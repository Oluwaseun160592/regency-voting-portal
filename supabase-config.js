/**
 * Regency Assets Management Limited - Supabase Cloud Backend Integration
 * Handles Multi-device Cloud Sync, Real-time Voting Subscriptions & Ledger
 */

(function () {
  'use strict';

  // Default configuration (can be updated here or dynamically via Portal UI)
  const DEFAULT_CONFIG = {
    // You can hardcode your Supabase URL & Anon Key below, or paste them into the portal UI
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: ''
  };

  const STORAGE_KEYS = {
    URL: 'raml_supabase_url',
    ANON_KEY: 'raml_supabase_anon_key',
    ENABLED: 'raml_supabase_enabled'
  };

  let supabaseClient = null;
  let realtimeChannel = null;
  let listeners = [];

  function getConfig() {
    const customUrl = localStorage.getItem(STORAGE_KEYS.URL);
    const customKey = localStorage.getItem(STORAGE_KEYS.ANON_KEY);
    return {
      url: (customUrl || DEFAULT_CONFIG.SUPABASE_URL || '').trim(),
      anonKey: (customKey || DEFAULT_CONFIG.ANON_KEY || '').trim()
    };
  }

  function isConfigured() {
    const config = getConfig();
    return !!(config.url && config.anonKey && config.url.startsWith('https://'));
  }

  function initClient() {
    const config = getConfig();
    if (!config.url || !config.anonKey) {
      supabaseClient = null;
      notifyStatusChange({ connected: false, message: 'Supabase credentials not configured' });
      return null;
    }

    try {
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(config.url, config.anonKey, {
          auth: {
            persistSession: false
          }
        });
        return supabaseClient;
      }
    } catch (err) {
      console.warn('[RAML Supabase] Failed to initialize client:', err);
      supabaseClient = null;
    }
    return null;
  }

  function onStatusChange(callback) {
    listeners.push(callback);
  }

  function notifyStatusChange(status) {
    listeners.forEach(fn => {
      try { fn(status); } catch (e) { console.error(e); }
    });
  }

  /**
   * Test Supabase credentials connection
   */
  async function testConnection(url, anonKey) {
    try {
      if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        return { success: false, message: 'Supabase JS library not loaded' };
      }
      const testClient = window.supabase.createClient(url, anonKey, {
        auth: { persistSession: false }
      });
      // Ping raml_votes or check public schema
      const { data, error } = await testClient
        .from('raml_votes')
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          return {
            success: false,
            message: 'Connected to Supabase, but "raml_votes" table was not found. Please run supabase-schema.sql in your Supabase SQL Editor.'
          };
        }
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Connected successfully to Supabase Database!' };
    } catch (err) {
      return { success: false, message: err.message || 'Connection test failed' };
    }
  }

  /**
   * Save credentials to localStorage and re-initialize
   */
  async function saveCredentials(url, anonKey) {
    const cleanUrl = (url || '').trim();
    const cleanKey = (anonKey || '').trim();

    localStorage.setItem(STORAGE_KEYS.URL, cleanUrl);
    localStorage.setItem(STORAGE_KEYS.ANON_KEY, cleanKey);

    const client = initClient();
    if (!client) {
      notifyStatusChange({ connected: false, message: 'Supabase credentials saved, awaiting connection.' });
      return { success: false, message: 'Invalid configuration' };
    }

    const test = await testConnection(cleanUrl, cleanKey);
    if (test.success) {
      notifyStatusChange({ connected: true, message: 'Supabase Cloud Connected' });
      initRealtime();
    } else {
      notifyStatusChange({ connected: false, message: test.message });
    }
    return test;
  }

  function clearCredentials() {
    localStorage.removeItem(STORAGE_KEYS.URL);
    localStorage.removeItem(STORAGE_KEYS.ANON_KEY);
    if (realtimeChannel && supabaseClient) {
      supabaseClient.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
    supabaseClient = null;
    notifyStatusChange({ connected: false, message: 'Supabase disconnected (Local Mode)' });
  }

  /**
   * Fetch all remote votes from Supabase
   */
  async function fetchRemoteVotes() {
    if (!supabaseClient) return null;
    try {
      const { data, error } = await supabaseClient
        .from('raml_votes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('[RAML Supabase] fetchRemoteVotes error:', err);
      return null;
    }
  }

  /**
   * Fetch aggregated tallies from Supabase
   */
  async function fetchRemoteTallies() {
    if (!supabaseClient) return null;
    try {
      // First try to read from the aggregated view raml_tallies
      const { data: viewData, error: viewError } = await supabaseClient
        .from('raml_tallies')
        .select('*');

      if (!viewError && Array.isArray(viewData)) {
        const tallyMap = {};
        viewData.forEach(row => {
          tallyMap[`${row.category_id}__${row.nominee_id}`] = row.total_votes;
        });
        return tallyMap;
      }

      // Fallback: manually aggregate from raml_votes
      const { data: votes, error: votesError } = await supabaseClient
        .from('raml_votes')
        .select('category_id, nominee_id');

      if (votesError) throw votesError;

      const tallyMap = {};
      (votes || []).forEach(v => {
        const key = `${v.category_id}__${v.nominee_id}`;
        tallyMap[key] = (tallyMap[key] || 0) + 1;
      });
      return tallyMap;
    } catch (err) {
      console.warn('[RAML Supabase] fetchRemoteTallies error:', err);
      return null;
    }
  }

  /**
   * Cast vote to Supabase Cloud
   */
  async function castVoteRemote(votePayload) {
    if (!supabaseClient) return { success: false, offline: true };

    try {
      // 1. Insert vote into raml_votes
      const { data: voteData, error: voteError } = await supabaseClient
        .from('raml_votes')
        .insert([{
          voter_id: votePayload.voterId,
          category_id: votePayload.categoryId,
          nominee_id: votePayload.nomineeId,
          nominee_name: votePayload.nomineeName,
          category_name: votePayload.categoryName,
          ballot_hash: votePayload.ballotHash
        }])
        .select();

      if (voteError) {
        // Check for unique constraint violation (voter already voted in this category)
        if (voteError.code === '23505') {
          return {
            success: false,
            alreadyVoted: true,
            message: `You have already recorded a ballot for this category in the cloud ledger.`
          };
        }
        throw voteError;
      }

      // 2. Insert into raml_audit_logs
      try {
        await supabaseClient
          .from('raml_audit_logs')
          .insert([{
            ballot_hash: votePayload.ballotHash,
            voter_id: votePayload.voterId,
            category_id: votePayload.categoryId,
            category_name: votePayload.categoryName,
            candidate_id: votePayload.nomineeId,
            candidate_name: votePayload.nomineeName
          }]);
      } catch (auditErr) {
        console.warn('[RAML Supabase] Non-fatal audit log warning:', auditErr);
      }

      return { success: true, data: voteData };
    } catch (err) {
      console.error('[RAML Supabase] Cast vote error:', err);
      return { success: false, error: err.message || 'Failed to submit vote to Supabase' };
    }
  }

  /**
   * Subscribe to Supabase Realtime broadcast for live updates across all devices
   */
  function initRealtime(onNewVoteCallback) {
    if (!supabaseClient) return;

    try {
      if (realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }

      realtimeChannel = supabaseClient
        .channel('raml-votes-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'raml_votes' },
          payload => {
            console.log('[RAML Supabase Realtime] Cloud Vote Broadcast received:', payload.new);
            if (typeof onNewVoteCallback === 'function') {
              onNewVoteCallback(payload.new);
            }
            // Trigger custom window event
            window.dispatchEvent(new CustomEvent('raml:cloud-vote-received', { detail: payload.new }));
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[RAML Supabase Realtime] Live channel subscribed successfully.');
          }
        });
    } catch (err) {
      console.warn('[RAML Supabase Realtime] Subscription error:', err);
    }
  }

  // Expose global RAML_SUPABASE API
  window.RAML_SUPABASE = {
    getConfig,
    isConfigured,
    initClient,
    testConnection,
    saveCredentials,
    clearCredentials,
    fetchRemoteVotes,
    fetchRemoteTallies,
    castVoteRemote,
    initRealtime,
    onStatusChange
  };

  // Initialize on script load
  document.addEventListener('DOMContentLoaded', () => {
    initClient();
  });
})();

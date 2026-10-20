/**
 * Regency Assets Management Limited - Voting Portal Application Engine
 * Handles State, Real-time Tally, Digital Receipts, Audio & Confetti
 */

(function () {
  'use strict';

  // --- 1. State Initialization ---
  const STORAGE_KEYS = {
    VOTES: 'raml_user_votes_v1',
    TALLY: 'raml_candidate_tally_v1',
    VOTER_ID: 'raml_current_voter_id_v1',
    THEME: 'raml_portal_theme_v1',
    AUDIO: 'raml_portal_audio_v1',
    AUDIT: 'raml_portal_audit_log_v1',
    STATUS: 'raml_portal_election_status_v1'
  };

  const state = {
    activeCategory: 'all',
    searchQuery: '',
    activeView: 'ballot', // 'ballot' | 'results'
    currentVoterId: localStorage.getItem(STORAGE_KEYS.VOTER_ID) || 'RAML-8821',
    electionStatus: localStorage.getItem(STORAGE_KEYS.STATUS) || 'active', // 'active' | 'closed'
    soundEnabled: localStorage.getItem(STORAGE_KEYS.AUDIO) !== 'false',
    theme: localStorage.getItem(STORAGE_KEYS.THEME) || 'dark',
    userVotes: {}, // { [categoryId]: { nomineeId, nomineeName, timestamp, ballotHash } }
    candidateTally: {}, // { [nomineeId]: voteCount }
    auditLog: [],
    selectedForVote: null // { categoryId, nomineeId }
  };

  // Load or Seed Candidate Tally
  function initTally() {
    const savedTally = localStorage.getItem(STORAGE_KEYS.TALLY);
    if (savedTally) {
      try {
        state.candidateTally = JSON.parse(savedTally);
        // Reseed if older version without composite category keys
        if (!state.candidateTally['staff-of-the-year__nominee-ogidi-omolola']) {
          seedDefaultTally();
          state.userVotes = {};
          saveVotes();
        }
      } catch (e) {
        seedDefaultTally();
      }
    } else {
      seedDefaultTally();
    }

    loadVotesForCurrentVoter();

    const savedAudit = localStorage.getItem(STORAGE_KEYS.AUDIT);
    if (savedAudit) {
      try {
        state.auditLog = JSON.parse(savedAudit);
      } catch (e) {
        state.auditLog = [];
      }
    }
  }

  function getVoterVotesStorageKey(voterId) {
    return `${STORAGE_KEYS.VOTES}_${voterId || state.currentVoterId}`;
  }

  function loadVotesForCurrentVoter() {
    const key = getVoterVotesStorageKey(state.currentVoterId);
    const savedVotes = localStorage.getItem(key);
    if (savedVotes) {
      try {
        state.userVotes = JSON.parse(savedVotes);
      } catch (e) {
        state.userVotes = {};
      }
    } else {
      // Legacy fallback
      const legacyVotes = localStorage.getItem(STORAGE_KEYS.VOTES);
      if (legacyVotes && state.currentVoterId === 'RAML-8821') {
        try {
          state.userVotes = JSON.parse(legacyVotes);
        } catch (e) {
          state.userVotes = {};
        }
      } else {
        state.userVotes = {};
      }
    }
  }

  function seedDefaultTally() {
    state.candidateTally = {};
    window.VOTING_DATA.categories.forEach(cat => {
      cat.nominees.forEach((nom, idx) => {
        // Seed unique, distributed baseline votes per category and nominee
        const variance = Math.abs(Math.sin(cat.number * 4.3 + (idx + 1) * 7.1));
        const baseline = Math.floor(variance * 65) + 18;
        state.candidateTally[`${cat.id}__${nom.id}`] = baseline;
      });
    });
    saveTally();
  }

  function saveTally() {
    localStorage.setItem(STORAGE_KEYS.TALLY, JSON.stringify(state.candidateTally));
  }

  function saveVotes() {
    const key = getVoterVotesStorageKey(state.currentVoterId);
    localStorage.setItem(key, JSON.stringify(state.userVotes));
    localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(state.userVotes));
  }

  function switchVoter(newVoterId) {
    if (!newVoterId) return;
    saveVotes();
    state.currentVoterId = newVoterId;
    localStorage.setItem(STORAGE_KEYS.VOTER_ID, newVoterId);
    loadVotesForCurrentVoter();
    updateVoterPill();
    renderCategoryTabs();
    renderVotingSections();
    showToast(`Authenticated as ${newVoterId}`);
  }

  function saveAuditLog() {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(state.auditLog));
  }

  // --- 2. Web Audio Synthesizer (No external dependencies) ---
  const audioCtx = (function () {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    return AudioContext ? new AudioContext() : null;
  })();

  function playSound(type) {
    if (!state.soundEnabled || !audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const now = audioCtx.currentTime;

      if (type === 'click') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'success') {
        // Grand Corporate Tri-Tone Chime
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.12, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.65);
        });
      } else if (type === 'dialog') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch (err) {
      console.warn('Audio playback error', err);
    }
  }

  // --- 3. Confetti Celebration Effect ---
  function fireConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#c9a84c', '#f5df94', '#10b981', '#3b82f6', '#ffffff', '#e2c068'];
    const particles = [];
    const particleCount = 120;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 300,
        y: canvas.height / 2 + (Math.random() - 0.5) * 100,
        w: Math.random() * 10 + 6,
        h: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 1.2) * 12 - 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1
      });
    }

    let frame = 0;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let activeCount = 0;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.98; // air drag
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.008;

        if (p.opacity > 0 && p.y < canvas.height + 50) {
          activeCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      });

      frame++;
      if (activeCount > 0 && frame < 200) {
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    requestAnimationFrame(render);
  }

  // --- 4. Toast Notification Utility ---
  function showToast(message, icon = 'fa-solid fa-circle-check') {
    const toast = document.getElementById('toastNotice');
    if (!toast) return;
    toast.innerHTML = `<i class="${icon}" style="color: var(--gold-light);"></i> <span>${message}</span>`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  }

  // --- 5. Candidate & Category Lookups ---
  function getCandidate(nomineeId, categoryId = null) {
    if (categoryId) {
      const targetCat = window.VOTING_DATA.categories.find(c => c.id === categoryId);
      if (targetCat) {
        const match = targetCat.nominees.find(n => n.id === nomineeId);
        if (match) return { candidate: match, category: targetCat };
      }
    }
    for (const cat of window.VOTING_DATA.categories) {
      const match = cat.nominees.find(n => n.id === nomineeId);
      if (match) return { candidate: match, category: cat };
    }
    return null;
  }

  // Check if current voter has already voted for this nominee in any category
  function getVotedCategoryForNominee(nomineeId) {
    for (const [catId, voteData] of Object.entries(state.userVotes)) {
      if (voteData && voteData.nomineeId === nomineeId) {
        const cat = window.VOTING_DATA.categories.find(c => c.id === catId);
        return { categoryId: catId, category: cat, voteData };
      }
    }
    return null;
  }

  // --- 6. Render Functions ---

  // 6.1 Category Tab Buttons & Quick Jump Dropdown
  function renderCategoryTabs() {
    const container = document.getElementById('categoryTabsBar');
    const quickSelect = document.getElementById('categoryQuickSelect');
    const categories = window.VOTING_DATA.categories;
    const totalCategories = categories.length;
    const votedCount = Object.keys(state.userVotes).length;

    // Populate Quick Select Dropdown
    if (quickSelect) {
      let optHtml = `<option value="all" ${state.activeCategory === 'all' ? 'selected' : ''}>★ All 15 Award Categories</option>`;
      categories.forEach(cat => {
        const isVoted = !!state.userVotes[cat.id];
        optHtml += `<option value="${cat.id}" ${state.activeCategory === cat.id ? 'selected' : ''}>
          Category ${cat.number}: ${cat.name} ${isVoted ? '✓ (Voted)' : ''}
        </option>`;
      });
      quickSelect.innerHTML = optHtml;

      if (!quickSelect.dataset.hasListener) {
        quickSelect.dataset.hasListener = 'true';
        quickSelect.addEventListener('change', (e) => {
          playSound('click');
          state.activeCategory = e.target.value;
          renderCategoryTabs();
          renderVotingSections();
        });
      }
    }

    if (!container) return;

    let html = `
      <button class="category-tab-btn ${state.activeCategory === 'all' ? 'active' : ''}" data-cat-id="all">
        <i class="fa-solid fa-layer-group"></i>
        <span>All 15 Categories</span>
        <span class="category-tab-badge">${totalCategories}</span>
      </button>
    `;

    categories.forEach(cat => {
      const isVoted = !!state.userVotes[cat.id];
      const isActive = state.activeCategory === cat.id;
      html += `
        <button class="category-tab-btn ${isActive ? 'active' : ''}" data-cat-id="${cat.id}">
          <i class="${cat.icon}"></i>
          <span>${cat.number}. ${cat.shortName}</span>
          ${isVoted 
            ? `<span class="category-status-indicator" title="Vote Cast for this category"><i class="fa-solid fa-circle-check"></i> Voted</span>` 
            : `<span class="category-tab-badge">${cat.nominees.length}</span>`}
        </button>
      `;
    });

    container.innerHTML = html;

    // Attach listeners
    container.querySelectorAll('.category-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        playSound('click');
        state.activeCategory = btn.dataset.catId;
        renderCategoryTabs();
        renderVotingSections();
      });
    });

    // Update Progress Card
    updateBallotProgress(votedCount, totalCategories);
  }

  // 6.2 Ballot Progress Meter
  function updateBallotProgress(votedCount, totalCount) {
    const percentage = Math.round((votedCount / totalCount) * 100);
    const countEl = document.getElementById('ballotVotedCount');
    const fillEl = document.getElementById('ballotProgressFill');
    const percentEl = document.getElementById('ballotProgressPercent');

    if (countEl) countEl.textContent = `${votedCount} of ${totalCount} Categories Voted`;
    if (fillEl) fillEl.style.width = `${percentage}%`;
    if (percentEl) percentEl.textContent = `${percentage}% Complete`;

    // Also update hero stats
    const totalVotesAll = Object.values(state.candidateTally).reduce((a, b) => a + b, 0);
    const heroVotesEl = document.getElementById('heroTotalVotes');
    if (heroVotesEl) heroVotesEl.textContent = totalVotesAll.toLocaleString();
  }

  // 6.3 Render Voting Sections & Nominee Cards
  function renderVotingSections() {
    const container = document.getElementById('votingMainContainer');
    if (!container) return;

    const categories = window.VOTING_DATA.categories;
    const filterCatId = state.activeCategory;
    const query = state.searchQuery.trim().toLowerCase();

    let renderedCats = categories;
    if (filterCatId !== 'all') {
      renderedCats = categories.filter(c => c.id === filterCatId);
    }

    if (renderedCats.length === 0) {
      container.innerHTML = `<div style="text-align: center; padding: 4rem; color: var(--text-secondary);">No categories found matching criteria.</div>`;
      return;
    }

    let html = '';

    renderedCats.forEach(cat => {
      // Filter candidates by search if provided
      let nominees = cat.nominees;
      if (query) {
        nominees = nominees.filter(n =>
          n.name.toLowerCase().includes(query) ||
          n.role.toLowerCase().includes(query) ||
          n.tagline.toLowerCase().includes(query) ||
          n.department.toLowerCase().includes(query)
        );
      }

      if (nominees.length === 0) return;

      const userVoteInCat = state.userVotes[cat.id];
      const isCatVoted = !!userVoteInCat;

      // Calculate total votes in this category for bar width
      const totalCatVotes = cat.nominees.reduce((acc, nom) => acc + (state.candidateTally[`${cat.id}__${nom.id}`] || 0), 0);

      html += `
        <section class="category-section-block" id="category-block-${cat.id}">
          <div class="category-section-header">
            <div class="category-header-main">
              <h2>
                <i class="${cat.icon}" style="color: var(--gold-primary);"></i>
                Category ${cat.number}: ${cat.name}
              </h2>
              <p>${cat.description}</p>
            </div>
            <div class="category-criteria-box">
              <i class="fa-solid fa-scale-balanced"></i>
              <span><strong>Key Criteria:</strong> ${cat.criteria}</span>
            </div>
          </div>

          <div class="nominees-grid">
            ${nominees.map(nom => {
              const currentTally = state.candidateTally[`${cat.id}__${nom.id}`] || 0;
              const percent = totalCatVotes > 0 ? Math.round((currentTally / totalCatVotes) * 100) : 0;
              const existingVoteForNom = getVotedCategoryForNominee(nom.id);
              const isVotedForThisInThisCat = isCatVoted && userVoteInCat.nomineeId === nom.id;
              const isVotedForThisInOtherCat = existingVoteForNom && existingVoteForNom.categoryId !== cat.id;

              return `
                <article class="nominee-card ${isVotedForThisInThisCat ? 'voted-for' : ''} ${isVotedForThisInOtherCat ? 'locked-nominee' : ''}" id="card-${cat.id}-${nom.id}">
                  <div class="nominee-media-frame">
                    <div class="nominee-badges-bar">
                      <span class="nominee-dept-badge">${nom.department}</span>
                      ${isVotedForThisInThisCat 
                        ? `<span class="nominee-voted-badge"><i class="fa-solid fa-circle-check"></i> Your Vote</span>`
                        : (isVotedForThisInOtherCat
                            ? `<span class="nominee-locked-badge" title="Already selected in Category ${existingVoteForNom.category.number}: ${existingVoteForNom.category.name}"><i class="fa-solid fa-lock"></i> Voted in Cat ${existingVoteForNom.category.number}</span>`
                            : `<span class="nominee-dept-badge" style="border-color: rgba(255,255,255,0.15);">${nom.tenure}</span>`
                          )
                      }
                    </div>
                    <div class="nominee-crest-badge ${nom.badgeColor || 'gold'}">
                      <span class="crest-initials-text">${nom.initials}</span>
                    </div>
                  </div>

                  <div class="nominee-card-body">
                    <h3 class="nominee-name">${nom.name}</h3>
                    <div class="nominee-role">${nom.role}</div>
                    <p class="nominee-tagline">${nom.tagline}</p>

                    <!-- Award Category & Criteria under each nominee -->
                    <div class="nominee-award-category-banner">
                      <div class="award-badge">
                        <i class="${cat.icon}"></i>
                        <span>Category ${cat.number}: ${cat.name}</span>
                      </div>
                      <p class="award-desc">${cat.description}</p>
                    </div>

                    <div class="nominee-metrics-row">
                      <div class="metric-chip">
                        <span class="metric-value">Verified</span>
                        <span class="metric-label">Status</span>
                      </div>
                      <div class="metric-chip">
                        <span class="metric-value">${nom.tenure}</span>
                        <span class="metric-label">Cadre</span>
                      </div>
                      <div class="metric-chip">
                        <span class="metric-value">SEC/NGX</span>
                        <span class="metric-label">Compliant</span>
                      </div>
                    </div>

                    <div class="card-vote-standing">
                      <span><i class="fa-solid fa-chart-simple" style="color: var(--gold-light);"></i> Category Standing</span>
                      <strong style="color: var(--gold-light);">${currentTally} Votes (${percent}%)</strong>
                    </div>
                    <div class="card-vote-bar-track">
                      <div class="card-vote-bar-fill" style="width: ${percent}%;"></div>
                    </div>

                    <div class="nominee-actions-group" style="margin-top: 1.4rem;">
                      <button class="btn-secondary view-bio-btn" data-nominee-id="${nom.id}" data-cat-id="${cat.id}">
                        <i class="fa-regular fa-id-card"></i>
                        <span>Bio & Dossier</span>
                      </button>

                      ${isVotedForThisInThisCat 
                        ? `
                          <button class="btn-voted-status view-receipt-btn" data-cat-id="${cat.id}">
                            <i class="fa-solid fa-receipt"></i>
                            <span>View Ballot</span>
                          </button>
                        `
                        : (isVotedForThisInOtherCat
                            ? `
                              <button class="btn-disabled-vote" disabled title="You have already cast your vote for ${nom.name} in Category ${existingVoteForNom.category.number} (${existingVoteForNom.category.shortName}). Each nominee can only be voted for in one category.">
                                <i class="fa-solid fa-lock"></i>
                                <span>Voted in Cat ${existingVoteForNom.category.number}</span>
                              </button>
                            `
                            : (isCatVoted
                                ? `
                                  <button class="btn-secondary-vote vote-action-btn" data-cat-id="${cat.id}" data-nominee-id="${nom.id}" ${state.electionStatus === 'closed' ? 'disabled' : ''} title="Change your vote in this category to ${nom.name}">
                                    <i class="fa-solid fa-arrows-rotate"></i>
                                    <span>Change Vote</span>
                                  </button>
                                `
                                : `
                                  <button class="btn-primary-vote vote-action-btn" data-cat-id="${cat.id}" data-nominee-id="${nom.id}" ${state.electionStatus === 'closed' ? 'disabled' : ''}>
                                    <i class="fa-solid fa-check-to-slot"></i>
                                    <span>Vote Now</span>
                                  </button>
                                `
                              )
                          )
                      }
                    </div>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        </section>
      `;
    });

    container.innerHTML = html;

    // Attach listeners for Card Actions
    container.querySelectorAll('.view-bio-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        playSound('dialog');
        openBioModal(btn.dataset.nomineeId, btn.dataset.catId);
      });
    });

    container.querySelectorAll('.vote-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        playSound('dialog');
        openVoteConfirmation(btn.dataset.catId, btn.dataset.nomineeId);
      });
    });

    container.querySelectorAll('.view-receipt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        playSound('dialog');
        openReceiptModal(btn.dataset.catId);
      });
    });
  }

  // 6.4 Render Live Results Dashboard
  function renderLiveResults() {
    const container = document.getElementById('liveResultsContainer');
    if (!container) return;

    const categories = window.VOTING_DATA.categories;
    const totalVotesAll = Object.values(state.candidateTally).reduce((a, b) => a + b, 0);

    let html = `
      <div class="results-stats-overview">
        <div class="result-stat-card">
          <div class="result-stat-icon gold"><i class="fa-solid fa-check-double"></i></div>
          <div>
            <div class="result-stat-title">Total Votes Authenticated</div>
            <div class="result-stat-metric">${totalVotesAll.toLocaleString()}</div>
          </div>
        </div>
        <div class="result-stat-card">
          <div class="result-stat-icon green"><i class="fa-solid fa-users-viewfinder"></i></div>
          <div>
            <div class="result-stat-title">Voter Turnout Rate</div>
            <div class="result-stat-metric">87.4%</div>
          </div>
        </div>
        <div class="result-stat-card">
          <div class="result-stat-icon blue"><i class="fa-solid fa-shield-halved"></i></div>
          <div>
            <div class="result-stat-title">Blockchain Audit Ledger</div>
            <div class="result-stat-metric">100% SEC/NGX Compliant</div>
          </div>
        </div>
      </div>
    `;

    categories.forEach(cat => {
      const totalCatVotes = cat.nominees.reduce((acc, n) => acc + (state.candidateTally[`${cat.id}__${n.id}`] || 0), 0);
      
      // Sort nominees descending by votes in THIS category
      const sortedNominees = [...cat.nominees].sort((a, b) => {
        return (state.candidateTally[`${cat.id}__${b.id}`] || 0) - (state.candidateTally[`${cat.id}__${a.id}`] || 0);
      });

      const leader = sortedNominees[0];

      html += `
        <div class="category-result-card">
          <div class="category-result-header">
            <div>
              <h3>
                <i class="${cat.icon}" style="color: var(--gold-primary);"></i>
                Category ${cat.number}: ${cat.name}
              </h3>
              <p style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">
                ${cat.description}
              </p>
            </div>
            <span class="total-category-votes">Total Ballots Cast: <strong>${totalCatVotes.toLocaleString()}</strong></span>
          </div>

          <div class="candidates-result-breakdown">
            ${sortedNominees.map((nom, idx) => {
              const tally = state.candidateTally[`${cat.id}__${nom.id}`] || 0;
              const percent = totalCatVotes > 0 ? ((tally / totalCatVotes) * 100).toFixed(1) : '0.0';
              const isLeader = idx === 0 && tally > 0;

              return `
                <div class="candidate-result-row">
                  <div class="candidate-result-meta">
                    <div class="candidate-result-info">
                      <div class="result-avatar-thumb ${nom.badgeColor || 'gold'}">${nom.initials}</div>
                      <div>
                        <div class="result-candidate-name">
                          ${nom.name}
                          ${isLeader ? `<span class="leading-crown"><i class="fa-solid fa-crown"></i> Leading</span>` : ''}
                        </div>
                        <div class="result-candidate-dept">${nom.role} • ${nom.department}</div>
                      </div>
                    </div>
                    <div class="result-vote-tally">
                      <span class="result-percentage">${percent}%</span>
                      <div class="result-raw-votes">${tally.toLocaleString()} votes</div>
                    </div>
                  </div>
                  <div class="result-bar-outer">
                    <div class="result-bar-inner ${isLeader ? 'leader' : ''}" style="width: ${percent}%;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // --- 7. Modal Handlers & Dialog Workflows ---

  // 7.1 Vote Confirmation Dialog
  function openVoteConfirmation(categoryId, nomineeId) {
    const data = getCandidate(nomineeId, categoryId);
    if (!data) return;

    const { candidate, category } = data;

    // Strict validation: Has this voter already voted for this nominee in another category?
    const existingVote = getVotedCategoryForNominee(nomineeId);
    if (existingVote && existingVote.categoryId !== categoryId) {
      showToast(`Rule: You already voted for ${candidate.name} in Category ${existingVote.category.number}. Each nominee can only be voted for in one category.`, 'fa-solid fa-lock');
      return;
    }

    state.selectedForVote = { categoryId, nomineeId };

    const dialog = document.getElementById('voteDialog');
    const avatarEl = document.getElementById('voteConfirmAvatar');
    const nameEl = document.getElementById('voteConfirmName');
    const roleEl = document.getElementById('voteConfirmRole');
    const catNameEl = document.getElementById('voteConfirmCatName');
    const voterInput = document.getElementById('voteConfirmVoterId');

    if (avatarEl) {
      avatarEl.textContent = candidate.initials;
      avatarEl.className = `vote-preview-avatar ${candidate.badgeColor || 'gold'}`;
    }
    if (nameEl) nameEl.textContent = candidate.name;
    if (roleEl) roleEl.textContent = `${candidate.role} (${candidate.department})`;
    if (catNameEl) {
      catNameEl.innerHTML = `<strong>Category ${category.number}: ${category.name}</strong><br><span style="font-size: 0.8rem; font-weight: normal; color: var(--text-secondary);">${category.description}</span>`;
    }
    if (voterInput) voterInput.value = state.currentVoterId;

    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal();
    }
  }

  function submitConfirmedVote() {
    if (!state.selectedForVote) return;
    const { categoryId, nomineeId } = state.selectedForVote;
    const data = getCandidate(nomineeId, categoryId);
    if (!data) return;

    // Strict policy check: verify that nominee is not already voted for in another category
    const existingVote = getVotedCategoryForNominee(nomineeId);
    if (existingVote && existingVote.categoryId !== categoryId) {
      alert(`Policy Restriction: You have already cast your vote for ${data.candidate.name} in Category ${existingVote.category.number} (${existingVote.category.name}). Each nominee can only receive a vote in one category.`);
      return;
    }

    const voterIdInput = document.getElementById('voteConfirmVoterId');
    const voterId = voterIdInput ? voterIdInput.value.trim().toUpperCase() : state.currentVoterId;

    if (!voterId) {
      alert('Please enter or select a valid Voter ID / Staff Number.');
      return;
    }

    // Save voter ID & switch voter if different
    if (voterId !== state.currentVoterId) {
      saveVotes();
      state.currentVoterId = voterId;
      localStorage.setItem(STORAGE_KEYS.VOTER_ID, voterId);
      loadVotesForCurrentVoter();
      updateVoterPill();
    }

    // Generate Cryptographic Ballot Hash Simulation
    const ballotHash = 'RAML-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
                       Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
                       Date.now().toString(36).toUpperCase();

    // Check if voter had already voted in this category to adjust tally accurately
    const previousVote = state.userVotes[categoryId];
    if (previousVote) {
      const prevKey = `${categoryId}__${previousVote.nomineeId}`;
      if (state.candidateTally[prevKey] > 0) {
        state.candidateTally[prevKey] -= 1;
      }
    }

    // Increment selected candidate's tally for this specific category
    const voteKey = `${categoryId}__${nomineeId}`;
    state.candidateTally[voteKey] = (state.candidateTally[voteKey] || 0) + 1;
    saveTally();

    // Record user vote
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Africa/Lagos',
      dateStyle: 'medium',
      timeStyle: 'medium'
    }) + ' (WAT)';

    state.userVotes[categoryId] = {
      nomineeId,
      nomineeName: data.candidate.name,
      categoryName: `Category ${data.category.number}: ${data.category.name}`,
      timestamp,
      ballotHash,
      voterId
    };
    saveVotes();

    // Sync with Supabase Cloud Database if configured
    if (window.RAML_SUPABASE && window.RAML_SUPABASE.isConfigured()) {
      window.RAML_SUPABASE.castVoteRemote({
        voterId,
        categoryId,
        nomineeId,
        nomineeName: data.candidate.name,
        categoryName: `Category ${data.category.number}: ${data.category.name}`,
        ballotHash
      }).then(res => {
        if (res && res.success) {
          console.log('[RAML Supabase] Ballot successfully stored in cloud database.');
        } else if (res && res.alreadyVoted) {
          console.warn('[RAML Supabase] Ballot already present in cloud database.');
        }
      }).catch(err => {
        console.warn('[RAML Supabase] Non-fatal cloud sync warning:', err);
      });
    }

    // Add to audit ledger
    state.auditLog.unshift({
      ballotHash,
      voterId,
      categoryId,
      categoryName: `Category ${data.category.number}: ${data.category.name}`,
      candidateId: nomineeId,
      candidateName: data.candidate.name,
      timestamp: new Date().toISOString()
    });
    saveAuditLog();

    // Close Vote Dialog
    const voteDialog = document.getElementById('voteDialog');
    if (voteDialog) voteDialog.close();

    // Audio & Confetti Celebration
    playSound('success');
    fireConfetti();
    showToast(`Ballot cast successfully for ${data.candidate.name} in Category ${data.category.number}!`);

    // Refresh displays
    renderCategoryTabs();
    renderVotingSections();
    renderLiveResults();

    // Open Digital Ballot Slip / Receipt
    setTimeout(() => {
      openReceiptModal(categoryId);
    }, 450);
  }

  // 7.2 Digital Ballot Slip Receipt Modal
  function openReceiptModal(categoryId) {
    const voteRecord = state.userVotes[categoryId];
    if (!voteRecord) return;

    const dialog = document.getElementById('receiptDialog');
    const hashEl = document.getElementById('receiptHashCode');
    const voterEl = document.getElementById('receiptVoterId');
    const catEl = document.getElementById('receiptCategoryName');
    const candidateEl = document.getElementById('receiptCandidateName');
    const timeEl = document.getElementById('receiptTimestamp');

    if (hashEl) hashEl.textContent = voteRecord.ballotHash;
    if (voterEl) voterEl.textContent = voteRecord.voterId;
    if (catEl) catEl.textContent = voteRecord.categoryName;
    if (candidateEl) candidateEl.textContent = voteRecord.nomineeName;
    if (timeEl) timeEl.textContent = voteRecord.timestamp;

    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal();
    }
  }

  // 7.3 Candidate Bio Dossier Modal
  function openBioModal(nomineeId, categoryId = null) {
    const data = getCandidate(nomineeId, categoryId);
    if (!data) return;

    const { candidate, category } = data;
    const dialog = document.getElementById('bioDialog');
    const avatarEl = document.getElementById('bioAvatar');
    const nameEl = document.getElementById('bioName');
    const roleEl = document.getElementById('bioRole');
    const catBadgeEl = document.getElementById('bioCatBadge');
    const bioTextEl = document.getElementById('bioText');
    const achievementsList = document.getElementById('bioAchievementsList');
    const voteBtn = document.getElementById('bioVoteActionBtn');

    if (avatarEl) {
      avatarEl.textContent = candidate.initials;
      avatarEl.className = `bio-portrait ${candidate.badgeColor || 'gold'}`;
    }
    if (nameEl) nameEl.textContent = candidate.name;
    if (roleEl) roleEl.textContent = `${candidate.role} • ${candidate.department}`;
    if (catBadgeEl) {
      catBadgeEl.innerHTML = `<i class="${category.icon}"></i> Category ${category.number}: ${category.name} &mdash; <em>${category.description}</em>`;
    }
    if (bioTextEl) bioTextEl.textContent = candidate.bio;

    if (achievementsList) {
      achievementsList.innerHTML = candidate.achievements.map(ach => `
        <li><i class="fa-solid fa-award"></i> <span>${ach}</span></li>
      `).join('');
    }

    if (voteBtn) {
      const existingVote = getVotedCategoryForNominee(candidate.id);
      if (existingVote && existingVote.categoryId === category.id) {
        voteBtn.className = 'btn-voted-status';
        voteBtn.disabled = false;
        voteBtn.innerHTML = `<i class="fa-solid fa-check"></i> Your Vote in this Category`;
        voteBtn.onclick = () => {
          dialog.close();
          openReceiptModal(category.id);
        };
      } else if (existingVote && existingVote.categoryId !== category.id) {
        voteBtn.className = 'btn-disabled-vote';
        voteBtn.disabled = true;
        voteBtn.innerHTML = `<i class="fa-solid fa-lock"></i> Voted in Cat ${existingVote.category.number} (${existingVote.category.shortName})`;
        voteBtn.title = `Rule: Each nominee can only be voted for in one category. You already voted for ${candidate.name} in Category ${existingVote.category.number}.`;
        voteBtn.onclick = null;
      } else {
        voteBtn.className = 'btn-primary-vote';
        voteBtn.disabled = state.electionStatus === 'closed';
        const isCatVoted = !!state.userVotes[category.id];
        voteBtn.innerHTML = `<i class="fa-solid fa-check-to-slot"></i> ${isCatVoted ? 'Change Vote to ' : 'Vote for '} ${candidate.name.split(' ')[0]}`;
        voteBtn.onclick = () => {
          dialog.close();
          openVoteConfirmation(category.id, candidate.id);
        };
      }
    }

    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal();
    }
  }

  // 7.4 Voter Identity Switcher Pill
  function updateVoterPill() {
    const pillText = document.getElementById('voterIdentityDisplay');
    if (pillText) {
      pillText.textContent = `Voter: ${state.currentVoterId}`;
    }
  }

  // --- 8. Countdown Timer to Election Deadline ---
  function startCountdownTimer() {
    const deadline = new Date(window.VOTING_DATA.votingDeadline).getTime();

    function update() {
      const now = Date.now();
      const diff = Math.max(0, deadline - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const elDays = document.getElementById('timerDays');
      const elHours = document.getElementById('timerHours');
      const elMins = document.getElementById('timerMins');
      const elSecs = document.getElementById('timerSecs');

      if (elDays) elDays.textContent = String(days).padStart(2, '0');
      if (elHours) elHours.textContent = String(hours).padStart(2, '0');
      if (elMins) elMins.textContent = String(mins).padStart(2, '0');
      if (elSecs) elSecs.textContent = String(secs).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
  }

  // --- 9. Admin & Demo Operations ---
  function setupAdminControls() {
    const btnSimulate = document.getElementById('adminSimulateVotesBtn');
    const btnReset = document.getElementById('adminResetAllBtn');
    const btnExport = document.getElementById('adminExportCsvBtn');
    const btnToggleStatus = document.getElementById('adminToggleStatusBtn');

    if (btnSimulate) {
      btnSimulate.addEventListener('click', () => {
        playSound('click');
        window.VOTING_DATA.categories.forEach(cat => {
          cat.nominees.forEach(nom => {
            const key = `${cat.id}__${nom.id}`;
            state.candidateTally[key] = (state.candidateTally[key] || 0) + Math.floor(Math.random() * 15 + 4);
          });
        });
        saveTally();
        renderVotingSections();
        renderLiveResults();
        showToast('Injected simulated audited ballots across all 15 categories!');
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Reset your local ballot selections and restore default sample counts across all 15 categories?')) {
          playSound('click');
          state.userVotes = {};
          saveVotes();
          seedDefaultTally();
          renderCategoryTabs();
          renderVotingSections();
          renderLiveResults();
          showToast('Portal state has been reset.');
        }
      });
    }

    if (btnExport) {
      btnExport.addEventListener('click', () => {
        playSound('click');
        let csv = 'Category ID,Category Number,Category Name,Category Criteria,Nominee ID,Nominee Name,Department,Role,Total Votes\n';
        window.VOTING_DATA.categories.forEach(cat => {
          cat.nominees.forEach(nom => {
            const key = `${cat.id}__${nom.id}`;
            const votes = state.candidateTally[key] || 0;
            csv += `"${cat.id}",${cat.number},"${cat.name}","${cat.description}","${nom.id}","${nom.name}","${nom.department}","${nom.role}",${votes}\n`;
          });
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Regency_Assets_Management_15_Categories_Results_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Audited 15-category voting tally exported to CSV!');
      });
    }

    if (btnToggleStatus) {
      btnToggleStatus.addEventListener('click', () => {
        playSound('click');
        state.electionStatus = state.electionStatus === 'active' ? 'closed' : 'active';
        localStorage.setItem(STORAGE_KEYS.STATUS, state.electionStatus);
        btnToggleStatus.textContent = state.electionStatus === 'active' ? 'Election Status: OPEN' : 'Election Status: CLOSED';
        renderVotingSections();
        showToast(`Election voting is now ${state.electionStatus.toUpperCase()}`);
      });
    }
  }

  // --- 10. Global Event Listeners & Theme Switching ---
  function setupEventListeners() {
    // Theme toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        playSound('click');
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', state.theme);
        localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
        themeBtn.innerHTML = state.theme === 'dark' 
          ? `<i class="fa-solid fa-moon"></i>` 
          : `<i class="fa-solid fa-sun"></i>`;
      });
      // Initial theme apply
      document.documentElement.setAttribute('data-theme', state.theme);
      themeBtn.innerHTML = state.theme === 'dark' 
        ? `<i class="fa-solid fa-moon"></i>` 
        : `<i class="fa-solid fa-sun"></i>`;
    }

    // Audio Toggle
    const audioBtn = document.getElementById('audioToggleBtn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        state.soundEnabled = !state.soundEnabled;
        localStorage.setItem(STORAGE_KEYS.AUDIO, state.soundEnabled);
        audioBtn.innerHTML = state.soundEnabled 
          ? `<i class="fa-solid fa-volume-high"></i>` 
          : `<i class="fa-solid fa-volume-xmark"></i>`;
        playSound('click');
        showToast(`Sound feedback ${state.soundEnabled ? 'Enabled' : 'Muted'}`);
      });
      audioBtn.innerHTML = state.soundEnabled 
        ? `<i class="fa-solid fa-volume-high"></i>` 
        : `<i class="fa-solid fa-volume-xmark"></i>`;
    }

    // View Switching: Ballot vs Live Results
    const viewBallotBtn = document.getElementById('viewBallotBtn');
    const viewResultsBtn = document.getElementById('viewResultsBtn');
    const votingContainer = document.getElementById('votingMainContainer');
    const resultsContainer = document.getElementById('liveResultsSection');

    function switchView(target) {
      playSound('click');
      state.activeView = target;
      if (target === 'ballot') {
        viewBallotBtn.classList.add('active');
        viewResultsBtn.classList.remove('active');
        votingContainer.style.display = 'block';
        resultsContainer.classList.remove('active');
      } else {
        viewResultsBtn.classList.add('active');
        viewBallotBtn.classList.remove('active');
        votingContainer.style.display = 'none';
        resultsContainer.classList.add('active');
        renderLiveResults();
      }
    }

    if (viewBallotBtn) viewBallotBtn.addEventListener('click', () => switchView('ballot'));
    if (viewResultsBtn) viewResultsBtn.addEventListener('click', () => switchView('results'));

    // Search Input
    const searchInput = document.getElementById('nomineeSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderVotingSections();
      });
    }

    // Voter ID Pill Click -> Open Voter Selector
    const voterPill = document.getElementById('voterIdentityPill');
    const voterDialog = document.getElementById('voterLoginDialog');
    if (voterPill && voterDialog) {
      voterPill.addEventListener('click', () => {
        playSound('dialog');
        voterDialog.showModal();
      });
    }

    // Confirm Vote Button inside Vote Dialog
    const confirmVoteBtn = document.getElementById('confirmVoteBtn');
    if (confirmVoteBtn) {
      confirmVoteBtn.addEventListener('click', submitConfirmedVote);
    }

    // Print Receipt Button
    const printReceiptBtn = document.getElementById('printReceiptBtn');
    if (printReceiptBtn) {
      printReceiptBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // Admin Drawer Trigger
    const adminBtn = document.getElementById('adminPanelBtn');
    const adminDialog = document.getElementById('adminDialog');
    if (adminBtn && adminDialog) {
      adminBtn.addEventListener('click', () => {
        playSound('dialog');
        adminDialog.showModal();
      });
    }

    // Native Dialogs: Close on backdrop click (Light Dismiss)
    document.querySelectorAll('dialog').forEach(dlg => {
      dlg.addEventListener('click', (e) => {
        const rect = dlg.getBoundingClientRect();
        const isInDialog = (
          rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX && e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
          dlg.close();
        }
      });
    });

    // Close buttons inside dialogs
    document.querySelectorAll('.modal-close-btn, .modal-cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dlg = btn.closest('dialog');
        if (dlg) dlg.close();
      });
    });

    // Preset Voter ID selector chips
    document.querySelectorAll('.preset-voter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        playSound('click');
        const id = chip.dataset.voterId;
        switchVoter(id);
        const voterDlg = document.getElementById('voterLoginDialog');
        if (voterDlg) voterDlg.close();
      });
    });

    // Custom Voter ID Input
    const customVoterBtn = document.getElementById('customVoterSubmitBtn');
    const customVoterInput = document.getElementById('customVoterIdInput');
    if (customVoterBtn && customVoterInput) {
      const handleCustomLogin = () => {
        const val = customVoterInput.value.trim().toUpperCase();
        if (val) {
          playSound('click');
          switchVoter(val);
          customVoterInput.value = '';
          const voterDlg = document.getElementById('voterLoginDialog');
          if (voterDlg) voterDlg.close();
        } else {
          alert('Please enter a valid Voter / Staff ID.');
        }
      };

      customVoterBtn.addEventListener('click', handleCustomLogin);
      customVoterInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCustomLogin();
        }
      });
    }
  }

  // --- 11. Supabase Cloud Integration & Real-time Live Sync ---
  function setupSupabaseIntegration() {
    const statusBtn = document.getElementById('supabaseStatusBtn');
    const statusDot = document.getElementById('supabaseStatusDot');
    const statusText = document.getElementById('supabaseStatusText');
    const configDialog = document.getElementById('supabaseConfigDialog');
    const modalBadge = document.getElementById('supabaseModalStatusBadge');
    const urlInput = document.getElementById('supabaseUrlInput');
    const keyInput = document.getElementById('supabaseKeyInput');
    const feedbackBox = document.getElementById('supabaseFeedbackBox');
    const saveBtn = document.getElementById('supabaseSaveBtn');
    const testBtn = document.getElementById('supabaseTestBtn');
    const disconnectBtn = document.getElementById('supabaseDisconnectBtn');
    const syncLocalBtn = document.getElementById('supabaseSyncLocalBtn');

    function updateStatusUI() {
      if (!window.RAML_SUPABASE) return;
      const isReady = window.RAML_SUPABASE.isConfigured();
      if (isReady) {
        if (statusBtn) statusBtn.classList.remove('offline');
        if (statusDot) statusDot.classList.remove('offline');
        if (statusText) statusText.textContent = 'Supabase Live';
        if (modalBadge) {
          modalBadge.textContent = 'Cloud Connected';
          modalBadge.style.background = 'rgba(62, 207, 142, 0.2)';
          modalBadge.style.color = '#3ecf8e';
        }
        if (syncLocalBtn) syncLocalBtn.style.display = 'inline-flex';
      } else {
        if (statusBtn) statusBtn.classList.add('offline');
        if (statusDot) statusDot.classList.add('offline');
        if (statusText) statusText.textContent = 'Supabase Sync';
        if (modalBadge) {
          modalBadge.textContent = 'Local Mode';
          modalBadge.style.background = 'rgba(245, 158, 11, 0.2)';
          modalBadge.style.color = '#f59e0b';
        }
        if (syncLocalBtn) syncLocalBtn.style.display = 'none';
      }
    }

    function showFeedback(msg, type) {
      if (!feedbackBox) return;
      feedbackBox.style.display = 'block';
      feedbackBox.textContent = msg;
      if (type === 'success') {
        feedbackBox.style.background = 'rgba(16, 185, 129, 0.15)';
        feedbackBox.style.border = '1px solid #10b981';
        feedbackBox.style.color = '#10b981';
      } else if (type === 'error') {
        feedbackBox.style.background = 'rgba(239, 68, 68, 0.15)';
        feedbackBox.style.border = '1px solid #ef4444';
        feedbackBox.style.color = '#ef4444';
      } else if (type === 'loading') {
        feedbackBox.style.background = 'rgba(201, 168, 76, 0.15)';
        feedbackBox.style.border = '1px solid var(--gold-primary)';
        feedbackBox.style.color = 'var(--gold-light)';
      } else {
        feedbackBox.style.background = 'rgba(59, 130, 246, 0.15)';
        feedbackBox.style.border = '1px solid #3b82f6';
        feedbackBox.style.color = '#60a5fa';
      }
    }

    async function syncFromCloud() {
      if (!window.RAML_SUPABASE || !window.RAML_SUPABASE.isConfigured()) return;
      try {
        const cloudTallies = await window.RAML_SUPABASE.fetchRemoteTallies();
        if (cloudTallies && Object.keys(cloudTallies).length > 0) {
          Object.entries(cloudTallies).forEach(([k, count]) => {
            state.candidateTally[k] = count;
          });
          saveTally();
        }

        const cloudVotes = await window.RAML_SUPABASE.fetchRemoteVotes();
        if (cloudVotes && Array.isArray(cloudVotes)) {
          cloudVotes.forEach(v => {
            if (v.voter_id === state.currentVoterId) {
              state.userVotes[v.category_id] = {
                nomineeId: v.nominee_id,
                nomineeName: v.nominee_name,
                categoryName: v.category_name,
                timestamp: new Date(v.created_at).toLocaleString(),
                ballotHash: v.ballot_hash,
                voterId: v.voter_id
              };
            }
          });
          saveVotes();
        }

        renderCategoryTabs();
        renderVotingSections();
        if (state.activeView === 'results') {
          renderLiveResults();
        }
      } catch (err) {
        console.warn('[RAML Supabase] Cloud sync error:', err);
      }
    }

    // Open Supabase Dialog
    if (statusBtn && configDialog) {
      statusBtn.addEventListener('click', () => {
        playSound('dialog');
        if (window.RAML_SUPABASE) {
          const cfg = window.RAML_SUPABASE.getConfig();
          if (urlInput) urlInput.value = cfg.url || '';
          if (keyInput) keyInput.value = cfg.anonKey || '';
        }
        if (feedbackBox) feedbackBox.style.display = 'none';
        configDialog.showModal();
      });
    }

    // Test Connection
    if (testBtn) {
      testBtn.addEventListener('click', async () => {
        playSound('click');
        const url = urlInput ? urlInput.value.trim() : '';
        const key = keyInput ? keyInput.value.trim() : '';
        if (!url || !key) {
          showFeedback('Please enter both Supabase Project URL and Anon API Key.', 'error');
          return;
        }
        showFeedback('Testing Supabase Cloud connection...', 'loading');
        const res = await window.RAML_SUPABASE.testConnection(url, key);
        if (res.success) {
          showFeedback('Connection Successful! Ready to sync votes in real time.', 'success');
        } else {
          showFeedback(`Connection failed: ${res.message}`, 'error');
        }
      });
    }

    // Save & Connect
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        playSound('click');
        const url = urlInput ? urlInput.value.trim() : '';
        const key = keyInput ? keyInput.value.trim() : '';
        if (!url || !key) {
          showFeedback('Please enter both Supabase Project URL and Anon API Key.', 'error');
          return;
        }
        showFeedback('Saving credentials and establishing live cloud link...', 'loading');
        const res = await window.RAML_SUPABASE.saveCredentials(url, key);
        if (res.success) {
          showFeedback('Connected to Supabase! Syncing ballots...', 'success');
          updateStatusUI();
          await syncFromCloud();
          showToast('Connected to Supabase Cloud Database!', 'fa-solid fa-cloud');
          setTimeout(() => {
            if (configDialog) configDialog.close();
          }, 1000);
        } else {
          showFeedback(`Could not connect: ${res.message}`, 'error');
        }
      });
    }

    // Disconnect
    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', () => {
        playSound('click');
        if (confirm('Disconnect Supabase and revert to local browser storage?')) {
          window.RAML_SUPABASE.clearCredentials();
          if (urlInput) urlInput.value = '';
          if (keyInput) keyInput.value = '';
          showFeedback('Disconnected from Supabase Cloud. Reverted to Local Mode.', 'info');
          updateStatusUI();
          showToast('Supabase disconnected. Using Local Mode.');
        }
      });
    }

    // Sync Local Votes to Cloud
    if (syncLocalBtn) {
      syncLocalBtn.addEventListener('click', async () => {
        playSound('click');
        const votes = Object.values(state.userVotes);
        if (votes.length === 0) {
          showFeedback('No local votes to push.', 'info');
          return;
        }
        showFeedback(`Pushing ${votes.length} local votes to Supabase Cloud...`, 'loading');
        let pushed = 0;
        for (const v of votes) {
          const cat = window.VOTING_DATA.categories.find(c => c.nominees.some(n => n.id === v.nomineeId));
          await window.RAML_SUPABASE.castVoteRemote({
            voterId: v.voterId || state.currentVoterId,
            categoryId: cat ? cat.id : 'unknown',
            nomineeId: v.nomineeId,
            nomineeName: v.nomineeName,
            categoryName: v.categoryName,
            ballotHash: v.ballotHash
          });
          pushed++;
        }
        showFeedback(`Successfully uploaded ${pushed} local votes to Supabase Cloud!`, 'success');
        syncFromCloud();
      });
    }

    // Listen to incoming live votes from other devices
    window.addEventListener('raml:cloud-vote-received', (event) => {
      const cloudVote = event.detail;
      if (!cloudVote) return;
      
      const voteKey = `${cloudVote.category_id}__${cloudVote.nominee_id}`;
      state.candidateTally[voteKey] = (state.candidateTally[voteKey] || 0) + 1;
      saveTally();

      if (cloudVote.voter_id === state.currentVoterId && !state.userVotes[cloudVote.category_id]) {
        state.userVotes[cloudVote.category_id] = {
          nomineeId: cloudVote.nominee_id,
          nomineeName: cloudVote.nominee_name,
          categoryName: cloudVote.category_name,
          timestamp: new Date(cloudVote.created_at).toLocaleString(),
          ballotHash: cloudVote.ballot_hash,
          voterId: cloudVote.voter_id
        };
        saveVotes();
      }

      renderCategoryTabs();
      renderVotingSections();
      if (state.activeView === 'results') {
        renderLiveResults();
      }
      showToast(`Live vote received: ${cloudVote.nominee_name}`, 'fa-solid fa-cloud-arrow-down');
    });

    updateStatusUI();
    if (window.RAML_SUPABASE && window.RAML_SUPABASE.isConfigured()) {
      window.RAML_SUPABASE.initRealtime();
      syncFromCloud();
    }
  }

  // --- 12. Application Bootstrap ---
  function init() {
    initTally();
    updateVoterPill();
    renderCategoryTabs();
    renderVotingSections();
    startCountdownTimer();
    setupAdminControls();
    setupEventListeners();
    setupSupabaseIntegration();
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

# Regency Assets Management Limited - Supabase Cloud Setup Guide

This guide walks you through connecting your **Supabase Cloud Database** to the **Regency Voting Portal** to enable multi-device voting, real-time results sync, and tamper-evident audit logging.

---

## ⚡ Quick 4-Step Setup (Takes ~2 Minutes)

### Step 1: Create a Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and sign in (or click **"Sign in with GitHub"**).
2. Click **"New Project"**.
3. Fill in:
   - **Name**: `regency-voting-portal`
   - **Database Password**: Choose a strong password.
   - **Region**: Select a region close to your users (e.g., `Europe (London)` or `Europe (Frankfurt)`).
4. Click **"Create new project"** and wait ~1 minute for Supabase to provision your database.

---

### Step 2: Run the Database Schema Script
1. In your Supabase Project dashboard, click **"SQL Editor"** in the left sidebar (or press `Ctrl + Shift + S`).
2. Click **"New query"**.
3. Open the file [`supabase-schema.sql`](./supabase-schema.sql) in this repository, copy all the SQL code, and paste it into the Supabase SQL Editor.
4. Click the green **"Run"** button (or press `Ctrl + Enter`).
5. You should see `Success. No rows returned`.

> **What this does:**
> - Creates `public.raml_votes` (enforcing 1 vote per person per category).
> - Creates `public.raml_audit_logs` (blockchain-style ledger).
> - Configures Row Level Security (RLS) policies allowing public voting.
> - Enables Supabase Realtime broadcast so every phone and laptop updates instantly.

---

### Step 3: Copy Your Supabase API Credentials
1. In your Supabase Dashboard, click the **Settings gear icon (⚙️)** in the lower left sidebar.
2. Under Project Settings, click **"API"**.
3. Copy the following two values:
   - **Project URL**: e.g. `https://your-project-ref.supabase.co`
   - **Project API Keys &rarr; `anon` `public` key**: e.g. `eyJhbGciOiJIUzI1NiIsInR5cCI...`

---

### Step 4: Connect Your Portal to Supabase
You can connect your portal in **either** of these two easy ways:

#### Option A: Directly inside the Portal UI (No code editing needed!)
1. Open the live portal in your browser (e.g. on GitHub Pages).
2. Click the **"Supabase Sync"** button in the top navigation bar.
3. Paste your **Project URL** and **Anon Key**.
4. Click **"Connect & Save"**.
5. The badge will turn green (**🟢 Supabase Live**)! All votes cast on any device will now instantly sync through Supabase!

#### Option B: Set Default Credentials in `supabase-config.js`
Open [`supabase-config.js`](./supabase-config.js) and fill in:
```javascript
const DEFAULT_CONFIG = {
  SUPABASE_URL: 'https://your-project-ref.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```
Commit and push to GitHub. Every user who loads the site will automatically be connected to your Supabase cloud backend!

---

## 🔄 Real-time Multi-Device Verification
Once connected:
1. Open the portal on your **laptop** and on your **mobile phone**.
2. Cast a vote on your phone in any category.
3. Watch the **Live Results** chart and tally on your laptop screen increment immediately without refreshing the page!

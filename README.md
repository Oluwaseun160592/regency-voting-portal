# Regency Assets Management Limited - Voting Portal

Official Electronic Voting Portal for the **Regency Assets Management Limited Corporate Excellence Awards**.

---

## 🌐 1. Free Hosting on GitHub Pages (Recommended)

This repository is already configured with a continuous deployment GitHub Actions workflow (`.github/workflows/deploy.yml`).

### To activate GitHub Pages on your repository:
1. Open your GitHub repository in your browser:
   [https://github.com/Oluwaseun160592/regency-voting-portal](https://github.com/Oluwaseun160592/regency-voting-portal)
2. Click **Settings** (tab at the top right of the repository).
3. In the left sidebar, click **Pages** (under the "Code and automation" section).
4. Under **Build and deployment &rarr; Source**:
   - Select **GitHub Actions** (recommended for automatic deploys).
   - *Or* select **Deploy from a branch** &rarr; select branch: `main` &rarr; folder: `/ (root)` &rarr; click **Save**.
5. Within 30–60 seconds, your site will be live at:
   ```
   https://oluwaseun160592.github.io/regency-voting-portal/
   ```

---

## ⚡ 2. Supabase Cloud Database & Realtime Sync

To allow voters to cast ballots from different devices (phones, laptops, office desktops) and see votes update on live charts in real time:

1. Follow the **[Supabase Cloud Setup Guide (SUPABASE_SETUP.md)](./SUPABASE_SETUP.md)**.
2. Run the included **[`supabase-schema.sql`](./supabase-schema.sql)** in your Supabase SQL Editor.
3. In the voting portal, click the **"Supabase Sync"** button in the header and paste your Supabase Project URL and Anon Key (or save them in [`supabase-config.js`](./supabase-config.js)).
4. The status badge will turn **🟢 Supabase Live**, and all votes will sync across all devices in real time!

---

## 🚀 3. Alternative Hosting: Render

You can also host on **Render** (https://render.com) for free:

1. Log into [Render Dashboard](https://dashboard.render.com).
2. Click **"New +"** &rarr; **"Static Site"**.
3. Connect your GitHub repository `regency-voting-portal`.
4. Settings:
   - **Branch**: `main`
   - **Publish Directory**: `.`
5. Click **"Create Static Site"**.
6. Live URL: `https://regency-voting-portal.onrender.com`

---

## 💻 Local Preview
To test locally:
```bash
npx http-server -p 8080
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

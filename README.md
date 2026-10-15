# Regency Assets Management Limited - Voting Portal

Official Electronic Voting Portal for the **Regency Assets Management Limited Corporate Excellence Awards**.

---

## 🚀 How to Deploy on Render (Step-by-Step)

Deploying this site on **Render** (https://render.com) takes less than 2 minutes and is **100% free**.

### Option A: Deploy as a Static Site (Recommended - Fastest & Always Free)

1. **Push this project to a GitHub Repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Regency Assets Voting Portal"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

2. **Open Render Dashboard**:
   - Go to [https://dashboard.render.com](https://dashboard.render.com) and log in.
   - Click the blue **"New +"** button in the top right.
   - Select **"Static Site"**.

3. **Connect Repository & Configure**:
   - Connect your GitHub account and select your repository.
   - Fill in the following settings:
     - **Name**: `regency-voting-portal` (or your preferred name)
     - **Branch**: `main`
     - **Build Command**: *(leave blank)*
     - **Publish Directory**: `.` (a single dot)
   
4. **Deploy**:
   - Click **"Create Static Site"**.
   - Render will build and deploy the site in ~30 seconds.
   - Your public URL will be live at:
     ```
     https://regency-voting-portal.onrender.com
     ```
   - Anyone on any device (phone, laptop, tablet) can now access and vote!

---

### Option B: Deploy Using Render Blueprints (Automatic)

Since this repository includes [`render.yaml`](./render.yaml):
1. In your Render Dashboard, click **"New +"** -> **"Blueprint"**.
2. Connect this repository.
3. Render will read `render.yaml` and configure everything automatically.
4. Click **"Apply"**.

---

## 💻 Local Preview
To test locally:
```bash
npx http-server -p 8080
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

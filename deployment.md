# ASTRAM — Deployment Guide (Free Tier)

Deploy the ASTRAM EventTwin app for **free** using **Render** (backend) and **Vercel** (frontend).

---

## Prerequisites

- GitHub account with the project pushed to a repository
- [Render](https://render.com) account (free)
- [Vercel](https://vercel.com) account (free)
- Groq API key (free at [console.groq.com](https://console.groq.com))

---

## Step 1: Push to GitHub

```bash
# From the project root (backend (1)/)
git init
git add .
git commit -m "Initial commit - ASTRAM EventTwin"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/astram-eventtwin.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend on Render (Free)

### 2.1 Create a new Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Configure:

| Setting | Value |
|---|---|
| **Name** | `astram-backend` |
| **Region** | Oregon (US West) or closest |
| **Root Directory** | `backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt && pip install groq python-dotenv` |
| **Start Command** | `uvicorn app:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free |

### 2.2 Set Environment Variables

In the Render dashboard → your service → **Environment**:

| Key | Value |
|---|---|
| `GROQ_API_KEY` | `gsk_xxxxxxxxxxxx` |
| `PYTHON_VERSION` | `3.10.12` |

### 2.3 Important: Include Model Files

The free tier has **limited build time**. The pre-trained models (`models/`) must be committed to Git:

```bash
# Make sure these files are NOT in .gitignore:
# models/embeddings.npy (12.5 MB)
# models/similarity_engine.pkl (12.5 MB)
# models/hotspots.csv
# models/priority_model.pkl
# models/resolution_model.pkl
# data/Astram_event_data.csv (4.5 MB)
```

> **Note:** If your repo exceeds GitHub's 100MB file limit, use [Git LFS](https://git-lfs.com/) for `embeddings.npy` and `similarity_engine.pkl`.

### 2.4 Verify

After deploy completes (3–5 min), visit:
```
https://astram-backend.onrender.com/health
```
Expected: `{"status": "healthy", "backend": "running", "service": "ASTRAM EventTwin"}`

> ⚠️ **Free tier cold starts**: The first request after 15 min of inactivity takes ~30–60s to spin up. This is normal.

---

## Step 3: Deploy Frontend on Vercel (Free)

### 3.1 Update API Base URL

Before deploying, update the backend URL in `frontend/src/App.jsx`:

```javascript
// Change this line:
const API_BASE = 'http://localhost:8000';

// To your Render backend URL:
const API_BASE = 'https://astram-backend.onrender.com';
```

Commit and push:
```bash
git add frontend/src/App.jsx
git commit -m "Update API base for production"
git push
```

### 3.2 Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure:

| Setting | Value |
|---|---|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

4. Click **Deploy**

### 3.3 Verify

After deploy (1–2 min), Vercel gives you a URL like:
```
https://astram-eventtwin.vercel.app
```

Open it and run a simulation!

---

## Step 4: Fix CORS (if needed)

If the frontend can't reach the backend, add the Vercel domain to CORS in `backend/app.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://astram-eventtwin.vercel.app",  # Add your Vercel URL
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Commit, push, and Render will auto-redeploy.

---

## Alternative: Deploy Both on Render

If you prefer deploying everything on Render:

### Backend (same as above)

### Frontend as Static Site

1. **New +** → **Static Site**
2. Configure:

| Setting | Value |
|---|---|
| **Name** | `astram-frontend` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

3. Add a redirect rule for SPA routing:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Status**: `200`

---

## Environment Variable Reference

### Backend (Render)

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | Groq API key for AI recommendations |
| `PYTHON_VERSION` | Recommended | Set to `3.10.12` |
| `PORT` | Auto-set | Render provides this automatically |

### Frontend (Vercel)

No environment variables needed — the API URL is hardcoded in `App.jsx`.

---

## Cost Summary

| Service | Tier | Cost | Limits |
|---|---|---|---|
| **Render** (backend) | Free | $0/mo | 750 hrs/mo, cold starts after 15min idle |
| **Vercel** (frontend) | Hobby | $0/mo | 100GB bandwidth, 100 deploys/day |
| **Groq API** | Free | $0/mo | 30 req/min, 14,400 req/day |
| **OSRM** | Public | $0 | No key required, fair use |
| **OpenStreetMap** | Public | $0 | Tile usage policy applies |

**Total: $0/month**

---

## Troubleshooting

### Backend won't start on Render
- Check the **Logs** tab in Render dashboard
- Ensure `requirements.txt` has all dependencies
- Ensure model files are committed (not gitignored)
- Set `PYTHON_VERSION=3.10.12` in environment variables

### "Failed to fetch" in frontend
- Check that `API_BASE` in `App.jsx` points to your Render URL
- Check CORS settings in `app.py`
- Wait 30–60s for Render cold start

### Models too large for GitHub
Use Git LFS:
```bash
git lfs install
git lfs track "*.npy"
git lfs track "*.pkl"
git add .gitattributes
git commit -m "Track large files with LFS"
git push
```

### Groq API errors
- Verify your API key at [console.groq.com](https://console.groq.com)
- Check rate limits (30 req/min on free tier)
- The app will still work without Groq — recommendation will show "(no recommendation returned)"

---

## Production Checklist

- [ ] Update `API_BASE` in `frontend/src/App.jsx` to Render URL
- [ ] Set `GROQ_API_KEY` in Render environment variables
- [ ] Verify all model files are committed to Git
- [ ] Add Vercel domain to CORS origins in `app.py`
- [ ] Test health endpoint: `GET /health`
- [ ] Test simulation: Run a sample event
- [ ] Test map download: Click "Download Planned Map"
- [ ] Test PDF download: Click "Download PDF Report"

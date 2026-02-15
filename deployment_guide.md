# Deployment Guide for JobTinder 🚀

This guide explains how to deploy the full stack application:
1.  **Frontend** (Next.js) -> **Vercel**
2.  **Backend** (Python API) -> **Render** (or Railway)
3.  **Database** -> **Supabase** (Already hosted)

---

## 1. Prerequisites

-   A GitHub account (push your code to a repository).
-   A Vercel account (free tier).
-   A Render account (free tier available, but Starter recommended for Docker).

---

## 2. Deploy Frontend (Vercel)

The frontend is a standard Next.js app.

1.  **Push to GitHub**: Ensure your project is on GitHub.
2.  **Import Project in Vercel**:
    -   Go to [Vercel Dashboard](https://vercel.com/dashboard).
    -   Click **Add New...** > **Project**.
    -   Select your `job-tinder` repository.
3.  **Configure Project**:
    -   **Framework Preset**: Next.js (Default).
    -   **Root Directory**: `./` (Default).
4.  **Environment Variables**:
    Add the following from your `.env.local`:
    -   `NEXT_PUBLIC_SUPABASE_URL`: (your URL)
    -   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (your Anon Key)
5.  **Deploy**: Click **Deploy**. Vercel will build and host your site.

---

## 3. Deploy Backend (Render)

The backend uses Docker and requires a reliable hosting provider.

1.  **Go to Render Dashboard**: [dashboard.render.com](https://dashboard.render.com/).
2.  **New Web Service**: Click **New +** > **Web Service**.
3.  **Connect GitHub**: Select your `job-tinder` repository.
4.  **Configure Details**:
    -   **Name**: `job-tinder-api`
    -   **Root Directory**: `browser-use` (Important! This tells Render where the Dockerfile is).
    -   **Runtime**: **Docker**.
    -   **Instance Type**: Free (might be slow) or Starter ($7/mo).
5.  **Environment Variables**:
    Add all keys from `browser-use/.env`:
    -   `SUPABASE_URL`: (your URL)
    -   `SUPABASE_KEY`: (your Anon Key)
    -   `SUPABASE_SERVICE_ROLE_KEY`: (your Service Role Key - **CRITICAL**)
    -   `GOOGLE_API_KEY`: (your Gemini Key)
6.  **Advanced**:
    -   **Auto-Deploy**: Yes (on push).
    -   **Port**: `8000` (Matches the Dockerfile `EXPOSE`).
7.  **Create Web Service**.

Render will build the Docker image (installing Playwright browsers takes a few minutes). Once live, you will get a URL like `https://job-tinder-api.onrender.com`.

---

## 4. Connect Frontend to Backend

Now that the backend is live, tell the frontend where to find it.

1.  **Update Frontend Config** (If hardcoded):
    -   Check `src/lib/jobService.js` or `api_server.py`.
    -   Currently, the frontend calls `/api/PROXY` routes in Next.js, or calls the Python API directly.
    -   **Correction**: Since we use Next.js for UI, but the "Matching" logic runs on Python...
        -   **If frontend calls Python directly**: You need to add a new env var `NEXT_PUBLIC_API_URL` to Vercel pointing to the Render URL.
        -   **If frontend uses Next.js API Routes (`src/app/api/...`)**: You might not need to change anything if the Python server is only for background tasks.
        -   *Wait*, `api_server.py` handles `/match` and `/enrich`. The Frontend calls these.
        -   The frontend likely assumes `localhost:8000` in development.
        -   **Action**: You MUST configure the API URL in the frontend.

2.  **Add API URL to Vercel**:
    -   Go to Vercel > Settings > Environment Variables.
    -   Add `NEXT_PUBLIC_API_URL` = `https://job-tinder-api.onrender.com` (Your Render URL).
    -   **Update Code**: Ensure your frontend code uses `process.env.NEXT_PUBLIC_API_URL` instead of `http://localhost:8000`.

---

## 5. Verify

1.  Open your Vercel URL.
2.  Login.
3.  Check that matches load.
4.  Check that "AI Enrichment" works (might exist in background).

**Troubleshooting**:
-   **CORS Errors**: I have already enabled `allow_origins=["*"]` in `api_server.py` to allow Vercel to fetch data.
-   **Cold Starts**: On Free Render tier, the API sleeps after inactivity. It might take 50s to wake up on first request.

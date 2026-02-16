# Vibe To-Do

A tiny, beginner-friendly task app built with **Vite + Vanilla JavaScript**.

## What this app does

- Add tasks.
- Mark tasks complete or incomplete.
- Delete tasks.
- Filter by **All**, **Active**, or **Completed**.
- Save tasks in `localStorage` so your list survives refresh.

## Project structure

```text
.
├── .github/workflows/deploy-pages.yml   # GitHub Actions workflow for Pages deploy
├── index.html                           # Main HTML structure
├── src/main.js                          # App logic + localStorage handling
├── src/style.css                        # App styling (mobile-friendly)
├── vite.config.js                       # Vite config (GitHub Pages base path)
└── README.md
```

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open the URL shown in your terminal (usually `http://localhost:5173`).

## Build locally

```bash
npm run build
npm run preview
```

## Deploy and view on GitHub Pages (step-by-step)

1. Push this repository to GitHub.
2. Ensure your default branch is `main` (the workflow deploys on pushes to `main`).
   - This workflow uses `npm install` (not `npm ci`) so it works even if a lockfile is not present.
3. In GitHub, go to:
   - **Repo → Settings → Pages**
   - Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Push to `main` (or trigger the workflow manually from the **Actions** tab).
5. After deployment finishes, open:
   - **Actions → Deploy Vite app to GitHub Pages → deploy job**
   - The live URL appears there and in the environment link.

Expected Pages URL format:

```text
https://<your-github-username>.github.io/Practice/
```

> Why this works: `vite.config.js` sets `base: '/Practice/'`, matching the repository name for GitHub Pages project sites.

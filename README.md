# Tudor Farm Cottages Dynamic Website

Modern mobile-first website + lightweight CMS using static frontend + Vercel serverless functions.

## Stack

- Frontend: HTML, Tailwind CSS (CDN), Vanilla JS
- Hosting: Vercel
- Storage: JSON files in GitHub repository
- Backend: Vercel Serverless Functions (`/api`)

## Project Structure

- `index.html` - Public website
- `admin/index.html` - Admin panel (login + CRUD)
- `data/rooms.json` - Room content
- `data/gallery.json` - Gallery content
- `data/config.json` - Site config and WhatsApp number
- `api/save-data.js` - Secure GitHub commit API
- `api/health.js` - Basic API health check

## 1) Configure Raw Data Source URLs

Edit both `index.html` and `admin/index.html` and replace:

- `YOUR_GITHUB_OWNER`
- `YOUR_REPO`

So this base URL points to your real repo:

`https://raw.githubusercontent.com/<owner>/<repo>/main/data`

## 2) GitHub Token Setup

Create a GitHub Personal Access Token with repository write access.

Recommended fine-grained token permissions on the target repo:

- Contents: Read and write
- Metadata: Read

## 3) Vercel Environment Variables

In Vercel Project Settings -> Environment Variables, set:

- `GITHUB_TOKEN` = your PAT
- `GITHUB_OWNER` = repo owner (user/org)
- `GITHUB_REPO` = repo name
- `GITHUB_BRANCH` = `main` (or your default branch)

Do not expose `GITHUB_TOKEN` in frontend code.

## 4) Deploy

- Push this project to GitHub.
- Import repo into Vercel.
- Add environment variables.
- Redeploy.

## 5) Admin Usage

Open `/admin`.

Default hardcoded admin password:

`tudor-admin-123`

After login:

- Add/edit/delete rooms
- Add/edit/delete gallery images
- Save Rooms / Save Gallery sends data to `/api/save-data`
- Serverless function updates `data/*.json` by committing to GitHub

## Notes

- This architecture avoids PHP and traditional servers.
- No local file writes are used.
- Public site always fetches from GitHub raw JSON files.
- For production, replace hardcoded admin password with stronger auth (Vercel Edge Middleware + session/JWT or provider auth).

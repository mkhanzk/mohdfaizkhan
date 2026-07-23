# Mohd Faiz Khan — Data Analyst Portfolio

A static portfolio website. No build step, no server required.

## Structure
- `index.html` — the whole page (About, Skills, Experience, Projects, Contact)
- `css/style.css` — styling (light/dark mode aware)
- `js/script.js` — filtering logic, owner login gate, "Add Project" form, dashboard embed viewer
- `data/projects.json` — the permanent project list (shown to every visitor)
- `assets/` — CV PDF and profile photo

## Owner login

The Projects section has a "🔒 Owner Login" button. Only someone who enters the correct
access code can see the "+ Add Project" button or any remove/publish controls — everyone
else can only view and filter projects. The code is never stored in plain text in the
site's files, only a one-way hash of it, so it isn't readable by viewing the page source.

This is a client-side gate, appropriate for keeping casual visitors (including recruiters)
from adding or deleting projects. It is not a substitute for a real backend — someone who
deliberately opens browser developer tools could bypass the UI. For a portfolio's project
list, this is a reasonable trade-off.

**If you ever need to change the access code:** ask your assistant to generate a new one —
it computes a new SHA-256 hash and updates the `OWNER_HASH` constant in `js/script.js`.

## How adding a project actually works

This is a static site with no database, so there is no way for the page itself to make
something permanently visible to every visitor. The workflow is:

1. Log in with the owner access code.
2. Click **+ Add Project** and fill in the form. The project is saved to your browser's
   `localStorage` and appears on your screen immediately, marked **"Draft — only visible
   to you"**. No one else can see it yet.
3. Click **📋 Copy JSON to publish** on that project's card, then paste it into your chat
   with your assistant and ask them to publish it.
4. Your assistant adds it to `data/projects.json` and pushes the change to GitHub — from
   that point on, it's live for every visitor, permanently, without needing your login at all.
5. Click **Discard draft** on your local copy once it's live, so it doesn't show up twice.

**To remove a live project:** while logged in, click **🗑 Copy removal request** on that
project's card and send the copied message to your assistant.

## Dashboard embed links

When adding a project, the optional **Dashboard Embed Link** field lets a Tableau Public
or Power BI "Publish to web" link open right inside the site, in a modal, instead of
sending the visitor away. Paste the embed/share URL Tableau or Power BI gives you — a
"▦ Open Dashboard" button then appears on that project's card.

## Manually editing `data/projects.json`

You can also skip the in-page form entirely and edit the file directly (or ask your
assistant to do it). Each entry looks like:

```json
{
  "id": "unique-id-here",
  "title": "Your Project Title",
  "description": "What you built and why it mattered.",
  "difficulty": "Easy | Medium | Hard",
  "tools": ["Excel", "SQL", "Python", "Power BI", "Tableau"],
  "businessCategory": "E-commerce | IT | Finance | Healthcare | Retail | Education | Other",
  "link": "https://... (optional, e.g. GitHub or a write-up)",
  "embedLink": "https://... (optional, Tableau Public / Power BI embed URL)",
  "tags": ["Any", "Extra", "Keywords"],
  "date": "2026-01-01"
}
```

## Viewing it locally
Any static file server works, e.g. from this folder:
```
python -m http.server 8090
```
then open http://localhost:8090

(Opening `index.html` directly by double-click also mostly works, but some browsers
block the `fetch()` of `data/projects.json` from a `file://` URL — a local server avoids that.)

## Publishing it for free
- **GitHub Pages**: push this folder to a GitHub repo, enable Pages in repo settings.
- **Netlify / Vercel**: drag-and-drop this folder in their dashboard — live in seconds.

Once published, share the link on your resume/LinkedIn — that's the version recruiters see.

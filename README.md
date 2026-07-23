# Mohd Faiz Khan — Data Analyst Portfolio

A static portfolio website. No build step, no server required.

## Structure
- `index.html` — the whole page (About, Skills, Experience, Projects, Contact)
- `css/style.css` — styling (light/dark mode aware)
- `js/script.js` — filtering logic + "Add Project" form
- `data/projects.json` — the permanent/seed project list (shown to every visitor)
- `assets/` — your CV PDF

## Two ways to add a project

**1. Quick / personal (in-page "+ Add Project" button)**
Projects added this way are saved to your browser's `localStorage` only. They show up
for you on that browser/device, but a recruiter opening the site elsewhere won't see them.
Good for drafting or if you're only ever showing the site from your own laptop.

**2. Permanent / visible to everyone (edit `data/projects.json`)**
Open `data/projects.json` and copy an existing entry, e.g.:

```json
{
  "id": "unique-id-here",
  "title": "Your Project Title",
  "description": "What you built and why it mattered.",
  "difficulty": "Easy | Medium | Hard",
  "tools": ["Excel", "SQL", "Python", "Power BI", "Tableau"],
  "businessCategory": "E-commerce | IT | Finance | Healthcare | Retail | Education | Other",
  "link": "https://... (optional, e.g. GitHub or a published dashboard)",
  "tags": ["Any", "Extra", "Keywords"],
  "date": "2026-01-01"
}
```
Add it to the array and save. This is what recruiters will actually see, so use this
for anything you want permanently on the site.

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

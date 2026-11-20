# Personal Website

A Spider-Man themed portfolio for Ben Gary Leo. As you scroll, a web thread runs down the page and project cards swing into view, grouped by domain with their skills.

Built with **Next.js 16 (App Router)**, **React**, **TypeScript** and **GSAP + ScrollTrigger**.

## What's built so far

| Section | What it does |
|---|---|
| **Nav** | Sticky bar with a BGL logo and About / Projects / Contact links. Transparent over the hero, solid after it, highlights the active section, smooth scrolls. |
| **Hero** | Web lines draw themselves on load, a spider dangles on a thread that stretches as you scroll, comic-style title with red and blue offset shadows. |
| **About ("Origin Story")** | Bio, education, leadership, skills and certifications, taken from the resume. |
| **Projects** | A web thread draws down the page as you scroll. Four domains (AI & Data Systems, Web & Frontend, Games, Algorithms & Optimisation) with cards that swing in and link to GitHub. |
| **Contact** | GitHub, LinkedIn and email buttons. |

Animations respect `prefers-reduced-motion`. The layout was checked at 375px (phone) and desktop widths.

## Editing content

All text lives in JSON files, so you rarely need to touch components.

| File | Controls |
|---|---|
| `data/projects.json` | Project domains, cards, descriptions, skill tags and repo links. Leave out `repo` for a private project. |
| `data/about.json` | Bio, education, skills, leadership, certifications. |
| `data/profile.json` | Name and GitHub / LinkedIn / email links. |

## Project structure

```
app/            layout, global styles, home page
components/     Nav, Hero, About, Projects, Contact (each with a CSS module)
data/           JSON content files
public/         static assets
graphify-out/   knowledge graph of this codebase (see below)
```

## Running locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Other scripts: `npm run build`, `npm run lint`.

## Deployment

Hosted on Vercel, linked to this repository (project `personal-website`, production branch `main`). Every push to `main` deploys automatically.

> Note: Vercel's default Deployment Protection is on, so the site currently asks for a Vercel login. To make it public, turn off Vercel Authentication for the project in the Vercel dashboard under Settings, Deployment Protection.

## Knowledge graph

`graphify-out/` holds a [graphify](https://github.com/safishamsi/graphify) knowledge graph of the code:

- `graph.html`: interactive graph, open in a browser
- `GRAPH_REPORT.md`: plain-language summary of the structure
- `graph.json`: raw graph data

It is built from the code structure only (no LLM), so every edge is extracted directly from the source.

## Next ideas

- Real project screenshots or demo links on the cards
- Resume download button
- Custom domain

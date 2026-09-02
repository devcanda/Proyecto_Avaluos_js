# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

"Candamil & Asociados - Avalúos" is a small internal tool for managing real-estate appraisal reports (avalúos): a dashboard of appraisal records, a form to create/edit them, and a template editor that lets a user customize the layout of the generated PDF report. It's a two-package repo (backend + frontend) glued together by a root orchestrator package.

## Commands

Run from the repo root (`concurrently` starts both):
```
npm run dev     # backend (nodemon) + frontend (vite) together
npm run api     # backend only
npm run app     # frontend only
```

Backend (`api-avaluos/`):
```
npm run dev     # nodemon server.js — auto-restarts on file change, listens on :3000
```
There is no build step, no lint config, and no real test suite for the backend (`npm test` is a placeholder that just exits with an error).

Frontend (`app-avaluos/`):
```
npm run dev       # vite dev server
npm run build     # production build
npm run lint      # eslint .
npm run preview   # preview a production build
```
No test suite exists on the frontend either — verify UI changes by running the dev server and exercising the feature manually (this app has no automated tests to fall back on).

## Architecture

**Two independent apps, no shared package/types.** The frontend talks to the backend exclusively over HTTP, hitting hardcoded `http://localhost:3000/api/...` URLs sprinkled across the components (`Dashboard.jsx`, `FormularioAvaluo.jsx`, `GestorPlantillas.jsx`) — there's no `.env`, proxy config, or API client module. If the backend port or host changes, these literals need updating in each component.

**Backend is a single-file Express server** (`api-avaluos/server.js`) with no router/controller/service split — every route, all business logic, and the PDF-generation pipeline live in that one file. Key pieces:
- `src/config/db.js` — a `mysql2` promise pool with hardcoded local credentials (XAMPP defaults: `root`/no password, db `candamil_avaluo`). There are no migration files; the schema (tables `avaluoenntity`, `plantillas_pdf`) is implicit and must be inferred from the queries in `server.js`.
- File uploads go through `multer` disk storage straight into `api-avaluos/uploads/`, which is also served statically at `/uploads`. Generated PDFs (`Avaluo_<id>.pdf`) and uploaded photos land in this same folder and are checked into git — this is intentional in this repo's workflow, not an oversight, so don't add them to `.gitignore` or delete them without checking with the user.
- PDF generation (`GET /api/avaluos/:id/pdf`) is the most complex route: it loads the appraisal row, base64-encodes referenced images (facade photo, map, letterhead/`membrete`, signature, annexed photos), builds an annex-photos HTML table, renders `views/pdf-template.ejs` with the active row from `plantillas_pdf` (field layout as `configuracion_campos` JSON, letterhead position/scale as `ajustes_membrete` JSON), then feeds the resulting HTML into Puppeteer (`headless: 'new'`) to produce the PDF written back into `uploads/`.
- The "plantillas" (templates) system is effectively a tiny CMS: `POST /api/plantillas` stores a template's field layout and letterhead placement, always resetting `es_predeterminada` (the "default" flag) so only one template is active at a time. The PDF route always renders using whichever template has `es_predeterminada = 1`.

**Frontend is a single-page app with no router library.** `App.jsx` holds `vistaActiva` state (`'dashboard' | 'formulario' | 'plantillas'`) and conditionally renders one of the three top-level components; "login" (`sesionIniciada`) is a local boolean with no real authentication. `FormularioAvaluo` is passed an `idEdicion` prop that's `null` for a new appraisal or a row id for editing — it fetches the existing row and pre-fills state when editing.

**Leftover files to be aware of:** `api-avaluos/server_original.js` is a superseded, unused backup of the server (not referenced by any npm script). The numerous root-level `fix_*.js`, `patch.js`, `apply_ejs_fix.js`, and `remove_page_breaks*.js` scripts in `api-avaluos/` are one-off scripts used in the past to patch `server.js`/the EJS template during development — they are not part of the running app and aren't wired into any npm script.

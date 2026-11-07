# HiLabs Case Management Workbench – MVP prototype

Clickable web prototype for the **HiLabs Product Caselet 2026–27 (APM)**. Built by Arnav Ranjan (2023CH10371).

**All data is synthetic** (5 fictional patients; mirrors `HiLabs_Synthetic_Patients_Annex.xlsx`). Not for clinical use. No backend, no real PHI: everything runs in the browser (state kept in `localStorage`).

## Run
Open `index.html` in a browser, or serve the folder: `python3 -m http.server` then visit http://localhost:8000.

## What it demonstrates
| Screen | Shows |
|---|---|
| **Today** | Ranked queue with a transparent, editable 100-point score; due-clocks; one next action per member; snooze with reason |
| **Member brief** | Data-freshness chips, cross-source conflicts with confidence, AI brief (draft → clinician confirms), next-best-actions (accept / snooze / not relevant + reason), medications side by side, stale-SDOH badges, consent-gated sensitive data |
| **Outreach & documentation** | Number ranking (dead numbers suppressed), opener, call-note draft, assessment prefill (prefilled / ask / clinical judgment), sign-off gate |

**Automated:** joining sources, freshness, clocks, score, number validity. **AI drafts → clinician confirms:** brief, conflict suggestions, call note, assessment prefill. **Clinician only:** judgments, care-plan goals, medication questions to prescribers, closing a case.

The "AI" text is pre-written for the five synthetic patients; this prototype demonstrates the design, not a live model.

## Files
`index.html` · `style.css` · `app.js` · `data.js` (synthetic patients) · `logo.png` · `net.svg`

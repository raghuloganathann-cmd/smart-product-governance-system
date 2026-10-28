# Smart Product Governance System

A simple web app to register products, score their risk, run compliance checks,
and approve releases only when the required checks are complete.

## Run
Open `index.html` in any browser. No installation or server needed.

## Files
- `index.html` - page structure
- `style.css`  - styling (light and dark mode)
- `app.js`     - logic: risk scoring, required checks, approval workflow, audit log

## Rules (edit in app.js)
- `riskOf()` calculates a risk score: personal data (+3), users (0-4), criticality (0-4).
  Score 7+ = High, 4-6 = Medium, below 4 = Low.
- `required()` picks the compliance checks by risk level.
- A product cannot move from "Under review" to "Approved" until all required checks pass.

## Lifecycle
Draft -> Under review -> Approved -> Released -> Retired

Data is stored in the browser's localStorage.

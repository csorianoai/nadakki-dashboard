# PR #140 — Dealer Portal screenshots

Captured **2026-06-16** with `tools/capture-dealer-pr140-screenshots.mjs` against `next start -p 3020` (production build of `feat/credit-hub-dealer-port`).

## Method

| Item | Value |
|------|-------|
| Tool | Playwright (msedge channel, chromium fallback) |
| Desktop viewport | 1280×800 |
| Mobile viewport | 375×812 |
| Auth / data | Client `fetch` mocks (auth refresh/me + credit applications/stats/branding) — no live Render backend required |
| Windows note | Same approach as MEE audit: bundled Chromium spawn can fail; msedge channel used successfully |

## Routes (26 images)

| # | Route | Desktop | Mobile |
|---|-------|---------|--------|
| 01 | `/credit-hub/dealer` | `desktop/01-dealer-dashboard.png` | `mobile/01-dealer-dashboard.png` |
| 02 | `/credit-hub/dealer/applications` | `desktop/02-dealer-applications.png` | `mobile/02-dealer-applications.png` |
| 03 | `/credit-hub/dealer/applications/APP-1847` | `desktop/03-dealer-application-detail.png` | `mobile/03-dealer-application-detail.png` |
| 04 | `/credit-hub/dealer/applications/new` → applicant | `desktop/04-dealer-new-redirect.png` | `mobile/04-dealer-new-redirect.png` |
| 05 | wizard applicant | `desktop/05-wizard-applicant.png` | `mobile/05-wizard-applicant.png` |
| 06 | wizard co-borrower | `desktop/06-wizard-co-borrower.png` | `mobile/06-wizard-co-borrower.png` |
| 07 | wizard vehicle | `desktop/07-wizard-vehicle.png` | `mobile/07-wizard-vehicle.png` |
| 08 | wizard documents | `desktop/08-wizard-documents.png` | `mobile/08-wizard-documents.png` |
| 09 | wizard consent | `desktop/09-wizard-consent.png` | `mobile/09-wizard-consent.png` |
| 10 | wizard complete | `desktop/10-wizard-complete.png` | `mobile/10-wizard-complete.png` |
| 11 | preapproval | `desktop/11-dealer-preapproval.png` | `mobile/11-dealer-preapproval.png` |
| 12 | notifications | `desktop/12-dealer-notifications.png` | `mobile/12-dealer-notifications.png` |
| 13 | profile | `desktop/13-dealer-profile.png` | `mobile/13-dealer-profile.png` |

## Known capture caveats (not blocking PR review)

- **Wizard steps 1 (applicant) & 3 (vehicle)** hit `RouteErrorBoundary` (`credit-hub.dealer`) under mocked-data capture — screenshots show the error state. Steps 2, 4, 5, complete render correctly with Package 2 chrome.
- **Currency display** shows `undefined` prefix on amounts when `currency_code` is DOP (dealerUi prefix bug — separate fix).
- Mock data only; live tenant may differ.

## Regenerate

```powershell
npx next start -p 3020
$env:BASE_URL="http://127.0.0.1:3020"
node tools/capture-dealer-pr140-screenshots.mjs
```

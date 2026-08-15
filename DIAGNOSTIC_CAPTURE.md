# DIAGNOSTIC INSTRUCTIONS - MANUAL CAPTURE

Dev server is running at: http://localhost:3000

## Steps to Capture Console Logs:

1. Open Chrome/Edge browser
2. Press F12 to open Developer Tools
3. Navigate to Console tab
4. Navigate to: http://localhost:3000/auth/login

5. Login with:
   - Email: `analista@test-piloto-02.com`
   - Password: `TestPiloto2026!Seguro`

6. After login, navigate to:
   http://localhost:3000/credit-hub/bank/applications/6a68b243-567b-493d-9b7d-68fd048eb62d

7. Wait for page to load, then click on "Estipulaciones" tab

8. Wait 3 seconds, then click on "Auditoría" tab

9. In the Console, look for logs that start with:
   - `[StipulationsTab] DIAGNOSTIC`
   - `[getStipulations]`
   - `[AuditTab] DIAGNOSTIC`
   - `[useBankAuditTrail]`
   - `[getAuditTrail]`
   - `[BankApplicationReviewPage] DIAGNOSTIC`

10. Copy ALL these logs and paste them here in this file below the divider line.

================================================================================
PASTE CONSOLE LOGS HERE:
================================================================================



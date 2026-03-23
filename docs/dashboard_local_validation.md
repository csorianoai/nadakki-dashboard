# Dashboard Local Validation

Quick guide for running and validating the Nadakki dashboard locally.

---

## Start Dev Server

Standard port: **3001** (use `dev:stable` for Windows stability):

```bash
npm run dev:stable
```

Dashboard available at `http://localhost:3001`.

---

## Run Full HTTP Audit

Verifies all agents via dashboard proxy (`/api/v1/agents/{id}/execute`). Requires dashboard and backend running.

```powershell
.\tools\audit\audit_agents_execute.ps1
```

Default BaseUrl: `http://localhost:3001`

Success indicators:
- **URLs contain /run: False**
- **OK: 18** (or matching total calls)

Reports: `logs/audit/agents_execute_audit_<ts>.json` and `.md`

---

## Run Smoke HTTP Audit

Faster validation (2 agents × 2 variants):

```powershell
.\tools\audit\audit_agents_execute.ps1 -Smoke
```

Expect: **4 calls**, all OK, **URLs contain /run: False**.

---

## If Port Is In Use

1. Stop the process using port 3001 (e.g. another Next.js instance)
2. Or override port: `npm run dev` (uses 3000) and run audit with `-BaseUrl http://localhost:3000`
3. Or run audit against a different BaseUrl: `.\tools\audit\audit_agents_execute.ps1 -BaseUrl http://localhost:3002`

---

## Execute Flow

- Dashboard proxy forwards only to `/api/v1/agents/{id}/execute`
- No `/run` in execute flow (verified by audit logs)

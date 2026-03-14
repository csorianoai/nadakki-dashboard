# Windows Dev Stability

## OS Error 1224

On Windows, Next.js dev server may fail with **error 1224** (ERROR_USER_MAPPED_FILE) when using Turbopack. This occurs when file handles are locked by antivirus, WSL, or other processes.

## Mitigation

1. **Use `dev:stable`** (recommended on Windows):

   ```bash
   npm run dev:stable
   ```

   This runs `next dev --webpack -p 3001`, disabling Turbopack and using Webpack instead.

2. **Environment variable** (alternative):

   Add to `.env.local`:

   ```
   NEXT_DISABLE_TURBOPACK=1
   ```

   Then run `npm run dev` — Next.js will use Webpack when this is set.

3. **Port**  
   Standard local dev port: **3001** (`dev:stable`). The audit runner and docs assume `http://localhost:3001`.

## Summary

| Script              | Port | Turbopack | Use case            |
|---------------------|------|-----------|---------------------|
| `npm run dev`       | 3000 | Yes       | Fast refresh        |
| `npm run dev:stable`| 3001 | No (Webpack) | Windows stability (recommended) |

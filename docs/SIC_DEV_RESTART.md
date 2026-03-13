# SIC Dev Runtime — Clean Restart

When SIC routes behave oddly (stale cache, ENOENT, mixed router issues):

## PowerShell

```powershell
# 1. Stop dev server (Ctrl+C if running)
# 2. Kill any orphan node processes (optional)
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# 3. Remove stale build cache
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# 4. Restart dev server
npm run dev
```

## Notes

- `.next` holds cached routes; removing it forces a full rebuild
- If webpack-based dev is preferred: `npm run dev:stable` (if script exists)
- Backend must be running at `NEXT_PUBLIC_NADAKKI_API_BASE` (default `http://127.0.0.1:8000`)

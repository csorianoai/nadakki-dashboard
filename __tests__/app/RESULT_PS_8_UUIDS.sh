#!/usr/bin/env bash
# Prueba de hecho PS-8-UUIDS
if npx jest __tests__/app/tenant-name-not-uuid.test.tsx __tests__/app/tenant-label-divergence.test.tsx __tests__/app/tenant-no-visible-id-scan.test.ts __tests__/app/tenant-screens-render.test.tsx; then echo "RESULT_PS_8_UUIDS=PASS"; else echo "RESULT_PS_8_UUIDS=FAIL"; fi

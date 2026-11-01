#!/usr/bin/env bash
# Prueba de hecho PS-8-UUIDS (PARTE 2/2)
if npx jest __tests__/app/tenant-label-divergence.test.tsx __tests__/app/admin-no-uuid.test.tsx; then echo "RESULT_PS_8_UUIDS=PASS"; else echo "RESULT_PS_8_UUIDS=FAIL"; fi

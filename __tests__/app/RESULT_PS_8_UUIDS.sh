#!/usr/bin/env bash
# Prueba de hecho PS-8-UUIDS (PARTE 1/2)
if npx jest __tests__/app/tenant-label-divergence.test.tsx; then echo "RESULT_PS_8_UUIDS=PASS"; else echo "RESULT_PS_8_UUIDS=FAIL"; fi

#!/usr/bin/env bash
# Prueba de hecho PS-8-UUIDS
if npx jest __tests__/app/tenant-name-not-uuid.test.tsx; then echo "RESULT_PS_8_UUIDS=PASS"; else echo "RESULT_PS_8_UUIDS=FAIL"; fi

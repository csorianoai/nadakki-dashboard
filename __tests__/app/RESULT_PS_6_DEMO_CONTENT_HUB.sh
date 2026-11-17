#!/usr/bin/env bash
# Prueba de hecho PS-6-DEMO-CONTENT-HUB
if npx jest __tests__/app/content-hub-demo.test.tsx; then echo "RESULT_PS_6_DEMO_CONTENT_HUB=PASS"; else echo "RESULT_PS_6_DEMO_CONTENT_HUB=FAIL"; fi

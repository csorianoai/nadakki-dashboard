#!/usr/bin/env bash
# Prueba de hecho ROP-G4-MANDATO-UI: capa de escritura + formulario de alta del mandato (negativos 403/404/409/422 y positivo).
if npx jest tests/realtor/propietarios; then echo "RESULT_ROP_G4_MANDATO_UI=PASS"; else echo "RESULT_ROP_G4_MANDATO_UI=FAIL"; fi

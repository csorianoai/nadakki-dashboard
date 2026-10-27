#!/usr/bin/env bash
# Prueba de hecho de ROP-PIL-DASH-PROMO: main contiene cada componente Realtor de la lista medida (26-oct).
# Da FAIL hasta que la ultima PARTE promueve el ultimo componente. Ultima linea: RESULT_ROP_PIL_DASH_PROMO=PASS | FAIL.
set -u
cd "$(dirname "$0")/../.." || exit 1
MANIFEST="
components/realtor/AltaAsistente.tsx
components/realtor/LicenciaVerificar.tsx
components/realtor/broker/BrokerPanel.tsx
components/realtor/clientes/AsignacionPanel.tsx
components/realtor/clientes/ClientesPanel.tsx
components/realtor/clientes/ContactForm.tsx
components/realtor/clientes/asignacion-api.ts
components/realtor/clientes/contact-copy.ts
components/realtor/clientes/contact-write.ts
components/realtor/documentos/DocumentosPanel.tsx
components/realtor/documentos/GenerateControls.tsx
components/realtor/mi-dia/MiDiaPanel.tsx
components/realtor/operaciones/OperacionGestion.tsx
components/realtor/operaciones/OperacionesPanel.tsx
components/realtor/operaciones/escritura.ts
components/realtor/propiedades/AsignacionesSection.tsx
components/realtor/propiedades/PropiedadForm.tsx
components/realtor/propiedades/PropiedadesPanel.tsx
components/realtor/propietarios/MandateForm.tsx
components/realtor/propietarios/PropietariosPanel.tsx
components/realtor/propietarios/mandate-copy.ts
components/realtor/smart-calendar/SmartCalendarPanel.tsx
components/realtor/smart-calendar/VisitActions.tsx
components/realtor/smart-calendar/VisitForm.tsx
components/realtor/smart-calendar/visit-actions.ts
components/realtor/smart-calendar/visit.ts
"
missing=0
for f in $MANIFEST; do
  if [ ! -s "$f" ]; then echo "FALTA: $f"; missing=$((missing+1)); fi
done
if [ "$missing" -eq 0 ]; then
  echo "RESULT_ROP_PIL_DASH_PROMO=PASS"
else
  echo "faltan $missing componentes"
  echo "RESULT_ROP_PIL_DASH_PROMO=FAIL"
  exit 1
fi

#!/usr/bin/env bash
# Prueba de hecho ROP-PIL-DASH-PROMO: la rama desplegada contiene cada componente Realtor de la lista medida (26-oct).
# Ultima linea: RESULT_ROP_PIL_DASH_PROMO=PASS | FAIL. FAIL hasta que la ultima parte (9/9) promueve todo.
set -u
cd "$(dirname "$0")/../.." || exit 1
C=components/realtor
missing=0
need_file() { [ -f "$1" ] || { echo "FALTA fichero: $1"; missing=$((missing+1)); }; }
need_text() { grep -q -- "$2" "$1" 2>/dev/null || { echo "FALTA en $1: $2"; missing=$((missing+1)); }; }

for f in LicenciaVerificar.tsx broker/QaDesk.tsx broker/qa-client.ts \
  clientes/AsignacionPanel.tsx clientes/ContactForm.tsx clientes/asignacion-api.ts clientes/contact-copy.ts clientes/contact-write.ts \
  documentos/GenerateControls.tsx operaciones/OperacionGestion.tsx operaciones/escritura.ts \
  propiedades/AsignacionesSection.tsx propiedades/PropiedadForm.tsx \
  propietarios/MandateForm.tsx propietarios/mandate-copy.ts \
  smart-calendar/VisitActions.tsx smart-calendar/VisitForm.tsx smart-calendar/visit-actions.ts smart-calendar/visit.ts; do
  need_file "$C/$f"
done
for f in lib/realtor/propietarios/write.ts lib/realtor/propiedades/write.ts lib/realtor/propiedades/asignaciones.ts lib/realtor/documentos/generate.ts; do
  need_file "$f"
done
# Paneles que ya existen en main: deben traer la version con las piezas nuevas.
need_text $C/AltaAsistente.tsx LicenciaVerificar
need_text $C/broker/BrokerPanel.tsx QaDesk
need_text $C/clientes/ClientesPanel.tsx ContactForm
need_text $C/documentos/DocumentosPanel.tsx GenerateControls
need_text $C/mi-dia/MiDiaPanel.tsx mi-dia-visitas-empty
need_text $C/operaciones/OperacionesPanel.tsx OperacionGestion
need_text $C/propiedades/PropiedadesPanel.tsx AsignacionesSection
need_text $C/propietarios/PropietariosPanel.tsx MandateForm
need_text $C/smart-calendar/SmartCalendarPanel.tsx VisitForm

if [ "$missing" -eq 0 ]; then echo "RESULT_ROP_PIL_DASH_PROMO=PASS"; else echo "faltan $missing piezas"; echo "RESULT_ROP_PIL_DASH_PROMO=FAIL"; exit 1; fi

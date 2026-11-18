# DECISION ABIERTA — sistema visual de "Mi web" (Sites)

**Estado: ABIERTA. Para Cesar. No esta cerrada ni la cierra este PR.**
Tarea: ST4-01. Medido en nadakki-dashboard, `staging` 4f8c987b (los conteos del brief, hechos sobre 68f17c84, difieren en DCC; abajo van los de este commit).

## Medicion (comandos reproducibles)

| Sistema | Que es | Medida |
|---|---|---|
| Forge | `_DESIGN_SYSTEM_RULES.md`; componentes en `components/forge/ui` | 30 ficheros en `components/forge/ui`; 34 ficheros de app/components/lib los importan (`grep -rl "components/forge/ui" app components lib --include=*.ts --include=*.tsx`). El doc dice Next 14 (`_DESIGN_SYSTEM_RULES.md:28`); `package.json:54` tiene next 16.2.10. Su `tokens.css` vive en `app/(forge)/credit-hub/_design/`; ningun `.tsx` de app/ o components/ fuera de credit-hub lo importa (`grep -rn tokens.css app components \| grep -v credit-hub` = 0). |
| DCC | `components/dcc` | 20 ficheros; 27 ficheros fuera de la carpeta lo importan (`grep -rl "components/dcc" app components lib ...`). |
| Tokens RT (Realtor) | `lib/realtor/tokens.ts` | 38 ficheros importan `realtor/tokens` o `./tokens` en lib/realtor. DL10A aprobado con `DESIGN_SCOPE=DL10A_PROTOTYPE_ONLY` (nadakki-dashboard#774): **no cubre Sites**. |

Son TRES sistemas, no dos. `/mi-web` hoy cae en el armazon generico `ModuleShell` (`components/auth/AppGate.tsx:112-118`, rama "Resto"), no en el de Realtor.

## Propuesta por defecto (reversible)

Los componentes de Sites se escriben sobre **`lib/sites/tokens.ts`**, un unico punto de cambio, con los valores de RT (`lib/realtor/tokens.ts`) como punto de partida. Ningun componente de Sites usa colores ni medidas literales. Cambiar de sistema = cambiar ese fichero (o su contenido), sin tocar pantallas. `tokens.ts` se creara con la primera pantalla; esta tarea no trae pantalla.

## Opciones y lo que se pierde

1. **Tokens RT via `lib/sites/tokens.ts` (por defecto).** Coherente con Realtor, el mismo cliente tipico (inmobiliaria); un solo punto de cambio. Se pierde: la aprobacion de diseno (DL10A no cubre Sites) y los componentes ya hechos de Forge/DCC; hay que escribir los de Sites.
2. **Forge (`components/forge/ui`).** Mas componentes reutilizables y el sistema con mas importadores (34). Se pierde: su doc esta desactualizado (Next 14 vs 16), sus tokens CSS estan acoplados a credit-hub y nunca se usaron fuera, y su estetica es de producto bancario.
3. **DCC (`components/dcc`).** Reutilizable (27 importadores). Se pierde: pensado para el cockpit de credito; no hay documento de reglas equivalente; acoplamiento a esa vertical.
4. **Sistema nuevo para Sites.** Libertad total. Se pierde: coste mas alto, un CUARTO sistema que mantener, y mas deuda de consistencia.

## Que se necesita de Cesar

Elegir 1-4 (o pedir otra). Hasta entonces rige la propuesta por defecto. Si se elige 2 o 3, `lib/sites/tokens.ts` pasa a ser un adaptador sobre ese sistema.

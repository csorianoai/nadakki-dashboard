# Copia Viva

## Mapa

| Copia | Estado | Alcance medido |
|---|---|---|
| `app/(forge)/credit-hub/**` | VIVA | 41 paginas; es la ruta enlazada por la navegacion |
| `app/credit/**` | Sin enlace | 11 paginas; responde 200, pero no tiene enlace desde el menu |
| `app/bank/**` | Sin enlace | 1 pagina; responde 200, pero no tiene enlace desde el menu |
| `app/(bank)/**` | Sin enlace | 3 paginas; responde 200, pero no tiene enlace desde el menu |

## Como se midio

Se revisaron `ForgeCreditHubCommandPalette.tsx` y `ForgeCreditHubSidebar.tsx`.
No contienen enlaces a `/credit/**` ni a `/bank/**`; la navegacion apunta a
`/credit-hub/**`. El inventario de rutas se obtuvo contando los `page.tsx` de
cada arbol. Las cuatro copias se conservaron porque responden 200 y existen
11 referencias a `/bank/analytics`; borrarlas requiere un packet separado con
medicion propia.

Cada `page.tsx` de las copias sin enlace lleva una advertencia en su primera
linea para evitar que un arreglo futuro se aplique al arbol equivocado.

## Guard de cambios

El workflow `copy-intent-guard.yml` compara el diff del PR contra su base. Si
incluye `app/credit/**`, `app/bank/**` o `app/(bank)/**`, exige que el cuerpo
declare literalmente `COPIA_INTENCIONAL`. Sin esa declaracion, el check falla.
La declaracion documenta una decision consciente; no habilita la copia viva ni
borra ninguna ruta.

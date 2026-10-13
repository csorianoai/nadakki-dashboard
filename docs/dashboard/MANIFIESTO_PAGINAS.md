# Manifiesto de páginas ("nada se pierde")

Cada `app/**/page.tsx` está clasificada en `lib/paginas/manifiesto.json` en una categoría:

| Categoría | Significa | Lo comprueba el test |
|---|---|---|
| `menu` | está en el menú de su módulo (`lib/navigation.ts` o el menú propio de su core) | el href está de verdad en esa fuente |
| `enlazada` | se llega desde otra pantalla (`desde`) | el origen existe, es otro fichero y nombra la ruta (o contiene lo declarado); el origen es alcanzable |
| `redirigida` | redirigida a su versión nueva (`destino`, `via`) | hay regla en `next.config.js`, `redirect()` en la página o middleware; el destino existe; `cubre` coherente |
| `oculta` | solo administradores, desarrollo, flag o copia sin enlace | motivo no vacío; coincide con `RUTAS_OCULTAS`; comprobaciones sobre el código |
| `pendiente-revision` | no se pudo determinar: decide César | se tolera y se cuenta; tope `MAXIMO_PENDIENTES` en el test (solo puede bajar) |

`redirigida` lleva `cubre`: `completa` | `parcial` (con `noCubre`) | `sin-verificar`. El PR 7 (borrado de copias) solo borra las `completa`.

## Mantenimiento

```
node scripts/paginas/generar-manifiesto.mjs            # informe
node scripts/paginas/generar-manifiesto.mjs --check    # falla con la lista de páginas nuevas sin clasificar / rutas que ya no existen
node scripts/paginas/generar-manifiesto.mjs --write    # regenera las entradas "auto" y CONSERVA las "manual"
node scripts/paginas/generar-manifiesto.mjs --sugerir  # con posibles orígenes de enlace
NEXT_PUBLIC_BACKEND_URL=http://backend.invalid npx jest tests/nav/manifiesto-paginas.test.ts
```

Al añadir, mover o borrar una página (o al aterrizar un PR que cambie redirecciones): `--write`, añade a mano en el JSON la entrada de lo que quede sin clasificar (`"origen": "manual"`), y `--check` + el test. Una entrada manual sobre una ruta que el script ya clasifica gana al script.

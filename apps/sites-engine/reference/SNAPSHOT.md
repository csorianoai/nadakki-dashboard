# Instantánea de baylara-web (solo lectura)

- **Origen:** repositorio `csorianoai/baylara-web`, commit `bc4b3a8` («Título de /nuevos-desarrollos: proyectos en la costa y en Miami (ES/EN)»).
- **Qué es:** copia exacta de los ficheros versionados de ese commit, sin `public/media` (598 ficheros de imágenes y video: ~36 MB que no son código ni contenido de texto). `public/icon.svg` sí está.
- **Para qué:** base de lectura de la primera plantilla inmobiliaria (ST2-06 y ST2-07). El constructor del loop no ve el repo baylara-web; esta carpeta es su única fuente.
- **Reglas:** no se edita (cualquier cambio requiere una nueva instantánea hecha por una persona); no se importa desde el código del motor; no se usa como fixture de prueba (los fixtures son sintéticos). El linter y el verificador de tipos del motor deben **ignorar `reference/**`**.
- **Cómo se obtuvo:** `git -C baylara-web archive bc4b3a8 | tar -x -C apps/sites-engine/reference/baylara-web --exclude='public/media'`.
- **Huella del contenido** (SHA-256 de la lista ordenada de `sha256sum` de todos los ficheros de `reference/baylara-web`): `5d3aa3a77fc883a4ab5173efe18c18ba8d9ff36c587babf586291dfe34a6277b`. Recalcular con `cd apps/sites-engine/reference/baylara-web && find . -type f | LC_ALL=C sort | xargs sha256sum | sha256sum`.

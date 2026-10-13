# Limitaciones · Design Loop 10A (final gate)

1. **G1-AUTONOMIA y la propuesta de ola 2 no están en el proyecto.** Tomé los códigos de las etapas del brief. La escala de A0 a A5 conserva las definiciones de Loop 10 y hay que contrastarla con el documento.
2. **T29 está corregido** y se verificó también simulando un rAF retrasado. Falta comprobarlo con un teclado físico (NOT_EXECUTED).
3. **Apertura por `file://` sin red:** NOT_EXECUTED. El archivo no tiene referencias externas y, en ejecución, no carga recursos de otro origen.
4. **Mapa base de OpenStreetMap:** es opcional y necesita red. Sin conexión, el mapa se dibuja sin las teselas.
5. **Contrato de compraventa:** la plantilla sigue pendiente.
6. **Todo es simulación.** No hay llamadas, grabaciones, envíos ni publicaciones reales. Los roles que se ven en la interfaz no conceden permisos.
7. **Estado compartido con Loop 10:** 10A usa la misma clave de almacenamiento que Loop 10. Reiniciar los datos DEMO en una versión los reinicia también en la otra.
8. **Pruebas NOT_EXECUTED:**
   - Teléfono físico con Safari en iOS.
   - Firefox y Safari de escritorio.
   - Lectores de pantalla.

# Prueba manual · DL10A (lo que la automatización no puede cubrir)

Se ejecuta en Chrome o Edge de escritorio. El resultado se registra como PASS o FAIL, con la fecha, el navegador y la versión.

## A. Apertura por file:// sin red y fuera de la carpeta del proyecto
1. Copia **solo** `Nadakki_Realtor_OS_DL10A_autonomo.html` a una carpeta vacía, por ejemplo el Escritorio.
2. Desconecta la red: wifi y cable apagados, o modo avión.
3. Haz doble clic en el archivo. La barra de direcciones debe empezar por `file:///`.
4. Abre las herramientas de desarrollo (F12):
   - **Consola:** no debe haber errores en rojo.
   - **Red:** no debe haber peticiones fallidas a otros dominios.
5. Recorre los 12 centros desde el sidebar.
6. Comprueba que estas pantallas se pueden usar:
   - Listing Director con sus 8 etapas, en Propietarios.
   - AI Workforce Router, en Mi día.
   - Los tres equipos de IA, en Marketing AI.
   - Conversation Intelligence, en CRM.
7. En CRM, activa el consentimiento de WhatsApp y recarga con F5. El consentimiento debe seguir activo.

## B. T29 con teclado físico
1. Pulsa Tab hasta llegar a **Reiniciar DEMO** y pulsa Enter. Se abre el diálogo y el foco queda en «Reiniciar».
2. Pulsa Esc. El diálogo se cierra y el anillo de foco vuelve a **Reiniciar DEMO**.
3. Pulsa una vez Tab y otra Mayús+Tab. El foco avanza y vuelve al control siguiente y al anterior sin saltar al inicio.
4. Ahora navega a otro centro desde el sidebar y, en menos de un segundo, repite los pasos 1 y 2. El foco debe volver a **Reiniciar DEMO** y no al título del centro.
5. Repite la prueba con la ventana del navegador en 390, 768, 1024 y 1440 px de ancho (modo dispositivo de las herramientas de desarrollo).

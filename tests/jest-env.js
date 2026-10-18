// Destino de backend declarado SOLO para las suites: lib/config/backend-url.ts no elige un destino por defecto
// y falla al importar la cadena de auth si el entorno no define ninguno (CI relacionado). Es un host local
// inexistente: ninguna suite alcanza un backend real. Una suite que prueba la ausencia lo borra en su propio setup.
if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
  process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:8000";
}

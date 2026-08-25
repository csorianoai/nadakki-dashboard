# #29 Android APK

STATUS=NO_EJECUTABLE_ANDROID

## Medición

Comando ejecutado desde la raíz del repositorio:

```text
android\gradlew.bat assembleDebug
```

Resultado exacto:

```text
ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
Please set the JAVA_HOME variable in your environment to match the location of your Java installation.
```

La verificación del entorno tampoco encontró `adb`, por lo que no existe un
camino disponible para abrir y comprobar un APK en este entorno.

## Alcance

No se declara el instalador funcionando. El PR #392 verificó configuración y
requisitos de build, pero no compiló ni abrió el instalador; esta medición no
agrega evidencia de ejecución que no existe.

No se modifican `lib/auth/**`, `tests/auth/**` ni `app/api/v2/**`.

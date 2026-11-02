# Helper de huella digital (DigitalPersona U.are.U)

`dpuareu.exe` es un helper de consola que captura y compara huellas usando el
SDK **DigitalPersona One Touch** instalado en Windows. El servidor lo invoca
desde `server/fingerprint.js`.

## Por qué x86

El SDK de DigitalPersona es de **32 bits**. Si el helper se compila en x64, el
lector se conecta (`available` responde OK) pero **nunca entrega muestras**
(`OnFingerTouch` / `OnComplete` no se disparan). Compilado en **x86** funciona.

## Comandos

El helper imprime una sola línea JSON en `stdout` (los logs van a `stderr`).

| Comando | Entrada | Salida |
|---|---|---|
| `available` | — | `{"success":true}` o error |
| `enroll` | — | `{"success":true,"fmd":"<base64>"}` (4 muestras) |
| `identify <file.json>` | `{"templates":[{"id":"...","fmd":"..."}]}` | `{"success":true,"matchedId":"...","compared":N}` |
| `auto-identify <file.json>` | igual + `maxWaitMs` | líneas NDJSON con `phase`, última `phase:"result"` |
| `status` | — | `{"success":true,"fingerPresent":bool}` |
| `wait <file.json>` | `{"maxWaitMs":N}` | `{"success":true,"fingerPresent":bool}` |

## Compilar

Requiere el SDK instalado en
`C:\Program Files\DigitalPersona\One Touch SDK\.NET\Bin`.

```powershell
powershell -ExecutionPolicy Bypass -File build-helper.ps1
```

Esto copia las DLLs del SDK a `bin/` y compila `bin/dpuareu.exe` en x86.

## Nota sobre las DLLs

Las DLLs `DPFP*.dll` son propiedad de DigitalPersona/HID Global y **no se
versionan** en este repositorio (están en `.gitignore`). El script
`build-helper.ps1` las copia desde la instalación local del SDK.

# Compila el helper de huella digital (dpuareu.exe) en x86.
#
# IMPORTANTE: el SDK "DigitalPersona One Touch" es de 32 bits. Si se compila
# en x64 el lector se conecta pero NO entrega muestras. Por eso /platform:x86.
#
# Requiere tener instalado el SDK de DigitalPersona en:
#   C:\Program Files\DigitalPersona\One Touch SDK\.NET\Bin
#
# Uso:  powershell -ExecutionPolicy Bypass -File build-helper.ps1

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$bin  = Join-Path $here 'bin'
$src  = Join-Path $here 'src\FpHelper.cs'
$sdk  = 'C:\Program Files\DigitalPersona\One Touch SDK\.NET\Bin'
$fw   = 'C:\Windows\Microsoft.NET\Framework\v4.0.30319'

if (-not (Test-Path $src)) { throw "No se encontro $src" }
if (-not (Test-Path $sdk)) { throw "No se encontro el SDK de DigitalPersona en $sdk" }

New-Item -ItemType Directory -Force $bin | Out-Null

foreach ($dll in @('DPFPDevNET.dll', 'DPFPEngNET.dll', 'DPFPVerNET.dll', 'DPFPShrNET.dll')) {
    Copy-Item (Join-Path $sdk $dll) $bin -Force
}

& (Join-Path $fw 'csc.exe') /nologo /target:exe /platform:x86 `
    /out:(Join-Path $bin 'dpuareu.exe') `
    /r:(Join-Path $bin 'DPFPDevNET.dll') `
    /r:(Join-Path $bin 'DPFPEngNET.dll') `
    /r:(Join-Path $bin 'DPFPVerNET.dll') `
    /r:(Join-Path $bin 'DPFPShrNET.dll') `
    /r:(Join-Path $fw 'System.Windows.Forms.dll') `
    /r:(Join-Path $fw 'System.Drawing.dll') `
    $src

if ($LASTEXITCODE -ne 0) { throw "Fallo la compilacion (exit $LASTEXITCODE)" }

Write-Host "Helper compilado en $bin\dpuareu.exe"

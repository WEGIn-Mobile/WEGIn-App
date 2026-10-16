$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $projectDirectory

$apiAddress = & node (Join-Path $PSScriptRoot 'apk-api-config.js')
if ($LASTEXITCODE -ne 0) { throw 'Corrija a URL da API antes de compilar o APK.' }
# O prebuild carrega .env somente no seu próprio processo. Passe a mesma URL ao Gradle/Metro.
$env:EXPO_PUBLIC_API_URL = $apiAddress
Write-Output "API incorporada no APK: $apiAddress"

if (-not $env:ANDROID_HOME -and -not $env:ANDROID_SDK_ROOT) {
    throw 'Configure ANDROID_HOME com o caminho do SDK Android.'
}

$keytool = if ($env:JAVA_HOME) {
    Join-Path $env:JAVA_HOME 'bin\keytool.exe'
} else {
    (Get-Command keytool.exe -ErrorAction Stop).Source
}

$signingDirectory = Join-Path $projectDirectory '.signing'
$keystore = Join-Path $signingDirectory 'wegin-release.jks'
$credentials = Join-Path $signingDirectory 'android.properties'
New-Item -ItemType Directory -Force -Path $signingDirectory | Out-Null

if ((Test-Path -LiteralPath $keystore) -ne (Test-Path -LiteralPath $credentials)) {
    throw 'A pasta .signing deve conter a chave e android.properties. Restaure o backup completo.'
}

if (-not (Test-Path -LiteralPath $keystore)) {
    $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $bytes = New-Object byte[] 32
    $random.GetBytes($bytes)
    $random.Dispose()
    $password = [BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
    $env:WEGIN_STORE_PASSWORD = $password
    try {
        & $keytool -genkeypair -keystore $keystore -storetype JKS -alias wegin -keyalg RSA -keysize 2048 -validity 10000 -dname 'CN=WEGIn' -storepass:env WEGIN_STORE_PASSWORD -keypass:env WEGIN_STORE_PASSWORD
        if ($LASTEXITCODE -ne 0) { throw 'Falha ao gerar a chave de assinatura.' }
        [IO.File]::WriteAllText($credentials, "storePassword=$password`n", [Text.Encoding]::ASCII)
    } finally {
        Remove-Item Env:\WEGIN_STORE_PASSWORD -ErrorAction SilentlyContinue
        $password = $null
    }
}

$env:CI = '1'
$env:NODE_ENV = 'production'
$env:GRADLE_USER_HOME = Join-Path $projectDirectory '.tmp\gradle'

# O Ninja 1.10 fornecido pelo CMake do SDK falha em caminhos Windows longos.
$ninjaDirectory = Join-Path $projectDirectory '.tmp\tools\ninja-1.13.2'
$env:WEGIN_NINJA = Join-Path $ninjaDirectory 'ninja.exe'
if (-not (Test-Path -LiteralPath $env:WEGIN_NINJA)) {
    New-Item -ItemType Directory -Force -Path $ninjaDirectory | Out-Null
    $ninjaArchive = Join-Path $ninjaDirectory 'ninja-win.zip'
    Write-Output 'Baixando Ninja 1.13.2 para compilar com caminhos longos no Windows.'
    Invoke-WebRequest -UseBasicParsing -Uri 'https://github.com/ninja-build/ninja/releases/download/v1.13.2/ninja-win.zip' -OutFile $ninjaArchive
    Expand-Archive -LiteralPath $ninjaArchive -DestinationPath $ninjaDirectory -Force
}

$packageFile = Join-Path $projectDirectory 'package.json'
$packageContents = [IO.File]::ReadAllBytes($packageFile)
try {
    & npx.cmd expo prebuild --platform android --no-install
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao preparar o projeto Android.' }
} finally {
    # O prebuild altera os atalhos de desenvolvimento para expo run.
    [IO.File]::WriteAllBytes($packageFile, $packageContents)
}

$initScript = Join-Path $PSScriptRoot 'android-release.init.gradle'
Push-Location (Join-Path $projectDirectory 'android')
try {
    & .\gradlew.bat :app:assembleRelease --init-script $initScript --console plain --max-workers 2 '-Dorg.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=1024m' '-PreactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64'
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar o APK.' }
} finally {
    Pop-Location
}

$outputDirectory = Join-Path $projectDirectory 'builds'
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
$version = (Get-Content -Raw app.json | ConvertFrom-Json).expo.version
$destination = Join-Path $outputDirectory "WEGIn-$version.apk"
$releaseApk = Join-Path $projectDirectory 'android\app\build\outputs\apk\release\app-release.apk'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$apkArchive = [IO.Compression.ZipFile]::OpenRead($releaseApk)
try {
    $bundleEntry = $apkArchive.GetEntry('assets/index.android.bundle')
    if (-not $bundleEntry) { throw 'O APK não contém o JavaScript da aplicação.' }
    $bundleStream = $bundleEntry.Open()
    $bundleMemory = New-Object IO.MemoryStream
    try {
        $bundleStream.CopyTo($bundleMemory)
        $bundleText = [Text.Encoding]::UTF8.GetString($bundleMemory.ToArray())
        if (-not $bundleText.Contains($apiAddress)) {
            throw 'A URL configurada da API não foi incorporada no APK. O arquivo não será distribuído.'
        }
    } finally {
        $bundleStream.Dispose()
        $bundleMemory.Dispose()
    }
} finally {
    $apkArchive.Dispose()
}
Copy-Item -LiteralPath $releaseApk -Destination $destination
Write-Output "APK gerado: $destination"

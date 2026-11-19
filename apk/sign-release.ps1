param(
    [Parameter(Mandatory=$true)][string]$ReleaseKey,
    [Parameter(Mandatory=$true)][string]$PasswordFile,
    [Parameter(Mandatory=$true)][string]$LegacyKey,
    [Parameter(Mandatory=$true)][string]$BuildTools,
    [Parameter(Mandatory=$true)][string]$OutputApk
)
$ErrorActionPreference='Stop'
$secure=(Get-Content -LiteralPath $PasswordFile -Raw).Trim() | ConvertTo-SecureString
$env:KURYEBRO_RELEASE_PASSWORD=[System.Net.NetworkCredential]::new('', $secure).Password
$env:KURYEBRO_LEGACY_PASSWORD='android'
try {
    $lineage=Join-Path $PSScriptRoot 'signing-lineage.bin'
    if(-not(Test-Path -LiteralPath $lineage)){
        & (Join-Path $BuildTools 'apksigner.bat') rotate --out $lineage --old-signer --ks $LegacyKey --ks-key-alias androiddebugkey --ks-pass env:KURYEBRO_LEGACY_PASSWORD --new-signer --ks $ReleaseKey --ks-key-alias kuryebro-release --ks-pass env:KURYEBRO_RELEASE_PASSWORD
        if($LASTEXITCODE -ne 0){throw 'Signing lineage creation failed'}
    }
    $unsigned=Join-Path $PSScriptRoot 'android/app/build/outputs/apk/release/app-release-unsigned.apk'
    $aligned=Join-Path (Split-Path -Parent $OutputApk) 'kuryebro-aligned.apk'
    & (Join-Path $BuildTools 'zipalign.exe') -f -p 4 $unsigned $aligned
    if($LASTEXITCODE -ne 0){throw 'Alignment failed'}
    & (Join-Path $BuildTools 'apksigner.bat') sign --ks $LegacyKey --ks-key-alias androiddebugkey --ks-pass env:KURYEBRO_LEGACY_PASSWORD --next-signer --ks $ReleaseKey --ks-key-alias kuryebro-release --ks-pass env:KURYEBRO_RELEASE_PASSWORD --lineage $lineage --rotation-min-sdk-version 28 --debuggable-apk-permitted false --v4-signing-enabled false --out $OutputApk $aligned
    if($LASTEXITCODE -ne 0){throw 'Signing failed'}
    & (Join-Path $BuildTools 'apksigner.bat') verify --verbose $OutputApk
    if($LASTEXITCODE -ne 0){throw 'Signature verification failed'}
    Remove-Item -LiteralPath $aligned
} finally {
    Remove-Item Env:KURYEBRO_RELEASE_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:KURYEBRO_LEGACY_PASSWORD -ErrorAction SilentlyContinue
}

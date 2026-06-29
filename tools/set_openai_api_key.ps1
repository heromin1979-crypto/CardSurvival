param(
  [switch]$WriteProjectEnv
)

$ErrorActionPreference = 'Stop'

Write-Host 'Paste your OpenAI API key at the prompt, then press Enter.'
Write-Host 'For security, pasted characters will not be displayed.'

for ($attempt = 1; $attempt -le 3; $attempt++) {
  $secureKey = Read-Host 'Enter OPENAI_API_KEY' -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)

  try {
    $plainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    if ([string]::IsNullOrWhiteSpace($plainKey)) {
      Write-Host 'No key was entered. Paste the key first, then press Enter.'
      continue
    }

    [Environment]::SetEnvironmentVariable('OPENAI_API_KEY', $plainKey, 'User')
    $env:OPENAI_API_KEY = $plainKey

    Write-Host 'OPENAI_API_KEY saved to the current Windows user environment.'

    if ($WriteProjectEnv) {
      $projectEnvPath = Join-Path (Get-Location) '.env'
      Set-Content -LiteralPath $projectEnvPath -Value "OPENAI_API_KEY=$plainKey" -Encoding utf8
      Write-Host "OPENAI_API_KEY also saved to $projectEnvPath."
      Write-Host '.env is ignored by Git.'
    }

    Write-Host 'Restart Codex, or run image commands after reloading the user environment variable.'
    exit 0
  } finally {
    if ($bstr -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
  }
}

Write-Host 'OPENAI_API_KEY was not saved because no key was entered.'
exit 1

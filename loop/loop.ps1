#Requires -Version 5.1
<#
  자율 루프 본체.

  한 바퀴마다 헤드리스 세션을 새로 연다. 대화를 이어 붙이지 않는다.
  --continue 와 --resume 을 쓰지 않는 것이 이 루프의 핵심이다.
  기억은 대화가 아니라 docs/ 의 문서가 대신한다.
#>

$ErrorActionPreference = 'Stop'

$LoopDir    = $PSScriptRoot
$RepoRoot   = Split-Path -Parent $LoopDir
$LogDir     = Join-Path $RepoRoot 'logs'
$StopFile   = Join-Path $LoopDir  'STOP'
$PromptFile = Join-Path $LoopDir  'PROMPT.md'
$EnvFile    = Join-Path $LoopDir  'env.ps1'

Set-Location $RepoRoot
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

# 설정을 다시 읽어도 PATH 가 계속 길어지지 않도록 원본을 붙잡아 둔다.
$OriginalPath = $env:PATH

function Write-LoopLog {
    param([string]$Message, [string]$Level = 'INFO')
    $ts   = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $line = "[$ts] [$Level] $Message"
    $file = Join-Path $LogDir ('loop-' + (Get-Date -Format 'yyyy-MM-dd') + '.log')
    $line | Out-File -FilePath $file -Append -Encoding utf8
    Write-Host $line
}

function Get-LogFile {
    Join-Path $LogDir ('loop-' + (Get-Date -Format 'yyyy-MM-dd') + '.log')
}

if (-not (Test-Path $PromptFile)) {
    Write-LoopLog "지시서가 없다: $PromptFile" 'FATAL'
    exit 1
}
if (-not (Test-Path $EnvFile)) {
    Write-LoopLog "설정 파일이 없다: $EnvFile" 'FATAL'
    exit 1
}

Write-LoopLog "루프 시작. 저장소=$RepoRoot  PID=$PID"

# 시작 전에 이미 STOP 이 있으면 한 바퀴도 돌지 않는다.
if (Test-Path $StopFile) {
    Write-LoopLog 'STOP 파일이 이미 있다. 시작하지 않는다.' 'WARN'
    exit 0
}

$cycle = 0

while ($true) {

    # 설정을 매 바퀴 다시 읽는다. 루프를 멈추지 않고 값을 바꿀 수 있다.
    . $EnvFile
    $env:PATH = (($LOOP_PATH_PREPEND -join ';') + ';' + $OriginalPath)

    $cycle++
    if ($LOOP_MAX_CYCLES -gt 0 -and $cycle -gt $LOOP_MAX_CYCLES) {
        Write-LoopLog "최대 바퀴 수($LOOP_MAX_CYCLES) 도달. 멈춘다."
        break
    }

    $logFile = Get-LogFile
    $started = Get-Date

    Write-LoopLog ('=' * 70)
    Write-LoopLog "바퀴 #$cycle 시작  모델=$LOOP_MODEL  최대턴=$LOOP_MAX_TURNS  권한=$LOOP_PERMISSION_MODE"

    $bin = $null
    try   { $bin = (Get-Command $LOOP_CLAUDE_BIN -ErrorAction Stop).Source }
    catch { }
    if (-not $bin) {
        Write-LoopLog "claude 실행 파일을 못 찾았다: '$LOOP_CLAUDE_BIN'. env.ps1 의 LOOP_PATH_PREPEND 를 확인하라." 'FATAL'
        exit 1
    }
    Write-LoopLog "실행 파일: $bin"

    $promptText = Get-Content -Raw -Encoding UTF8 $PromptFile

    $claudeArgs = @(
        '-p', $promptText,
        '--model', $LOOP_MODEL,
        '--max-turns', "$LOOP_MAX_TURNS",
        '--permission-mode', $LOOP_PERMISSION_MODE
    )

    $exitCode = 0
    try {
        & $bin @claudeArgs 2>&1 | ForEach-Object {
            $_ | Out-File -FilePath $logFile -Append -Encoding utf8
            Write-Host $_
        }
        $exitCode = $LASTEXITCODE
    }
    catch {
        Write-LoopLog "세션이 예외로 끝났다: $($_.Exception.Message)" 'ERROR'
        $exitCode = 1
    }

    $elapsed = [int]((Get-Date) - $started).TotalSeconds
    if ($exitCode -eq 0) {
        Write-LoopLog "바퀴 #$cycle 끝. ${elapsed}초. 종료코드=0"
    } else {
        Write-LoopLog "바퀴 #$cycle 끝. ${elapsed}초. 종료코드=$exitCode" 'ERROR'
    }

    # STOP 은 바퀴가 끝난 뒤에 본다. 시작한 바퀴는 끝까지 돈다.
    if (Test-Path $StopFile) {
        Write-LoopLog 'STOP 파일을 확인했다. 이번 바퀴까지만 하고 멈춘다.'
        break
    }

    if ($LOOP_MAX_CYCLES -gt 0 -and $cycle -ge $LOOP_MAX_CYCLES) {
        Write-LoopLog "최대 바퀴 수($LOOP_MAX_CYCLES) 도달. 멈춘다."
        break
    }

    Write-LoopLog "다음 바퀴까지 ${LOOP_SLEEP_SECONDS}초 대기"
    Start-Sleep -Seconds $LOOP_SLEEP_SECONDS
}

Write-LoopLog "루프 종료. 총 $cycle 바퀴."
exit 0

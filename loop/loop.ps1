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

# 자식 프로세스(claude)의 stdout 을 UTF-8 로 읽는다.
# 이걸 안 하면 PowerShell 이 콘솔 OEM 코드페이지로 디코딩해 한글이 깨진다.
# 로그가 루프를 들여다보는 유일한 창구이므로 여기서 깨지면 아무것도 못 본다.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

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

    # 브랜치 확인. 다르면 바퀴를 시작하지 않는다.
    # 확인 자체가 실패해도 거부한다 - 어디에 커밋될지 모르는 채로 돌리지 않는다.
    if ($LOOP_ALLOWED_BRANCH) {
        $currentBranch = $null
        try {
            # 파이프라인으로 Select-Object 를 걸지 않는다. PowerShell 5.1 에서
            # -First 가 파이프라인을 조기 종료시키면 $LASTEXITCODE 가 -1 이 되어
            # 값이 멀쩡해도 실패로 잡힌다.
            $out = @(& git rev-parse --abbrev-ref HEAD 2>&1)
            if ($LASTEXITCODE -eq 0 -and $out.Count -gt 0) {
                $currentBranch = "$($out[0])".Trim()
            }
        }
        catch { }

        if ($currentBranch -ne $LOOP_ALLOWED_BRANCH) {
            $shown = if ($currentBranch) { $currentBranch } else { '(확인 불가)' }
            Write-LoopLog "브랜치가 달라 이번 바퀴를 건너뛴다. 허용=$LOOP_ALLOWED_BRANCH 현재=$shown" 'WARN'

            # 건너뛰는 중에도 STOP 은 듣는다.
            if (Test-Path $StopFile) {
                Write-LoopLog 'STOP 파일을 확인했다. 멈춘다.'
                break
            }
            Start-Sleep -Seconds $LOOP_SLEEP_SECONDS
            continue
        }
    }

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
    # 자식 프로세스의 stderr 는 경고도 섞여 온다. ErrorActionPreference 가 Stop 인 채로
    # 2>&1 을 걸면 경고 한 줄이 종료 오류로 승격되어 바퀴가 통째로 죽는다.
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        # $null 을 파이프로 흘려 stdin 을 즉시 닫는다.
        # 안 그러면 claude 가 stdin 입력을 3초 기다리며 경고를 낸다.
        $null | & $bin @claudeArgs 2>&1 | ForEach-Object {
            $_ | Out-File -FilePath $logFile -Append -Encoding utf8
            Write-Host $_
        }
        $exitCode = $LASTEXITCODE
    }
    catch {
        Write-LoopLog "세션이 예외로 끝났다: $($_.Exception.Message)" 'ERROR'
        $exitCode = 1
    }
    finally {
        $ErrorActionPreference = $prevEap
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

#Requires -Version 5.1
<#
  루프 제어: 켜기 / 끄기 / 상태 보기 + 작업 스케줄러 등록·해제

  사용법:
    .\loop\ctl.ps1 install     작업 스케줄러에 등록한다 (등록만, 꺼진 상태)
    .\loop\ctl.ps1 start       켠다 (STOP 해제 + 작업 활성화 + 지금 실행)
    .\loop\ctl.ps1 stop        끈다 (STOP 파일 생성 - 이번 바퀴를 마치고 멈춘다)
    .\loop\ctl.ps1 kill        지금 즉시 죽인다 (도중에 끊긴다. 커밋 안 된 작업은 사라진다)
    .\loop\ctl.ps1 status      상태를 본다
    .\loop\ctl.ps1 uninstall   작업 스케줄러에서 지운다
#>

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet('install', 'start', 'stop', 'kill', 'status', 'uninstall')]
    [string]$Command
)

$ErrorActionPreference = 'Stop'

$LoopDir    = $PSScriptRoot
$RepoRoot   = Split-Path -Parent $LoopDir
$LoopScript = Join-Path $LoopDir 'loop.ps1'
$StopFile   = Join-Path $LoopDir 'STOP'
$LogDir     = Join-Path $RepoRoot 'logs'
$TaskName   = 'ClaudeAutoLoop-CardSurvival'
$CurrentUser = "$env:USERDOMAIN\$env:USERNAME"

function Get-LoopTask {
    Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
}

function Get-LoopProcesses {
    Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -and $_.CommandLine -like '*loop.ps1*' }
}

switch ($Command) {

    'install' {
        $action = New-ScheduledTaskAction `
            -Execute 'powershell.exe' `
            -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$LoopScript`"" `
            -WorkingDirectory $RepoRoot

        $trigger = New-ScheduledTaskTrigger -AtLogOn -User $CurrentUser

        $principal = New-ScheduledTaskPrincipal `
            -UserId $CurrentUser -LogonType Interactive -RunLevel Limited

        # 비정상 종료(0 아닌 종료코드)면 1분 뒤 재시작, 최대 3회.
        # 정상 종료(0)면 재시작하지 않는다 - STOP 으로 멈춘 것을 되살리지 않기 위해서다.
        $settings = New-ScheduledTaskSettingsSet `
            -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
            -StartWhenAvailable `
            -MultipleInstances IgnoreNew `
            -ExecutionTimeLimit ([TimeSpan]::Zero) `
            -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

        Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
            -Principal $principal -Settings $settings -Description 'Claude 자율 루프' -Force | Out-Null

        # 등록만 하고 켜지는 않는다. 켜려면 start 를 쓴다.
        Disable-ScheduledTask -TaskName $TaskName | Out-Null

        Write-Host "등록했다: $TaskName (꺼진 상태)"
        Write-Host "켜려면:  .\loop\ctl.ps1 start"
    }

    'start' {
        if (-not (Get-LoopTask)) { throw "등록되지 않았다. 먼저 .\loop\ctl.ps1 install 을 실행하라." }
        if (Test-Path $StopFile) { Remove-Item $StopFile -Force; Write-Host 'STOP 파일을 지웠다.' }
        Enable-ScheduledTask -TaskName $TaskName | Out-Null
        Start-ScheduledTask -TaskName $TaskName
        Write-Host "켰다: $TaskName"
        Write-Host "로그: $LogDir\loop-$(Get-Date -Format 'yyyy-MM-dd').log"
    }

    'stop' {
        New-Item -ItemType File -Path $StopFile -Force | Out-Null
        if (Get-LoopTask) { Disable-ScheduledTask -TaskName $TaskName | Out-Null }
        Write-Host 'STOP 파일을 만들었다. 지금 도는 바퀴를 마치고 멈춘다.'
        Write-Host '(다음 로그인 때 다시 뜨지 않도록 작업도 비활성화했다)'
        Write-Host '즉시 끊으려면: .\loop\ctl.ps1 kill'
    }

    'kill' {
        New-Item -ItemType File -Path $StopFile -Force | Out-Null
        if (Get-LoopTask) {
            Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
            Disable-ScheduledTask -TaskName $TaskName | Out-Null
        }
        $procs = Get-LoopProcesses
        foreach ($p in $procs) {
            Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
            Write-Host "죽였다: PID $($p.ProcessId)"
        }
        if (-not $procs) { Write-Host '돌고 있는 루프 프로세스가 없다.' }
    }

    'status' {
        Write-Host '─────────────── 루프 상태 ───────────────'
        $task = Get-LoopTask
        if ($task) {
            $info = Get-ScheduledTaskInfo -TaskName $TaskName
            Write-Host "작업        : $TaskName"
            Write-Host "  상태      : $($task.State)"
            Write-Host "  마지막 실행: $($info.LastRunTime)"
            Write-Host "  마지막 결과: $($info.LastTaskResult)"
            Write-Host "  다음 실행  : $($info.NextRunTime)"
        } else {
            Write-Host "작업        : 등록되지 않음 (.\loop\ctl.ps1 install)"
        }

        Write-Host "STOP 파일   : $(if (Test-Path $StopFile) { '있음 - 멈추는 중이거나 멈춰 있다' } else { '없음' })"

        $procs = @(Get-LoopProcesses)
        if ($procs.Count) {
            Write-Host "돌고 있는 것: $($procs.Count)개"
            $procs | ForEach-Object { Write-Host "  PID $($_.ProcessId)" }
        } else {
            Write-Host '돌고 있는 것: 없음'
        }

        $today = Join-Path $LogDir ('loop-' + (Get-Date -Format 'yyyy-MM-dd') + '.log')
        Write-Host "오늘 로그   : $today"
        if (Test-Path $today) {
            Write-Host '─────────────── 최근 20줄 ───────────────'
            Get-Content $today -Tail 20 -Encoding UTF8
        } else {
            Write-Host '  (오늘 로그 없음)'
        }
    }

    'uninstall' {
        if (Get-LoopTask) {
            Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
            Write-Host "작업 스케줄러에서 지웠다: $TaskName"
        } else {
            Write-Host '등록된 작업이 없다.'
        }
    }
}

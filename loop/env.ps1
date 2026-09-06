# 루프 설정
# loop.ps1 이 "매 바퀴 시작할 때" 다시 읽는다.
# 루프를 멈추지 않고 값을 바꿔도 다음 바퀴부터 반영된다.

# 사용할 모델
$LOOP_MODEL = 'claude-opus-5[1m]'

# 한 바퀴에서 허용할 최대 턴 수.
# 한 바퀴가 끝없이 늘어지지 않게 강제로 끊는 안전장치다.
# 턴을 다 쓰면 세션이 종료코드 1 로 끝난다. 루프는 이것을 기록만 하고 계속 돈다.
$LOOP_MAX_TURNS = 40

# 바퀴 사이 대기(초).
$LOOP_SLEEP_SECONDS = 60

# 최대 바퀴 수. 0 이면 무한.
$LOOP_MAX_CYCLES = 0

# 권한 모드.
#
# 주의: 이 값만으로 셸 명령이 막히지 않는다.
# 실제 허용 범위는 ~/.claude/settings.json 의 permissions 와 함께 결정된다.
# 2026-09-06 시운전에서 acceptEdits 로 돌렸는데 헤드리스 세션이 git commit 을
# 실제로 실행했다. settings.json 의 allow 에 Bash(*) 가 있기 때문이다.
# 즉 이 저장소에서 루프는 지금 셸 명령을 자유롭게 쓴다.
#
#   acceptEdits        파일 편집을 자동 승인한다.
#   bypassPermissions  모든 승인을 건너뛴다.
#
# 루프를 좁히고 싶으면 이 값이 아니라 settings.json 의 permissions.deny 를 손봐야 한다.
$LOOP_PERMISSION_MODE = 'acceptEdits'

# claude 실행 파일. PATH 에서 찾게 하려면 'claude' 그대로 둔다.
$LOOP_CLAUDE_BIN = 'claude'

# PATH 앞에 붙일 경로.
# 작업 스케줄러로 뜬 프로세스는 평소 터미널의 PATH 를 물려받지 않는다.
# 여기를 비우면 claude 를 못 찾고 조용히 죽는다.
# 시운전에서 실제로 잡힌 경로: C:\Users\USER\AppData\Roaming\npm\claude.ps1
$LOOP_PATH_PREPEND = @(
  "$env:APPDATA\npm"
  "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Anthropic.ClaudeCode_Microsoft.Winget.Source_8wekyb3d8bbwe"
  "$env:ProgramFiles\Git\cmd"
  "$env:ProgramFiles\nodejs"
)

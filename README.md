# 자율 루프 (loop/)

한 바퀴마다 헤드리스 Claude 세션을 **새로** 열어 작업시키는 장치다.
대화를 이어 붙이지 않는다. `--continue` 도 `--resume` 도 쓰지 않는다.

기억은 대화가 아니라 **파일**이 대신한다. 세션이 아는 것은 아래 문서에 적힌 것뿐이고,
바퀴가 남기지 않은 것은 다음 바퀴에게 존재하지 않는다.

---

## 만들어진 파일

| 경로 | 무엇 |
|------|------|
| `loop/loop.ps1` | 루프 본체. 무한 반복, 바퀴마다 새 세션 |
| `loop/env.ps1` | 설정 (모델 / 최대 턴 / 대기 / 최대 바퀴 / 권한 / PATH) |
| `loop/ctl.ps1` | 제어 (install · start · stop · kill · status · uninstall) |
| `loop/PROMPT.md` | 지시서. 매 바퀴 세션에 그대로 넘어간다 |
| `loop/STOP` | 있으면 이번 바퀴를 마치고 멈춘다 (git 무시) |
| `docs/loop/SPEC.md` | 이번 라운드에 무엇을 만드는가. 거의 안 고침 |
| `docs/loop/STATUS.md` | 어디까지 했고 다음은 뭔가. 매 바퀴 갱신 |
| `docs/loop/INBOX.md` | 사람이 던지는 지시. 가장 먼저 처리. **남은 건수가 곧 합격 기준** |
| `logs/loop-YYYY-MM-DD.log` | 날짜별 로그 (git 무시) |

**`docs/loop/SPEC.md` 는 저장소 루트의 `DESIGN.md`(디자인 시스템)와 다른 파일이다.**

`INBOX.md` 가 비어 있으면 루프는 아무것도 만들지 않고 대기한다. 그렇게 만들어 뒀다.

---

## 켜는 법

```powershell
.\loop\ctl.ps1 install    # 작업 스케줄러에 등록 (한 번만. 등록 직후는 꺼진 상태)
.\loop\ctl.ps1 start      # 켠다
```

`start` 는 `STOP` 파일을 지우고, 작업을 활성화하고, 지금 바로 한 번 돌린다.
등록 이후로는 **로그인할 때마다 자동으로 시작**한다.

## 끄는 법

```powershell
.\loop\ctl.ps1 stop       # 이번 바퀴를 마치고 멈춘다 (권장)
.\loop\ctl.ps1 kill       # 지금 즉시 죽인다
```

`stop` 은 `loop/STOP` 파일을 만들고 작업을 비활성화한다.
지금 도는 바퀴는 끝까지 돌고 멈추므로, 대기 시간에 걸려 있으면 최대 한 바퀴만큼 기다린다.

`kill` 은 도중에 끊는다. **커밋 안 된 작업은 사라진다.** 급할 때만 쓴다.

## 상태 보는 법

```powershell
.\loop\ctl.ps1 status
```

작업 등록 여부와 상태, 마지막 실행 시각과 결과, `STOP` 파일 유무,
돌고 있는 프로세스, 오늘 로그 마지막 20줄을 한 번에 보여준다.

## 등록 해제

```powershell
.\loop\ctl.ps1 uninstall
```

---

## 설정 바꾸기

`loop/env.ps1` 을 고친다. 루프는 **매 바퀴 시작할 때 설정을 다시 읽으므로**,
멈추지 않고 값을 바꿔도 다음 바퀴부터 반영된다.

| 값 | 기본 | 뜻 |
|----|------|-----|
| `$LOOP_MODEL` | `claude-opus-5[1m]` | 쓸 모델 |
| `$LOOP_MAX_TURNS` | `40` | 한 바퀴 최대 턴. 다 쓰면 종료코드 1 로 끝나고 다음 바퀴로 간다 |
| `$LOOP_SLEEP_SECONDS` | `60` | 바퀴 사이 대기 |
| `$LOOP_MAX_CYCLES` | `0` | 최대 바퀴 수. 0 이면 무한 |
| `$LOOP_PERMISSION_MODE` | `acceptEdits` | 권한 모드 |
| `$LOOP_PATH_PREPEND` | 4개 경로 | 작업 스케줄러용 PATH. **비우면 조용히 죽는다** |

---

## 자동 실행이 어떻게 걸려 있나

Windows 작업 스케줄러, 작업 이름 `ClaudeAutoLoop-CardSurvival`.

- **트리거**: 로그온 시
- **비정상 종료**: 1분 뒤 재시작, 최대 3회
- **정상 종료**: 그대로 둔다 (`stop` 으로 멈춘 것을 되살리지 않기 위해)
- **동시 실행**: 새 인스턴스 무시 (겹쳐 뜨지 않는다)
- **실행 시간 제한**: 없음

작업 스케줄러로 뜬 프로세스는 평소 터미널의 PATH 를 물려받지 않는다.
그래서 `env.ps1` 의 `$LOOP_PATH_PREPEND` 로 PATH 를 명시하고, `loop.ps1` 이 매 바퀴 앞에 붙인다.
여기가 비면 `claude` 를 못 찾고 아무 소리 없이 죽는다.

---

## 켜기 전에 알아야 할 것

- **이 저장소는 게임 프로젝트다.** 루프가 커밋하는 곳도 여기다.
  지금 브랜치는 `codex/ai-playtest-runner-inline` 이고 진행 중인 작업이 함께 있다.
  루프 전용 브랜치를 파거나 별도 저장소로 옮기는 편이 안전하다.

- **루프는 셸 명령을 자유롭게 쓴다.** `~/.claude/settings.json` 의 `permissions.allow` 에
  `Bash(*)` 가 있어서다. 좁히려면 `env.ps1` 이 아니라 그 파일의 `permissions.deny` 를 손봐야 한다.

- **문서 세 개를 채우기 전에는 켜도 아무것도 안 만든다.** 그렇게 만들어 뒀다.
  빈 기획서를 추측으로 채우면 바퀴마다 범위가 넓어지기 때문이다.

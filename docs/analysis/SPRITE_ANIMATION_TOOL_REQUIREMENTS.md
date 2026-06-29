# 2D Sprite Animation Tool Requirements

## 목적

현재 전투 화면은 캐릭터, NPC, 몬스터를 2D 스프라이트 시트로 재생한다. 최근 작업에서 반복적으로 드러난 문제는 모션 자체보다 제작 파이프라인의 부재에 가깝다.

- 캐릭터와 NPC의 시각 크기가 달라 전장 위 스케일이 흔들린다.
- 프레임별 루트 좌표가 고정되지 않으면 idle, stay, hit 모션에서 캐릭터가 앞뒤로 튄다.
- 생성 이미지, 원본 시트, 실제 적용 시트가 분리되어 있어 어느 파일이 게임에 반영되는지 추적하기 어렵다.
- 전투 이벤트와 CSS motion class가 맞물리는지 전투 화면에서 직접 검증해야 한다.
- 몬스터와 동료 수가 늘어날수록 수작업 정규화로는 품질을 유지하기 어렵다.

따라서 이 툴의 1차 목표는 Spine이나 Live2D 수준의 범용 리깅 툴을 만드는 것이 아니라, 우리 게임 전투 화면에 들어갈 스프라이트 시트를 검사, 정규화, 미리보기, 내보내기 하는 제작 도구를 만드는 것이다.

## 현재 게임 기준

확인한 구현 기준은 다음과 같다.

- 전투 스프라이트 등록 위치: `js/ui/CombatUI.js`
- 전투 스프라이트 CSS 재생 위치: `css/screens-combat.css`
- 전투 모션 계약 문서: `docs/analysis/COMBAT_CHARACTER_MOTION_LIST.md`
- 캐릭터/NPC 스프라이트 폴더: `assets/images/combat/spritesheets`
- 몬스터 스프라이트 폴더: `assets/images/combat/spritesheets/enemies`

현재 `CombatUI.js`의 `spriteSheet(src)`는 모든 전투 스프라이트를 `cols: 6`, `rows: 4`로 등록한다. `css/screens-combat.css`는 `combatSpriteSheetFrames`에서 6프레임을 가로로 재생하고, 모션 class에 따라 4개 행을 선택한다.

| 행 | CSS row 위치 | 현재 용도 |
| --- | --- | --- |
| 0 | `0%` | idle, combat-ready, 기본 대기 루프 |
| 1 | `33.333%` | 공격, 사격, 전진 공격, 비명/소환 계열 |
| 2 | `66.666%` | 방어, 치료, 버프, 피격 반응 일부 |
| 3 | `100%` | 피격, 다운, 사망, 패배 |

현재 파일 구조에는 `*_sheet.png`와 `*_sheet_src.png`가 공존한다. 실제 게임은 `*_sheet.png`를 사용하고, `*_sheet_src.png`는 재생성/정규화 원본으로 취급해야 한다.

## 참고한 상용/준상용 툴

이 문서는 범용 애니메이션 툴을 그대로 복제하기 위한 것이 아니다. 각 툴에서 우리 제작 파이프라인에 필요한 아이디어만 추려온다.

| 툴 | 참고할 기능 | 우리 게임에 적용할 해석 |
| --- | --- | --- |
| [Aseprite Animation Docs](https://www.aseprite.org/docs/animation/) | timeline, frame, layer, cel, tag, preview, onion skin | 행/프레임 기반 시트 편집, 프레임 태그, onion-skin 비교가 필요하다. |
| [Adobe Animate Sprite Sheet Export](https://helpx.adobe.com/animate/desktop/workspace-and-workflow/create-sprite-sheet.html) | sprite sheet/texture atlas export, padding, trim, PNG alpha | Export 설정, 투명 배경, padding/trim 옵션을 명시적으로 제공해야 한다. |
| [TexturePacker Documentation](https://www.codeandweb.com/texturepacker/documentation) | exporter format, data file, sprite positions, trimming, pivot points | 시트 PNG만 만들지 말고 위치, pivot, trim 결과를 JSON으로 남겨야 한다. |
| [Spine User Guide](https://esotericsoftware.com/spine-user-guide) | skeleton, bones, slots, attachments, skins, constraints, events, timeline/preview | 장기적으로는 이벤트 마커, 스킨/장비 교체, hitbox를 고려하되 MVP에서는 과하다. |
| [Live2D Cubism Manual](https://docs.live2d.com/en/cubism-editor-manual/top/) | ArtMesh, deformer, parameters, timeline, physics, viewer | 캐릭터 표정/상체 흔들림 같은 고급 변형은 후순위다. 대신 parameter 개념은 모션 메타데이터에 참고한다. |
| [Rive State Machine Docs](https://rive.app/docs/editor/state-machine/state-machine) | state, transition, layer, animation mixing | 전투 이벤트가 어떤 모션으로 전이되는지 시각적으로 검증하는 state preview가 필요하다. |

## 제품 방향

권장 이름은 `Combat Sprite Studio`다. 이 툴은 일반 그래픽 편집기가 아니라 전투 스프라이트 납품 검수 도구에 가깝다.

핵심 방향은 다음과 같다.

1. 고정 규격을 먼저 지킨다.
   - 기본 규격은 `6 cols x 4 rows`.
   - 기본 cell은 현재 전투 시트 기준 `256 x 256`으로 취급한다.
   - display sheet는 `1536 x 1024`를 표준으로 삼는다.

2. 루트 좌표를 최우선으로 검증한다.
   - 모든 프레임은 bottom-center anchor를 기준으로 정렬한다.
   - idle 행에서 center/bottom 편차를 수치로 보여준다.
   - 허용 편차를 넘으면 Export를 경고 또는 차단한다.

3. 전투 화면과 같은 방식으로 미리 본다.
   - 단순 PNG preview가 아니라 `.motion-*` class와 동일한 행 매핑으로 재생한다.
   - player, companion, enemy의 좌우 배치, 스케일, 카메라 흔들림, 피격 이펙트까지 함께 확인한다.

4. 원본과 결과물을 분리한다.
   - `*_sheet_src.png`: 생성/편집 원본
   - `*_sheet.png`: 게임 적용용 정규화 결과
   - `*.sprite.json`: 툴 메타데이터와 검증 결과

## MVP 기능

### 1. 에셋 브라우저

필요 기능:

- `assets/images/combat/spritesheets`와 `assets/images/combat/spritesheets/enemies` 자동 스캔
- player, companion, enemy, boss 타입 구분
- `*_sheet.png`와 `*_sheet_src.png` 페어링 상태 표시
- `CombatUI.js`에 등록된 키와 실제 파일 존재 여부 비교
- 누락, 미등록, 중복, fallback 사용 여부 표시

수용 기준:

- 현재 등록된 전투 스프라이트 전체를 목록으로 볼 수 있다.
- 실제 게임에서 사용 중인 파일과 원본 파일을 구분해서 보여준다.
- 미등록 파일이나 깨진 경로가 있으면 즉시 경고한다.

### 2. 시트 검사기

필요 기능:

- PNG 크기 검사
- 행/열 수 검사
- cell 크기 계산
- alpha channel 존재 여부 검사
- 불투명 배경 또는 검은 배경 잔여 픽셀 감지
- 프레임별 bounding box 측정
- center X, bottom Y, visible width/height 편차 측정

권장 기본 규칙:

| 항목 | 권장 기준 |
| --- | --- |
| columns | 6 |
| rows | 4 |
| display sheet | 1536 x 1024 |
| cell | 256 x 256 |
| anchor | bottom-center |
| idle center drift | 4px 이하 |
| idle bottom drift | 4px 이하 |
| attack/hit center drift | 의도된 이동 태그가 없으면 8px 이하 |
| transparent background | 필수 |

수용 기준:

- 프레임별 root drift를 수치와 overlay로 확인할 수 있다.
- 문제가 있는 행/프레임을 클릭하면 해당 프레임만 확대해서 볼 수 있다.
- Export 전에 pass/warn/fail 상태를 만든다.

### 3. 타임라인/프리뷰

필요 기능:

- 행별 모션 재생
- FPS/기간 설정
- loop/once 설정
- frame step, previous/next frame
- onion-skin overlay
- 이전 프레임 ghost 표시
- row tag 표시

기본 row tag:

| Actor | Row 0 | Row 1 | Row 2 | Row 3 |
| --- | --- | --- | --- | --- |
| Player/NPC | idle/ready | attack | guard/heal/buff | hit/down/death |
| Enemy | idle/ready | attack/scream/advance | hit/debuff | death |

수용 기준:

- 사용자가 `motion-knife-slash`, `motion-firearm-shot`, `motion-zombie-lunge` 같은 실제 class 이름으로 미리 볼 수 있다.
- loop 모션과 once 모션의 반복 정책이 전투 CSS와 일치한다.

### 4. 루트/스케일 정규화

필요 기능:

- 기준 프레임 선택
- frame 0 또는 idle 대표 프레임을 기준으로 scale lock
- bottom-center anchor 자동 정렬
- actor별 기준 키 높이 설정
- player/NPC 표준 키 높이 일괄 적용
- boss/enemy는 별도 scale profile 허용
- frame padding 보존
- 원본 손상 없이 새 display sheet 생성

수용 기준:

- 캐릭터와 NPC가 같은 체급이면 전장 위 체감 크기가 거의 동일해야 한다.
- idle 루프에서 큰 앞뒤 흔들림이 없어야 한다.
- source sheet를 다시 넣어도 같은 결과가 나와야 한다.

### 5. 전투 이벤트 미리보기

필요 기능:

- playerAttack, companionAction, enemyAttack, playerHit, enemyDeath 등 주요 `fxQueue` 이벤트 시뮬레이션
- attacker/target 선택
- miss, crit, damage tier, weapon fx 선택
- 카메라워크 class preview
- hit effect overlay preview
- 상태이상 loop preview

수용 기준:

- 스프라이트 단독 재생이 아니라 실제 전투 상황에서 어색한지 확인할 수 있다.
- 캐릭터, NPC, 몬스터가 같은 화면에서 스케일과 루트가 맞는지 확인할 수 있다.

### 6. 모션 메타데이터

각 시트에는 JSON sidecar를 둔다.

예시:

```json
{
  "id": "doctor_f",
  "actorType": "player",
  "displayPath": "assets/images/combat/spritesheets/doctor_f_sheet.png",
  "sourcePath": "assets/images/combat/spritesheets/doctor_f_sheet_src.png",
  "cols": 6,
  "rows": 4,
  "cell": { "width": 256, "height": 256 },
  "anchor": { "mode": "bottom-center", "x": 128, "y": 244 },
  "scaleProfile": "human_medium",
  "motions": {
    "idle": { "row": 0, "frames": [0, 1, 2, 3, 4, 5], "fps": 6, "loop": true },
    "attack": { "row": 1, "frames": [0, 1, 2, 3, 4, 5], "fps": 10, "loop": false },
    "support": { "row": 2, "frames": [0, 1, 2, 3, 4, 5], "fps": 8, "loop": false },
    "hitDeath": { "row": 3, "frames": [0, 1, 2, 3, 4, 5], "fps": 8, "loop": false }
  },
  "validation": {
    "lastCheckedAt": "2026-06-26",
    "status": "pass",
    "maxCenterDriftPx": 0,
    "maxBottomDriftPx": 0
  }
}
```

### 7. Export

필요 기능:

- 정규화된 `*_sheet.png` 생성
- 원본 `*_sheet_src.png` 유지
- JSON sidecar 생성
- contact sheet 생성
- preview GIF 또는 WebP 생성
- validation report 생성
- 기존 파일 overwrite 전 diff preview

Export 옵션:

- fixed grid export
- alpha PNG
- trim 금지 또는 제한적 trim
- edge padding
- background cleanup
- scale profile 적용
- root lock 적용

주의:

TexturePacker나 Adobe Animate는 trim으로 빈 픽셀을 줄이는 흐름을 제공하지만, 우리 게임의 CSS background-position 방식에서는 임의 trim이 루트 좌표를 흔들 수 있다. MVP에서는 fixed cell grid를 우선하고, trim은 JSON atlas 방식으로 전환할 때만 허용한다.

## 고급 기능

MVP 이후 검토할 기능:

- hitbox/hurtbox 편집
- 무기 장착 레이어 preview
- muzzle, slash, impact marker 지정
- sound/event marker 지정
- camera marker 지정
- Rive식 state machine view
- Spine식 skin/slot 개념을 단순화한 장비 overlay
- Live2D식 deformer/parameter는 외부 툴 연동으로 처리
- AI 이미지 생성 프롬프트와 seed/reference 이미지 기록
- 생성 결과 A/B 비교
- sprite diff: 이전 적용본과 신규 적용본의 프레임별 차이 비교
- batch normalize for all enemies
- 시트 용량 최적화 리포트

## 화면 구성안

권장 레이아웃:

| 영역 | 기능 |
| --- | --- |
| 좌측 Asset List | actor type, 등록 여부, pass/warn/fail, 파일 페어링 |
| 중앙 Stage | 전투 화면 배경 위 실제 스케일 preview |
| 우측 Inspector | 시트 정보, anchor, scale, drift, 모션 메타데이터 |
| 하단 Timeline | row/frame 선택, loop, FPS, onion-skin |
| 상단 Toolbar | Import, Validate, Normalize, Export, Combat Preview |

디자인은 `DESIGN.md`와 `css/variables.css`의 industrial/utilitarian 톤을 따른다. 색상은 `--bg-void`, `--bg-surface`, `--accent-primary`, `--text-danger`, `--text-warn`, `--text-good`을 우선 사용한다. 툴 자체가 개발자/아트 검수용 화면이므로 장식보다 수치, overlay, 검증 상태가 명확해야 한다.

## 구현 구조 제안

처음부터 게임 본편 UI에 섞지 말고 개발용 standalone 페이지로 시작하는 것을 권장한다.

권장 경로:

- `tools/sprite-studio/index.html`
- `tools/sprite-studio/sprite-studio.css`
- `tools/sprite-studio/sprite-studio.js`
- `tools/sprite-studio/sprite-analyzer.js`
- `tools/sprite-studio/sprite-normalizer.js`
- `tools/sprite-studio/sprite-manifest.js`

주요 모듈:

| 모듈 | 책임 |
| --- | --- |
| `AssetIndex` | 파일 목록, 등록 키, source/display pair 관리 |
| `SpriteSheetDecoder` | PNG load, grid 분해, frame canvas 추출 |
| `FrameAnalyzer` | alpha bbox, center/bottom drift, 배경 잔여 픽셀 검사 |
| `Normalizer` | scale, anchor, padding, fixed grid 재배치 |
| `MotionPreview` | row/tag/FPS/loop 재생 |
| `CombatPreview` | 실제 전투 class와 camera/fx preview |
| `Exporter` | PNG/JSON/report/contact sheet 출력 |
| `ValidationReport` | pass/warn/fail와 수정 권장사항 생성 |

## 구현 순서

### Phase 1: 읽기 전용 Inspector

- 현재 시트 자동 스캔
- 6x4 grid 검사
- 프레임별 bbox/drift 측정
- row preview
- validation report 생성

완료 기준:

- 현재 전투 시트 전체를 읽고 pass/warn/fail을 출력한다.
- 어느 actor가 스케일/루트 문제를 갖는지 바로 알 수 있다.

### Phase 2: Normalize/Export

- source sheet 기준 정규화
- bottom-center anchor lock
- display sheet export
- JSON sidecar 생성
- contact sheet 생성

완료 기준:

- 수작업 없이 동일 입력에서 동일 출력이 나온다.
- normalized sheet를 `CombatUI.js`가 그대로 사용할 수 있다.

### Phase 3: Combat Preview

- `CombatUI.js` motion class와 같은 row mapping 적용
- player/NPC/enemy 동시 배치
- 공격/피격/사망/상태이상 이벤트 preview
- 카메라워크와 타격 이펙트 preview

완료 기준:

- 실제 전투에 넣기 전 어색한 모션과 스케일 문제를 발견할 수 있다.

### Phase 4: Batch/Production Pipeline

- 전체 actor batch validate
- 전체 enemy normalize
- 변경 리포트 생성
- 생성 이미지 prompt/seed 기록
- 승인된 시트만 게임 적용

완료 기준:

- 신규 캐릭터나 몬스터가 추가되어도 같은 절차로 검수하고 반영할 수 있다.

## 비목표

MVP에서 하지 않을 것:

- Spine 수준의 본격 bone rigging
- Live2D 수준의 mesh/deformer authoring
- 자체 AI 이미지 생성 UI 전체 구현
- 범용 atlas packing 엔진
- 게임 본편에서 사용하는 유저용 애니메이션 에디터

이 기능들은 매력적이지만 현재 문제를 해결하는 데에는 비용이 크다. 지금 필요한 것은 전투 스프라이트의 일관성과 검증성이다.

## 리스크

| 리스크 | 대응 |
| --- | --- |
| trim으로 루트가 다시 흔들림 | fixed grid 우선, trim은 metadata 기반 atlas로 전환할 때만 허용 |
| 원본/적용본 혼동 | `*_sheet_src.png`, `*_sheet.png`, `*.sprite.json` 역할 고정 |
| 캐릭터별 체급 차이와 오류 구분 어려움 | scale profile을 human_medium, human_large, dog, boss 등으로 분리 |
| AI 생성 결과의 스타일 편차 | seed/reference/prompt 기록과 contact sheet 비교 |
| 툴이 너무 커짐 | Phase 1 Inspector를 먼저 만들고 Export는 다음 단계로 제한 |

## 최종 수용 기준

이 툴의 첫 번째 실사용 버전은 다음을 만족해야 한다.

- 현재 프로젝트의 전투 스프라이트 전체를 자동 목록화한다.
- 각 시트의 크기, 행/열, alpha, root drift, bbox 편차를 검사한다.
- 캐릭터/NPC/몬스터를 실제 전투 배치와 유사하게 미리 볼 수 있다.
- idle, attack, support, hit/death 행을 전투 CSS와 같은 방식으로 재생한다.
- source sheet를 display sheet로 정규화해서 export할 수 있다.
- Export 결과에 JSON metadata와 validation report가 남는다.
- 전투 화면 적용 전, 흔들림과 스케일 불일치를 수치로 잡아낼 수 있다.

## 결론

우리 게임에 필요한 2D 애니메이션 툴은 범용 작화 프로그램이 아니라, `전투용 스프라이트 시트 품질 게이트`다. Aseprite의 타임라인/태그, TexturePacker와 Adobe Animate의 export 개념, Rive의 상태 전환 사고방식, Spine/Live2D의 장기 확장성을 참고하되, MVP는 다음 네 가지에 집중해야 한다.

1. 시트 검사
2. 루트/스케일 정규화
3. 전투 모션 preview
4. 검증 리포트와 안전한 export

이 순서로 만들면 지금 반복되는 좌표 흔들림, 크기 불일치, 실제 전투 적용 후 발견되는 문제를 제작 단계에서 잡을 수 있다.

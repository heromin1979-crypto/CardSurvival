# 캐릭터·동료 NPC 모션 선택적 개선 설계

## 상태

- 작성일: 2026-08-08
- 사용자 승인: 2번 방식 — 외형을 고정하고 저점수 동작 행 20개만 AI로 재제작
- 대상 브랜치: `master`
- 범위: 전투에서 사용하는 플레이어 캐릭터 6종과 동료 NPC 20종

## 목표

현재 production 6×8 스프라이트 시트 26종, 208개 동작 행을 전수 검토한 결과를 기준으로 다음을 달성한다.

1. 얼굴, 체형, 의상, 색상, 장비 정체성은 기존 runtime 시트와 동일하게 유지한다.
2. 의미가 뒤섞였거나 프레임 연결이 어색한 20개 행만 교체한다.
3. 모든 교체 행은 256×256 셀 6개로 구성하고 기존 1536×2048 RGBA 시트 계약을 유지한다.
4. 초록색 잔상, 숨은 RGB, 잘린 신체, 이웃 셀 파편, 과도한 앵커 이동을 0으로 만든다.
5. 실제 runtime의 6프레임 재생 시간과 모션 의미가 일치하도록 한다.

## 평가 기준과 현재 기준선

점수는 100점 만점으로 다음 항목을 합산한다.

| 항목 | 배점 | 판정 기준 |
|---|---:|---|
| 자세·스킬 가독성 | 25 | 첫눈에 `melee`, `ranged`, `support`, `guard`, `move`, `hit`, `death`가 구분되는가 |
| 프레임 연속성 | 25 | 준비, 핵심 동작, 후속 동작 또는 회복이 6프레임에서 자연스럽게 이어지는가 |
| 외형 일관성 | 20 | 얼굴, 체형, 헤어, 의상이 행과 프레임 사이에서 유지되는가 |
| 장비 일관성 | 15 | 무기와 소품의 형태, 크기, 손 위치가 튀거나 다른 물체로 바뀌지 않는가 |
| 앵커·클리핑·투명도 | 15 | 지면, 크기, 셀 경계, 알파와 chroma 정리가 안정적인가 |

현재 기준선은 플레이어 평균 86.0점, 동료 NPC 평균 80.8점, 전체 평균 82.0점이다. 기존 자동 QA는 기술적 무결성은 통과했지만 동작 의미와 연출 완성도를 점수화하지 않았으므로, 이번 작업에서는 자동 지표와 별도로 같은 기준표를 사용한 수동 점수를 기록한다.

## 교체 대상 20개 행

| 우선순위 | 시트 | 행 | 현재 문제 | 개선 동작 |
|---:|---|---|---|---|
| P0 | `firefighter_m` | `ranged` r2 | 도끼를 앞으로 내밀어 원거리 공격으로 읽히지 않음 | 소방 장비 또는 투척형 구조 장비의 준비→방출→회수 |
| P0 | `old_survivor_companion` | `move` r5 | 마지막 프레임에서 넘어지고 지팡이를 놓음 | 지팡이를 짚는 완결된 6단 보행 주기 |
| P1 | `soldier_companion` | `ranged` r2 | 조준 자세 반복으로 발사와 반동이 약함 | 견착→격발→반동→재조준 |
| P1 | `child_companion` | `hit` r6 | 같은 후방 기울기 반복 | 충격→비틀림→균형 회복 |
| P0 | `mechanic_companion` | `melee` r1 | 공구 형태와 손 위치가 프레임 사이에서 바뀜 | 동일 렌치의 준비→타격→회수 |
| P0 | `mechanic_companion` | `guard` r4 | 공구 상자 크기와 위치가 튐 | 동일 공구 상자를 전면에 고정한 방어 |
| P0 | `student_companion` | `guard` r4 | 가방 방어가 우산 공격 자세로 변함 | 가방 또는 접은 우산 중 하나만 사용한 일관된 방어 |
| P1 | `dog_companion` | `hit` r6 | 피격이 아니라 주저앉는 동작으로 읽힘 | 순간 충격→몸통 수축→네 발 복귀 |
| P0 | `dog_companion` | `death` r7 | 첫 프레임부터 누워 있어 붕괴 과정이 없음 | 직립→다리 풀림→측면 낙하→최종 정지 |
| P1 | `minjun_companion` | `hit` r6 | 후방 기울기 자세가 반복됨 | 총기를 유지한 충격→반동→복귀 |
| P1 | `sohee_companion` | `support` r3 | 약품 사용 뒤 사격 자세로 바뀌어 의미가 섞임 | 집중 또는 약품 사용 하나로 통일 |
| P0 | `sohee_companion` | `move` r5 | 이동 행에 피격 혈흔이 포함됨 | 소총을 낮춘 6단 전술 이동 |
| P0 | `sohee_companion` | `hit` r6 | 이동과 구분되지 않고 충격 변화가 약함 | 충격→상체 붕괴→회복 |
| P0 | `sohee_companion` | `death` r7 | 첫 프레임부터 같은 웅크린 시신 반복 | 직립→무릎 붕괴→측면 낙하→최종 정지 |
| P1 | `yeongcheol_companion` | `hit` r6 | 공중에 뒤로 기운 자세가 반복됨 | 중장비 무게를 반영한 짧은 반동과 복귀 |
| P0 | `daehan_companion` | `ranged` r2 | 얼굴, 체형, 복장이 다른 군인으로 바뀜 | 기존 작업복 외형으로 장치 또는 투척 도구 사용 |
| P0 | `daehan_companion` | `hit` r6 | 체형과 크기 변화, 회복 부재 | 기존 외형의 충격→반동→복귀 |
| P0 | `daehan_companion` | `death` r7 | 처음부터 누워 있고 프레임 간 변화가 약함 | 기존 외형의 직립→붕괴→최종 정지 |
| P1 | `tower_doctor_companion` | `hit` r6 | 500ms 피격 행이 완전한 사망 동작으로 끝남 | 피격 후 서 있는 상태로 복귀 |
| P0 | `sous_chef_companion` | `move` r5 | 행 전체가 이동이 아니라 피격 동작 | 식칼을 낮춘 완결된 6단 보행 주기 |

## AI 제작 계약

### 참조 입력

- 각 대상의 production 시트와 1:1 확대 보드를 참조 이미지로 사용한다.
  - 플레이어: `assets/images/combat/spritesheets/*_sheet.png`
  - 동료: `assets/images/combat/spritesheets/companions/*_sheet.png`, `assets/images/combat/spritesheets/nurse_companion_sheet.png`, `assets/images/combat/spritesheets/soldier_companion_sheet.png`
  - 동료 확대 보드: `art_sources/combat/task9_companions/review_previews/*_review.png`
- 프롬프트에 얼굴, 헤어, 체형, 의상 색상, 장비 목록, 시점, 광원, 렌더링 밀도를 명시한다.
- 새로운 인물, 복장, 무기, 카메라 각도는 허용하지 않는다.

### 프레임 문법

- 일반 공격: 준비→가속→접촉/방출→팔로스루→회수→중립 복귀
- `support`: 도구 준비→사용→효과 전달→정리. 다른 공격 자세를 섞지 않는다.
- `guard`: 동일한 방어 도구와 자세를 유지하며 작은 충격 흡수 변화만 허용한다.
- `move`: 좌우 보폭과 체중 이동이 교차하는 완결된 보행 주기. 피격, 혈흔, 넘어짐을 금지한다.
- `hit`: 충격→최대 반동→회복. 마지막 프레임은 사망·다운이 아니라 전투 가능한 자세여야 한다.
- `death`: 직립 또는 전투 자세→균형 상실→붕괴→완전한 최종 자세. 마지막 프레임은 `holdLast`에 적합해야 한다.

### 출력 규격

- 원본 생성은 평면 chroma 배경에서 수행하고 기존 정규화 도구로 RGBA로 변환한다.
- 최종 행은 1536×256, 6열이며 각 셀은 256×256이다.
- 캐릭터는 기존 행의 중간 신장과 발 기준선을 따른다.
- 분리된 투사체나 소품은 의도된 프레임에만 존재해야 하며 이웃 셀로 넘어가면 안 된다.
- 기존 파일을 바로 덮어쓰기 전에 `art_sources/combat/` 아래에 원본 chroma와 alpha 산출물을 보관한다.

## 조립과 provenance

### 플레이어

- `art_sources/combat/task8_players/`에 새 `firefighter_m_ranged_rework_chroma.png`와 `firefighter_m_ranged_rework_alpha.png`를 추가한다.
- `tools/build_player_motion_sheets.py`의 `SOURCE_GRIDS`, `SIMPLE_ROW_SOURCES`, `ROW_RECIPES`가 새 행을 명시적으로 사용하도록 변경한다.
- `art_sources/combat/task8_players/assembly_recipe.json`은 빌더가 생성한 실제 매핑과 일치해야 한다.

### 동료 NPC

- `art_sources/combat/task9_companions/`에 대상별 rework chroma/alpha 원본을 보관한다.
- `art_sources/combat/task9_companions/assembly_recipe.json`에서 19개 동료 행의 새 source, sourceRow, sourceColumns를 명시한다.
- `art_sources/combat/task9_companions/generation_provenance.json`에 생성 도구, 참조 자산, 생성 시각, 파일 SHA-256을 기록한다.
- `tools/build_companion_motion_sheets.ps1`은 recipe를 통해 같은 runtime PNG를 결정적으로 재현해야 한다.
- `soldier_companion/ranged` 변경으로 분리 투사체 계약이 바뀌면 `ranged_component_contract.json`과 `tools/companion_motion_quality.mjs`의 고정 SHA를 함께 갱신한다.

## runtime 계약

`js/data/combatMotionManifest.js`의 `PLAYER_MOTIONS` 행 순서와 시간은 유지한다.

- `ranged`: r2, 680ms, stationary
- `support`: r3, 760ms, stationary
- `guard`: r4, 640ms, stationary
- `move`: r5, 650ms, approach
- `hit`: r6, 500ms, stationary
- `death`: r7, 1100ms, stationary, `holdLast: true`

이미지 행 교체만으로 의미가 맞으므로 기본적으로 JS와 CSS 동작 계약은 변경하지 않는다. 프레임별 가중 시간이 꼭 필요한 경우에만 `assets/images/combat/spritesheets/motionLibrary.json`의 해당 `frameDur`를 수정하며, 전체 지속 시간은 위 계약을 넘지 않는다.

## QA 산출물

### 자동 검증

- 플레이어 빌드·검증
  - `python tools/build_player_motion_sheets.py --check`
  - `python tools/render_player_motion_preview.py`
  - `python tools/verify_player_motion_qa.py`
- 동료 빌드·검증
  - `powershell -ExecutionPolicy Bypass -File tools/build_companion_motion_sheets.ps1 -Check`
  - `powershell -ExecutionPolicy Bypass -File tools/render_companion_motion_preview.ps1`
  - `node tools/verify_companion_motion_qa.mjs`
- 공통
  - `node tools/export_combat_motion_manifest.mjs --check`
  - `npm.cmd test -- tests/unit/CombatPlayerMotionAssets.test.js tests/unit/CompanionMotionQuality.test.js`
  - 전체 `npm.cmd test`
  - `npm.cmd run build:web`

실제 스크립트의 옵션이 위 예시와 다르면 구현 단계에서 `--help` 또는 소스의 `argparse`/`param` 정의를 기준으로 정확한 명령을 사용한다.

### 수동 검증

- `docs/analysis/generated/player_motion_preview.png`와 `art_sources/combat/task9_companions/companion_motion_contact_sheet.png`를 원본 해상도로 다시 확인한다.
- 교체된 20개 행을 runtime 지속 시간으로 반복 재생하여 팝, 미끄러짐, 외형 변화, 소품 순간 이동을 확인한다.
- `docs/analysis/PLAYER_MOTION_MANUAL_OBSERVATIONS.json`과 `docs/analysis/COMPANION_MOTION_MANUAL_OBSERVATIONS.json`을 실제 새 해시와 관찰 내용으로 갱신한다.
- 동일 평가표로 26종 점수를 다시 계산하고 이전 점수, 이후 점수, 잔여 개선 항목을 별도 QA 문서에 기록한다.

## 완료 기준

1. 승인된 20개 행만 교체되고 나머지 188개 행의 픽셀은 유지된다.
2. 대상 캐릭터의 얼굴, 체형, 의상과 주요 장비가 기존 행과 일치한다.
3. `move`에 피격·혈흔·넘어짐이 없고 `hit`은 사망 자세로 끝나지 않는다.
4. `death`는 첫 프레임부터 누워 있지 않고 마지막 프레임이 안정적으로 유지된다.
5. 20개 행 모두 6개 유효 프레임이며 alpha coverage가 0인 셀이 없다.
6. opaque green, fringe green, hidden RGB, boundary green이 모두 0이다.
7. 빌더 `--check`, 전용 QA, 전체 Vitest, production build가 통과한다.
8. 전체 평균 점수는 88점 이상, 교체 대상 각 시트는 80점 이상을 목표로 한다.

## 범위 제외

- 보스·일반 적 스프라이트 재작업
- 전투 수치, 스킬 효과, AI, 타게팅 변경
- 플레이어·동료 roster 또는 스킬 `motionKey` 변경
- 전체 208개 행의 재생성
- 승인되지 않은 UI·CSS 개편

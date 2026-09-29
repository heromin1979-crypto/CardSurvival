# 전투 연출 개선 계획 — 배경 · 날씨/광원 · 이펙트 · 노드 · 바인딩 · 타격감

- 작성: 2026-09-26
- 확인 툴: `tools/combat-fx-lab/` → `node serve.js` 후 `http://localhost:8080/tools/combat-fx-lab/`
- 참고 영상: 용사주식회사 「머신 만드는 기능, 프롬프트 한번에 현타 왔습니다 | 클로드 오퍼스 5.5」 (https://youtu.be/SWtjWL5ipEM)
  — 영상은 "개선 전후를 툴에서 바로 보며 연출을 올리는" 흐름을 참고했고, 세부 항목(③~⑧)은 요청 목록을 그대로 따랐다.

## 0. 원칙

1. **전투 규칙은 건드리지 않는다.** 이번 작업은 순수 연출층이다. `CombatSystem.fxQueue`가 내보내는 이벤트(명중·치명·처치·빗나감)를 그대로 받아 그리기만 한다.
2. **툴에서 먼저 확정하고 게임으로 옮긴다.** 모든 수치·이펙트·바인딩은 FX 랩에서 전/후를 비교해 정하고, 랩의 **⤓ 내보내기 JSON**이 게임 런타임의 입력이 된다(수치를 두 번 옮겨 적지 않는다).
3. **기존 DOM 전투 UI는 유지**하고, 전장 영역에만 캔버스 레이어 하나를 추가한다. 카드·HP바·의도 아이콘은 지금처럼 DOM.
4. **모바일(Capacitor) 성능 예산**: 파티클 동시 400개 이하, 캔버스 1장, `fx.quality`(0.25~2)로 단계 조정.

## 1. 현재 상태 (코드 기준 기준선)

| 항목 | 현재 구현 | 위치 |
|---|---|---|
| 배경 | 이미지 1장 + CSS 그라데이션·스캔라인·바닥 띠 | `css/screens-combat.css` `.combat-battlefield::before/::after`, `combatAssets.js` `backdrop` |
| 날씨 | 상단 칩 텍스트만 (`날씨 비`) — 화면 연출 없음 | `CombatUI.js` `ctb-chip` |
| 광원 | 없음 (`light_source` 태그는 판정에만 사용) | `CombatSystem.js` 1133/2057/3043행 |
| 이펙트 | PNG 1장(slash/claw/impact/shot/acid)이 700ms 확대·소멸, 일부 이모지 | `CombatFxPlayer._spawnFxOverlay` |
| 데미지 숫자 | 떠오르며 사라짐 | `_spawnFloatText` |
| 히트스톱 | 70ms / 치명 120ms (CSS 애니메이션 일시정지) | `_hitstop` |
| 흔들림 | 치명·처치에만, 가로 7px 400ms | `_shakeVisual`, `visualShake` |
| 넉백·반동·피격섬광·잔상 | 없음 | — |
| 캐릭터-이펙트 연결 | 명중 순간 대상 위 1장. 발동(기 모으기)·돌진·총구 단계 연출 없음 | `_playFx` `case` 분기 |

## 2. 항목별 계획

### ③ 배경 개선 전후
- **목표**: 캐릭터가 배경에 붙어 보이는 문제 해결 — 깊이·접지·분리.
- **내용**: 원경/근경 레이어 분리(원경 흐림 2.5px, 패럴랙스 0.6) · 발밑 접지 그림자 · 림라이트(시간대 색) · 빛줄기 · 뒤 안개/발목 안개 2층 · 젖은 바닥 반사 · 시간대 색보정 · 비네트.
- **데이터 추가**: 배경마다 `horizon`(지평선 비율), `indoor`, `shafts`(빛줄기 x), `fire`/`emergency`(고정 광원 위치). → `combatAssets.js`의 `backdrop`을 객체로 확장.
- **게임 반영**: `js/ui/combat/CombatStageRenderer.js`(신규) — 전장 뒤 캔버스. CSS `::before/::after`는 제거.
- **완료 기준**: 랩 "③ 배경 · 이 항목만 비교"에서 개선안 채택, 모바일 60fps 유지.

### ④ 실제 전투에서 보는 날씨와 광원
- **입력**: `GameState.weather.id`(값은 `rainy` 등 — `.current` 아님), `isRainyWeather()`/`WET_WEATHER_IDS`, `NightSystem.isNight()`, 보드의 `light_source` 카드.
- **날씨 13종 매핑**: 비 계열(rainy/storm/monsoon/acid_rain) 빗줄기+튀김+젖은 바닥, 눈 계열(snow/blizzard) 눈송이·화이트아웃, foggy 안개 강화, storm 번개(섬광·짧은 흔들림), windy 잔해, hot 아지랑이+난색, cloudy/overcast 어둡게.
- **실내 규칙**: `indoor` 배경(지하철)은 천장 틈(빛줄기 위치)으로만 비·눈이 들어오고 양은 1/3. 번개는 섬광만.
- **광원**: 시간대별 어둠(낮 0.05/황혼 0.3/밤 0.5) 위에 손전등(`light_source` 보유 시 원뿔), 드럼통 불(깜빡임), 비상등(점멸), **이펙트 동적 광원**(총구·타격·충격파). 캐릭터 키라이트로 어둠 속에서도 캐릭터가 먼저 읽히게.
- **게임 반영**: `CombatWeatherLayer` + `CombatLighting` (둘 다 `CombatStageRenderer` 안의 패스).
- **완료 기준**: 13종 날씨 × 3시간대 × 실내/실외 스샷 점검, 가독성(적 의도 아이콘·HP) 저하 없음.

### ⑤ 전투 이펙트 개선
- PNG 오버레이 → **파티클 + 동적 광원**. 11종 기본 세트: 베기 궤적, 타격 스파크, 혈흔, 충격파, 기 모으기, 총구 화염, 예광탄, 흙먼지, 돌진 베기, 할퀴기, 산성 튀김.
- 데미지 숫자: 튀어오름(pop) + 타격 방향으로 흐름 + 치명 `CRITICAL` 강조.
- 기존 `fx` 키(slash/claw/impact/shot/acid)는 매핑표(`LEGACY_FX_MAP` 역방향)로 새 이펙트에 연결 → `CombatSystem`의 fxQueue 수정 불필요.
- **게임 반영**: `CombatFxPlayer`의 `_spawnFxOverlay` 호출부를 `CombatFxCanvas.spawn(id, pos, {flip, scale})`로 교체. 실패 시 기존 PNG로 폴백.

### ⑥ 노드 기반 이펙트 제작
- 이펙트 = 노드 그래프 1개. 노드 12종: 생성·형태·속도·힘·난류·색상·크기·회전·렌더 + 광원·화면(흔들림/섬광) + 출력.
- 체인(생성→…→렌더) 여러 개를 출력에 모으면 레이어 합성. 광원·화면 노드는 단독 체인.
- 랩에서 편집 → 브라우저 자동 저장 → **⤓ 내보내기**의 `library`를 `js/data/combatFxLibrary.json`으로 커밋. 게임 런타임은 랩과 **같은 컴파일러**(`fxNodes.compileGraph`)와 **같은 파티클 런타임**(`fxRuntime.FxSystem`)을 공유 모듈로 사용.
- 검증: `validate.js`에 "출력에 연결 안 된 체인 / 시작 노드 없는 체인" 검사 추가(랩 하단 경고와 같은 규칙).

### ⑦ 캐릭터에 공격·스킬·대시 이펙트 붙이기
- 스프라이트 시트 모션(`combatMotionManifest` / `spritesheets/manifest.json`의 melee·support·move·ranged·basic_attack) 위에 **타임라인 이벤트**를 둔다.
  - `fx` 이벤트: 시점 t(0~1), 이펙트 id, 소켓(무기·손·발·몸 중심·머리·대상 중심/발/머리), 회전·크기·오프셋
  - `hit` 이벤트: 명중 순간 — 타격감(⑧) 발동 + 대상에 재생할 이펙트 목록 + 위력
  - `trail` 구간: 잔상 on/off
  - `loco`: 접근 끝/복귀 시작/간격 (현재 CSS 접근 모션 대체)
- 기본 바인딩: 공격(흙먼지→베기→스파크+혈흔), 스킬(기 모으기→충격파), 대시(잔상+흙먼지→돌진 베기), 사격(총구 화염+예광탄→스파크), 적 공격(할퀴기→혈흔).
- **게임 반영**: `js/data/combatFxBindings.js` — 액션 종류(무기 타입·스킬 id·적 모션)별 이벤트 목록. `_playFx`는 "모션 재생 + 이벤트 스케줄"만 하면 된다.
- 소켓 좌표는 지금은 전 캐릭터 공통 비율. 시트별 오차가 크면 manifest에 `sockets` 필드를 추가해 덮어쓴다(2단계).

### ⑧ 타격감 — 정지·반동·잔상

| 수치 | 현재 게임 | 개선안 |
|---|---|---|
| 히트스톱 | 70 / 치명 120ms | 90 / 치명 160ms + 정지 중 대상 진동 4px |
| 넉백 | 없음(모션만) | 28px (정지 풀린 뒤 90ms 튕김, 360ms 복귀) |
| 공격자 반동 | 없음 | 12px |
| 흔들림 | 치명·처치만 7px 400ms 가로 | 모든 명중 6px / 치명 16px, 260ms, 세로 성분 포함 |
| 피격 섬광 | 없음 | 흰 실루엣 90ms |
| 치명 줌 펀치 | 없음 | 4.5% 220ms |
| 처치 슬로모션 | 없음 | ×0.3, 320ms |
| 잔상 | 없음 | 대시/접근 구간 6장, 32ms 간격, 240ms 소멸 |

- 프리셋 4종(현재 게임·개선안·묵직하게·가볍고 빠르게)을 랩에서 비교해 캐릭터/무기군별로 고를 수 있게 `COMBAT_FEEL` 테이블로 둔다(예: 둔기=묵직, 칼=가볍고 빠르게).
- 접근성: 설정에 "화면 흔들림 줄이기" 토글 → 흔들림·줌 0, 히트스톱 유지.

## 3. 일정 (제안)

| 단계 | 내용 | 산출물 | 기간 |
|---|---|---|---|
| 0 | FX 랩으로 수치·이펙트·바인딩 확정 (완료: 툴) | `combat-fx-config.json` | 2~3일 |
| 1 | `CombatStageRenderer` 캔버스 도입 + 배경(③) | 전장 캔버스, CSS 배경 제거 | 3일 |
| 2 | 파티클 런타임 공유 모듈화 + 이펙트(⑤) + 라이브러리 JSON(⑥) | `combatFxLibrary.json`, `CombatFxCanvas` | 4일 |
| 3 | 바인딩(⑦) + 타격감(⑧) — `_playFx` 재작성 | `combatFxBindings.js`, `COMBAT_FEEL` | 4일 |
| 4 | 날씨·광원(④) — 게임 상태 연동 | `CombatWeatherLayer`, `CombatLighting` | 3일 |
| 5 | 모바일 성능·가독성 QA, `tests/e2e/combat-screen.playwright.mjs`에 스샷 비교 추가 | QA 리포트 | 2일 |

## 4. 위험 · 확인할 것

- **에셋 결함**: `soldier_m_sheet.png`의 피격(hit) 행 3번째 칸에 작은 인물이 2명 들어가 있다 — 피격 시 캐릭터가 순간 둘로 보인다(현재 게임에도 동일). 랩의 "적 공격(5)"으로 재현됨. `sprite-anim-editor`로 해당 칸 교체 필요.
- 캔버스와 DOM 레이어 좌표 동기화(창 크기·Scale 방식) — `main.js`의 1920×1080 스케일을 캔버스에도 동일 적용.
- 어둠 연출이 적 의도 아이콘·HP 가독성을 해치지 않도록 UI는 캔버스 위 DOM으로 유지.
- 저사양 안드로이드: `fx.quality` 0.5, 원경 흐림은 미리 구운 이미지로 대체(실시간 blur 금지 — 랩도 캐시 사용).
- CLAUDE.md 규칙: 날씨는 `GameState.weather.id`, 비 판정은 `isRainyWeather()` 사용(리터럴 금지).

## 5. FX 랩 사용법 요약

- 상단 **개선 전 / 개선 후 / 슬라이더 비교 / 나란히** — 보기 전환. **이 항목만 비교**는 현재 탭 항목만 전/후가 다르고 나머지는 개선안으로 고정, **전체 비교**는 현재 게임 전체 대 개선안 전체.
- 액션 바: 공격(1)·스킬(2)·대시(3)·사격(4)·적 공격(5), 스페이스 = 다시 재생, 치명타/처치/자동 반복, 속도 ×0.25 슬로 재생.
- 캐릭터/적 선택은 실제 `spritesheets/manifest.json` 60종 전부.
- 탭 ③~⑧에서 값을 바꾸면 즉시 반영, 브라우저에 자동 저장. **⤓ 내보내기**로 JSON 저장 → 게임 반영 단계의 입력.

## 6. 진행 현황

### 2026-09-26 — 1차 게임 반영 (⑤ 이펙트 · ⑥ 노드 런타임 · ⑦ 발동 바인딩 · ⑧ 타격감)

| 파일 | 내용 |
|---|---|
| `js/ui/combat/fx/fxNodes.js · fxRuntime.js · fxLibrary.js` (신규) | 노드 그래프 컴파일러 + 파티클 런타임 + 내장 이펙트 11종. **랩과 게임이 같은 파일을 쓴다** (`tools/combat-fx-lab/js/fx*.js`는 이 파일을 다시 내보내기만 함) |
| `js/ui/combat/CombatFxCanvas.js` (신규) | `.combat-visual` 위 캔버스 1장. 이펙트가 없으면 rAF 정지. 캔버스 미지원 환경(테스트 happy-dom 등)은 자동으로 기존 연출 |
| `js/data/combatFxConfig.js` (신규) | `COMBAT_FEEL`(legacy/enhanced 수치), `FX_PARTICLE_MAP`(게임 fx 키 → 파티클), `ACTION_BINDINGS`(발동 단계) |
| `js/ui/combat/CombatFxPlayer.js` | `_spawnFxOverlay` → 파티클(기존 `.cv-fx-*` DOM 마커는 유지하고 숨김), `_impactFeel`(정지+대상 진동 → 넉백·반동, 흰 섬광, 흔들림, 치명 줌), `_actionWindup`(접근 공격 흙먼지+잔상), `_spawnTracer`(사격 예광탄), 스킬 발동 기 모으기, 스킵 시 캔버스 정리 |
| `js/core/SettingsManager.js` · `js/ui/SettingsModal.js` · `js/data/locales.js` | 설정 → **전투 연출**: "개선 연출" 켜기/끄기, "화면 흔들림 줄이기" |
| `css/screens-combat.css` | `.combat-fx-canvas`, `.cv-fx--particle`, `.combat-afterimage` |
| `tests/unit/CombatFxConfig.test.js` (신규) | 그래프 컴파일 오류 0, 매핑 id 존재, 모든 타격 fx 키 매핑, legacy 수치 고정 |

- 개선 연출을 끄면 이전과 완전히 같은 경로(히트스톱 70/120, PNG 오버레이)로 돈다.
- 검증: 전투 관련 테스트 70개 + 신규 4개 통과. 전체 스위트 결과는 작업 복사본 기준 3908 통과 / 22 실패였고, 실패 22개는 모두 이번 변경과 무관(아트 소스·git 이력이 필요한 에셋 출처 검사 20개 + 기존 실패 2개: `LocaleItemCoverage` npc_early_resident 영문 키, `CompanionSidePanel` 비네팅).
- 브라우저 확인: `combat-test.html`에서 근접 치명·사격·적 할퀴기·처치를 녹화해 파티클·넉백 방향·잔상·흔들림 확인.

### 2026-09-26 — 2차 게임 반영 (③ 배경 깊이 · ④ 날씨·광원)

| 파일 | 내용 |
|---|---|
| `js/ui/combat/CombatStageRenderer.js` (신규) | 뒤 캔버스(캐릭터 뒤): 시간대 어둠 + 광원 구멍(손전등 원뿔·드럼통 불·비상등·이펙트 동적 광원) · 빛줄기 · 뒤 안개 · 먼지 · 발밑 그림자 · 젖은 바닥 광원 반사 / 앞 캔버스: 비·눈·잔해 · 발목 안개 · 번개. 30fps 제한, 반해상도 |
| `js/ui/CombatUI.js` | `render()` 직후 `_mountStageFx()` — 설정이 꺼져 있거나 캔버스 미지원이면 아무것도 안 함 |
| `js/data/combatAssets.js` | 종로 지하철 배경에 `env` 메타(실내, 빛줄기·불·비상등 위치) |
| `css/screens-combat.css` | 캔버스 레이어, 캐릭터 밝기/림라이트(`--env-actor-bright`, `--env-rim`), 기존 CSS 그라데이션 약화 |

- 입력: `GameState.weather.id`(`isRainyWeather`), `GameState.time.hour` + `NightSystem.isNight()`(21~5시 밤, 17~21·5~7시 황혼), 보드의 `light_source`/`light` 태그 카드(손전등).
- **HP·의도 등 UI는 어둡게 하지 않는다** — 어둠은 배경 캔버스에만, 캐릭터는 CSS 밝기로만 조정.
- 실내 배경은 비·눈이 빛줄기(천장 틈) 위치로만 1/3 양. 번개는 섬광만.
- 원경 흐림·패럴랙스는 배경이 CSS 이미지 한 장이라 이번엔 제외(배경을 원경/근경 이미지로 나누는 아트 작업 필요).
- 검증: 전체 스위트 3912 통과, 실패 22개는 1차와 동일(모두 무관). 맑음/비(황혼)/폭풍(밤)/눈/안개 화면 캡처 확인.

### 2026-09-26 — 3차 반영 (원경 흐림·패럴랙스 · 처치 슬로모션 · 소켓 보정 · 실외 배경 등록)

- **원경 흐림 + 패럴랙스** (`CombatStageRenderer._farLayer`): 새 아트 없이, 배경 이미지를 CSS와 같은 배치로 흐리게 다시 그려 지평선 위만 남긴다. 아군/적 카메라 연출(`camera-ally-*`/`camera-enemy-*`) 방향으로 원경만 ±10px 밀려 깊이가 생긴다. 크기별 1회 생성 후 캐시.
- **처치 슬로모션** (`CombatFxPlayer._killSlowmo`, `CombatFxCanvas.slowmo`): 처치 명중 시 전장 안 애니메이션·파티클을 ×0.3으로 320ms. 연출 큐 타이머는 그대로라 다음 행동과 겹치지 않는다.
- **소켓 보정** (`SOCKET_OVERRIDES`): 시트 키별 부착점 비율 덮어쓰기. 현재 소총 든 `soldier_m`·`soldier_companion`의 무기 위치만 등록.
- **실외 배경** `overpass_rail`(`battle_bg.jpg`, `env.indoor: false`) 등록 — 화면 전체 비·눈·번개 볼트 확인. 단, **전투 배경을 고르는 규칙이 아직 코드에 없다**(`GameState.combat.sceneId`를 설정하는 곳이 없어 항상 종로 지하철). 그리고 이 이미지는 정사각 1024px이라 가로로 잘려 하늘이 안 보인다 → 실외용 와이드 배경 아트 필요.
- 테스트: `CombatFxConfig.test.js` 7개(소켓 키 존재, 모든 배경의 env 메타, 슬로모션 범위 추가). 전체 3915 통과 / 실패 22(기존과 동일, 무관).

### 남은 단계
- 전투 배경 선택 규칙 결정(구·랜드마크·세부장소별 sceneId) + 실외 와이드 배경 아트.
- 소켓 보정은 실제 플레이에서 어긋나 보이는 캐릭터부터 `SOCKET_OVERRIDES`에 추가.
- 커밋 + Confluence 패치 노트(CLAUDE.md 7절) — 사용자 확인 후.

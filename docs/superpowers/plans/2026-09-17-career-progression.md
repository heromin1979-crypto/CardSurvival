# 직업별 제작·대화씬·지역 수급 개편 구현 계획

> 실행 담당: `superpowers:executing-plans` 절차로 작업별 구현·검증을 진행한다. 체크박스는 검증된 구현 상태를 표시한다. 실행 기록: docs/analysis/progression-execution/progress.md.

**목표:** 기존 6직업 퀘스트를 초반 제작 경험→중간 생산·협력→후반 분기로 연결하고, 첨부 대화씬 형태로 진행을 표현하며, 원료 중심 탐색 경제를 구축한다.

**구조:** QuestSystem이 목표의 유일한 판정 주체가 된다. 치료·설비 사용은 도메인 시스템이 검증하고 결과 이벤트를 보낸다. 장면 UI는 상태를 표시하고 명령을 전달한다. 수급은 구/랜드마크/세부장소/확정 보상 역할을 분리해 기존 세이브를 보존한다.

**기술:** Vanilla JS ES modules, CSS tokens, EventBus, Vitest, 기존 Playwright 실행 환경.

**설계:** [감사·통합 설계](../../analysis/2026-09-17-career-progression-design.md), [25구 보상안](../../analysis/2026-09-17-progression-regional-proposal.md), [전수 데이터](../../analysis/2026-09-17-progression-data-audit.md).

## 공통 제약

- 모든 문서와 사용자 문구는 한글. 실제 기존 함수/상태를 확인한 뒤 수정한다.
- 1920×1080 Scale, `DESIGN.md`, `css/variables.css`의 폰트·색 의미·14px 최소 본문 기준 유지.
- 기존 직업·분기·엔딩은 유지. 기존 레시피 결과물은 가능한 한 재사용한다.
- 공급 경로를 마련하기 전에 기존 완제품 드랍을 제거하지 않는다. 시작 구호품을 일괄 원료로 바꾸지 않는다.
- 신규 필드는 데이터 선언·검증·에디터 설명·소비처를 함께 추가한다.
- 수집/제작/설치/사용은 구별한다. 최초 행동 요구인지 기존 상태 인정인지 퀘스트별로 명시한다.
- 세이브 이전 상태를 보존하고 청구한 보상을 다시 지급하지 않는다. 화면 재열람으로 게임 상태가 변하지 않게 한다.
- 아래 새로운 파일/인터페이스는 제안이며 현행 구현으로 오인하지 않는다. 전체 게임 경제를 일괄 교체하지 않고 각 단계가 작동하는 상태로 진행한다.

## 순서와 산출물

| 단계 | 범위 | 완료 산출물 | 선행 |
|---|---|---|---|
| 0 | 목표 판정·기준선 | 잘못된 제작으로 퀘스트가 진행되지 않음 | 없음 |
| 1 | 대화씬 | NPC/메인 퀘스트/분기가 첨부 구도로 표시 | 0 |
| 2 | 의료 | 첫 치료→중간 환자→연구 준비가 실제 제작에 연결 | 0, 1 |
| 3 | 수급 기반 | 확정 보상 고정 수량·청구 이력·공급 병목 대안 | 0 |
| 4 | 나머지 직업 | 5직업 초·중·후반 프로젝트 연결 | 1, 3 |
| 5 | 지역별 경제 적용 | 25구 보상·일반 드랍·특화 장소 조정 | 2, 3, 4 |
| 6 | 통합 검수 | 세이브·모바일·동선·소모량 검증 기록 | 5 |

## 작업 0. 특정 제작물 목표 판정과 회귀 기준선

수정: `js/systems/QuestSystem.js`의 `_onCraft`, `_matchSubObjective`; `js/data/validate.js`.
신규 테스트: `tests/unit/QuestCraftOutputRequirement.test.js`.

- [x] 아래 재현을 회귀 테스트로 작성한다. 완료 보상과 분기 실행을 격리하고 진행도만 확인한다.

```js
GameState.quests.active = [{ id: 'mq_doctor_side_end', progress: 0 }];
const complete = vi.spyOn(QuestSystem, '_checkCompletion').mockImplementation(() => {});
QuestSystem._onCraft('wrap_bandage');
expect(GameState.quests.active[0].progress).toBe(0);
complete.mockRestore();
```

- [x] 실행해 현재 실패 확인: `npx vitest run tests/unit/QuestCraftOutputRequirement.test.js`.
- [x] `_onCraft`에서 objective.definitionId가 있으면 bp.output의 definitionId를 검사한다. category도 지정됐으면 두 조건 모두 만족해야 한다. 같은 이벤트가 중복될 가능성은 기존 이벤트 발행 지점까지 확인한다.
- [x] 레시피 ID를 원하는 경우 신규 필드 blueprintId로 명시한다. definitionId와 혼용하지 않는다. 이벤트 횟수와 산출 수량도 분리하며 기존 count는 제작 완료 횟수 의미를 유지한다.
- [x] 정답/오답/복수 산출/카테고리/이미 완료된 퀘스트를 검사한다. 메인 목표와 서브목표가 같은 결과를 표시하는지 확인한다.
- [x] 기존 QuestSystem_subObjective, QuestCollectStartSync, QuestNpcCrossoverSync 회귀 테스트 실행.

## 작업 1. 공통 대화 장면과 퀘스트 연결

신규: `js/ui/DialogueScene.js`, `js/data/questScenes.js`, `tests/unit/DialogueScene.test.js`, `tests/unit/QuestSceneFlow.test.js`, `tests/e2e/quest-dialogue.playwright.mjs`.
수정: `js/ui/NPCDialogueModal.js`, `js/ui/ModalManager.js`, `js/ui/CinematicScene.js`, `js/systems/QuestSystem.js`, `js/main.js`, `css/npc-dialogue.css`.

제안 인터페이스:

```js
// SceneSpec: {id, questId?, speakerId?, background, portrait?, text,
// choices:[{id,label,disabledReason?}], dismissible}
// 표시는 읽기 전용이며 선택의 게임 효과는 호출자가 실행한다.
DialogueScene.enqueue(scene, onChoose); // onChoose(choiceId)
DialogueScene.close();
```

- [x] 기존 NPCDialogueModal의 배경/인물 폴백·focus/키보드 로직을 읽고 공통 렌더러로 옮길 책임만 결정한다. 치료/거래 로직까지 UI에 복제하지 않는다.
- [x] 큐에서 장면 2개를 순서대로 표시하고 선택 콜백이 한 번씩만 실행되는 테스트 작성. 이미지 실패와 재열람 시 게임 상태 불변도 검사.
- [x] 전체 배경, 좌측 큰 인물, 우측 떠 있는 패널로 CSS를 변경한다. `--panel-glass`, `--accent-primary`, `--text-info` 사용. 인물 얼굴 위치와 패널 본문 스크롤을 분리한다.
- [x] questStarted/questCompleted/branchChoice를 한 장면 순서로 연결한다. 시작 자동화는 유지하고 '수락'처럼 오해되는 버튼을 쓰지 않는다. 완료 보상은 QuestSystem에서만 지급한다.
- [x] 기존 showBranchChoice의 플래그/영입/branchChosen 효과를 한 실행 함수로 옮겨 화면 재열람이 효과를 실행하지 않도록 한다. 기능상 강제 분기의 닫기 정책을 보존한다.
- [x] 독백·무전·NPC 대화는 화자/인물 유무로 지원한다. NPC가 없는 퀘스트에 가짜 NPC를 생성하지 않는다.
- [x] 저장할 미결 분기에는 questId와 선택 가능 ID만 보관하고 콜백 함수를 직렬화하지 않는다. 로드 시 데이터로 복원한다. 완료/이미 선택된 분기는 다시 실행하지 않는다.
- [x] 의사 시작·보고, 군인 분기, NPC 거래·치료를 브라우저에서 마우스/터치로 확인하고 1920×1080 및 축소 화면 스크린샷을 저장한다.

## 작업 2. NPC 치료 실행 통합과 의료 사례

신규: `js/systems/PatientTreatmentSystem.js`, `js/data/treatmentProfiles.js`, `tests/unit/PatientTreatmentSystem.test.js`.
수정: `js/board/DragDrop.js`, `js/board/TouchDrag.js`, `js/ui/NPCDialogueModal.js`, `js/ui/BodyStatusModal.js`, `js/systems/PatientIntakeSystem.js`, `js/data/patients/{adults,children,elders}.js`, `js/data/mainQuests/doctor/{shared,branch_a,branch_b}.js`.

제안 인터페이스:

```js
PatientTreatmentSystem.inspect(npcId); // 단계, 가능한 처치, 부족한 재료/설비
PatientTreatmentSystem.treat(npcId, actionId); // {ok, reason?, previousStage?, stage?}
```

- [x] 기존 woundHealItem 환자도 같은 서비스에서 동일한 효과를 받도록 어댑터를 먼저 만든다. drag/touch/modal의 기존 수량·신뢰 차이는 하나의 명시 규칙으로 확정한다.
- [x] 재료 부족이면 상태·시간·재료 모두 불변, 스택 분할 소비, 완치 이벤트 1회, UI 재진입으로 치료가 실행되지 않는 테스트 작성.
- [x] 초반 첫 환자는 현재 시작 붕대와 medical_station으로 진행 가능하게 유지한다. 세 가지 중간 사례(탈수·복합 외상·감염 위험)에만 추가 치료 단계를 적용한다.
- [x] 진단→안정화→처치→회복 상태를 profile로 정의한다. 경상은 불필요한 단계 생략. 안정화된 장기 환자를 기존 48TP 퇴원 타이머로 퇴장시키지 않도록 분기한다.
- [x] `npcHealed`의 의미가 동료 HP 회복과 완치에 함께 쓰이는 점을 정리한다. 새 서비스는 완치 전이만 `npcWoundHealed`/환자 기여 처리를 유발한다. 기존 구독자를 전수 확인한다.
- [x] 마취제·멸균 키트·수술용 마취제에 실제 사례별 소비/도구 역할을 부여한다. 새 기능이 없는 상위 물품을 수량만 늘려 추가하지 않는다.
- [x] `purify_medicine` 해금/요구 스킬 차이, 초반 작업대 의존, `sc_field_surgery_kit` 대체 경로를 조정한다. 의료 시설 onTick과 플레이어 DiseaseSystem 치료는 별도 회귀 검증한다.
- [x] 공동 연구/군 의료/단독 백신 경로 각각에 특정 제작물·사용·상태 목표를 연결한다. 의료 4개 제작만으로 연구 완료 처리하지 않는다.

의존성 완료: 위 마지막 연구 설치·가동 및 유한 환자의 기존 임상 경험 인정은 작업4 공통 프로젝트에서 완료했다. 구 연구 해금 접근권 이관 보완 후 작업4 재검수 PASS. 치료 실행 범위는 작업2 재검수 PASS.

## 작업 3. 탐색 확정 보상과 공급 기반

수정: `js/systems/ExploreSystem.js`의 `_advanceExploration`, `_generateLandmarkLoot`, `_generateSubLocationLoot`; `js/core/GameState.js`; `js/data/districts.js`, `js/data/landmarks.js`, `js/data/validate.js`, `tools/editor/editor.js`.
신규: `tests/unit/ExplorationMilestoneClaims.test.js`, `tests/unit/ProgressionSupplyCoverage.test.js`.

- [x] 임계값 25→30, 55→65, 95→100, 복수 임계값 통과, 100% 재탐색, 만차 pendingLoot, 저장 후 재개 테스트 작성.
- [x] 새 보상은 qty 고정값으로 전환한다. 구/보상 ID/데이터 버전의 청구 이력을 저장한다. 기존 세이브는 이미 통과한 구간을 지급 완료로 이전하고 예전 보상 재지급 금지.
- [x] 새 세부장소 최초 조사만 탐사도 기여를 허용한다. 장소별 조사 이력으로 중복을 막고 기존 일반 탐색 경로와 같은 함수를 사용한다. 전투 도중 미완료된 조사는 기여하지 않는다.
- [x] 로비 드랍에 유한 회수처/재생 채집처/거래 보급처 구분을 정의한다. 기존 세부장소 재고 정책을 무조건 로비에 덮어씌우지 않는다.
- [x] 기판: 용산·구로 회수 경로. 소금: 셰프 초기 공급과 시장 반복 경로. 필터: 회수 또는 제작 대안. 흙·종자: 한 번의 불운으로 막히지 않는 대안. 이 네 공급 축을 먼저 구현한다.
- [x] 100% 공급처 발견은 별도 discovery 정의와 해금 이벤트로 표현한다. discovery와 물품 지급은 같은 보상 청구 트랜잭션에서 한 번 처리한다.
- [x] 에디터 필드 도움말과 validate 규칙에 qty, 보상 ID, discovery 참조, 청구 버전을 추가한다. 참조 누락을 조용히 건너뛰지 않고 검증 오류로 보고한다.

## 작업 4. 5직업의 실제 행동 목표와 후반 분기

수정: `js/data/mainQuests/{soldier,firefighter,chef,engineer,homeless}/{shared,branch_a,branch_b,hidden}.js`; `js/data/blueprints.js`, `js/data/blueprints_advanced.js`, `js/data/hiddenRecipes.js`; 필요한 `items_*`, `stackConfig`, `locales`, `CardFactory`.
신규: `js/data/careerProjects.js`, `js/systems/CareerProjectSystem.js`, `tests/unit/CareerProjectSystem.test.js`, `tests/unit/CareerQuestProgression.test.js`.

제안 인터페이스와 상태: `inspect(projectId)`, `contribute(projectId, actionId)`, `activate(projectId)`. 상태는 정의가 아닌 GameState에 `{projectId, stageId, installedInputs, active}`로 저장한다. 필수 항목 검사 후 실제 소비/설치하고, 완료 이벤트 `{projectId, stageId, districtId}`를 QuestSystem이 판정한다. 새 bool 플래그를 퀘스트마다 쌓지 않는다.

- [x] 프로젝트 단계·장소·필요 품목·완료 효과를 careerProjects 데이터로 정의한다. 효과는 기존 시스템의 공식 API로 적용하고 UI에서 stats/flags를 직접 변경하지 않는다.
- [x] 군인: 무전기 복원→전진 통신/보급→구조망 또는 KBS 송출→기존 결말. 잘못된 장소/미장착 전원은 가동 불가 테스트.
- [x] 소방관: 구호소→접근 장비/구조→방수·출입구·급수→가족/대형 대피소→인계. 다른 지역 structure 제작은 목표 불충족 테스트.
- [x] 셰프: 첫 식사 제공→손질/저장/기초 조리 재료→두 급식소/재배/전문 주방→기존 결말. 조리만 하고 제공하지 않은 상태는 배식 불충족 테스트.
- [x] 기계공: 작업대→기판·코일·모터→동력·정밀 작업→차량/공장/도시/헬기. 부품 보유와 장착·가동을 구분하고 동일 모듈을 두 프로젝트에 중복 설치하지 못하게 테스트.
- [x] 최형식: 회수·재생→교환→운반·저장→타워/치료소/중개망. 방문만으로 네트워크 완료 불가, 거래 재고·수요·비용 검증.
- [x] 기존 survive_days/dayTrigger/deadlineDays를 새 공정 소요와 함께 검토한다. 관찰 기간을 남기는 경우 실제 활동과 연결하고 단순 날짜 대기는 제거/축소한다.
- [x] 각 직업에 필수 신규 아이템은 독립 용도와 두 소비처를 검토한다. 새 ID는 데이터·이미지·스택·에디터·i18n 검증을 함께 통과한다.
- [x] 기존 캐릭터 협력 분기를 재사용한다. 전문 분야 외 작업의 회수/거래 대안을 보장하고 타 직업 엔딩을 새 전문 잠금으로 막지 않는다.

## 작업 5. 25구 드랍·보상 적용과 수량 조정

수정: `js/data/districts.js`, `js/data/landmarks.js`, `js/data/gameBalance.js`; 필요 시 NPC 거래·퀘스트 보상 데이터.
검증 자료: 지역별 보상안 75행 대응, 전수 데이터 재생성.

- [x] 의료·생활 시작 동선(동작·은평·중구와 인접 공급처)부터 별첨 표의 원료 묶음 적용. 기존 시작 보상/자동 첫 방문 보상을 중복 계산하지 않는다.
- [x] 전자·금속 축(용산·구로·성동·금천·영등포·강서)에서 기판 공급을 확인한 뒤 모듈·코어·로터 완제품을 이동한다.
- [x] 나머지 구에 농업·섬유·물류·전원 특화를 적용한다. 별첨의 모든 qty는 초기 조정값이며 소비처 최소 수량과 전체 회수량으로 확정한다.
- [x] 순환 검사는 청사진 외에도 secretCombinations·interactions·분해·상인·보스·퀘스트 보상을 포함한다. 완제품 제작보다 쉬운 우회는 의도한 구조품만 허용한다.
- [x] 지역별 다음 보상의 용도와 공급처 단서를 지도/탐색 상세에 표시한다. 필요한 재료를 어느 구에서 얻는지 게임 안에서 찾을 수 있게 한다.
- [x] 구별 재생/로비 반복/세부장소 고갈이 다른 것을 UI에 표시하고, 100% 이후에는 이미 완료된 탐색 보상을 다시 기대하게 하지 않는다.

## 작업 6. 통합 검증과 세이브 이전

- [x] `node js/data/validate.js`, `node tools/check-effect-wiring.mjs`, `node tools/editor/check-help-coverage.mjs` 실행. 기존 경고와 신규 회귀를 구분한다.
- [x] 대상 단위 테스트와 전체 `npm test` 실행. 실패하면 관련 기능을 수정하고 필요한 범위만 재실행한다.
- [x] UI 변경 후 `npm run build:web` 및 대화 Playwright 시나리오 실행. 시작/진행/보고/분기/거래/치료/장면 겹침/이미지 실패를 확인한다.
- [x] 저장 전후 환자 단계·프로젝트 투입·미결 분기·탐사도·청구 이력 동일성 확인. 구버전 100% 세이브는 고급 보상 재지급 없이 유지한다.
- [x] 6직업 × 봄/겨울 × 일반/불리한 난수의 플레이를 비교한다. 플레이 시간 대신 이동·탐색·제작·유지비 TP, 필요한 지역 수, 원료 병목, 완료된 의미 있는 공정 수를 기록한다.
- [ ] 첫 프로젝트를 시작하는 데 고급 가공이나 100% 탐색이 필요하지 않음을 확인한다. 중반 프로젝트에 서로 다른 생산/수급 방식 두 개 이상이 연결되는지 확인한다.
- [ ] 핵심 아이템을 소모/분실했을 때 대체 경로를 확인한다. 100% 완료 지역을 재방문할 구체적인 생산·거래 이유가 있는지 확인한다.
- [x] 결과를 `docs/analysis/2026-09-17-progression-playtest-results.md`에 기록한다(구현 검수 때 생성). 테스트를 하지 않은 단계는 완료로 표시하지 않는다.

검증 범위(2026-09-20): 기능·저장·브라우저·빌드 검증과 초반 경제24/준비 중반24구간 검사는 완료했다. 전체 테스트에는 변경 전부터 존재한 CompanionSidePanel 1건이 남아 있다. 퀘스트 접근·전투·준비 재료를 통제한 시험을 연속 캠페인24조건 완주로 표시하지 않는다. 초반24표본은 최대탐색도30% 이내 완료했고, 셰프 원료 조리4표본과 작업대 분해 후 재제작2표본도 확인했다. 전 직업 중반 자연 수급·모든 핵심품목의 무보상 분실 복구·장기 생존 검증은 위 미완료 항목으로 유지한다. 상세: `docs/analysis/2026-09-20-progression-verification-summary.md`.

## 후속 계획. 직업별 대화·선택 확장 (2026-09-20 추가)

사용자 추가 요청에 따라 `docs/analysis/2026-09-20-dialogue-interaction-plan.md`에 현재 정의 수/실제 표시 경로와 직업별 초·중·후반 확장안을 작성했다. 집계 스크립트는 `tools/audit-dialogue-content.mjs`다. 기존 작업4~6을 마무리한 뒤 연결한다.

- [x] 현재 퀘스트·NPC·딜레마·비밀 이벤트·기억·반응 대사를 구분하여 정적 집계하고 표시 경로 확인.
- [x] 6직업별 선택 방식과 대사 작성 규격, 12개 시범→60개 주제 확장, 실제 행동·저장·UI 검증 계획 작성.
- [ ] 기존 제작/탐색 이벤트와 동료 서사 발동 계약 복구.
- [ ] 공통 대화 노드/화자/선택 이력과 기존 도메인 행동 연결.
- [ ] 직업별 핵심1개+생활1개, 총12개 시범 구현·플레이 검증.
- [ ] 시범 결과에 따라36개 핵심+24개 생활 주제 전체 매핑/집필/검증.

## 이번 계획 작성 검증

실행: 감사 생성기 정상; 데이터 검증 Errors 0 / Warnings 183; 관련 7파일 97테스트 통과. 백신 목표에 붕대 제작을 전달하면 progress 1이 되는 별도 재현 성공. 게임 코드·드랍표·UI는 미수정. 계획상의 신규 기능에 대한 성공을 뜻하지 않는다.



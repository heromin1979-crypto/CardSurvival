import fs from 'node:fs';
const dir='docs/analysis/progression-execution/';
const early=JSON.parse(fs.readFileSync(dir+'task-6-economic-traces.json')).results;
const starts=JSON.parse(fs.readFileSync(dir+'task-6-start-traces.json')).results;
const middle=JSON.parse(fs.readFileSync(dir+'task-6-middle-traces.json')).rows;
const n=x=>Math.round(x*10)/10;
const rows=early.map(r=>`| ${r.character} | ${r.season.startsWith('winter')?'겨울 날짜 fixture':'봄'} | ${r.rng.startsWith('first')?'첫3탐색 불발':'일반 seed'} | ${r.tp.travel??0} | ${(r.tp.explore??0)+(r.tp.survey??0)} | ${(r.tp.craft??0)+(r.tp.dismantle??0)} | ${r.tp.rest??0} | ${(r.tp.project??0)+(r.tp.treatment??0)} | ${r.end.tp} | ${r.visited.length} | ${n(r.end.hydration)} / ${n(r.end.fatigue)} | ${r.firstComplete?'완료':'미완료'} |`).join('\n');
const midRows=middle.map(r=>`| ${r.character} | ${r.season} | ${r.rng} | ${r.tp} | ${r.saveChecks} | ${r.complete?'완료':'미완료'} |`).join('\n');
const text=`# 작업6 경제·진행 검증 보고

2026-09-20. 초반 수급 phase 시험, 중반 준비 fixture, 정규 시작 탐색을 구분한다. 이 구간 검증은 전투를 포함한 전체 캠페인 밸런스 검증과 다르다. 제품 변경은 고급 제작 해금 누락 1건이며 커밋·푸시는 하지 않았다.

## 검증 수준과 결론

1. **초반 경제 phase 24조건: 24개 목표 실행 성공.** 실제 CharCreate._startGame의 시작 물품·바닥·숙련·HP/수분/피로로 출발했다. 재료를 주입하지 않았다. 다만 5직업의 목표 퀘스트 접근만 직접 열고 선행 퀘스트·일자 대기를 생략했다. 생략한 선행 보상을 직접 추가하지 않았으며, 시작 직후 실제 퀘스트 이벤트로 받은 보상은 유지했다. 의사는 실제 응급실 오프닝 그대로다. 따라서 신규 게임 전체 진행/기한/전투 밸런스 통과가 아니다.
2. **중반 24조건: 준비 fixture의 제작·공급·투입·가동·저장 동일성 성공.** 도구·원료·숙련·선행 공정 상태를 명시적으로 준비했다. 초기 경제의 연속 세이브가 아니다. 두 seed 표본은 최악 난수 증거가 아니다.
3. **정규 초기 시도24건:** 첫 목표 완료 ${starts.filter(r=>r.firstComplete).length}건. 나머지는 조우, 밤, 자원 정책의 한계에서 멈췄다. 이 예비 자료는 진짜 난수 생존 완주를 증명하지 않는다. 특히 constant0.99는 최초 진단용 왜곡 표본이며 최종 불리 조건의 근거로 사용하지 않는다.

재현: node tools/playtest-progression-starts.mjs --economic, node tools/playtest-progression-middle.mjs. 원시 자료는 [초반 전 행동·물품·숙련·비용](task-6-economic-traces.json), [중반 fixture 입력과 실행](task-6-middle-traces.json), [정규 시작 예비 기록](task-6-start-traces.json). 각 JSON은 소비 전후 TP/스탯 또는 행동별 비용을 보존한다.

## 초반 시험의 정확한 경계

겨울은 day271로 옮긴 날짜 fixture다. 봄은 day1의 실제 시작 계절이다. 겨울의 270일치 생활비를 생략했으므로 장기 생존 비용은 아니다. 초반 phase에서는 district.encounterChance와 세부장소 dangerMod를 0으로, 보스 검사를 false로 둔다. TP·수분·영양·피로·질병·사망은 실제 StatSystem이다. 일상 날씨는 CharCreate의 맑음 그대로이며 폭설 난수까지 검증하지 않았다. UI DOM만 null 조회로 stub한다. SkillSystem, QuestSystem, NightSystem, EncumbranceSystem, EcologySystem을 초기화했고 실제 TickEngine을 사용한다. 전체 main.js의 모든 이벤트 시스템을 초기화한 캠페인과는 다르다.

일반 난수는 LCG seed20260920. 불리는 같은 seed에 첫3회 거리 탐색의 수확·탐사도를 발생시키지 않는 외생 불발 조건을 적용한 뒤 실제 탐색 생성기로 복귀한다. 확률적 최악/분위수 검증은 아니다. 탐색이 필요 없는 직업에는 두 조건의 차이가 없다. 세부장소 조사 자체에는 불발을 강제하지 않는다.

목재가 없는 용산만 무한 탐색하던 초기 정책을 폐기했다. 기계공은 은평 목재·종로 못 수급과 실제 제작 실패 재시도를, 소방관은 목재·천 지역과 가까운 식수 세부장소를 찾아 이동하도록 했다. 최초 HUD document 오류로 사망 검사 직전 TP 핸들러가 중단되던 하네스 결과도 폐기하고 DOM stub 후 재실행했다. 최종 로그에는 EventBus 오류가 없다.

기계공 겨울 불리 표본의 초기 정책은 은평 한 곳을 계속 탐색해 100%·81TP에 이르렀고, 시작 물병만으로는 탈수해 시작 오염수를 긴급 음용해야 했다. [수정 전 정책 trace](task-6-economic-pre-salvage-policy.json)에 보존했다. 100% 보상은 herb_seed2·soil_bag3이며 작업대 입력 wood5/scrap_metal3/rope1/nail5와 겹치지 않는다. 공급처도 이용하지 않아 100% 보상 자체에 의존한 것은 아니지만, 해당 경로가 첫 작업대 전에100%를 채운 사실은 남는다.

정책을 실제 대안에 맞춰 보완했다. 채집한 tree_log/withered_tree/broken_chair가 있으면 실제 DismantleSystem으로 목재를 회수하고, 은평30%의 wood3 확정 묶음 이후에도 부족하면 강북으로 옮겨 wood를 수급한다. 겨울 일반은 실제 잔해 회수로45→29TP, 겨울 불리는 은평30%·강북15%만으로81→51TP(이동21/탐색12/제작8/수면8/가동2)가 됐다. 불리 표본의 최종 수분69.2·피로17.6, 감염0이며 음용 없이 완료했다. **최종24개 첫 공정 표본에서 어느 구도30%를 넘지 않았다.** 이는 최초 공정에100%가 필수가 아님을 보인 실제 대체 경로이며, 모든 생존 정책에서 같은 비용을 보장하는 수치는 아니다. 제품 드랍 수량·확률은 바꾸지 않았다.

## 대상과 생산 경로

| 직업 | 첫 목표 | 중반 목표 | 관찰 경로·게이트 |
|---|---|---|---|
| 의사 | npc_wounded_soldier | patient_lee_junho_16 / dehydration | 시작 붕대 치료→완치. 중반 쌀·정수·소금→죽 조리→진단/수분/영양/회복, campfire·medical_station 필요 |
| 군인 | soldier_radio | soldier_relay | 시작 전원/휴대품+용산 전자부품 실제 탐색. 중반 용산 유한 circuit_board 공급→종로 이동→고철·철사 유료 copper_coil 회수→설치 |
| 소방관 | fire_relief | fire_access | 은평 목재·성북 천·세부장소 물 확보→용산. 중반 rope+wood로 사다리 제작, 별도 보유 crowbar 필요(중반fixture 도구로 제공) |
| 노숙인 | homeless_reclaim | homeless_storage | 실제 시작 잔해 분해·고철/천 투입. 중반 wood+nail→storage_box 제작, 별도 rope·wood 운영물자 투입 |
| 요리사 | chef_first_meal | chef_pantry | 최초2TP는 실제 시작 chef_meal_kit 또는 hearty_stew 제공이다. 원료부터 조리한 결과로 계산하지 않는다. 중반 상자 제작+별도 salt·kitchen_knife 준비 |
| 기계공 | engineer_workbench | engineer_power | 은평 목재·종로 못·시작 고철/로프→workbench 2단계 제작. 중반 copper_wire→coil3개→motor, 별도 circuit_board 유한 공급+고철4→fuel_can 교환→발전→정비 |

중반의 다른 생산/수급 방식 두 가지는 군인의 유한 공급/전문 회수, 기계공의 직접 가공/연료 교환으로 **실제 호출**했다. 의사는 조리/치료 두 도메인을 연결했다. 소방·노숙·요리는 제작 후 준비한 다른 물자를 투입하는 범위까지만 검증했고, 해당 중반 물자의 자연 획득 동선 전체는 미검증이다. doctor_research는 후기여서 첫 목표로 쓰지 않았다. 기계 모터는 crafting8와 field_forge, 코일은 crafting5와 workbench가 필요하다. 중반 fixture는 이를 이미 갖춘 시점으로 한정했으며 초반 숙련으로 가능하다고 주장하지 않는다.

## 실제 TP와 생활비

탐색 열에는 세부장소 조사 TP를 포함한다. 제작 열에는 분해를 포함한다. 소비는 실제API에서0TP인 경우0으로 기록한다. 수분/피로는 완료시 현재값이며 휴식·음용 전후 상세는 JSON이다. 방문 구 수는 시작 구를 포함한다. 총TP는 퀘스트 일자 대기를 포함하지 않는다.

| 직업 | 계절 | 난수 조건 | 이동 | 탐색·조사 | 제작·분해 | 휴식 | 가동·치료 | 총TP | 방문구 | 최종 수분 / 피로 | 결과 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
${rows}

초반 선행 조건을 모두 통과했다는 뜻은 아니다. 특히 원래 Day10 chef_first_meal을 Day1에 접근 허용한 phase 결과이므로 2TP를 실제 새게임 완주비용으로 인용하면 안 된다. 첫 목표 재료에는 100% 탐색이 필요하다는 공통 게이트가 없지만, 이 정책이 일부 지역을 얼마나 탐색했는지는 JSON exploration에 남는다.

## 중반 실행과 저장

각 중반 fixture의 모든 주입 품목은 JSON fixtureItems, 숙련은 fixtureSkills에 남는다. 고급 완성품 목표를 직접 넣지 않고 실제 목표 청사진을 제작했다. 기존 crowbar/kitchen_knife, field_forge/workbench/medical_station/campfire 등 도구는 해당 중반에 확보한 것으로 준비했다. 이를 초반 경제나 자연 획득 증거로 합산하지 않는다. 준비 중간재 copper_wire, 정수, 소금 등의 원료 이전 공정도 이 시험 범위 밖이다.

| 직업 | 날짜 fixture | 난수 표본 | 실제 총TP | 저장·복원 동일성 횟수 | 목표 실행 |
|---|---|---|---:|---:|---|
${midRows}

각 투입/환자 단계 이후 serialize→deserialize로 careerProjects·npcs.states·explorationSupply 동일성을 검사했다. 기계는 발전 전력3회→전동정비 후2회도 저장했다. 미결분기·구100%청구이관·청구보존의 전체 통합은 기존 SupplyAutoSave/RegionalProgression/DialogueScene 계열 회귀와 부모가 실행한 E2E 결과를 함께 봐야 한다. 이 스크립트만으로 실제 localStorage 자동저장 전체를 보증하지 않는다.

## 발견한 제품 결함과 수정

HiddenElementSystem._checkRecipeUnlocks가 기본 BLUEPRINTS와 HIDDEN_RECIPES만 검사해서 blueprints_advanced의 wind_copper_coil/build_electric_motor를 숙련 도달 후에도 열지 않았다. 실제 중반 하네스의 locked:wind_copper_coil로 재현했다. 새 회귀는 crafting4에서 잠금,5에서 코일 해금·모터 잠금,8에서 모터 해금·중복 없음으로 수정 전1실패/7통과를 확인했다.

수정은 이미 기본·고급·히든을 합친 GameData.blueprints 한 원본을 해금 검사에 사용하는 것이다. 중복 원본 목록이나 해금 예외를 추가하지 않았다. [수정 전 실패](task-6-unlock-red.txt), [집중 회귀](task-6-unlock-tests.txt), [작업 직전 snapshot 대비 diff](task-6-unlock-diff.txt). 변경 제품 js/systems/HiddenElementSystem.js, 회귀 tests/unit/HiddenRecipeUnlock.test.js. 선행0~5 누적 diff와 구별한다.

## 남은 범위

- 6직업의 정규 신규게임→선행퀘스트→첫공정→중반 연속 생존 완주, 전투와 동행/날씨/기간을 포함한24조건 밸런스는 완료되지 않았다.
- 최초 급식 원료 조리와 작업대 분해 후 재제작은 아래 추가시험으로 보완했다. 모든 중반 자연 수급과 도구를 회수품 없이 완전히 잃은 경우 전체는 검증하지 않았다.
- 완료구 재방문은 34공급처·발전연료와 전력소비 회귀가 제공하는 기능 근거가 있다. 장기 순환경제의 생존 순수익은 미측정이다.
- 전체 npm test/build/E2E의 최종 판정은 부모 통합 보고를 따른다. 이 문서의 24/24는 한정된 phase 및 prepared fixture 성공 수이며 작업6 전체PASS가 아니다.

## 추가 실행 — 원료 급식과 핵심 도구 재제작

추가 제품 변경 없이 기존 하네스에 두 정책만 추가했다. 같은 phase의 전투 제외·목표 접근 허용·실제 시작물품/유지비 조건이며 재료를 주입하지 않았다.

**요리사 원료 급식 4조건 성공.** 시작 chef_meal_kit와 hearty_stew를 먼저 실제 StatSystem.consumeCard로 모두 먹어 프로젝트에 쓸 수 없게 했다. 중구→동대문→강북의 실제 이동·탐색으로 herb3와 wild_berry2를 모으고 시작 salt1을 써 cook_garden_salad를 실제 제작했다. 완성 샐러드를 휴대해 중구로 돌아와 serve/activate했다. 불이나 솥을 쓰지 않는 손질 조리 레시피이며 따뜻한 요리의 화기 수급까지 검증한 것은 아니다. 일반 봄41TP, 불리 봄75TP, 일반 겨울19TP, 불리 겨울32TP. 제작은 각1TP, 제공 가동2TP, 왕복 이동8TP이며 차이는 실제 탐색·수면이다. 시작 완성식2개를 제공한 앞선2TP 사례와 구분한다.

초기 정책은 만차 때 샐러드를 바닥에 두고 떠나 실패했다. 기존 Board.moveCard의 실제 교환으로 불필요한 휴대품과 샐러드를 바꿔 챙기도록 하네스만 보완했다. 제품 슬롯 수나 무게를 늘리지 않았다. [원료 급식 trace](task-6-raw-meal-traces.json), [로그](task-6-raw-meal-log.txt). 재현: node tools/playtest-progression-starts.mjs --economic --raw-meal.

**기계공 작업대 분해 후 재제작 2표본 성공.** 처음 만든 workbench를 투입하기 전에 실제 DismantleSystem.dismantle로1개 분해했다. 잔존 작업대0을 기록하고 실제 나온 회수품만 유지했다. 로프까지 돌려받지 못하므로 성북에서 로프를, 부족한 못은 양천에서 재수급했다. 초기 종로 못 재탐색 정책은 누적 방사선으로 실패하여 radiation0의 양천 대안으로 전환했다. 은평 목재·양천 못·성북 로프와 회수 고철로 실제2단계 제작을 다시 수행한 뒤 가동했다. 일반96TP(이동43/탐색9/제작16/분해2/수면24/가동2), 불리93TP(이동39/탐색10/제작16/분해2/수면24/가동2), 각9구 방문. 순수 삭제·완전 유실이 아니라 **분해 회수품을 보유한 재제작**이라는 조건을 유지한다. 첫 제작+재제작8TP씩이 포함된다.

[작업대 재제작 trace](task-6-tool-loss-traces.json), [로그](task-6-tool-loss-log.txt). 재현: node tools/playtest-progression-starts.mjs --economic --lose-workbench. 대조한 실제 대안 원본은 districts의 seongbuk.lootTable(rope), yangcheon.lootTable(nail/방사선0), items의 workbench.dismantle, blueprints의 workbench.stages다. 모든 핵심 도구가 무손실·무위험으로 복구된다는 일반화는 하지 않는다.
`;
fs.writeFileSync(dir+'task-6-report.md',text);
console.log('보고서 생성: 초반 '+early.filter(r=>r.firstComplete).length+'/24, 중반 '+middle.filter(r=>r.complete).length+'/24 (각 범위 한정)');

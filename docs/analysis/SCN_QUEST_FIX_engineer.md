# 정대한(engineer) 시나리오 퀘스트 수정 설계서

> 시나리오 기획 "한도연" · 2026-06-08
> 대상: `js/data/mainQuests/engineer/{shared,branch_a,branch_b}.js`
> 제약: 퀘스트 데이터(텍스트·objective·flag·대사)만 수정. 밸런스 수치·NPC trust 공식·메커닉 불변. 아이템/부품 id는 실제 존재하는 것만.

---

## 사전 코드 확인 결과 (수정안의 근거)

수정 전, 아래를 실제 파일로 확인했다.

1. **`collect_item` objective 판정** — `QuestSystem.js:844` `_checkAllProgress`, `872` `_updateCollectQuests`는 모두 `GameState.countOnBoard(definitionId)`(`GameState.js:549`)로 **보드 위 해당 id 카드 수량**을 센다. 제작 결과물도 보드에 카드로 배치되면 동일하게 카운트된다. 따라서 `collect_item`은 "줍든 만들든 보드에 N개 보유"를 의미한다.

2. **`craft_item` objective 판정** — `QuestSystem.js:605` `_onCraft`는 `craft_item`을 **`category`로만** 매칭한다. **`definitionId`를 보지 않는다.** matcher 함수(`186~209`)는 `definitionId`를 처리하나 이는 subObjective 전용 경로이며, 메인 objective 실시간 진행(`_onCraft`)에는 적용되지 않는다.
   → **결론: `craft_item` + `definitionId`는 현재 시스템에서 오작동한다.** `category`만 일치하면 아무 레시피나 1개로 진행된다. 헬기 부품 blueprint는 모두 `category:'material'`(`blueprints.js:3351~3525`)이므로, b3 부품을 `craft_item`(category:material)으로 바꾸면 **고철 합금 1개 제작만으로 로터·엔진·동체 퀘스트가 전부 완료될 수 있다.** 부품별·개수별 추적이 불가능해진다.
   → **따라서 b3 부품 objective는 `collect_item` 유지가 기능적으로 정확하다.** 수정 방향은 objective 변경이 아니라 desc/narrative 정렬이다.

3. **헬기 부품 존재 확인** — `blueprints.js`에 `craft_aviation_alloy / craft_rotor_blade / craft_piston_engine / craft_avionics_module / craft_tail_rotor_assembly / craft_fuselage_frame / refine_avgas` 7종 레시피 존재. 아이템 정의는 `items_misc.js:1391~1463`에 `aviation_alloy / rotor_blade / piston_engine / avionics_module / tail_rotor_assembly / fuselage_frame / avgas_drum` 전부 존재. 모두 제작 가능한 실재 부품이다.

4. **`npc_yeongcheol` 존재 확인** — `npcs.js:105`(아이템 카드 정의), `npcs.js:1020`(NPC 데이터, dialogues greet/hint/reject 보유). 박영철은 firefighter 직업 본인이자 영입 가능 NPC. B경로 b_11에서만 등장하고 이후 퀘스트 narrative에는 산발적.

5. **엔딩 플래그 연결 정상 확인** — `endings.js`의 `mq_engineer_escape`(a1_escape), `mq_engineer_base`(a3_base), `mq_engineer_rebuild`(b1_rebuild + 3 인프라 플래그), `mq_engineer_heli`(b3_heli_escape) 모두 퀘스트 reward의 `engineer_ending` 플래그와 정합. **수정 불필요.**

6. **dayTrigger 역전 확인** — `branch_a.js`: a_14 `dayTrigger:155` → a_15 `dayTrigger:95`. `branch_b.js`: b_14 `dayTrigger:155` → b_15 `dayTrigger:95`. 두 분기점 퀘스트 모두 선행보다 dayTrigger가 60일 빠르다. (트리거는 prerequisite 완료가 우선이라 게임이 막히진 않으나, 데이터 의미가 어긋난다.)

---

## 문제 1 — [중요] B1 엔딩이 캐릭터 goal과 정면 충돌

**[문제]** 캐릭터 goal은 "서울 외곽 **탈출** 루트 개척"(`characters.js:400`)인데, B경로 b1_rebuild 엔딩은 도시 잔류·재건으로 끝난다. 플레이어가 Q10에서 B를 고를 때, 자신의 선언된 목표(탈출)를 버린다는 동기 전환이 대사로 명시되지 않는다. "왜 탈출을 포기하는가"가 빈칸이다.

**[파일:퀘스트ID]** `js/data/mainQuests/engineer/branch_b.js` → `mq_eng_b_11` (B경로 진입 직후 첫 퀘스트)

**[현재]**
```js
narrative: {
  start: '박영철 소방관이 은평구에서 대피소를 짓고 있다. 엔지니어가 없어서 구조 설계가 안 된다고 했다.',
  complete: '은평구 도착. 박영철이 반겼다. "엔지니어가 왔군요. 이제 제대로 만들 수 있겠습니다." 현장 주변에 고철이 쌓여있었다.',
},
```

**[수정 후 전문]**
```js
narrative: {
  start: '설계도는 가방 안에 있다. 차를 만들어 서울을 빠져나가면 된다. 그런데 발이 떨어지지 않았다. 박영철 소방관이 은평구에서 대피소를 짓고 있다. 엔지니어가 없어 구조 설계가 막혔다고 했다. 떠나는 길과 남는 길. 둘 중 하나를 택하면 다른 하나는 버려야 한다.',
  complete: '은평구 도착. 박영철이 반겼다. "엔지니어가 왔군요. 이제 제대로 만들 수 있겠습니다." 현장 주변에 고철이 쌓여 있었다. 정대한은 설계도를 가방 깊숙이 넣었다. 탈출은 잠시 미룬다. 여기 사람들이 먼저다. 아버지라면 어느 쪽을 골랐을까 — 답은 알 수 없었다.',
},
```

**[이유]** goal을 재정의하면 `characters.js`까지 손대고 a1/a3/b3 동기까지 흔들린다. goal은 "탈출"로 두되, **B경로 진입 퀘스트가 그 목표를 의식적으로 보류하는 장면을 담당**한다. "둘 중 하나를 택하면 다른 하나는 버려야 한다"로 시나리오 톤(잃는 것 명시)을 지키고, b3(헬기 탈출)가 B경로 안에 살아 있으므로 "잠시 미룬다"는 표현이 b1·b3 양쪽과 모두 모순되지 않는다. goal 자체는 b3(헬기 탈출)·a1(차량 탈출)으로 여전히 달성 가능하므로 충돌은 b1에 한정되며, 이 한 장면으로 봉합된다.

---

## 문제 2 — [서사-objective 불일치] b3 헬기 체인 desc는 "제작", objective는 collect

**[문제]** b3 일부 퀘스트는 desc/narrative가 "제작하라"인데 objective는 `collect_item`이다. 사전 확인 2번 결과, **objective를 `craft_item`으로 바꾸면 오히려 오작동한다**(category:material 한 건으로 전부 완료). 현재의 `collect_item` + definitionId는 `countOnBoard`로 부품별 정확히 추적하므로 기능적으로 옳다. 문제는 desc 문구가 "제작"으로만 단정해, 플레이어가 부품을 주워 와도 완료되는 실제 동작과 어긋난다는 점이다.

**[파일:퀘스트ID]** `js/data/mainQuests/engineer/branch_b.js` → `mq_eng_b3_3`, `mq_eng_b3_5`, `mq_eng_b3_6` (desc가 "제작하라"인데 objective가 collect_item인 항목)
※ `mq_eng_b3_4`는 desc "제작하라" + objective collect_item(piston_engine 1)으로 동일 사안. 함께 처리.

**[수정 후 전문]**

`mq_eng_b3_3` (objective는 변경 없음, desc만):
```js
desc: '주회전익(rotor_blade) 4개를 확보하라. 작업대에서 직접 깎는다. 대칭 정밀도가 생명이다.',
```

`mq_eng_b3_4` (desc만):
```js
desc: '4기통 피스톤 엔진(piston_engine) 1기를 확보하라. 작업대에서 가솔린 연소식으로 조립한다.',
```

`mq_eng_b3_5` (desc만):
```js
desc: '꼬리 로터 조립체(tail_rotor_assembly)와 항공 전자 모듈(avionics_module)을 각 1개 확보하라. 작업대에서 조립한다.',
```

`mq_eng_b3_6` (desc만):
```js
desc: '조종석+엔진 베드+꼬리 빔 통합 프레임(fuselage_frame) 1개를 확보하라. 가장 큰 단일 부품. 작업대에서 용접·조립한다.',
```

**[이유]** "확보하라 — 작업대에서 직접 깎는다/조립한다"는 표현은 **제작이 정상 경로임을 안내하면서도, 시스템이 보유(countOnBoard) 기준으로 판정한다는 실제 동작과 모순되지 않는다.** objective를 건드리지 않으므로 부품별·개수별 추적(blueprints.js 레시피가 실제로 존재하는 7종)이 그대로 유지된다. narrative.start/complete는 이미 제작 과정을 묘사하므로 변경 불필요. (objective를 `craft_item`으로 바꾸는 안은 `_onCraft`가 definitionId를 무시하는 한 채택 불가 — 이는 시스템 기획 영역이며 본 설계서 제약 밖이다.)

---

## 문제 3 — goal "고철 8개" 누적량 점검

**[문제]** goal은 "scrap_metal 8개 수집"인데, shared 1~10 체인의 고철 흐름이 8을 한 시점에 보유하도록 보장되는지 불명확.

**[파일:퀘스트ID]** `js/data/mainQuests/engineer/shared.js` → `mq_eng_01`, `mq_eng_10` 및 reward 흐름

**[현재 — 고철 흐름 집계]**
| 퀘스트 | 고철 증감 | 비고 |
|--------|-----------|------|
| `mq_eng_01` | collect 3 (보유) | 사용 안 하면 보드 잔존 |
| `mq_eng_02` reward | +2 | 작업장 제작 보상 |
| `mq_eng_09` reward | +3 | 성수 공장 첫 방문 |
| `mq_eng_10` | collect 3 (보유) | 분기점 |
| **누적 가능 최대** | **11** | 제작 소비 없을 시 |

goal 수치(8)는 누적 가능 최대(11) 안에 들어오므로 **데이터상 달성 가능**하다. 다만 두 가지가 어긋난다.
(a) goal 문구는 "scrap_metal 8개·rope 3개"인데, 퀘스트 체인의 로프 수집은 `mq_eng_07`(rope 2)뿐 — **로프 3개 단일 시점 보유가 체인만으로 보장되지 않는다.**
(b) goal은 "수집해 이동 수단을 제작"이라 단정하나, B경로는 이동 수단(차량/헬기)을 안 만들 수도 있다(b1 재건).

**[수정 후 전문]** `js/data/characters.js:400` (퀘스트 데이터 정합화를 위한 goal 텍스트 제안 — 시스템 기획 승인 필요)
```js
goal: 'scrap_metal과 rope를 모아 탈출 수단을 설계한다. 서울 밖으로 나갈지, 남아서 도시를 고칠지는 정대한의 선택이다.',
```

**[이유]** 정확한 수치(8·3)를 goal에 박으면 분기마다 누적 시점이 달라 항상 어긋난다. 수치를 빼고 "모아 설계한다 → 나갈지 남을지는 선택"으로 바꾸면 (a) 로프 3개 시점 불일치, (b) B경로 비제작 충돌이 동시에 해소된다. **단, `characters.js` 수정은 본 설계서 제약(퀘스트 데이터만) 밖이므로 시스템 기획 검토 후 적용**한다. 퀘스트 측 대안으로는 `mq_eng_10`이 분기점이므로, 그 complete 대사에 "고철은 충분하다. 로프도 더 모아야 한다"는 식의 보유 현황 언급을 넣어 체인 내에서 goal 수치를 자연스럽게 회수하는 방법도 있다(아래 보강 대사 참조).

`mq_eng_10` narrative.complete 보강안 (선택 적용):
```js
complete: '고철을 확보했다. 공장 작업대에서 파이프렌치도 찾았다. 머릿속으로 재고를 셌다. 고철은 넉넉하다. 로프는 조금 더 필요하다. 성수 공장이 눈앞이다. 선택해야 한다. 아버지의 설계도로 탈출할 것인가, 박영철과 함께 이 도시를 고칠 것인가.',
```

---

## 문제 4 — 회색지대(잃는 것) 명시

**[문제]** Q10(A/B), a_15(a1/a3), b_15(b1/b3) 분기 선택지 desc가 얻는 것만 말하고 잃는 것을 말하지 않는다. 시나리오 톤("A를 얻으면 B를 잃는다") 미준수.

**[파일:퀘스트ID]** `shared.js` → `mq_eng_10.branchOptions` / `branch_a.js` → `mq_eng_a_15.branchOptions` / `branch_b.js` → `mq_eng_b_15.branchOptions`

**[수정 후 전문]**

`mq_eng_10.branchOptions`:
```js
branchOptions: [
  {
    label: '아버지 설계도로 탈출',
    desc: '탈출 차량을 완성해 서울을 빠져나간다. 아버지의 마지막 선물을 완성한다. 대신 이 도시에 남은 사람들은 돌아보지 않는다.',
    setsFlag: 'eng_branch_a',
  },
  {
    label: '박영철과 도시 재건',
    desc: '남아서 고친다. 소방관과 함께 인프라를 복구한다. 대신 서울을 나갈 기회는 당분간 닫힌다.',
    setsFlag: 'eng_branch_b',
    recruitNpc: 'npc_yeongcheol',
  },
],
```

`mq_eng_a_15.branchOptions`:
```js
branchOptions: [
  {
    label: '서울 완전 탈출',
    desc: '차를 몰고 서울을 빠져나간다. 아버지의 설계가 길 위에서 증명된다. 대신 여기서 쌓은 작업장과 인연은 두고 떠난다.',
    setsFlag: 'eng_end_a1',
  },
  {
    label: '탈출 포기, 거점 구축',
    desc: '차는 보급 차량이 된다. 기술로 도시에 기여한다. 대신 서울 밖 세상은 끝내 보지 못한다.',
    setsFlag: 'eng_end_a3',
  },
],
```

`mq_eng_b_15.branchOptions`:
```js
branchOptions: [
  {
    label: '도시 인프라 복구 완성',
    desc: '전기·수도·통신을 되살려 서울을 다시 살아있는 도시로 만든다. 대신 떠날 기회는 영영 포기한다.',
    setsFlag: 'eng_end_b1',
  },
  {
    label: '재건 포기, 헬기로 탈출',
    desc: '도시는 너무 크게 부서졌다. 아버지의 R22 설계도로 헬기를 만들어 하늘로 나간다. 대신 여기까지 살린 인프라와 사람들을 등진다.',
    setsFlag: 'eng_end_b3',
    warning: '9단계 제작 체인 + 7종 신규 부품 + 항공 가솔린 정제. 추가 100일 이상의 플레이가 필요합니다.',
  },
],
```

**[이유]** 각 선택지에 "대신 ~을 잃는다/포기한다"를 한 절씩 붙여 시나리오 톤을 맞춘다. 과장 형용사 없이 사실만 적시. `warning` 필드(b3)는 메커니즘 안내이므로 잃는 것 절과 분리해 유지.

---

## 문제 5 — a_15 / b_15 dayTrigger 역전

**[문제]** `mq_eng_a_15.dayTrigger:95`인데 선행 `mq_eng_a_14.dayTrigger:155`. `mq_eng_b_15.dayTrigger:95`인데 선행 `mq_eng_b_14.dayTrigger:155`. 분기점 트리거가 선행보다 60일 빠르다. 게임은 prerequisite 우선으로 막히지 않으나, narrative.start가 "180일. 차량이 거의 완성됐다"라고 말하는 것과 dayTrigger 95가 모순된다.

**[파일:퀘스트ID]** `branch_a.js` → `mq_eng_a_15.dayTrigger` / `branch_b.js` → `mq_eng_b_15.dayTrigger`

**[현재]**
```js
// mq_eng_a_15
dayTrigger: 95,
// mq_eng_b_15
dayTrigger: 95,
```

**[수정 후 전문]**
```js
// mq_eng_a_15 — 선행 a_14(155) 이후, 후속 a1_prep/a3_prep(205) 이전
dayTrigger: 180,
// mq_eng_b_15 — 선행 b_14(155) 이후, 후속 b1_*/b3_1(205) 이전
dayTrigger: 180,
```

**[이유]** narrative.start가 "180일"을 명시하므로 dayTrigger를 180으로 맞춘다. 선행(155) < 180 < 후속(205) 순서가 정합. survive_days objective(count:100)는 별개 조건이므로 영향 없다. 95는 survive_days 100과 혼동된 입력 실수로 보인다(목표 일수 100 vs 진입 트리거 일수).

---

## 문제 6 — 박영철 모집 후 상호작용 부재

**[문제]** B경로 Q10에서 `recruitNpc:'npc_yeongcheol'`로 박영철을 영입하지만, b_12~b_15·b1_*·b3_* narrative에 박영철의 등장·역할이 산발적이거나 빠져 있다. 영입한 동료가 서사에서 보이지 않는다.

**[파일:퀘스트ID]** `branch_b.js` → 박영철 등장이 빠지거나 약한 퀘스트: `mq_eng_b3_2`(합금 단조), `mq_eng_b3_4`(피스톤 엔진), `mq_eng_b3_8`(가솔린 정제), `mq_eng_a` 계열에는 박영철 없음(A경로는 미영입이므로 정상)

※ b_12~b_15, b1_power/water/comms, b3_3/5/6/7/9는 이미 박영철 대사 존재 — 변경 불필요. 누락분만 보강.

**[수정 후 전문]**

`mq_eng_b3_2.narrative.complete` (박영철 역할 추가):
```js
complete: '항공용 합금 잉곳 8개. 두드려 보면 은은한 고음. 밀도와 강도가 항공 규격에 가깝다. 박영철이 용광로 불을 지켜봤다. "대한씨, 이 불 끄지 말고 둬요. 내가 화재 감시는 자신 있으니까." 이제 이것으로 모든 부품을 깎는다.',
```

`mq_eng_b3_4.narrative.start` (박영철 역할 추가):
```js
start: '아버지의 설계는 라이커밍 O-320 방식 4기통 피스톤. 전기 모터로 바꿀까 고민했지만 중량 대비 출력이 안 맞는다. 원설계대로 간다. 실린더 블록 → 연료 분사 → 크랭크샤프트. 3단계 조립. 박영철이 무거운 블록을 받쳐줬다. "혼자선 못 들어요, 이건."',
```

`mq_eng_b3_8.narrative.complete` (박영철 역할 추가):
```js
complete: '100LL 항공 가솔린 드럼 2개 확보. 약 80리터. 납 첨가 고옥탄가. 박영철이 드럼을 냄새 맡더니 물러섰다. "이거 한 통이면 우리 대피소가 한 달은 버틸 텐데." 정대한은 답하지 못했다. 연료 트럭에서 빼낸 차량 연료가 항공용으로 되살아났다. 아버지의 레시피대로.',
```

**[이유]** 영입한 동료가 제작 체인 전반에 꾸준히 등장하도록 누락된 3개 퀘스트에 박영철의 행동·대사를 보강. b3_8의 박영철 대사("대피소가 한 달은 버틸 텐데")는 헬기 탈출이 도시를 등지는 선택임을 동료의 시선으로 환기해 문제 1·4의 톤(잃는 것)과 연결한다. 신규 NPC·flag 추가 없이 기존 `npc_yeongcheol` 등장 빈도만 보강.

---

## 문제 7 — char_engineer 및 4개 엔딩 플래그 연결 (정상)

**[확인 결과]** `endings.js` 점검 결과 모든 연결 정상.
- `mq_engineer_escape` ← `engineer_ending === 'a1_escape'` ← `mq_eng_end_a1.reward.flags`
- `mq_engineer_base` ← `engineer_ending === 'a3_base'` ← `mq_eng_end_a3.reward.flags`
- `mq_engineer_rebuild` ← `engineer_ending === 'b1_rebuild'` + power_station_cleared/water_plant_restored/comms_tower_active ← `mq_eng_end_b1` 및 b1_power/water/comms reward.flags
- `mq_engineer_heli` ← `engineer_ending === 'b3_heli_escape'` ← `mq_eng_end_b3.reward.flags`
- `char_engineer`(미클리어 카드)는 `mainQuestComplete_engineer` false + day≥150 + totalCrafted≥15 조건. 정상.

**수정 불필요.** 코멘트만 남긴다.

---

## 적용 체크리스트

- [ ] **문제 1** `branch_b.js` `mq_eng_b_11.narrative.start/complete` 교체 (탈출 보류 동기)
- [ ] **문제 2** `branch_b.js` `mq_eng_b3_3/b3_4/b3_5/b3_6.desc` 4건 교체 ("확보하라 — 작업대에서 직접 …"). objective 불변.
- [ ] **문제 3** `mq_eng_10.narrative.complete` 보유 현황 언급 보강 (선택). `characters.js:400` goal 텍스트는 시스템 기획 검토 후 적용.
- [ ] **문제 4** `mq_eng_10` / `mq_eng_a_15` / `mq_eng_b_15`의 `branchOptions[].desc` 6개 선택지에 "대신 ~" 절 추가
- [ ] **문제 5** `mq_eng_a_15.dayTrigger` 95→180, `mq_eng_b_15.dayTrigger` 95→180
- [ ] **문제 6** `branch_b.js` `mq_eng_b3_2.complete` / `mq_eng_b3_4.start` / `mq_eng_b3_8.complete` 박영철 대사 보강
- [ ] **문제 7** 수정 없음 (정상 확인)

## 검증 방법

1. **데이터 무결성** — 수정 후 `node js/data/validate.js` 실행, 0 error 확인.
2. **objective 미변경 확인** — `git diff js/data/mainQuests/engineer/` 에서 `objective:` 라인 변경분이 0인지 확인(문제 2·4·6은 텍스트만, 문제 5는 dayTrigger만). objective.type/definitionId/count가 diff에 나타나면 안 됨.
3. **참조 id 실재 확인** — 본 설계서가 인용한 부품 id(rotor_blade 등 7종)는 `items_misc.js:1391~1463` + `blueprints.js:3351~3525`에 존재함을 위에서 확인. NPC `npc_yeongcheol`은 `npcs.js:105,1020`에 존재. 신규 id를 추가하지 않으므로 추가 등록(stackConfig/CardFactory) 불필요.
4. **분기 흐름 dayTrigger 순서** — 수정 후 a/b 분기 각각 dayTrigger 오름차순(…155 → 180 → 205…)인지 육안 확인.
5. **엔딩 도달** — 문제 7은 변경 없으므로 회귀 없음. 변경한 reward.flags가 없으므로(문제 1~6 모두 flags 미변경) 엔딩 조건 회귀 테스트 불요.

# 시나리오 수정 설계서 — 윤재혁(chef)

> 시나리오 페르소나: 한도연. 분기는 "A를 얻으면 B를 잃는다" 형식. 절제된 문장.
> 대상: `js/data/mainQuests/chef/` 전체 + `js/data/endings.js` char_chef + `js/systems/EndingSystem.js`(1번 버그)
> 작성 기준: 실제 파일을 모두 읽고 확인. 코드 예시는 적용 가능한 전문.

캐릭터 목표(`characters.js` chef.goal):
> "남대문시장에서 식재료를 확보하고 생존자 급식소를 운영해, 서울 생존자들의 식량 자급 체계를 구축한다."

이 목표를 기준선으로 모든 분기를 정합한다.

---

## 1. [버그/최우선] char_chef 폴백 엔딩 도달 불가 — totalFoodCrafted 카운터 미집계

### [문제]
`endings.js`의 `char_chef` 엔딩 조건이 `gs.flags.totalFoodCrafted >= 20`을 요구하는데, 게임 어디에서도 이 카운터를 증가시키지 않는다. 따라서 폴백 엔딩이 영원히 발동하지 않는다.

### [파일:위치]
- 조건 정의: `js/data/endings.js:362-372` (`char_chef`)
- 집계 누락 위치: `js/systems/EndingSystem.js:39-50` (`craftComplete` 핸들러)
- 초기화 누락 1: `js/core/GameState.js:246-251` (flags 초기 정의)
- 초기화 누락 2: `js/core/GameState.js:869-879` (구버전 세이브 호환 보정)
- 초기화 누락 3: `js/screens/CharCreate.js:353-357` (새 게임 flags 초기화)

### [현재] 코드 흐름 확인 결과
`EndingSystem.js`의 `craftComplete` 핸들러는 제작 완료 시 `bp.category`를 보고 카운터를 나눠 집계한다. `'structure'` → `structuresBuilt`, `'medical'` → `totalMedicalCrafted`. 그러나 `'food'` 분기가 없다. 반면 `endings.js` 다른 직업 폴백(`char_eng`)은 `totalCrafted`(전체 제작)를 쓰므로 정상 집계된다. chef만 `totalFoodCrafted`라는 전용 카운터를 조건으로 쓰는데 그 카운터를 채우는 코드가 없다.

`category: 'food'` blueprint은 `GameData.blueprints`(= `blueprints.js` + `hiddenRecipes.js`)에 다수 존재함을 확인(예: `make_boiled_water`, `js/data/blueprints.js:692`). 따라서 핸들러에 food 분기만 추가하면 정상 집계된다.

### [수정 후 전문]

#### (1) `js/systems/EndingSystem.js:39-50` — craftComplete 핸들러

**Before**
```javascript
    // Track craft completions
    EventBus.on('craftComplete', ({ blueprintId }) => {
      const bp = GameData?.blueprints?.[blueprintId];
      if (!bp) return;
      GameState.flags.totalCrafted = (GameState.flags.totalCrafted ?? 0) + 1;
      if (bp.category === 'structure') {
        GameState.flags.structuresBuilt = (GameState.flags.structuresBuilt ?? 0) + 1;
      }
      if (bp.category === 'medical') {
        GameState.flags.totalMedicalCrafted = (GameState.flags.totalMedicalCrafted ?? 0) + 1;
      }
    });
```

**After**
```javascript
    // Track craft completions
    EventBus.on('craftComplete', ({ blueprintId }) => {
      const bp = GameData?.blueprints?.[blueprintId];
      if (!bp) return;
      GameState.flags.totalCrafted = (GameState.flags.totalCrafted ?? 0) + 1;
      if (bp.category === 'structure') {
        GameState.flags.structuresBuilt = (GameState.flags.structuresBuilt ?? 0) + 1;
      }
      if (bp.category === 'medical') {
        GameState.flags.totalMedicalCrafted = (GameState.flags.totalMedicalCrafted ?? 0) + 1;
      }
      if (bp.category === 'food') {
        GameState.flags.totalFoodCrafted = (GameState.flags.totalFoodCrafted ?? 0) + 1;
      }
    });
```

#### (2) `js/core/GameState.js:249-251` — flags 초기 정의

**Before**
```javascript
    totalCrafted:        0,    // 누적 제작 횟수
    totalMedicalCrafted: 0,    // 의료 카테고리 제작 횟수
    structuresBuilt:     0,    // 구조물 카테고리 제작 횟수
```

**After**
```javascript
    totalCrafted:        0,    // 누적 제작 횟수
    totalMedicalCrafted: 0,    // 의료 카테고리 제작 횟수
    totalFoodCrafted:    0,    // 음식 카테고리 제작 횟수
    structuresBuilt:     0,    // 구조물 카테고리 제작 횟수
```

#### (3) `js/core/GameState.js:873-875` — 구버전 세이브 호환 보정

**Before**
```javascript
    if (ef.totalCrafted        === undefined) ef.totalCrafted        = 0;
    if (ef.totalMedicalCrafted === undefined) ef.totalMedicalCrafted = 0;
    if (ef.structuresBuilt     === undefined) ef.structuresBuilt     = 0;
```

**After**
```javascript
    if (ef.totalCrafted        === undefined) ef.totalCrafted        = 0;
    if (ef.totalMedicalCrafted === undefined) ef.totalMedicalCrafted = 0;
    if (ef.totalFoodCrafted    === undefined) ef.totalFoodCrafted    = 0;
    if (ef.structuresBuilt     === undefined) ef.structuresBuilt     = 0;
```

#### (4) `js/screens/CharCreate.js:355-356` — 새 게임 flags 초기화

**Before**
```javascript
      totalKills: 0, totalItemsFound: 0, totalCrafted: 0,
      totalMedicalCrafted: 0, structuresBuilt: 0,
```

**After**
```javascript
      totalKills: 0, totalItemsFound: 0, totalCrafted: 0,
      totalMedicalCrafted: 0, totalFoodCrafted: 0, structuresBuilt: 0,
```

### [이유]
`char_chef`는 메인 퀘스트를 이탈한 플레이어(mq_chef_01 미완료, 150일 생존, 음식 20회 제작)에게 주는 "조용한 급식소 운영자" 폴백 엔딩이다. 다른 직업은 `totalCrafted`(전체)로 폴백을 받지만, chef는 직업 정체성에 맞춰 "음식 제작"만 세는 전용 카운터를 의도했다. 의도는 옳았으나 집계 코드가 빠져 사실상 죽은 조건이 됐다. food 분기 한 줄과 3곳의 기본값 초기화로 의도대로 복원된다. 기존 카운터(structure/medical) 집계 패턴을 그대로 따르므로 부작용이 없다.

---

## 2. B경로 목표 변질 — "식량 자급"이 "미식 복원"으로 치환됨

### [문제]
chef.goal은 "식량 자급 체계 구축"인데, B경로(`branch_b.js`)는 용산 전문 주방에서 풀코스 미식을 복원하는 것으로 끝난다(`mq_chef_end_b1`). 목표와 직접 연결되는 동기가 없어, B경로는 "왜 자급을 포기하고 미식으로 가는가"가 설명되지 않는다.

### [파일:위치/퀘스트ID]
- 분기 진입 선택지: `shared.js` `mq_chef_10.branchOptions[1]` (B경로 라벨/설명)
- B경로 첫 퀘스트: `branch_b.js` `mq_chef_b_11.narrative` (용산 탐색, 전환 동기 위치)

### [현재]
`mq_chef_10.branchOptions[1]`:
```javascript
      {
        label: '용산 동료 셰프 — 미식 복원',
        desc: '용산에서 소피텔 동료 박민호를 찾아 전문 주방을 세우고, 종말 이후의 미식을 되살린다.',
        setsFlag: 'chef_branch_b',
      },
```
`mq_chef_b_11.narrative.start`: "용산에 소피텔 동료 박민호가 있다는 소문을 들었다. 호텔 셰프 두 명이면 전문 주방을 만들 수 있다."

→ 둘 다 "무엇을 추구하는가"는 있으나 "급식소(자급)를 넘어 무엇을 포기하는가"의 전환 동기가 없다.

### [수정 후 전문]

#### (1) `shared.js` `mq_chef_10.branchOptions[1].desc` 보강

**Before**
```javascript
        desc: '용산에서 소피텔 동료 박민호를 찾아 전문 주방을 세우고, 종말 이후의 미식을 되살린다.',
```

**After**
```javascript
        desc: '배를 채우는 일은 남대문에 맡긴다. 용산에서 동료 박민호를 찾아, 음식이 다시 존엄이 될 수 있음을 증명한다. 자급의 규모를 포기하는 대신 한 끼의 격을 되찾는다.',
```

#### (2) `branch_b.js` `mq_chef_b_11.narrative.start` 전환 동기 보강

**Before**
```javascript
      start: '용산에 소피텔 동료 박민호가 있다는 소문을 들었다. 호텔 셰프 두 명이면 전문 주방을 만들 수 있다.',
```

**After**
```javascript
      start: '남대문 급식소는 이제 혼자가 아니어도 돌아간다. 배를 채우는 일은 거기 두고 왔다. 용산에 소피텔 동료 박민호가 있다는 소문을 들었다. 셰프 두 명이면 전문 주방을 세울 수 있다. 더 많은 입이 아니라, 한 사람의 한 끼를 다시 음식답게 만드는 일. 자급의 넓이를 포기하고 미식의 깊이를 택한다.',
```

### [이유]
B경로는 "양(자급 규모)"을 버리고 "질(한 끼의 존엄)"을 얻는 트레이드오프다. 진입 선택지와 첫 퀘스트 양쪽에 이 전환을 명시하면, goal(자급)에서 이탈하는 것이 변질이 아니라 의도된 선택임이 드러난다. 분기 라벨 텍스트는 UI에 노출되므로(`isBranchPoint`/`branchOptions`) 플레이어가 선택 시점에 잃는 것을 인지한다.

---

## 3. A1 자급 vs 보급망 모순 — "외부 마트 순회 의존"과 "자급"의 충돌

### [문제]
A1 엔딩(`mq_chef_end_a1`, 서울 급식 네트워크)은 반포·잠실·서초·논현 4개 외부 마트를 순회하며 재고를 긁어오는 "보급망"인데, desc와 narrative는 이를 "서울 식량 자급 체계"로 부른다. 외부 비축물 의존은 엄밀히 자급(직접 생산)이 아니다. A2(가락 농장)가 진짜 자급이고, A1은 유통/보급이다.

### [파일:위치/퀘스트ID]
- `branch_a.js` `mq_chef_end_a1.desc`
- `branch_a.js` `mq_chef_end_a1.narrative` (start / complete)
- `endings.js` `mq_chef_network` (엔딩 화면 텍스트, line 479-496)

### [현재]
`mq_chef_end_a1.desc`: "365일을 생존하라. 강남 대형마트 네트워크가 서울 식량 자급 체계가 된다."
`mq_chef_end_a1.narrative.start`: "...급식 네트워크가 한강 이남 전역으로 퍼지고 있다..."
`mq_chef_end_a1.narrative.complete`: "...4개 마트 + 2개 급식소 보급망..."

→ desc에서 "보급망"을 "자급 체계"로 호명하는 것이 모순.

### [수정 후 전문]

#### (1) `branch_a.js` `mq_chef_end_a1.desc`

**Before**
```javascript
    desc: '365일을 생존하라. 강남 대형마트 네트워크가 서울 식량 자급 체계가 된다.',
```

**After**
```javascript
    desc: '365일을 생존하라. 강남 대형마트 네트워크가 한강 이남의 식량 보급망이 된다.',
```

#### (2) `branch_a.js` `mq_chef_end_a1.narrative.complete`

**Before**
```javascript
      complete: 'D+365. 4개 마트 + 2개 급식소 보급망. 하루 급식 인원 87명. 누적 급식 12,400끼. 윤재혁은 조리대 앞에 섰다. "음식은 생존이 아니라 희망입니다." 소피텔 호텔 주방보다 훨씬 보람찬 주방이다.',
```

**After**
```javascript
      complete: 'D+365. 4개 마트 + 2개 급식소 보급망. 하루 급식 인원 87명. 누적 급식 12,400끼. 윤재혁은 조리대 앞에 섰다. "직접 기르지는 못했다. 흩어진 것을 모아 흐르게 했을 뿐이다. 그래도 오늘 87명이 먹는다." 자급은 아니지만, 굶주림은 멈췄다.',
```

#### (3) `endings.js` `mq_chef_network.narrative` (line 489-495)

**Before**
```javascript
    narrative: [
      '남대문에서 시작한 급식소가 강남·잠실·반포로 뻗어나갔다.',
      '매일 순회 보급 트럭이 4개 마트를 돈다. 하루 87명분.',
      ...
      '"한 사람의 주방이 도시의 식탁이 됐다."',
      '종말 이후 가장 큰 식량 네트워크. 셰프가 만들었다.',
    ],
```
(전체 배열은 line 489-495. 마지막 두 줄 외 중간 줄은 실제 파일 확인 후 유지)

**After** (마지막 줄만 교체)
```javascript
      '"한 사람의 주방이 도시의 식탁이 됐다."',
      '직접 기르지는 못했다. 흩어진 식량을 모아 흐르게 했다. 그것으로 충분했다.',
```

### [이유]
A1은 "유통/보급"이 정체성이고, A2는 "재배/자급"이 정체성이다. 두 갈래의 차이가 분명할수록 a_19 분기의 의미가 산다. A1 텍스트에서 "자급"이라는 단어를 "보급망"으로 바꾸고, 셰프 스스로 "직접 기르지는 못했다"고 인정하게 하면 모순이 사라지고 A2와의 대비가 선명해진다. goal(자급)을 완전히 달성하는 길은 A2뿐이라는 구조가 드러난다.

---

## 4. 회색지대 부재 — Q10·a_19 분기에 "잃는 것" 명시

### [문제]
분기 선택지가 "얻는 것"만 말하고 "잃는 것"을 말하지 않는다. 한도연 톤("A를 얻으면 B를 잃는다")이 분기 UI에 반영되지 않아, 선택이 무게를 갖지 못한다.

### [파일:위치/퀘스트ID]
- `shared.js` `mq_chef_10.branchOptions[0]` (A경로, line 152-156)
- `branch_a.js` `mq_chef_a_19.branchOptions[0]/[1]` (A1/A2, line 132-143)

### [현재]
Q10 A경로: desc = "강남 대형마트로 진출해 한강 이남 보급망을 개척한다. 이후 네트워크와 농장 연계로 다시 갈린다."
a_19 A1: desc = "한강 남쪽 대형마트들을 잇는 대규모 보급 네트워크를 완성한다."
a_19 A2: desc = "가락시장 옥상 농장을 재가동해 자급 식량 기반을 만든다."

→ 모두 이득만 서술.

### [수정 후 전문]

#### (1) `shared.js` `mq_chef_10.branchOptions[0].desc` (A경로)

**Before**
```javascript
        desc: '강남 대형마트로 진출해 한강 이남 보급망을 개척한다. 이후 네트워크와 농장 연계로 다시 갈린다.',
```

**After**
```javascript
        desc: '강남 대형마트로 진출해 한강 이남 보급망을 개척한다. 규모를 얻는 대신, 칼을 다시 들어야 한다 — 강을 건너고 약탈자와 마주친다. 이후 네트워크와 농장 연계로 다시 갈린다.',
```

#### (2) `branch_a.js` `mq_chef_a_19.branchOptions[0].desc` (A1 네트워크)

**Before**
```javascript
        desc: '한강 남쪽 대형마트들을 잇는 대규모 보급 네트워크를 완성한다.',
```

**After**
```javascript
        desc: '한강 남쪽 대형마트들을 잇는 대규모 보급 네트워크를 완성한다. 더 많은 사람을 먹이는 대신, 식량은 끝내 남의 창고에서 온다. 마트가 마르면 급식소도 마른다.',
```

#### (3) `branch_a.js` `mq_chef_a_19.branchOptions[1].desc` (A2 농장)

**Before**
```javascript
        desc: '가락시장 옥상 농장을 재가동해 자급 식량 기반을 만든다.',
```

**After**
```javascript
        desc: '가락시장 옥상 농장을 재가동해 자급 식량 기반을 만든다. 마침내 직접 기르는 대신, 한 곳에 묶인다 — 먹일 수 있는 입은 줄고, 수확을 기다리는 계절을 견뎌야 한다.',
```

### [이유]
"잃는 것"을 명시해야 선택이 도덕적·전략적 무게를 갖는다. A1은 "규모↔의존(남의 창고)", A2는 "자급↔규모 축소+계절 의존"의 트레이드오프다. 이 대비가 3번(자급 vs 보급)의 정정과 맞물려, A1/A2가 같은 목표의 두 해석이 아니라 서로 다른 대가를 치르는 길임을 분명히 한다.

---

## 5. 동료 사전 설정 부재 — 박민호·김지은 첫 등장 소개 보강

### [문제]
B경로와 side_06에서 부주방장 박민호, 주방 보조 김지은이 등장하지만 `characters.js`에 NPC 정의가 없다(chef 캐릭터 정의만 존재). 플레이어는 이들이 누구인지 모른 채 "재혁이형!"이라는 대사를 만난다.

### [파일:위치/퀘스트ID]
- 박민호 첫 등장: `branch_b.js` `mq_chef_b_11.narrative.complete` (용산에서 조우)
- 김지은 첫 등장: `shared.js` `mq_chef_side_06.narrative.start` (주방 팀 구성)

확인 결과: `characters.js`는 플레이어블 캐릭터만 정의하며 박민호/김지은은 NPC 데이터(`npcs.js`)에도 별도 등록이 없다. 따라서 서사 텍스트 안에서 최소 소개를 제공하는 것이 현실적 해법(NPC 시스템 신규 등록은 메커닉 변경이므로 제외).

### [현재]
`mq_chef_b_11.narrative.complete`: "용산에 도달했다. 전자상가 뒤편 건물에서 박민호를 찾았다. \"재혁이형! 살아있었어요.\" 고철도 챙겼다. 이제 둘이서 시작한다."
`mq_chef_side_06.narrative.start`: "팀이 있다면 혼자보다 10배 많은 사람을 먹일 수 있다. 부주방장 박민호와 주방 보조 김지은. 두 사람의 신뢰를 얻으려면 요리로 증명해야 한다."

→ side_06에는 직책이 한 줄 있으나, B경로 b_11(박민호 첫 등장)에는 소개가 없다. 김지은은 side_06가 첫 등장.

### [수정 후 전문]

#### (1) `branch_b.js` `mq_chef_b_11.narrative.complete` — 박민호 소개 보강

**Before**
```javascript
      complete: '용산에 도달했다. 전자상가 뒤편 건물에서 박민호를 찾았다. "재혁이형! 살아있었어요." 고철도 챙겼다. 이제 둘이서 시작한다.',
```

**After**
```javascript
      complete: '용산에 도달했다. 전자상가 뒤편 건물에서 박민호를 찾았다. 소피텔 시절 재혁 밑에서 일하던 부주방장 — 칼질은 거칠어도 화구 앞에서는 누구보다 침착했던 후배다. "재혁이형! 살아있었어요." 고철도 챙겼다. 이제 둘이서 시작한다.',
```

#### (2) `shared.js` `mq_chef_side_06.narrative.start` — 김지은 소개 보강

**Before**
```javascript
      start: '팀이 있다면 혼자보다 10배 많은 사람을 먹일 수 있다. 부주방장 박민호와 주방 보조 김지은. 두 사람의 신뢰를 얻으려면 요리로 증명해야 한다.',
```

**After**
```javascript
      start: '팀이 있다면 혼자보다 더 많은 사람을 먹일 수 있다. 소피텔 부주방장이었던 박민호, 그리고 호텔 조리학교 실습생이던 김지은 — 스무 살, 칼은 서툴지만 눈썰미가 좋다. 두 사람의 신뢰를 얻으려면 요리로 증명해야 한다.',
```

### [이유]
NPC 데이터를 신규 등록하는 것은 메커닉/데이터 변경 범위이므로, 첫 등장 narrative 안에 한 문장 소개(직책·관계·특징)를 넣는 것이 최소 침습 해법이다. 박민호는 "소피텔 부주방장·재혁의 후배", 김지은은 "조리학교 실습생·스무 살"로 한 번씩만 못 박으면, 이후 대사("형", "셰프님처럼!")의 관계가 자연스럽게 읽힌다. side_06 start의 과장 수치("10배")는 한도연 톤에 맞춰 "더 많은"으로 절제.

---

## 6. 서사-목표 정합 및 필드명·수치 점검

### [점검 결과]
실제 파일 확인 기준.

- **필드명 일관성**: 모든 퀘스트가 `id`, `objective.type`(`collect_item`/`collect_item_type`/`craft_item`/`visit_district`/`survive_days`/`track_infected`), `requiresFlag`, `setsFlag`, `branchOptions`, `firstEnterReward` 패턴을 일관되게 사용. 신규 필드 추가 없음 — 모든 수정은 기존 `desc`/`narrative` 문자열 교체 또는 EndingSystem 카운터 한 줄 추가에 한정.
- **분기 플래그 흐름**: Q10 `chef_branch_a`/`chef_branch_b` → A경로 a_19 `chef_end_a1`/`chef_end_a2` → 엔딩 flags `chef_ending: 'a1_network'/'a2_farm'/'b1_ascension'`. `endings.js`의 `mq_chef_network`(a1) / `mq_chef_farm`(a2) / `mq_chef_ascension`(b1) 조건과 정확히 매칭됨. **수정 불필요.**
- **수치 일관성**: `mq_chef_end_a1` complete "87명 / 12,400끼"와 `endings.js` `mq_chef_network` "하루 87명분" 일치. `mq_chef_end_a2` "62명", `mq_chef_end_b1` "42명 / 6,800회"도 엔딩 텍스트와 정합. **수정 불필요.**
- **목표 정합**: A2(가락 농장)만 goal의 "자급"을 직접 달성. A1은 보급(3번 정정으로 명확화), B는 미식(2번 전환 동기로 정당화). 세 엔딩이 goal에서 분기하는 구조가 1·2·3번 수정 후 일관됨.
- **잠재 이슈(범위 외, 기록만)**: `mq_chef_side_05.desc`는 "중구 가락시장 뒷골목"이라 적혀 있으나 가락시장은 송파구다. side_01·side_02에서 가락시장을 송파(`songpa`)로 명시한 것과 불일치. 시나리오 외 지명 오류이며 본 설계서 6개 문제 범위 밖이라 정정하지 않고 기록만 남긴다.

---

## 적용 체크리스트

### 시스템 코드 (1번 버그)
- [ ] `js/systems/EndingSystem.js:39-50` craftComplete 핸들러에 `food` 분기 추가
- [ ] `js/core/GameState.js:249-251` flags 초기 정의에 `totalFoodCrafted: 0` 추가
- [ ] `js/core/GameState.js:873-875` 세이브 호환 보정에 `totalFoodCrafted` undefined 가드 추가
- [ ] `js/screens/CharCreate.js:355-356` 새 게임 flags에 `totalFoodCrafted: 0` 추가

### 시나리오 데이터 (2~5번)
- [ ] 2번: `shared.js` mq_chef_10.branchOptions[1].desc 교체
- [ ] 2번: `branch_b.js` mq_chef_b_11.narrative.start 교체
- [ ] 3번: `branch_a.js` mq_chef_end_a1.desc 교체
- [ ] 3번: `branch_a.js` mq_chef_end_a1.narrative.complete 교체
- [ ] 3번: `endings.js` mq_chef_network.narrative 마지막 줄 교체
- [ ] 4번: `shared.js` mq_chef_10.branchOptions[0].desc 교체
- [ ] 4번: `branch_a.js` mq_chef_a_19.branchOptions[0].desc 교체
- [ ] 4번: `branch_a.js` mq_chef_a_19.branchOptions[1].desc 교체
- [ ] 5번: `branch_b.js` mq_chef_b_11.narrative.complete 교체
- [ ] 5번: `shared.js` mq_chef_side_06.narrative.start 교체

---

## 검증 방법

### 1번 버그 (코드)
1. **데이터 검증**: `node js/data/validate.js` — 퀘스트/엔딩 데이터 구조 무결성.
2. **카운터 동작(Red-Green)**:
   - Red: 수정 전 새 게임 → chef로 food 카테고리 제작 다회 → 콘솔에서 `GameState.flags.totalFoodCrafted` 확인 → `undefined`(미집계).
   - Green: 수정 후 동일 절차 → 제작 횟수만큼 증가하는지 확인.
3. **폴백 엔딩 도달**: 디버그로 `gs.time.day = 150`, mq_chef_01 미완료, `totalFoodCrafted >= 20` 상태 구성 → `tpAdvance` 1회 → `char_chef` 엔딩 발동 확인. (조건: `EndingSystem._checkVictoryEndings`)
4. **세이브 호환**: `totalFoodCrafted` 키 없는 구버전 세이브 로드 → `GameState.js:873` 보정으로 `0` 세팅되는지 확인.

### 2~5번 시나리오 데이터
1. `node js/data/validate.js` 통과(문자열 교체만이므로 구조 영향 없음).
2. 인게임 분기 UI에서 Q10·a_19 선택지 desc가 "잃는 것"을 포함해 노출되는지 육안 확인.
3. B경로 b_11, side_06 진입 시 박민호·김지은 소개 문장 노출 확인.
4. i18n: chef 퀘스트 텍스트가 별도 i18n 키로 분리되어 있는지 확인 필요. 분리되어 있다면 동일 키의 영문/한글 라벨도 함께 갱신(범위: `WORKER_PERSONA_I18N` 절차). 인라인 문자열이면 추가 작업 없음.

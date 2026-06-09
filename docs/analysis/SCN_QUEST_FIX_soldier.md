# 강민준(soldier) 시나리오 수정 설계서

> 시나리오 기획 / 페르소나: 한도연
> 대상: `js/data/mainQuests/soldier/{shared,branch_a,branch_b,index}.js`
> 원칙: 퀘스트 데이터(텍스트·objective·flag·대사)만 수정. NPC trust 공식·밸런스 수치·메커닉 구현·lootTable 변경 없음. 아이템 id는 실재하는 것만 사용.

---

## 사전 코드 재확인 결과 (근거)

작업 전 실제 파일을 읽고 확인한 사실. 모든 수정안은 아래 근거 위에 선다.

- **objective 처리** (`js/systems/QuestSystem.js`)
  - `collect_item`: `_checkAllProgress`(L844)·`_updateCollectQuests`(L871)가 `GameState.countOnBoard(definitionId)`(GameState.js L549)로 **보드 위 같은 id 카드 수량 합산**. 즉 해당 id 아이템을 보드에 그만큼 보유해야 완료.
  - `collect_item_type`: `tags.includes(itemType) || subtype === itemType` 합산(L848, L887).
  - `survive_days`·`visit_district`·`craft_item`(category) 모두 정상 트리거 확인.
- **dog_tag 아이템** (`js/data/items_misc.js:583`): 실재한다. `type:'consumable', subtype:'keepsake', tags:['consumable','keepsake','soldier']`, `weight:0.02`. `stackConfig.js:259`에서 **stackable=false, maxStack=1**.
  - **그러나 어떤 districts/landmarks lootTable에도 등록돼 있지 않다.** 획득 경로는 soldier `comrade_memorial` 능력의 시작 지급 1개(`characters.js:135 startingItems:['dog_tag']`)뿐.
  - 결론: `collect_item dog_tag count:4`로 바꾸면 **추가 획득 경로가 없어 영구 미완료(소프트락)**. `count:1`은 시작 보유분으로 즉시 완료되어 "수습 여정" 서사와 맞지 않는다.
- **knife** (`mq_soldier_01`이 `collect_item knife count:1`로 정상 동작 → knife는 게임 내 획득 경로 존재 확정). 따라서 `mq_soldier_b_11`의 `knife×2`는 **기능상 동작하지만 서사(인식표 수습)와 불일치**일 뿐 소프트락은 아니다.
- **dayTrigger 실태** (선행 체인 day 누적)
  - A경로: a_11(65) → a_12(95) → a_13(125) → a_14(155) → a_15(**95**) → end_a1(205).
  - B경로: b_11(65) → b_12(95) → b_13(125) → b_14(155) → b_15(**95**) → end_b1/b3(205).
  - a_15/b_15의 `dayTrigger:95`는 선행 a_14/b_14(155)보다 작다. dayTrigger는 "이 날 이후 + 선행 완료"의 AND 게이트라 조기 발화는 막히지만, **표기상 155 이후에 의미 없는 95가 박혀 있어 시간선 혼란**을 유발.
- **narrative 시간 표기 불일치**
  - a_15.start `'180일.'` / b_15.start `'160일.'` ↔ 두 퀘스트 모두 objective는 `survive_days count:100`. 100일 생존 목표인데 본문은 160~180일을 말한다.
  - a_15.dayTrigger 95인데 본문 180일.
- **엔딩 조건** (`js/data/endings.js`)
  - `char_soldier`(L299): `day>=120 && flags.yeongdeungpoVisited && flags.totalKills>=30`. 영등포 방문·처치수는 사이드 퀘스트(`mq_soldier_side_03` 영등포 요새)와 일반 전투로 시스템이 자동 set → **도달 가능, 버그 아님**(코멘트만).
  - `mq_soldier`(L423): `flags.mainQuestComplete_soldier && day>=100`. end_a1/end_b1/end_b3 모두 `mainQuestComplete_soldier:true`를 set하므로 정상 연결.

---

## 문제 1 — mq_soldier_b_11 서사·목표 불일치 (버그성)

**[문제]** narrative는 "전우 인식표 4개 수습"인데 objective는 `collect_item knife count:2`. 목표 아이템(나이프)과 서사(인식표/군번줄)가 무관.

**[파일:퀘스트ID]** `js/data/mainQuests/soldier/branch_b.js` — `mq_soldier_b_11`

**[현재]**
```js
mq_soldier_b_11: {
  id: 'mq_soldier_b_11', title: '전우의 인식표',
  desc: '나이프 2개를 수집하라. 전우들의 유품을 수습하는 의식이다.',
  icon: '🎖️', characterId: 'soldier', dayTrigger: 65,
  prerequisite: 'mq_soldier_10', requiresFlag: 'soldier_branch_b',
  objective: { type: 'collect_item', definitionId: 'knife', count: 2 },
  reward: { morale: 15, items: [{ definitionId: 'alcohol_swab', qty: 2 }, { definitionId: 'painkiller', qty: 1 }] },
  failPenalty: { morale: -5 }, deadlineDays: 120,
  narrative: {
    start: '광화문 복도에서 군번줄 3개를 더 발견했다. 박상현, 김태호, 이동훈. 유품을 찾아 수습해야 한다. 전우에 대한 예의다.',
    complete: '인식표 4개. 박상현, 김태호, 이동훈, 정재민. 살아서 전달하겠다고 약속했다. 의료품도 챙겼다. 혼자 가는 길, 부상에 대비해야 한다.',
  },
},
```

**[수정 후 전문]**

> 채택안: objective는 `collect_item knife count:2` **유지**(획득 경로 보장 — 소프트락 회피), 단 서사를 "추모이자 정비"로 재정렬한다. 강민준이 시작부터 지닌 군번줄(`dog_tag`, comrade_memorial 지급분)은 이미 손에 있다는 전제로, 이번 퀘스트는 "전우의 칼을 거둬 내 무기로 잇는다"는 행위로 목표와 서사를 일치시킨다. 군인에게 전우의 무기를 물려받는 것은 추모의 한 형태다 — 형용사 없이 행위로 보여준다.

```js
mq_soldier_b_11: {
  id: 'mq_soldier_b_11', title: '전우의 칼',
  desc: '나이프 2개를 수습하라. 쓰러진 전우들이 쥐고 있던 무기다.',
  icon: '🎖️', characterId: 'soldier', dayTrigger: 65,
  prerequisite: 'mq_soldier_10', requiresFlag: 'soldier_branch_b',
  objective: { type: 'collect_item', definitionId: 'knife', count: 2 },
  reward: { morale: 15, items: [{ definitionId: 'alcohol_swab', qty: 2 }, { definitionId: 'painkiller', qty: 1 }] },
  failPenalty: { morale: -5 }, deadlineDays: 120,
  narrative: {
    start: '목에 건 군번줄 네 개. 박상현, 김태호, 이동훈, 정재민. 시신은 두고 왔다. 대신 그들이 쥐고 있던 칼은 거둘 수 있다. 무기를 거두면 시신을 거둘 수 없다. 둘 다는 안 된다.',
    complete: '전우의 칼 두 자루. 내 것과 함께 챙겼다. 군번줄은 목에 그대로 둔다. 살아서 전달한다는 약속은 칼을 드는 것으로 대신한다. 혼자 가는 길, 손에 쥔 것이 늘었다.',
  },
},
```

**[이유]** dog_tag로 교체하면 count:4는 소프트락(획득 경로 없음), count:1은 즉시 완료라 여정이 사라진다. knife는 획득 경로가 검증됐다(`mq_soldier_01` 동작). 목표(나이프)를 그대로 두되 서사를 "전우의 칼을 잇는 추모"로 재정의하면 기능·서사가 동시에 성립한다. title/desc도 "인식표→칼"로 맞춰 목표와 충돌하지 않게 한다. 군번줄(dog_tag)은 이미 지닌 유품으로 narrative 안에서만 다뤄 keepsake 설정과도 모순되지 않는다.

---

## 문제 2 — A경로 목표 전환 동기 부족

**[문제]** 직업 goal은 "KBS 방송 송출"(`characters.js:91`)인데, A경로(soldier_branch_a)는 Q11부터 박영철 구조 작전으로 전환된다. "왜 방송을 포기하고 구조로 가는가"의 심리 전환이 없다.

**[파일:퀘스트ID]** 분기점 `js/data/mainQuests/soldier/shared.js` — `mq_soldier_10` / 전환 직후 `js/data/mainQuests/soldier/branch_a.js` — `mq_soldier_a_11`

**[현재 — mq_soldier_10.narrative.complete]**
```js
complete: '증폭기 완성. KBS 신호가 선명해졌다. 전자부품 수거 중 버려진 쌍안경도 발견했다. 두 선택이 기다린다. 박영철의 구조 요청, 그리고 KBS.',
```

**[수정 후 — mq_soldier_10.narrative.complete]**
```js
complete: '증폭기 완성. KBS 신호가 선명해졌다. 곧 갈 수 있다. 그때 다른 주파수가 끼어들었다. 박영철 소방위. "서대문에 사람이 깔렸습니다. 지금 안 가면 죽어요." KBS는 기다려준다. 깔린 사람은 안 기다린다. 결정해야 한다.',
```

**[현재 — mq_soldier_a_11.narrative]**
```js
narrative: {
  start: '박영철의 무전. "강민준 하사, 서대문 쪽에 생존자가 갇혔습니다. 전술 지원이 필요합니다." 군인의 자리는 여기다.',
  complete: '서대문 소방서. 박영철 소방위가 구조 장비를 챙기고 있었다. "와줬군요. 군인이 옆에 있으니 든든합니다." 소방서 장비함에서 손전등도 받았다. 구조 작전이 시작됐다.',
},
```

**[수정 후 — mq_soldier_a_11.narrative]**
```js
narrative: {
  start: 'KBS 좌표를 수첩에서 지웠다. 송출은 신호를 보내는 일이다. 신호는 누군가 받아야 의미가 있고, 받을 사람이 먼저 죽으면 송출할 이유도 없다. 방송을 미룬다. 서대문으로 간다. 박상현이라면 같은 선택을 했을 거다.',
  complete: '서대문 소방서. 박영철 소방위가 구조 장비를 챙기고 있었다. "와줬군요. 군인이 옆에 있으니 든든합니다." 손전등을 받아 들었다. 마이크 대신 들것을 든다. 방송은 살아남은 사람들의 몫으로 남긴다.',
},
```

**[이유]** A경로는 직업 goal에서 이탈하는 분기다. 이탈에는 납득 가능한 심리 전환이 필요하다. "송출은 받을 사람이 있어야 의미가 있다 → 받을 사람이 죽고 있다 → 방송을 미룬다"는 논리로 목표 포기를 정당화했다. 과장 없이 행위(좌표를 지운다, 마이크 대신 들것)로 전환을 보여준다.

---

## 문제 3 — 분기점 회색지대 부재 (Q10 branchOptions)

**[문제]** `mq_soldier_10`의 branchOptions가 각 선택이 무엇을 **얻는지**만 적고, 무엇을 **잃는지**는 말하지 않는다. 시나리오 톤 원칙(A를 얻으면 B를 잃는다)이 분기 UI에 드러나지 않는다.

**[파일:퀘스트ID]** `js/data/mainQuests/soldier/shared.js` — `mq_soldier_10.branchOptions`

**[현재]**
```js
branchOptions: [
  {
    label: '박영철 소방관과 구조 작전',
    desc: '생존자 구조에 전술 능력을 쓴다.',
    setsFlag: 'soldier_branch_a',
    recruitNpc: 'npc_yeongcheol',
  },
  {
    label: 'KBS 단독 방송 임무',
    desc: '혼자 KBS로 간다. 전국에 신호를 보낸다.',
    setsFlag: 'soldier_branch_b',
  },
],
```

**[수정 후 전문]**
```js
branchOptions: [
  {
    label: '박영철과 구조 작전 (방송 포기)',
    desc: '눈앞의 생존자를 구한다. KBS 송출은 포기한다. 전국에 닿는 신호 대신, 손에 닿는 사람을 택한다. 박영철이 합류한다.',
    setsFlag: 'soldier_branch_a',
    recruitNpc: 'npc_yeongcheol',
  },
  {
    label: 'KBS 단독 방송 (구조 포기)',
    desc: '혼자 KBS로 간다. 전국에 신호를 보낸다. 박영철의 구조 요청은 거절한다. 서대문에 깔린 사람들은 다른 누군가를 기다려야 한다.',
    setsFlag: 'soldier_branch_b',
  },
],
```

**[이유]** 분기 선택은 트레이드오프가 명시될 때 무게가 생긴다. A=방송 포기, B=구조 포기를 label과 desc에 직접 박아 "둘 다는 안 된다"를 선택 시점에 인지시킨다. 기존 필드(label/desc/setsFlag/recruitNpc) 구조 그대로 유지.

---

## 문제 4 — dayTrigger 무의미 값 정리 (a_15 / b_15)

**[문제]** a_15·b_15의 `dayTrigger:95`가 선행 퀘스트(a_14/b_14, dayTrigger:155)보다 작다. AND 게이트라 조기 발화는 안 되지만, 표기상 95가 남아 시간선을 흐린다.

**[파일:퀘스트ID]** `branch_a.js` — `mq_soldier_a_15` / `branch_b.js` — `mq_soldier_b_15`

**[현재]**
```js
// branch_a.js
mq_soldier_a_15: { ... dayTrigger: 95, prerequisite: 'mq_soldier_a_14', ... }
// branch_b.js
mq_soldier_b_15: { ... dayTrigger: 95, prerequisite: 'mq_soldier_b_14', ... }
```

**[수정 후]**
```js
// branch_a.js — a_14(155) 다음 단계이므로 트리거를 선행과 정합되게 상향
mq_soldier_a_15: { ... dayTrigger: 175, prerequisite: 'mq_soldier_a_14', ... }
// branch_b.js
mq_soldier_b_15: { ... dayTrigger: 175, prerequisite: 'mq_soldier_b_14', ... }
```

**[이유]** dayTrigger는 "이 날 이후 + 선행 완료" AND 게이트다. 선행 a_14/b_14가 155다음 단계인데 95는 항상 선행 게이트에 묻혀 죽은 값이다. 175로 올려 체인 시간선(65→95→125→155→175→205)을 단조 증가로 맞춘다. end_a1/end_b1/end_b3의 205와도 정합. objective(`survive_days count:100`)는 day 게이트와 독립이라 영향 없음.

---

## 문제 5 — 클라이맥스 후 늘어짐 (B3 엔딩 공백)

**[문제]** B3(방송 후 수원 이동)은 방송 성공이라는 클라이맥스 이후 식량 8개 수집(`collect_item_type food 8`) 동안 긴 공백이 생긴다. 텐션이 풀린다.

**[파일:퀘스트ID]** `branch_b.js` — `mq_soldier_end_b3.narrative`

**[현재]**
```js
narrative: {
  start: '마지막 방송을 내보낸다. "서울에서 수원으로 이동합니다. 따라오는 분들을 기다리겠습니다." 이제 걷는다.',
  complete: 'D+90. 수원 외곽. 군용 전투 식량 세 팩. 뒤에서 발소리가 들렸다. 방송을 듣고 따라온 사람들이었다. 박상현, 나는 혼자가 아니야.',
},
```

**[수정 후 전문]**
```js
narrative: {
  start: '마지막 방송을 내보냈다. "서울에서 수원으로 이동합니다. 따라오는 분들을 기다리겠습니다." 마이크를 끄자 KBS는 정적이 됐다. 이제 걷는 일만 남았다. 수원까지 사흘. 사흘치 식량이 없으면 도착 전에 무너진다. 따라오겠다던 사람들이 길 위에서 굶으면, 방송은 그들을 죽인 셈이 된다. 보급이 곧 약속이다.',
  complete: 'D+90. 수원 외곽. 군용 전투 식량 세 팩. 뒤에서 발소리가 들렸다. 한 명이 아니었다. 방송을 듣고 길에서 합류한 사람들이었다. 식량을 나눴다. 박상현, 나는 혼자가 아니야.',
},
```

**[이유]** 식량 수집이라는 단조 목표에 "보급=따라온 사람들의 생사"라는 긴장을 부여해 클라이맥스 후 공백을 채웠다. objective·flag·보상은 손대지 않고 narrative.start만 확장. complete는 "합류 인원이 늘었다"로 보급 성공을 회수.

---

## 문제 6 — narrative 시간선 표기 정리

**[문제]** a_15.start `'180일.'`, b_15.start `'160일.'` ↔ 두 퀘스트 objective는 `survive_days count:100`(100일 생존). 본문 일수와 목표 일수, dayTrigger가 제각각이다.

**[파일:퀘스트ID]** `branch_a.js` — `mq_soldier_a_15.narrative` / `branch_b.js` — `mq_soldier_b_15.narrative`

**[현재 — a_15]**
```js
narrative: {
  start: '180일. 박영철과 함께한 구조 작전이 성과를 냈다.',
  complete: '박영철: "강 하사, 이제 서울 전역이다. 우리가 해낼 수 있어요." 각성제를 꺼내 마셨다. 길은 하나였다.',
},
```

**[수정 후 — a_15]**
```js
narrative: {
  start: '100일을 넘겼다. 박영철과 함께한 구조 작전이 성과를 냈다. 서대문 한 구를 지키는 데 100일이 들었다.',
  complete: '박영철: "강 하사, 이제 서울 전역이다. 우리가 해낼 수 있어요." 한 구를 넓히면 손이 닿는 범위가 늘고, 닿지 않는 곳은 더 멀어진다. 각성제를 마셨다. 길은 하나였다.',
},
```

**[현재 — b_15]**
```js
narrative: {
  start: '160일. 광화문에서 팀원들이 쓰러진 날부터 160일. 혼자 살아남았다.',
  complete: '160일. 박상현이라면 뭐라고 했을까. "민준아, 그냥 살면 돼." KBS 방송이 나가고 있다. 무전기를 손에 쥐었다. 이제 결정할 시간이다.',
},
```

**[수정 후 — b_15]**
```js
narrative: {
  start: '100일. 광화문에서 팀원들이 쓰러진 날부터 100일. 혼자 살아남았다.',
  complete: '100일. 박상현이라면 뭐라고 했을까. "민준아, 그냥 살면 돼." KBS 방송이 나가고 있다. 무전기를 손에 쥐었다. 이제 결정할 시간이다.',
},
```

**[이유]** objective가 `survive_days count:100`이므로 narrative 기준일을 100일로 통일해 목표·본문·dayTrigger(175 상향 후 "100일 넘겨 175일 시점"과도 모순 없음) 정합. a_15.complete에는 "한 구를 지키면 다른 곳이 멀어진다"는 회색지대를 더해 작전 확대 결정의 무게를 보강.

---

## 문제 7 — char_soldier 엔딩 조건 (버그 아님 / 코멘트)

**[문제]** `endings.js` `char_soldier` 조건 `yeongdeungpoVisited && totalKills>=30`이 도달 불가로 보일 수 있다는 우려.

**[확인 결과]** 버그 아님. `yeongdeungpoVisited`·`totalKills`는 일반 탐색/전투와 사이드 퀘스트(`mq_soldier_side_03` 영등포 요새 강습, dayTrigger:60)로 시스템이 자동 set한다. `day>=120` 게이트도 본편 진행 일수로 충족. **수정 불필요.** 다만 `char_soldier`는 "방송 시작"이라는 도입 연출 엔딩이고, 실제 메인 완료 엔딩은 `mq_soldier`(`mainQuestComplete_soldier` 기반)다 — 두 엔딩이 별개 트랙임을 데이터 주석으로 한 줄 남길 것을 권장(코드 동작 변경 없음).

---

## 적용 체크리스트

- [ ] **문제1** `branch_b.js` `mq_soldier_b_11` — title '전우의 칼', desc '나이프 2개를 수습하라…', narrative start/complete 교체. objective(knife×2) **유지**.
- [ ] **문제2** `shared.js` `mq_soldier_10.narrative.complete` 교체 / `branch_a.js` `mq_soldier_a_11.narrative` start·complete 교체.
- [ ] **문제3** `shared.js` `mq_soldier_10.branchOptions` label·desc 2건 교체. setsFlag/recruitNpc 유지.
- [ ] **문제4** `branch_a.js` `mq_soldier_a_15.dayTrigger` 95→175 / `branch_b.js` `mq_soldier_b_15.dayTrigger` 95→175.
- [ ] **문제5** `branch_b.js` `mq_soldier_end_b3.narrative.start` 확장.
- [ ] **문제6** `branch_a.js` `mq_soldier_a_15.narrative` / `branch_b.js` `mq_soldier_b_15.narrative` 일수 100일 통일.
- [ ] **문제7** 코드 변경 없음. `endings.js` char_soldier vs mq_soldier 트랙 구분 주석 1줄(선택).

## 검증 방법

1. **데이터 무결성**: `node js/data/validate.js` 실행 — objective.definitionId(`knife`)·아이템 id 실재 확인, 깨진 참조 0건.
2. **소프트락 회피 확인**: 수정안은 새 objective 아이템을 도입하지 않음(knife/food/structure/survive_days/electronic_parts — 전부 기존 동작 경로). dog_tag를 objective로 쓰지 않으므로 lootTable 미등록으로 인한 미완료 위험 없음.
3. **체인 시간선 단조 증가 확인**: 수정 후 a/b 경로 dayTrigger = 65→95→125→155→**175**→205. 선행<후행 단조 증가, end 단계 205와 정합.
4. **분기 게이트 동작**: `requiresFlag`(soldier_branch_a/b)·`setsFlag` 미변경 → 기존 분기 흐름 그대로. branchOptions 텍스트만 변경이라 로직 영향 없음.
5. **엔딩 플래그 연결**: end_a1/end_b1/end_b3의 `flags.mainQuestComplete_soldier:true` 미변경 → `endings.js mq_soldier`(L423) 트리거 정상.
6. **인게임 스폿 체크(권장)**: soldier로 신규 시작 → Q10까지 진행 → A/B 각각 선택 시 분기 텍스트 트레이드오프 노출 확인, b_11 목표(나이프 2)와 본문(칼 수습) 일치 확인.

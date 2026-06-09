# doctor(이지수) 시나리오 수정 설계서

> 시나리오 기획 페르소나 "한도연" 작성. 회색지대 강조 — 모든 분기는 "A를 얻으면 B를 잃는다" 형식.
> 수정 범위: 퀘스트 데이터(텍스트·objective·flag·narrative·branchOptions 대사)만. NPC trust 공식·밸런스 수치·메커닉/트리거 구현은 건드리지 않는다.
> 모든 코드 인용은 실제 파일을 읽고 확인한 현재 상태다.

---

## 사전 확인 (실제 코드 기반)

| 항목 | 확인 결과 | 근거 |
|------|-----------|------|
| `collect_item` 필드명 | `objective.definitionId`를 읽음 (`itemId` 아님) | `QuestSystem.js:845, 871` `GameState.countOnBoard(obj.definitionId)` |
| doctor 퀘스트 내 `itemId` 오타 | **없음** | `grep itemId js/data/mainQuests/doctor` → No matches |
| `requiresFlag` 게이트 | `if (def.requiresFlag && !gs.flags[def.requiresFlag]) continue;` | `QuestSystem.js:826` |
| C경로 side 체인 게이트 | `mq_doctor_side_01~06`, `side_end` 모두 `requiresFlag` **없음**. `prerequisite`만 있음 | `shared.js:593~696` |
| `seodaemunVisited` set 주체 | 시스템 자동 (`ExploreSystem.js:256`, `SubwaySystem.js:257`) | grep 결과 |
| `infectionCured` set 주체 | 시스템 자동 (`StatSystem.js:385`) | grep 결과 |
| goal 텍스트 | "신촌 세브란스병원 연구소에서 감염 패턴 데이터를 확보하고… 치료 프로토콜을 수립" | `characters.js:27` |
| 세브란스 실제 방문 퀘스트 | **존재하지 않음** (A=관악, B=용산, C=보라매) | `branch_a.js`, `branch_b.js`, `shared.js` 전수 |

---

## 문제 1 — 목표 변질 (goal과 분기 종착지 괴리)

### [문제 요약]
`characters.js:27`의 goal은 "신촌 세브란스병원 연구소 데이터 + 치료 프로토콜"인데, A경로는 서울대 약학연구소(관악·한소희), B경로는 용산 군 의료본부로 끝나 원 목표와 닿지 않는다. 더 심각한 것은 narrative가 "세브란스 데이터가 필요했거든요"(`branch_a.js:20`), "세브란스 데이터가 맞았어요"(`branch_a.js:48`)처럼 **확보한 적 없는 데이터를 이미 가진 것처럼** 서술한다는 점이다.

### [대상 파일 : 퀘스트 ID]
- `js/data/characters.js` : doctor `goal`
- `js/data/mainQuests/doctor/branch_a.js` : `mq_doctor_a_11`, `mq_doctor_a_13`
- `js/data/mainQuests/doctor/shared.js` : `mq_doctor_10` branchOptions

### [현재 코드/텍스트 인용]
```js
// characters.js:27
goal: '신촌 세브란스병원 연구소에서 감염 패턴 데이터를 확보하고, 생존자들을 위한 치료 프로토콜을 수립한다.',
```
```js
// branch_a.js:20 (mq_doctor_a_11.narrative.complete)
complete: '서울대 약학연구소. 한소희가 이미 실험을 시작하고 있었다. "당신 오길 기다렸어요. 세브란스 데이터가 필요했거든요." 연구실 선반에 약초 시료도 가득 있었다.',
// branch_a.js:48 (mq_doctor_a_13.narrative.complete)
complete: '1차 제제 완성. 합성 과정에서 항생제도 만들어졌다. 한소희: "이 성분 비율이 핵심이에요. 세브란스 데이터가 맞았어요."',
```

### [수정 후 코드/텍스트 전문]

목표를 "세브란스"라는 단일 종착지가 아니라 **"치료 프로토콜 수립"이라는 결과**로 재정의하고, 세브란스는 닿지 못한 출발점이었음을 명시한다. 분기 포용형.

```js
// characters.js:27
goal: '신촌 세브란스 연구팀을 찾아 떠났으나 그곳은 비어 있었다. 흩어진 감염 데이터와 임상 관찰을 직접 이어 붙여, 생존자를 위한 치료 프로토콜을 자기 손으로 완성한다.',
```

세브란스 데이터를 "이미 가진 것"이 아니라 "끝내 닿지 못해 직접 메워야 했던 공백"으로 바꾼다.

```js
// branch_a.js:20 (mq_doctor_a_11.narrative.complete)
complete: '서울대 약학연구소. 한소희가 이미 실험을 시작하고 있었다. "세브란스로 가려던 거죠? 거긴 비었어요. 나도 거기서 빈손으로 돌아왔으니까." 한소희가 자기 노트를 밀어놓았다. "당신 임상 관찰을 내 합성 데이터에 붙이면 — 세브란스가 못 한 걸 우리가 합니다. 대신 당신은 이제 단독 연구자가 아니에요. 내 방식에 맞춰야 합니다."',
// branch_a.js:48 (mq_doctor_a_13.narrative.complete)
complete: '1차 제제 완성. 합성 과정에서 항생제도 만들어졌다. 한소희: "이 비율은 내 손에서 나온 거예요. 세브란스 데이터가 아니라. 그게 없으니 우리가 직접 만든 거고요 — 그래서 이건 검증된 적 없는 처방이에요. 누군가에게 써봐야 압니다."',
```

분기 진입(Q10)에서 "원 목표를 무엇으로 바꾸는가 / 무엇을 포기하는가"를 명시한다 → 문제 2에서 branchOptions 전문 제시.

### [이유]
goal과 실제 도달지의 괴리, 그리고 "확보한 적 없는 데이터"의 거짓 서술을 제거한다. 세브란스를 "빈 출발점"으로 재정의하면 A·B·C 세 종착지 모두 원 목표("프로토콜 자기 손으로 완성")의 하위 갈래로 묶인다.

---

## 문제 2 — 회색지대 부재 (Q10 분기에서 잃는 것이 안 보임)

### [문제 요약]
`mq_doctor_10`의 `branchOptions`(`shared.js:418~437`)는 얻는 것만 적고 잃는 것을 적지 않는다. A는 "백신을 연구한다", B는 "보급로·전투 지원을 확보한다"로 이득만 나열 — 페르소나 규칙(모든 분기는 잃는 것 명시) 위반.

### [대상 파일 : 퀘스트 ID]
`js/data/mainQuests/doctor/shared.js` : `mq_doctor_10.branchOptions`

### [현재 코드/텍스트 인용]
```js
// shared.js:418~437
branchOptions: [
  {
    label: '한소희 약사와 협력',
    desc: '서울대 연구소로 함께 간다. 합성 전문가와 백신을 연구한다.',
    setsFlag: 'doctor_branch_a',
    recruitNpc: 'npc_sohee',
  },
  {
    label: '강민준 군의관과 합류',
    desc: '군 의료팀에 합류한다. 군 보급로와 전투 지원을 확보한다.',
    setsFlag: 'doctor_branch_b',
    recruitNpc: 'npc_minjun',
  },
  {
    label: '독자 연구 (시크릿)',
    desc: '보라매에 남아 단독 역학 연구를 시작한다. 협력자 없이, 그러나 0번 환자 표본까지 밀어붙여 역병 백신을 합성한다. (사이드 체인 side_01 → side_end)',
    setsFlag: 'doctor_branch_c',
    warning: '고난이도 — 협력자 없이 40일 이상 단독 생존해야 하며, 0번 환자(보스)와 대면해야 한다.',
  },
],
```

### [수정 후 코드/텍스트 전문]
```js
branchOptions: [
  {
    label: '한소희와 서울대로 (합성을 얻고, 통제권을 잃는다)',
    desc: '관악 약학연구소의 합성 장비와 한소희의 손을 얻는다. 대신 연구의 방향은 한소희가 쥔다 — 무엇을 만들지, 누구에게 먼저 쓸지 당신이 정하지 못한다. 군의 보호도, 0번 환자 표본도 포기한다.',
    setsFlag: 'doctor_branch_a',
    recruitNpc: 'npc_sohee',
  },
  {
    label: '강민준과 용산으로 (안전을 얻고, 연구를 잃는다)',
    desc: '군의 보급로와 무장 경계를 얻어 살아남을 확률이 가장 높다. 대신 우선순위는 부상 군인이지 백신이 아니다 — 치료 프로토콜 연구는 군의 일정에 밀려 멈춘다. 한소희의 합성 지식과 단독 백신의 길을 함께 닫는다.',
    setsFlag: 'doctor_branch_b',
    recruitNpc: 'npc_minjun',
  },
  {
    label: '보라매에 남는다 (백신을 얻고, 모든 손을 잃는다)',
    desc: '0번 환자 표본까지 밀어붙여 역병 백신 자체를 합성한다 — 셋 중 유일하게 원인을 끝낸다. 대신 협력자도, 보급도, 무장 경계도 전부 없다. 한소희와 강민준의 무전에 답하지 않는 순간, 두 사람은 당신 없이 떠난다.',
    setsFlag: 'doctor_branch_c',
    warning: '고난이도 — 협력자 없이 40일 이상 단독 생존해야 하며, 0번 환자(보스)와 대면해야 한다.',
  },
],
```

`mq_doctor_10.narrative.complete`도 분기 직전 회색지대를 환기하도록 보강한다.

```js
// shared.js:439~440 (현재)
complete: '자기 처방으로 상처를 다스렸다. 비상용 각성제와 소독약이 추가로 확보됐다. 이제 두 갈래 길 앞에 섰다. 한소희의 메모와 강민준의 무전. 의사의 손이 어디로 향할지 선택해야 한다.',
```
```js
// 수정 후
complete: '자기 처방으로 상처를 다스렸다. 비상용 각성제와 소독약이 추가로 확보됐다. 세 갈래가 동시에 손짓한다 — 한소희의 합성 장비, 강민준의 보급로, 그리고 아무도 없는 보라매의 연구대. 어느 하나를 잡는 순간 나머지 둘은 닫힌다. 이지수는 베인 손을 폈다. 무엇을 끝내고 싶은지부터 정해야 했다.',
```

### [이유]
선택지마다 "얻는 것 / 잃는 것"을 한 문장 안에 병치해 회색지대를 강제한다. 도덕적으로 안전한 선택지가 없도록 — A는 자율성, B는 연구, C는 인적 안전을 각각 대가로 지불한다.

---

## 문제 3 — C경로 상호배타 누수 (side 체인이 A/B와 병렬 진행)

### [문제 요약]
`QuestSystem.js:826`의 게이트는 `requiresFlag`가 있을 때만 분기를 막는다. 그런데 C경로 본체인 `mq_doctor_side_01 ~ side_06`, `side_end`는 `requiresFlag`가 없고 `prerequisite: 'mq_doctor_10'`(또는 side 체인 선행)만 가진다. 따라서 Q10에서 A를 골라 `doctor_branch_a`를 set해도, C경로 side 체인이 **동시에 활성화**되어 백신 시크릿 엔딩 플래그까지 병렬로 진행 가능하다. 상호배타가 누수된다.

> 주의: `side_end`(`shared.js:677`)는 완료 시 `mainQuestComplete_doctor: true`와 `doctor_ending: 'c_vaccine'`을 set한다. A/B 엔딩 퀘스트보다 먼저 완료되면 엔딩이 C로 덮어써질 수 있다.

### [대상 파일 : 퀘스트 ID]
`js/data/mainQuests/doctor/shared.js` : `mq_doctor_side_01`, `side_02`, `side_03`, `side_04`, `side_05`, `side_06`, `side_end`

> 단, "기획 의도" 확인 필요 — 주석(`shared.js:471~472`)은 이 체인을 "사이드 퀘스트(선택, 메인 체인 비차단)"로 명시하고, `side_end`의 desc는 "A·B루트에서는 시크릿 부가 엔딩"이라 적혀 있다. 즉 **부가 엔딩 허용이 의도**일 수 있다. 두 가지 설계안을 제시하고, 평가에서 도출된 "상호배타" 요구에 맞춰 **설계안 1(엄격 게이트)을 권장**한다.

### [현재 코드/텍스트 인용]
```js
// shared.js:593~596 (mq_doctor_side_01 — requiresFlag 없음)
mq_doctor_side_01: {
  id: 'mq_doctor_side_01', title: '감염 패턴 추적',
  desc: '감염자 10마리를 처치하며 감염 진행 단계를 관찰하라.',
  icon: '🧫', characterId: 'doctor', dayTrigger: 22, prerequisite: 'mq_doctor_10',
  objective: { type: 'track_infected', enemyType: 'zombie', count: 10 },
```
```js
// shared.js:677~681 (mq_doctor_side_end — requiresFlag 없음)
mq_doctor_side_end: {
  id: 'mq_doctor_side_end', title: '역병의 종결 — 백신 합성',
  desc: '0번 환자 혈액 표본으로 역병 백신을 직접 합성하라. (C루트 공식 엔딩 / A·B루트에서는 시크릿 부가 엔딩)',
  icon: '💠', characterId: 'doctor', dayTrigger: 55, prerequisite: 'mq_doctor_side_05',
  objective: { type: 'craft_item', definitionId: 'plague_vaccine', count: 1 },
```

### [수정 후 코드/텍스트 전문] — 설계안 1 (권장: 엄격 상호배타)

C경로 본체인 7개 퀘스트 전부에 `requiresFlag: 'doctor_branch_c'`를 추가한다. 다른 필드는 그대로 둔다.

```js
// mq_doctor_side_01
icon: '🧫', characterId: 'doctor', dayTrigger: 22,
prerequisite: 'mq_doctor_10', requiresFlag: 'doctor_branch_c',

// mq_doctor_side_02
icon: '🩺', characterId: 'doctor', dayTrigger: 25,
prerequisite: 'mq_doctor_10', requiresFlag: 'doctor_branch_c',

// mq_doctor_side_03
icon: '🗺️', characterId: 'doctor', dayTrigger: 30,
prerequisite: 'mq_doctor_10', requiresFlag: 'doctor_branch_c',

// mq_doctor_side_04
icon: '⚗️', characterId: 'doctor', dayTrigger: 35,
prerequisite: 'mq_doctor_10', requiresFlag: 'doctor_branch_c',

// mq_doctor_side_05
icon: '🧪', characterId: 'doctor', dayTrigger: 45,
prerequisite: 'mq_doctor_side_01', requiresFlag: 'doctor_branch_c',

// mq_doctor_side_06
icon: '🏥', characterId: 'doctor', dayTrigger: 50,
prerequisite: 'mq_doctor_side_04', requiresFlag: 'doctor_branch_c',

// mq_doctor_side_end
icon: '💠', characterId: 'doctor', dayTrigger: 55,
prerequisite: 'mq_doctor_side_05', requiresFlag: 'doctor_branch_c',
```

그리고 `side_end`의 desc에서 "A·B루트에서는 시크릿 부가 엔딩" 문구를 삭제해 의도를 일치시킨다.

```js
// 수정 후 desc
desc: '0번 환자 혈액 표본으로 역병 백신을 직접 합성하라. (C루트 단독 연구의 종착점)',
```

### [수정 후 코드/텍스트 전문] — 설계안 2 (부가 엔딩 허용을 유지하되 엔딩 덮어쓰기만 차단)

`side_end`에만 `requiresFlag`를 두지 않되, 완료 플래그를 분리해 A/B 엔딩이 이미 났으면 C 엔딩으로 덮지 않도록 한다. 이 경우 `side_01~06`은 "임상 사이드 콘텐츠"로 유지(A/B에서도 진행 가능), `side_end`의 `flags`에서 `doctor_ending` 무조건 set을 제거한다.

```js
// mq_doctor_side_end.reward.flags (현재)
flags: {
  doctor_vaccine_synthesized:    true,
  doctor_secret_ending_unlocked: true,
  mainQuestComplete_doctor:      true,
  doctor_ending:                 'c_vaccine',
},
// 설계안 2 수정 후 — doctor_ending 무조건 덮어쓰기 제거, 합성 사실만 기록
flags: {
  doctor_vaccine_synthesized:    true,
  doctor_secret_ending_unlocked: true,
},
```
> 단 설계안 2는 `mainQuestComplete_doctor`를 set하지 않으면 C 단독 플레이어가 엔딩을 못 받는다. C 단독 종결을 유지하려면 별도 트리거가 필요하므로 **구현 복잡도가 높다.** 평가 요구("상호배타")에는 설계안 1이 직접적이다.

### [이유]
`requiresFlag: 'doctor_branch_c'`는 `QuestSystem.js:826` 게이트를 그대로 사용하는 최소 침습 수정이다. A/B를 고른 플레이어에게 C 체인이 활성화되지 않으므로 분기 상호배타가 데이터 레벨에서 강제된다. branch_a/branch_b 퀘스트가 이미 `requiresFlag`를 쓰는 것과 패턴이 일치한다(`branch_a.js:14` 등).

---

## 문제 4 — 서사-목표 불일치 (Q09 등 narrative ≠ objective)

### [문제 요약]
`mq_doctor_09`(`shared.js:376~408`)는 title "홍대 약국 경유", narrative.complete는 "한소희 메모 발견 + 강민준 무전"이라는 **분기 떡밥 두 개를 동시에** 던지는데, objective는 `visit_district: mapo` 단순 이동뿐이다. 메모/무전이 서사상 핵심인데 게임플레이로 회수되지 않는다. desc("마포구를 통과하라")는 title("홍대 약국 경유")보다 단조롭다. 또한 Q09 title은 "홍대 약국"인데 내부 표기는 "홍대 입구"·"약국 뒷창고"로 흔들린다.

추가: `mq_doctor_side_03`(`shared.js:619~630`) title "역학 조사", narrative는 "0번 환자 동선/방사형 패턴 스케치"인데 objective는 `visit_district: junggoo`뿐 — 진입만 하면 완료된다. narrative가 요구하는 "지도화"가 플레이로 표현되지 않는다. (메커닉 추가는 범위 밖이므로 narrative를 objective 수준에 맞춰 절제한다.)

### [대상 파일 : 퀘스트 ID]
- `js/data/mainQuests/doctor/shared.js` : `mq_doctor_09`, `mq_doctor_side_03`

### [현재 코드/텍스트 인용]
```js
// shared.js:376~385 (mq_doctor_09)
mq_doctor_09: {
  id: 'mq_doctor_09', title: '홍대 약국 경유',
  desc: '마포구를 통과하라.',
  ...
  objective: { type: 'visit_district', districtId: 'mapo', count: 1 },
  ...
  narrative: {
    start: '마포구 홍대 입구. 약국들이 있는 곳이다.',
    complete: '홍대 약국 뒷창고에서 소독약, 해독제, 그리고 메모 한 장 발견. "약사 한소희. 서울대 연구소로 갑니다." 용산 방향에서 무전도 잡혔다 — 군의관 강민준 하사. "의사를 찾습니다."',
  },
```

### [수정 후 코드/텍스트 전문]

objective는 메커닉상 `visit_district`로 유지(변경 불가 범위)하되, narrative를 "마포 진입 = 두 분기의 떡밥을 동시에 줍는 지점"으로 정합화하고, 회색지대를 예고한다. desc·subObjective 표현도 title과 일치시킨다.

```js
mq_doctor_09: {
  id: 'mq_doctor_09', title: '홍대 약국 경유',
  desc: '마포구 홍대 약국가를 통과하며 다음 행선지의 단서를 줍는다.',
  icon: '🗺️', characterId: 'doctor', dayTrigger: 18, prerequisite: 'mq_doctor_08',
  objective: { type: 'visit_district', districtId: 'mapo', count: 1 },
  reward: { morale: 10, items: [{ definitionId: 'antiseptic', qty: 1 }, { definitionId: 'antidote', qty: 1 }] },
  failPenalty: { morale: -5 }, deadlineDays: 20,
  narrative: {
    start: '마포구 홍대. 약국이 늘어선 거리다. 세브란스는 여기서 강만 건너면 닿는다 — 그렇게 믿고 떠나온 길이다.',
    complete: '약국 뒷창고에서 소독약과 해독제, 그리고 메모 한 장. "약사 한소희. 세브란스는 비었다. 서울대 연구소로 간다." 같은 순간 용산 쪽 무전이 잡힌다. "군의관 강민준. 의사를 찾습니다." 두 손이 동시에 손짓한다. 둘 다 잡을 수는 없다는 걸, 이지수는 메모를 접으며 알았다.',
  },
  locationHint: {
    districtId: 'mapo',
    note: '마포구 홍대 — 약국 뒷창고 라인 우선 탐색',
    noteEn: 'Mapo — sweep the Hongdae pharmacy back rooms first',
  },
  subObjectives: [
    {
      id: 'so_d09_01',
      text: '동작구→마포구 이동 동선 확보',
      textEn: 'Plot a route from Dongjak into Mapo',
      hint: '지구 이동 카드 사용',
    },
    {
      id: 'so_d09_02',
      text: '마포구 홍대 약국가 진입',
      textEn: 'Enter the Hongdae pharmacy district in Mapo',
      match: { type: 'visit_district', districtId: 'mapo' },
    },
  ],
  actionHint: '의료 배낭을 챙긴 뒤 마포구로 이동. 홍대 약국 라인을 우선 탐색해 한소희 메모와 강민준 무전을 확인.',
  actionHintEn: 'Grab the expedition pack, move to Mapo, sweep the Hongdae pharmacy line for Sohee\'s note and Minjun\'s radio call.',
},
```

`mq_doctor_side_03` — narrative를 objective(진입) 수준으로 절제한다. "스케치 완성"을 단정하지 않고 "진입해 첫 관찰을 시작했다"로 낮춘다.

```js
// shared.js:626~628 (현재)
narrative: {
  start: '감염은 어디서 시작됐을까. 서울역 — 하루 수십만이 지나던 교통의 심장. 그곳이 0번 환자의 동선과 겹칠 가능성이 가장 높다. 역학 조사가 필요하다.',
  complete: '서울역 대합실에 쌓인 시신 분포를 스케치했다. 방사형 패턴 — 중심에서 바깥으로 퍼져나간 자국이 선명하다. 질병관리청 소속이 남긴 메모도 발견했다. 해독제 샘플과 약초도 챙겼다.',
},
```
```js
// 수정 후
narrative: {
  start: '감염은 어디서 시작됐을까. 서울역 — 하루 수십만이 지나던 교통의 심장. 0번 환자의 동선과 겹칠 가능성이 가장 높다. 직접 들어가 보는 수밖에 없다.',
  complete: '서울역 대합실에 들어섰다. 시신은 중심에서 바깥으로 퍼진 자국을 남겼다 — 첫 관찰을 수첩에 옮겼다. 질병관리청 명찰이 붙은 메모 한 장, 해독제 샘플, 약초를 챙겨 나왔다. 조사는 이제 시작이다.',
},
```

### [이유]
objective를 바꾸지 않고도 narrative가 "실제 게임에서 일어난 일(마포 진입/중구 진입)"의 범위를 넘지 않게 만든다. Q09는 두 분기 떡밥을 동시에 던지는 본래 의도를 유지하되 "둘 다 못 잡는다"는 회색지대 예고를 추가해 Q10 분기와 연결한다.

---

## 문제 5 — 필드명·수치 정합성 전수 점검

### [문제 요약]
`collect_item` objective는 `definitionId`를 읽는다(`QuestSystem.js:845`). doctor 퀘스트 전수 점검 결과 `itemId` 오타는 **없다**(grep 확인). desc 수치와 objective `count` 일치 여부를 전수 대조한 결과 모두 일치한다.

### [대상 파일 : 퀘스트 ID]
`shared.js`, `branch_a.js`, `branch_b.js` 전체

### [점검 결과 표]

| 퀘스트 ID | objective | desc 수치 | 일치 |
|-----------|-----------|-----------|------|
| `mq_doctor_02` so_d02_01 | `collect_item bandage 5` | "붕대 5개" | ✅ |
| `mq_doctor_02` so_d02_02 | `collect_item first_aid_kit 2` | "구급키트 2개" | ✅ |
| `mq_doctor_04` | `collect_item_type clean 3` | "음용수 3개" | ✅ |
| `mq_doctor_06` | `collect_item herb 3` | "약초 3개" | ✅ |
| `mq_doctor_07` | `craft_item medical 1` | "1개" | ✅ |
| `mq_doctor_08` | `craft_item medical 3` | "3개" | ✅ |
| `mq_doctor_a_12` | `collect_item_type medical 6` | "6개" | ✅ |
| `mq_doctor_a_13` | `craft_item medical 2` | "2개" | ✅ |
| `mq_doctor_a_14` | `survive_days 150` | "150일 이상" | ✅ |
| `mq_doctor_a_15` | `collect_item herb 5` | "약초 5개" | ✅ |
| `mq_doctor_end_a1` | `craft_item medical 4` | "4개" | ✅ |
| `mq_doctor_end_a3` | `collect_item_type food 8` | "식량 8개" | ✅ |
| `mq_doctor_b_12` | `treat_npc 3` | "3명" | ✅ |
| `mq_doctor_b_13` | `craft_item structure 2` | "구조물 2개" | ✅ |
| `mq_doctor_b_14` | `craft_item medical 4` | "4개" | ✅ |
| `mq_doctor_b_15` | `survive_days 30` | "30일 이상" | ✅ |
| `mq_doctor_end_b1` | `craft_item structure 3` | "구조물 3개" | ✅ |
| `mq_doctor_side_01` | `track_infected 10` | "10마리" | ✅ |
| `mq_doctor_side_06` | `craft_item structure 3` | "구조물 3개" | ✅ |
| `mq_doctor_side_end` | `craft_item plague_vaccine 1` | "백신" 1 | ✅ |

> 한 가지 표기 흔들림만 메모: `mq_doctor_a_14`(Q14A) title은 "임상 시험"이고 narrative.start "180일이 지났다"는 `mq_doctor_b_15`(Q15B) 쪽 문장이다. B의 `survive_days:30` start가 "180일이 지났다"로 시작하는데(`branch_b.js:74`) 누적일수 맥락은 맞다(Q14B dayTrigger 155 + 30). 수치 오류 아님 — **수정 불필요**, 코멘트만 남긴다.

### [수정 후 코드/텍스트 전문]
**수정 없음.** 필드명·수치 모두 코드 기준 정합. (이 절은 "점검했고 이상 없음"을 증거로 남기는 항목이다.)

### [이유]
평가 요구는 "전수 점검"이며, 점검 결과 변경할 데이터가 없다는 것 자체가 산출물이다. 추측이 아니라 grep + 표 대조로 확인했다.

---

## 문제 6 — char_doctor 엔딩 조건 점검 (버그 아님 / 의도 확인)

### [문제 요약]
`char_doctor` 엔딩(`endings.js:278~289`)의 `seodaemunVisited` + `infectionCured`는 시스템이 자동 set하므로(`ExploreSystem.js:256`, `StatSystem.js:385`) **도달 가능하다 — 버그 아님.** 단 이 엔딩의 핵심 게이트는 `!gs.quests.completed.includes('mq_doctor_01')`이다. 즉 **doctor 메인 퀘스트를 한 번도 시작하지 않은 채 180일 생존 + 서대문 방문 + 감염 1회 완치**한 플레이어용 "메인 미진행 생존 엔딩"이다.

### [대상 파일 : 퀘스트 ID]
- `js/data/endings.js` : `char_doctor`(L278), `mq_doctor`(L405)
- doctor 메인 경로는 서대문(`seodaemun`)을 **방문하지 않아도 된다** — A=관악, B=용산, C=보라매/중구. grep 확인 결과 doctor 퀘스트 내 `seodaemun` objective 없음.

### [현재 코드/텍스트 인용]
```js
// endings.js:282~289 (char_doctor.condition)
condition: (gs) => {
  return gs.player.characterId === 'doctor'
      && !(gs.flags.mainQuestComplete_doctor ?? false)
      && !gs.quests.completed.includes('mq_doctor_01')
      && gs.time.day >= 180
      && (gs.flags.seodaemunVisited ?? false)
      && (gs.flags.infectionCured ?? false);
},
```

### [수정 후 코드/텍스트 전문]
**수정 없음 (의도 일치 확인).**

- `char_doctor`는 "메인 미진행(`mq_doctor_01` 미완료) 시 발동하는 대체 생존 엔딩"으로 의도와 부합한다. `mq_doctor_01`은 1일차 트리거이므로 정상 플레이어는 거의 즉시 완료 → 이 엔딩은 사실상 "메인을 의도적으로 외면한 플레이"에만 열린다.
- `mq_doctor` 엔딩(`endings.js:405~413`)은 `mainQuestComplete_doctor` + 100일이면 발동 — A/B/C 세 종착지 모두 이 플래그를 set하므로(`branch_a.js:101,117`, `branch_b.js:88`, `shared.js:688`) 정상 도달.
- **코멘트:** doctor 메인 경로가 서대문을 강제하지 않는 것은 의도와 일치한다(goal의 "세브란스=닿지 못한 출발점" 재정의와도 부합 — 문제 1). 단 `char_doctor`의 narrative(`endings.js:290~296`)는 "신촌 세브란스 데이터를 찾았다"고 단정하는데, 이는 **메인 미진행 대체 엔딩**의 맥락(혼자 우연히 닿음)으로 읽히므로 충돌 아님. 변경 불필요.

### [이유]
조건 분석 결과 도달 가능하고 의도와 부합. "버그 아님" 판정의 근거(자동 set 주체, 게이트 의미)를 코드 줄번호로 명시했다.

---

## 적용 체크리스트 (수정할 파일·항목)

| # | 파일 | 항목 / 줄 | 변경 |
|---|------|-----------|------|
| 1 | `js/data/characters.js` | doctor `goal` (L27) | 텍스트 교체 (분기 포용형) |
| 1 | `js/data/mainQuests/doctor/branch_a.js` | `mq_doctor_a_11.narrative.complete` (L20) | 텍스트 교체 |
| 1 | `js/data/mainQuests/doctor/branch_a.js` | `mq_doctor_a_13.narrative.complete` (L48) | 텍스트 교체 |
| 2 | `js/data/mainQuests/doctor/shared.js` | `mq_doctor_10.branchOptions` (L418~437) | label·desc 3건 교체 |
| 2 | `js/data/mainQuests/doctor/shared.js` | `mq_doctor_10.narrative.complete` (L440) | 텍스트 교체 |
| 3 | `js/data/mainQuests/doctor/shared.js` | `mq_doctor_side_01`~`side_06`, `side_end` (L593~696) | 각 퀘스트에 `requiresFlag: 'doctor_branch_c'` 추가 (7건) |
| 3 | `js/data/mainQuests/doctor/shared.js` | `mq_doctor_side_end.desc` (L679) | "A·B루트 부가 엔딩" 문구 삭제 |
| 4 | `js/data/mainQuests/doctor/shared.js` | `mq_doctor_09` (L376~408) | desc·narrative·subObjective·actionHint 교체 |
| 4 | `js/data/mainQuests/doctor/shared.js` | `mq_doctor_side_03.narrative` (L626~628) | 텍스트 절제 교체 |
| 5 | — | — | 수정 없음 (정합 확인 완료) |
| 6 | — | — | 수정 없음 (의도 일치 확인) |

순수 신규 코드 추가는 문제 3의 `requiresFlag` 7줄뿐이며, 나머지는 모두 기존 필드 텍스트 교체다. 객체 구조·필드명은 기존 그대로 유지한다.

## 검증 방법

1. **데이터 무결성 검증**
   ```
   node js/data/validate.js
   ```
   퀘스트 objective의 `definitionId`가 실제 아이템(`plague_vaccine`, `herb`, `bandage` 등)을 가리키는지, flag 명칭 충돌이 없는지 확인.

2. **분기 상호배타 수동 검증 (문제 3)**
   - Q10에서 A 선택 → `gs.flags.doctor_branch_a = true`, `doctor_branch_c`는 unset.
   - `QuestSystem.js:826` 게이트에 의해 `mq_doctor_side_01`은 `requiresFlag: 'doctor_branch_c'` 미충족 → `startQuest` 호출 안 됨.
   - 콘솔에서 `GameState.quests.active.map(q=>q.id)` 확인 시 side 체인이 활성 목록에 없어야 함.

3. **엔딩 도달 검증 (문제 6)**
   - A1: `mq_doctor_end_a1` 완료 → `mainQuestComplete_doctor`, `doctor_ending: 'a1_vaccine'` set → `mq_doctor` 엔딩 조건(100일+) 충족.
   - C: `mq_doctor_side_end` 완료 → `doctor_ending: 'c_vaccine'` set. (설계안 1 적용 시 C 플래그 보유자만 도달.)

4. **텍스트 회귀 검증**
   ```
   grep -n "세브란스 데이터가 필요했거든요\|세브란스 데이터가 맞았어요" js/data/mainQuests/doctor/
   ```
   → 수정 후 0건이어야 함 (거짓 데이터 서술 제거 확인).

5. **i18n 영향** — 변경 항목은 모두 한글 본문 텍스트와 `requiresFlag`이며 `nameEn`/`titleKey` 키 구조는 건드리지 않는다. subObjective의 `textEn`은 Q09에서 1건 교체했으므로 한/영 쌍이 유지되는지 육안 확인.

# 시나리오 수정 설계서 — firefighter (박영철)

> 작성: 시나리오 기획 페르소나 "한도연"
> 대상 캐릭터: `firefighter` / 박영철, 44세 / 용산 화재 출동 → 동료 이재훈 감염 → 탈출 / homeDist=eunpyeong
> goal(characters.js): "은평구 집으로 돌아가 가족의 생사를 확인하고, 생존자들을 위한 거점 거주지를 구축한다."

## 실제 파일 재확인 결과 (수정 전 사실관계)

- 실사용 소스: `js/data/mainQuests/firefighter/index.js`가 `shared.js + branch_a.js + branch_b.js`를 병합한다. `js/data/mainQuests/firefighter.js`(단일 파일·30퀘스트 주석)는 **import되지 않는 레거시**다. `js/data/mainQuests.js`의 firefighter 블록(403행~)도 `mainQuests/index.js` 경로와 별개로 존재하나 본 설계 대상이 아니다. **수정은 `firefighter/` 폴더에만 적용한다.**
- 분기점은 두 곳:
  - Q10(`mq_fire_10`, shared.js) `isBranchPoint` → `fire_branch_a`(가족) / `fire_branch_b`(정대한, `recruitNpc: 'npc_daehan'`).
  - Q15(`mq_fire_a_15` / `mq_fire_b_15`) → 엔딩 분기.
- 엔딩 정의(`js/data/endings.js`)에 firefighter용은 **2개뿐**: `char_firefighter`(폴백, 가족 재회, mq_fire_01 미시작 + day≥180 + eunpyeong 방문 + structuresBuilt≥3), `mq_firefighter`(메인 완료, `mainQuestComplete_firefighter` + day≥100, "가족과 함께 100일 생존").
- 퀘스트가 set하는 `fire_ending`(`a1_shelter`/`a3_memorial`/`b3_escape`) 플래그를 **읽는 엔딩 정의는 endings.js에 없다.** 단, `js/data/endingImages.js`에는 a1_shelter / a3_memorial / b3_escape 세 이미지가 등록돼 있다(86~102행). 즉 엔딩 이미지·플래그는 3분기를 가정하는데 엔딩 텍스트는 2개로 수렴한다.
- 이재훈 사망: `mq_fire_01.complete`에 "이재훈은... 이미 늦었다."가 이미 있다. Q03·Q05는 추모 톤이나 사망을 **직접 확정·목격하는 장면**은 없다.

---

## [문제 1] B경로 가족 포기 미명시 (중요)

### [파일:퀘스트ID]
`js/data/mainQuests/firefighter/shared.js` → `mq_fire_10.branchOptions` / `mq_fire_10.narrative`
`js/data/mainQuests/firefighter/branch_b.js` → `mq_fire_b_11`

### [현재]
Q10 분기 선택지 B는 "정대한과 대형 대피소 건설 / 더 많은 사람을 구하려면 거점이 필요하다."뿐이다. 캐릭터 핵심 goal인 "은평 가족"을 포기·보류한다는 무게가 어디에도 없다. B경로 첫 퀘스트(`mq_fire_b_11`)도 성수동 이동 동기만 말하고 가족을 언급하지 않는다. 플레이어는 "은평이 바로 위"라는 Q9·Q10 narrative를 본 직후 가족을 두고 반대 방향으로 떠나는데, 그 대가가 침묵된다.

### [수정 후 전문]

`mq_fire_10.branchOptions` — B 선택지 desc 교체:
```js
    branchOptions: [
      {
        label: '가족 구출 최우선',
        desc: '은평 불광동. 가족이 먼저다. 더 큰 거점은 포기한다.',
        setsFlag: 'fire_branch_a',
      },
      {
        label: '정대한과 대형 대피소 건설',
        desc: '가족 확인을 미룬다. 더 많은 사람을 살리는 쪽을 택한다.',
        setsFlag: 'fire_branch_b',
        recruitNpc: 'npc_daehan',
      },
    ],
```

`mq_fire_10.narrative.complete` 교체:
```js
    narrative: {
      start: '서대문구. 은평구가 바로 위다. 조금만 더. 가족이 다쳤을 수도 있다. 치료 물자 없이 가면 안 된다.',
      complete: '의료 물자를 확보했다. 부목과 진통제까지 챙겼다. 무전기에서 정대한의 목소리가 다시 들렸다. "소방관님, 혼자 가족 데려오는 것보다, 같이 만들면 수십 명이 삽니다." 쌍안경 너머 불광동 아파트가 보인다. 저기 아내와 아이들이 있을지 모른다. 한 걸음이면 가족, 반대로 돌면 낯선 수십 명. 둘 다 가질 수는 없다.',
    },
```

`mq_fire_b_11.narrative` 교체:
```js
    narrative: {
      start: '불광동을 등지고 돌아섰다. 쌍안경 속 빨간 현관문이 점점 작아졌다. 정대한의 무전. "소방관이라면서요? 성수동에 제 공장이 있어요. 같이 대피소 만들 수 있어요." 가족은 나중에. 지금은 더 많은 사람. 스스로에게 그렇게 말했다.',
      complete: '성수동 공장. 정대한이 이미 작업을 시작하고 있었다. "왔군요. 소방관 손이 필요했어요." 공장 창고에서 손전등도 발견했다. 가족 생각이 떠오를 때마다 손을 더 빨리 움직였다.',
    },
```

### [이유]
분기는 "A를 얻으면 B를 잃는다"여야 한다. B를 고른 순간 잃는 것(가족 확인)을 선택지 desc·분기 narrative·B경로 첫 장면 세 곳에서 못박아, 회색지대를 플레이어가 자기 선택으로 짊어지게 한다. 과장 없이 "둘 다 가질 수는 없다" 한 문장으로 무게를 준다.

---

## [문제 2] 이재훈 사망 시점 확정 장면 부재

### [파일:퀘스트ID]
`js/data/mainQuests/firefighter/shared.js` → `mq_fire_03`(`이재훈을 위해`)

### [현재]
`mq_fire_01.complete`에 "이재훈은... 이미 늦었다."가 있어 사망이 암시되지만, 영철이 그의 최후를 **직접 마주하는 장면**은 없다. Q03·Q05는 "이것만 있었어도", "혼자 마셔야겠지" 같은 회상 톤이라 죽음이 확정됐는지 모호하게 읽힐 수 있다. 추모 엔딩(`mq_fire_end_a3`)까지 가서야 비석으로 죽음이 확정된다. 죽음을 매듭짓는 장면은 Q03이 적합하다 — 제목이 '이재훈을 위해'이고, 감염 직후(Q01)와 추모(엔딩) 사이의 중간 지점이기 때문이다.

### [수정 후 전문]

`mq_fire_03.narrative` 교체:
```js
    narrative: {
      start: '용산을 떠나기 전, 마지막으로 이재훈에게 돌아갔다. 그는 더 이상 말을 하지 못했다. 눈만 영철을 향했다. 소방관 둘이 지키던 규칙대로, 영철은 그를 고통 없이 보냈다. "미안하다, 재훈아." 이제 할 수 있는 건 앞으로 나아가는 것뿐이다.',
      complete: '응급 키트를 꾸렸다. 붕대도 여분으로 챙겼다. 이재훈이 살아있었다면 이걸로 누군가를 살렸을 거다. 소방관은 항상 준비돼 있어야 한다.',
    },
```

### [이유]
감염(Q01) → 사망 확정(Q03) → 추모(엔딩 a3)로 이재훈의 죽음이 한 번 분명히 닫힌다. "고통 없이 보냈다"는 절제된 표현으로 직접 묘사를 피하면서도 영철이 동료를 자기 손으로 떠나보냈다는 사실을 확정한다. objective(의료 3개 수집)와 "이재훈이 살아있었다면 이걸로 누군가를 살렸을 거다"가 정합한다.

---

## [문제 3] 규모 비약 — "50명 대피소"를 구조물 3개로 완성

### [파일:퀘스트ID]
`js/data/mainQuests/firefighter/branch_b.js` → `mq_fire_b_12`(complete), `mq_fire_b_13`(complete)

### [현재]
`mq_fire_b_12.complete`에 정대한이 "이 정도면 50명은 거뜬해요."라고 단언한다. 그런데 골격(`mq_fire_b_13`)은 구조물 3개, 가족용 A경로 은신처(`mq_fire_a_13`)는 구조물 2개다. 고철 6개·구조물 3개로 "50명 완성"은 A경로 가족 거점(구조물 2개)과 스케일이 어긋난다. 50명은 설계 의도(목표)일 뿐 완성 규모가 아니다.

### [수정 후 전문]

`mq_fire_b_12.complete` 교체:
```js
    narrative: {
      start: '정대한: "철근이 있으면 벽을 세울 수 있어요. 공단 주변에 고철이 많아요." 소방관의 눈에는 구조가 보인다.',
      complete: '고철을 확보했다. 공단에서 덕트 테이프와 못도 함께 발견했다. 정대한이 설계를 그렸다. "다 지으면 수십 명은 들일 수 있어요. 지금은 첫 구역부터." 영철은 도면을 보며 비상구 동선부터 점검했다.',
    },
```

`mq_fire_b_13.complete` 교체:
```js
    narrative: {
      start: '정대한의 기계 지식 + 박영철의 구조 안전 감각. 두 사람이 함께하니 속도가 두 배가 됐다.',
      complete: '첫 구역 골격이 섰다. 작업 중 로프도 발견했다. 한 번에 수십 명은 아니다. 한 구역씩, 사람이 오는 만큼 늘려간다. 정대한: "소방관이 옆에 있으니 안전하게 잘 됩니다." 박영철: "기계공이 있으니 빠르게 됩니다."',
    },
```

### [이유]
"50명 거뜬"이라는 완성 단언을 "다 지으면 수십 명, 지금은 첫 구역"이라는 단계적 확장으로 바꿔, 구조물 3개=초기 골격이라는 게임 상태와 narrative를 정합시킨다. "한 구역씩, 사람이 오는 만큼"은 대피소가 점진적으로 커진다는 현실 감각을 주고 A경로(가족 거점 구조물 2개)와의 스케일 모순을 제거한다. 정대한 핵심 톤(공학적 계산)은 유지한다.

---

## [문제 4] 회색지대 부재 — A/B 선택 시 잃는 것 명시

### [파일:퀘스트ID]
A측: `js/data/mainQuests/firefighter/shared.js` `mq_fire_10.branchOptions[0]` + `branch_a.js` `mq_fire_a_11.narrative`
B측: 문제 1에서 처리(B 선택지·B11)

### [현재]
A 선택지는 "은평 불광동. 가족이 먼저다."로 끝나 가족을 택할 때 **포기하는 것(더 많은 사람을 살릴 기회)**이 없다. A경로 첫 퀘스트(`mq_fire_a_11`)도 재회의 안도만 그리고, 정대한·대피소를 등진 무게가 없다.

### [수정 후 전문]

A 선택지 desc는 문제 1의 `mq_fire_10.branchOptions[0]`("…더 큰 거점은 포기한다.")로 함께 처리한다.

`mq_fire_a_11.narrative` 교체:
```js
    narrative: {
      start: '은평구. 거의 다 왔다. 정대한의 무전은 더 이상 받지 않았다. 수십 명을 살릴 수 있었을지도 모른다. 그래도 영철은 빨간 현관문 쪽으로 걸었다. 아파트 3층, 빨간 현관문.',
      complete: '"영철이야?" 아내의 목소리였다. 살아있었다. 두 아이도. 무릎이 꺾였다. 정대한도, 수십 명의 낯선 얼굴도 떠오르지 않았다. 지금은 이 셋이면 됐다. 이동 중 들른 은평 소방서 비상 창고에서 붕대도 챙겼다.',
    },
```

### [이유]
A를 택하면 "정대한·수십 명"을 잃는다는 사실을 start에서 명시하고, complete에서 "지금은 이 셋이면 됐다"로 그 상실을 영철 스스로 받아들이게 한다. B(가족 상실)와 대칭을 이뤄 어느 쪽도 무손실이 아님을 보여준다. 과장 형용사 없이 행동("무전을 더 이상 받지 않았다")으로 포기를 드러낸다.

---

## [문제 5] B경로 엔딩에서 가족 운명 미매듭 + 폴백 엔딩 미도달

### [파일:퀘스트ID]
`js/data/mainQuests/firefighter/branch_b.js` → `mq_fire_end_b3`(complete)
관련 참조: `js/data/endings.js` `mq_firefighter`(441행), `char_firefighter`(320행)

### [현재 — 코드 사실관계]
- `mq_fire_end_b3.reward.flags`는 `mainQuestComplete_firefighter: true` + `fire_ending: 'b3_escape'`를 set한다.
- endings.js `mq_firefighter` 조건은 `mainQuestComplete_firefighter && day≥100`만 본다. 즉 **B경로(가족 한 번도 못 만남)로 클리어해도 "박영철: 은평의 수호자 — 가족과 함께 100일 생존" 엔딩이 출력된다.** 이는 서사 모순이다.
- 폴백 엔딩 `char_firefighter`(가족 재회)는 `!mainQuestComplete_firefighter`를 요구하므로 B경로 클리어 시 도달 불가. 의도된 폴백이 아니라, B경로 전용 엔딩 텍스트가 endings.js에 **부재**한 것이 원인이다.
- endingImages.js에는 `b3_escape` 이미지가 이미 있으나, 이를 띄울 엔딩 정의가 없다.

### [판정]
char_firefighter(가족 재회) 폴백 미도달은 **의도된 설계가 아니라 누락**이다. B경로는 가족 재회를 하지 않으므로 폴백이 떠서도 안 된다. 올바른 해법은 **B경로 전용 엔딩 텍스트를 추가**하고, 그 안에서 가족의 운명을 매듭짓는 것이다.

### [수정 후 전문 — 두 부분]

(1) 퀘스트 측: `mq_fire_end_b3.narrative.complete`에 가족 매듭 한 줄 보강(퀘스트 데이터 범위):
```js
    narrative: {
      start: '대피소를 생존자들에게 맡긴다. 정대한: "더 안전한 곳을 찾아야죠. 같이 가요." 소방관과 기계공. 어디서든 살아남을 수 있다.',
      complete: 'D+100. 서울 외곽. 정대한이 전투 식량 3팩을 챙겼다. "가는 길에 먹읍시다." 영철은 마지막으로 북쪽을 봤다. 은평. 끝내 가보지 못한 빨간 현관문. "나중에, 길이 안전해지면, 꼭 가볼 겁니다." 정대한은 말없이 고개를 끄덕였다. 박영철: "이재훈도 살아남았으면 같이 갔을 텐데." 두 사람은 걸었다.',
    },
```

(2) 엔딩 측(설계 권고 — `js/data/endings.js`): `mq_firefighter` 조건에 A경로 한정을 추가하고, B경로 전용 엔딩을 신설한다. 본 설계서는 퀘스트 데이터가 1차 범위이나, 서사 정합을 위해 엔딩 정의 변경이 필수임을 명시한다.

`mq_firefighter` 조건 보강(가족 재회 엔딩을 A경로로 한정):
```js
    condition: (gs) => {
      return gs.player.characterId === 'firefighter'
          && (gs.flags.mainQuestComplete_firefighter ?? false)
          && gs.flags.fire_ending !== 'b3_escape'
          && gs.time.day >= 100;
    },
```

신규 엔딩 `mq_firefighter_b3`(B경로 전용, endingImages.js의 b3_escape와 연결):
```js
  mq_firefighter_b3: {
    id: 'mq_firefighter_b3', category: 'character', characterId: 'firefighter',
    title: '박영철: 떠나는 사람',     subtitle: '대피소를 남기고 서울 밖으로',
    gradient: 'linear-gradient(160deg,#1a0800 0%,#2a1208 60%,#140600 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'firefighter'
          && (gs.flags.mainQuestComplete_firefighter ?? false)
          && gs.flags.fire_ending === 'b3_escape'
          && gs.time.day >= 100;
    },
    narrative: [
      '100일. 성수동 공장은 수십 명의 대피소가 됐다.',
      '영철은 그곳을 생존자들에게 맡기고 정대한과 길을 나섰다.',
      '한 번도 가보지 못한 은평이 등 뒤로 멀어졌다.',
      '많은 사람을 살렸다. 대신 가족의 생사는 끝내 모른 채로 남았다.',
      '"길이 안전해지면, 그때 불광동으로 갑니다." 영철은 북쪽을 한 번 더 봤다.',
    ],
  },
```

### [이유]
- B경로 클리어 시 가족 재회 엔딩이 뜨는 모순을 `fire_ending !== 'b3_escape'` 조건으로 차단한다.
- 신규 `mq_firefighter_b3`가 가족의 운명을 "끝내 모른 채로 남았다"로 명시적으로 매듭짓는다 — 행복한 재회가 아니라 **유보된 상실**로. 이것이 B경로(더 많은 사람 vs 가족)의 회색지대를 엔딩까지 일관되게 끌고 간다.
- endingImages.js의 b3_escape 이미지가 비로소 표시될 엔딩 정의를 얻는다.
- A1(은평 대피소)·A3(추모)도 현재 endings.js에 전용 엔딩 텍스트가 없고 `mq_firefighter` 하나로 수렴한다. 본 설계의 1차 목표(B경로 가족 매듭)는 위로 해결되며, A1/A3 분리는 별도 후속 과제로 남긴다(아래 후속 과제 참조).

---

## [문제 6] 서사-목표 정합 · 필드명 점검

### 점검 결과 (실제 파일 대조)
- **필드명**: 모든 퀘스트가 `id/title/desc/icon/characterId/dayTrigger/prerequisite/objective/reward/failPenalty/deadlineDays/narrative`를 일관 사용. `isBranchPoint`, `branchOptions[].setsFlag`, `branchOptions[].recruitNpc`, `requiresFlag`도 다른 직업(soldier/doctor)과 동일 스키마. **신규 필드 도입 없음** — 위 수정은 모두 기존 필드의 텍스트 변경 + endings.js 엔딩 1건 추가뿐이다.
- **objective vs narrative 정합**:
  - `mq_fire_b_12` objective는 `scrap_metal 6` — 수정 후 "수십 명…첫 구역부터"와 정합(완성 아닌 자재 확보 단계).
  - `mq_fire_b_13` objective는 `craft_item structure 3` — "첫 구역 골격"과 정합.
  - `mq_fire_03` objective는 `medical 3` — "이재훈이 살아있었다면 이걸로 누군가를 살렸을 거다"와 정합.
  - `mq_fire_a_11` objective는 `visit_district eunpyeong` — 재회 narrative와 정합.
- **이재훈 연령**: `mq_fire_end_a3.complete`에 "이재훈 (1985–2026)". 박영철 44세(2026년 기준 1982년생)와 이재훈 1985년생(41세)은 모순 없음(후배 동료로 자연스러움). 변경 불요.
- **dayTrigger 일관성**: A/B경로 모두 Q11=65, Q12=95, Q13=125, Q14=155, Q15=185, 엔딩=205로 대칭. 변경 불요.

---

## 적용 체크리스트

- [ ] `shared.js` `mq_fire_10.branchOptions[0].desc` → "…더 큰 거점은 포기한다." (문제 1·4)
- [ ] `shared.js` `mq_fire_10.branchOptions[1].desc` → "가족 확인을 미룬다. …" (문제 1)
- [ ] `shared.js` `mq_fire_10.narrative.complete` → "둘 다 가질 수는 없다." 보강 (문제 1)
- [ ] `shared.js` `mq_fire_03.narrative.start/complete` → 이재훈 최후 확정 (문제 2)
- [ ] `branch_b.js` `mq_fire_b_11.narrative.start/complete` → 가족 등지는 무게 (문제 1)
- [ ] `branch_b.js` `mq_fire_b_12.narrative.complete` → "수십 명…첫 구역부터" (문제 3)
- [ ] `branch_b.js` `mq_fire_b_13.narrative.complete` → "첫 구역 골격…한 구역씩" (문제 3)
- [ ] `branch_b.js` `mq_fire_end_b3.narrative.complete` → 가족 매듭 한 줄 (문제 5)
- [ ] `branch_a.js` `mq_fire_a_11.narrative.start/complete` → 정대한·수십 명 포기 명시 (문제 4)
- [ ] `endings.js` `mq_firefighter.condition` → `fire_ending !== 'b3_escape'` 추가 (문제 5)
- [ ] `endings.js` `mq_firefighter_b3` 신규 엔딩 추가 (문제 5)

## 검증 방법

1. **데이터 무결성**: `node js/data/validate.js` 실행 — 퀘스트 필드/플래그/objective 스키마 검증 통과 확인.
2. **분기 도달성 수동 점검**: `firefighter/index.js` 병합 객체에서 `requiresFlag`/`setsFlag` 체인이 끊기지 않는지 확인 — Q10(`fire_branch_a`|`fire_branch_b`) → Q11~Q15 → 엔딩 플래그(`fire_end_a1`/`fire_end_a3`/`fire_end_b3`) → `fire_ending`(`a1_shelter`/`a3_memorial`/`b3_escape`).
3. **엔딩 매칭 검증**: B경로 클리어 시뮬 상태(`mainQuestComplete_firefighter=true`, `fire_ending='b3_escape'`, day≥100, eunpyeong 미방문)에서 `mq_firefighter`(재회)가 **걸러지고** `mq_firefighter_b3`만 매칭되는지 endings.js condition 함수로 확인.
4. **이미지 연결 확인**: `endingImages.js`의 `b3_escape`가 신규 `mq_firefighter_b3`와 코드 매핑 규칙으로 연결되는지(엔딩 코드→이미지 키 매핑부) 확인.
5. **톤 리뷰**: 추가 대사에 과장 형용사·이모티콘·메타 주석이 없는지 육안 확인(절제 톤 유지).

## 후속 과제 (본 설계 범위 밖, 별도 트랙)

- A1(은평 대피소)·A3(이재훈 추모) 전용 엔딩 텍스트가 endings.js에 없어 둘 다 `mq_firefighter` 하나로 수렴한다. endingImages.js에는 a1_shelter·a3_memorial 이미지가 이미 존재하므로, B경로와 동일한 패턴으로 A1/A3 전용 엔딩 정의 추가가 필요하다. 본 설계서의 1차 목표(B경로 가족 포기·매듭)와 분리해 후속 진행 권장.

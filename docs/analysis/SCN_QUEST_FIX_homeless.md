# 최형식(homeless) 시나리오 수정 설계서

> 시나리오 기획 페르소나 한도연. 분기는 "A를 얻으면 B를 잃는다" 형식. 절제된 문장.
> 대상: `js/data/mainQuests/homeless/{shared,branch_a,branch_b}.js`, `js/data/characters.js`, `js/data/endings.js`
> 제약: NPC trust 공식·밸런스 수치·메커닉 미변경. 퀘스트 데이터(텍스트·objective·flag·대사)만 손댄다. 기존 필드명 준수.

---

## 코드 검증 요약 (수정 전 확인 사항)

- `js/ui/ModalManager.js:190-232` `showBranchChoice`는 분기 옵션의 `label`, `desc`, `recruitNpc`(동반자 배지), **`warning`(경고 배지)** 4개 필드를 렌더링한다. "잃는 것" 명시는 기존 `warning` 필드를 그대로 쓰면 된다. doctor(`doctor/shared.js:435`)·engineer(`engineer/branch_b.js:85`)가 이미 `warning`을 난이도/비용 경고로 사용 중이므로 패턴이 일치한다.
- `js/systems/QuestSystem.js:975-977` 분기 발화는 `isBranchPoint && branchOptions`일 때만 emit. 구조 변경 없이 텍스트만 보강 가능.
- `char_homeless`(`endings.js:341-352`) 폴백 조건은 `districtsVisited.includes('songpa')`를 요구. A경로(`branch_a.js`)는 강남(`gangnam`)만 방문하고 송파를 거치지 않는다 → A경로 순수 진행 시 폴백 엔딩 도달 불가. 사실로 확인됨.
- `goal`(`characters.js:244`)은 "롯데타워 합류"로 고정. A경로의 강남 거점과 목표 문구가 어긋난다. 사실로 확인됨.

---

## 문제 1 — A경로 주인공 주도권 상실

**[파일:퀘스트ID]** `branch_a.js` : `mq_homeless_a_11`, `mq_homeless_a_12`, `mq_homeless_a_13`, `mq_homeless_a_14`

**[현재]**
A경로 narrative가 이지수 중심으로 흐른다. 최형식은 "물자를 가져다주는 사람"으로 축소되고, 이지수의 대사("~수용 가능해요", "~치료했어요")가 매 퀘스트 완료를 마무리한다. CEO 출신·거리 생존 2년이라는 정체성이 드러나지 않는다.

**[수정 후 전문]**

`mq_homeless_a_11.narrative`
```js
    narrative: {
      start: '이지수가 삼성병원 부근에서 치료소를 운영하고 있다. 의사 한 명에 환자만 쌓여 있다. 약은 있어도 물자도, 사람도, 동선도 없다. 그건 내 영역이다.',
      complete: '이지수를 만났다. "최 대표님 얘기는 들었어요. 솔직히 저 혼자선 이 치료소 못 굴려요." 둘러봤다. 보급 동선이 엉켜 있었다. "치료는 의사가, 나머지는 내가 맡죠." 비상 박스에서 붕대를 챙겼다. 역할이 갈렸다.',
    },
```

`mq_homeless_a_12.narrative`
```js
    narrative: {
      start: '치료소와 거주 공간을 함께 짓는다. 도면은 내가 그린다. 동선, 격리 구획, 자재 순서 — 현장 소장 시절 몸에 밴 일이다. 이지수는 의료 동선만 짚어주면 된다.',
      complete: '공동 거점 완성. 작업 중 로프도 챙겼다. 이지수가 도면을 보고 말했다. "이 구조라면 환자 15명은 동시에 봐요. 저는 못 그릴 그림이네요."',
    },
```

`mq_homeless_a_13.narrative`
```js
    narrative: {
      start: '치료소에 사람이 모이기 시작했다. 치료만으로는 못 산다. 먹어야 산다. 강남 일대 물자 루트와 거리 인맥 — 공급망은 내가 깐다. 건설회사 때 제일 잘하던 일이다.',
      complete: '식량 확보 완료. 강남 마트에서 통조림도 여분으로 빼냈다. 이지수: "최 대표님이 오고 나서 사람이 안 굶어요." 거점이 돌아가기 시작했다. 치료소가 아니라 마을이 됐다.',
    },
```

`mq_homeless_a_14.narrative`
```js
    narrative: {
      start: '"강남에 의사가 있고, 물자도 있다." 소문은 내가 거리 인맥에 흘린 것이다. 하루 환자 8명. 물자가 빠르게 빈다. 보급은 끊기면 안 된다. 그게 내 책임이다.',
      complete: '치료 물자 보충 완료. 진통제와 소독약도 챙겼다. 이지수: "오늘 7명 봤어요. 형식 씨가 물자 안 끊으니까 가능한 거예요." 시스템이 돈다. 내가 설계한 시스템이.',
    },
```

`mq_homeless_a_15.narrative`
```js
    narrative: {
      start: '100일. 거점에 38명이 모였다. 치료소는 이지수가, 마을은 내가 세웠다. 이제 방향을 정한다.',
      complete: '이지수가 구급키트를 건넸다. "최 대표님, 여기 정리하고 더 좋은 곳을 같이 찾아볼까요? 결정은 대표님이 하세요." 오래 생각했다.',
    },
```

**[이유]** 주도성은 "역할 분담"을 명시할 때 산다. 의료=이지수, 물류·조직·도면·인맥=최형식으로 경계를 그으면 보조가 아니라 공동 운영자가 된다. 이지수 대사를 "당신이 있어야 가능하다"는 인정으로 바꿔 주도권을 최형식에게 돌린다. 마지막 결정권("결정은 대표님이")까지 최형식에게 둔다.

---

## 문제 2 — 회색지대 부재 (선택의 대가 미명시)

**[파일:퀘스트ID]** `shared.js` : `mq_homeless_10.branchOptions`

**[현재]**
```js
    branchOptions: [
      {
        label: '이지수 의사와 협력',
        desc: '의료+커뮤니티 결합. 의사가 있으면 살아남을 확률이 높아진다.',
        setsFlag: 'homeless_branch_a',
        recruitNpc: 'npc_jisu',
      },
      {
        label: '롯데타워 자력 커뮤니티',
        desc: '내 방식대로. 아무것도 없어도 버텨온 사람이다.',
        setsFlag: 'homeless_branch_b',
      },
    ],
```
얻는 것만 적혀 있고 잃는 것이 없다. 두 선택 모두 장점뿐이라 트레이드오프가 보이지 않는다.

**[수정 후 전문]**
```js
    branchOptions: [
      {
        label: '이지수 의사와 협력 (강남 치료소)',
        desc: '의료를 얻는다. 이지수가 동행하고, 거점은 치료 중심으로 선다.',
        setsFlag: 'homeless_branch_a',
        recruitNpc: 'npc_jisu',
        warning: '롯데타워를 포기한다. 강남에 머무는 만큼 대규모 자치 커뮤니티는 꿈꾸지 않는다. 규모보다 사람을 택하는 길.',
      },
      {
        label: '롯데타워 자력 커뮤니티 (송파)',
        desc: '규모를 얻는다. 타워를 본거지로 수십 명의 커뮤니티를 세운다.',
        setsFlag: 'homeless_branch_b',
        warning: '의사가 없다. 다친 사람은 내 손으로 감당해야 한다. 의료 역량을 포기하는 대신 독립과 규모를 택하는 길.',
      },
    ],
```

**[이유]** `warning` 필드는 `showBranchChoice`가 빨간 경고 배지로 렌더한다(검증 완료). "A를 얻으면 B를 잃는다"를 코드 변경 없이 명시할 수 있는 정확한 위치다. A=대규모 커뮤니티·독립성 포기, B=의료 역량 포기로 대가를 분명히 했다. label에 행선지(강남/송파)를 붙여 문제 4의 동선 괴리도 선택 시점에 미리 드러낸다.

---

## 문제 3 — Q9 "두 제안" 화자 불명

**[파일:퀘스트ID]** `shared.js` : `mq_homeless_09`

**[현재]**
```js
      complete: '8일치 식량. 강남 건물에서 손전등도 발견했다. 두 가지 제안이 들려왔다. 의사 이지수가 치료소를 함께 운영하자고 한다. 롯데타워에서 누군가가 혼자 버티고 있다는 소문도 들렸다.',
```
누가 이지수의 제안을 전했는지, 롯데타워 소문이 어디서 왔는지 출처가 없다. "들려왔다"는 화자 없는 정보다.

**[수정 후 전문]**
```js
    narrative: {
      start: '강남에서 잠실까지. 회사 다닐 때는 차로 20분이었다. 지금은 하루 이상 걸린다. 강남 골목에서 광진 낚시꾼 중 한 명을 다시 만났다.',
      complete: '8일치 식량. 강남 건물에서 손전등도 발견했다. 낚시꾼이 두 가지 소식을 전했다. "삼성병원 쪽 이지수라는 의사가 사람 찾는대요. 물자 대줄 사람." 그리고 또 하나. "롯데타워엔 누가 혼자 버틴다던데, 무리를 못 모은대요." 길이 둘로 갈렸다.',
    },
```

**[이유]** Q5에서 이미 등장한 광진 낚시꾼 집단을 정보 출처로 재활용한다(새 NPC 추가 없음). 거리 인맥이 정보망이라는 최형식의 정체성과도 맞물린다. 이지수 제안은 "물자 대줄 사람을 찾는다"로, 롯데타워 소문은 "리더가 없어 무리를 못 모은다"로 구체화해 두 분기의 진입 동기를 자연스럽게 깐다. (기존 `mq_homeless_09`에는 `narrative.start`가 있으므로 start도 함께 제시한다.)

---

## 문제 4 — goal "합류" vs A경로 "강남 거점" 괴리

**[파일]** `characters.js` : `homeless.goal` (244행)

**[현재]**
```js
    goal: '잠실 롯데타워의 생존자 요새에 합류하고, 거리 생존 노하우를 공유해 집단 생존 체계를 구축한다.',
```
"롯데타워 합류"로 단정돼 A경로(강남 치료소)와 어긋난다.

**[수정 후 전문]**
```js
    goal: '한강을 건너 강 이남에 생존 거점을 세운다. 거리 생존 노하우와 공급망 감각을 살려, 자력 커뮤니티든 의료 거점이든 사람이 굶지 않는 체계를 만든다.',
```

**[이유]** goal을 분기 포용형으로 재정의한다. "강 이남 거점"은 강남(A)과 송파(B)를 모두 포괄한다. "자력 커뮤니티든 의료 거점이든"으로 두 길을 명시적으로 열어, 선택 전 goal이 한쪽을 단정하지 않게 한다. 핵심 정체성(물류·공급망·거리 노하우)은 유지한다. 메커닉·능력치는 손대지 않는다.

> 보조 정합: `mq_homeless_07.narrative.start`("저 위, 롯데타워에서 사람들이 손을 흔드는 것 같았다")는 B경로 암시가 강하다. A경로 진입도 자연스럽도록 아래로 보강한다.
>
> `mq_homeless_07.narrative.start` 수정 후:
> ```js
>       start: '강을 건너기 전에 제대로 된 거처가 필요하다. 강 이남 어딘가에 자리를 잡아야 한다. 롯데타워든, 다른 거점이든.',
> ```
> 이유: 특정 행선지를 단정하지 않고 강 이남 정착이라는 공통 동기만 남겨 A/B 양쪽 진입을 모두 받친다.

---

## 문제 5 — A경로 폴백 엔딩 사각

**[파일]** `endings.js` : `char_homeless` (341-352행), `branch_a.js` 전반

**[현재]**
`char_homeless` 폴백 엔딩은 `districtsVisited.includes('songpa')`를 요구한다. 그러나 A경로는 강남(`gangnam`)만 방문하고 송파를 거치지 않는다. 메인 퀘스트만 따라가고 자유 탐색을 안 하면 A경로 플레이어는 폴백 엔딩 조건을 영영 못 채운다.

확인: `branch_a.js`의 `visit_district` objective는 `mq_homeless_a_11`의 `gangnam` 하나뿐. songpa 방문 퀘스트 없음.

**[판정]** 의도된 설계가 아니다. 폴백 엔딩 `char_homeless`는 "메인 미완료 + 90일 생존 + 송파 방문 + 아이템 50개"로 롯데타워 정착을 그린다. A경로 플레이어는 롯데타워가 아닌 강남에 정착하므로, 송파 조건은 A경로 서사와도 맞지 않는다. 송파를 강제로 끼워 넣으면 A경로 동선이 깨진다.

**[수정 후 전문]**
폴백 엔딩 조건에서 행선지를 분기 포용형으로 바꾼다. `endings.js` `char_homeless.condition`:
```js
    condition: (gs) => {
      return gs.player.characterId === 'homeless'
          && !(gs.flags.mainQuestComplete_homeless ?? false)
          && !gs.quests.completed.includes('mq_homeless_01')
          && gs.time.day >= 90
          && (gs.location.districtsVisited.includes('songpa')
              || gs.location.districtsVisited.includes('gangnam'))
          && (gs.flags.totalItemsFound ?? 0) >= 50;
    },
```
그리고 폴백 narrative를 행선지 중립으로 조정한다:
```js
    narrative: [
      '강을 건넜다. 강 이남 어딘가, 불이 켜진 건물이 보였다.',
      '동호대교 아래에서 2년을 살았다. 아무것도 없이.',
      '건물 입구에서 소리가 났다. 사람들. 살아있는 사람들.',
      '"올라오세요. 자리 있어요." 누군가 말했다.',
      '최형식은 처음으로 웃었다. 집이 생겼다.',
    ],
```
subtitle도 `'한강 이남 생존자 거점'`으로 일반화.

**[이유]** A경로는 강남, B경로는 송파에 정착한다. 폴백은 메인을 끝내지 못한 플레이어를 위한 안전망이므로, 두 행선지 중 하나라도 밟으면 도달하게 열어 사각을 없앤다. narrative에서 "롯데타워 42층" 같은 송파 고정 표현을 빼 두 경로 모두에 어울리게 한다. (정식 엔딩 `mq_homeless`는 `mainQuestComplete_homeless` 플래그로만 걸리고 행선지 조건이 없으므로 수정 불필요 — 검증 완료.)

---

## 문제 6 — 사업 파트너 화해 서브플롯 부재

**[파일:퀘스트ID]** `shared.js` : 신규 `mq_homeless_side_06` (선택형, 가벼운 1건)

**[현재]**
`story`의 "2023년 보증 실패로 모든 것을 잃었다"가 서브플롯으로 전혀 쓰이지 않는다. 과거를 짊어진 인물인데 그 과거가 게임 안에서 단 한 번도 호출되지 않는다.

**[수정 후 전문]**
기존 사이드 퀘스트 체인(`side_01`~`side_05`) 말미에 선택형 한 건을 덧붙인다. 메커닉·신규 NPC trust 공식 없이, 기존 사이드 패턴(`treat_npc`/`collect`)을 재사용한다.
```js
  mq_homeless_side_06: {
    id: 'mq_homeless_side_06', title: '낯익은 얼굴',
    desc: '타워 진료소에서 옛 사업 파트너를 만났다. 의료 아이템 2개로 그를 치료하라.',
    icon: '🤝', characterId: 'homeless', dayTrigger: 60, prerequisite: 'mq_homeless_side_05',
    objective: { type: 'treat_npc', count: 1 },
    reward: { morale: 12, items: [{ definitionId: 'canned_food', qty: 2 }] },
    failPenalty: null, deadlineDays: 30,
    narrative: {
      start: '진료소 침상에 낯익은 얼굴이 누워 있었다. 2023년, 내 보증을 받고 함께 무너졌던 사람. 서로 연락을 끊고 살았다. 그가 먼저 알아봤다. "최 대표…" 손이 떨렸다.',
      complete: '상처를 싸맸다. 그가 천장을 보며 말했다. "그때 형 탓 안 했어요." 나는 아무 말도 못 했다. "여기선 보증 같은 거 없잖아요." 그가 웃었다. 오래 묵은 것이 조금 풀렸다.',
    },
    companionEpilogue: {
      default: '옛 파트너: "최 대표, 아니… 형식이 형. 여기선 다시 시작해도 돼요."',
    },
  },
```
`failPenalty: null`로 두어 부담 없는 선택형으로 만든다. 기존 `side_05`(prerequisite)에 이어 붙고, 사이드 체인을 끝까지 따라온 플레이어만 만난다.

**[이유]** 과욕 금지 요청에 맞춰 1건, 기존 `treat_npc` 메커닉만 사용한다. "A를 얻으면 B를 잃는다"의 변주로, 화해는 죄책감을 더는 대신 과거를 직면해야 하는 대가를 치른다. 보상도 통조림 2개로 가볍게 둔다. 신규 NPC 정의(`characters.js` npc)나 trust 공식은 건드리지 않고 익명 환자(`treat_npc` count 기반)로 처리해 데이터 변경을 텍스트에 가둔다.

> 주의: `treat_npc`가 특정 NPC 없이 count만으로 동작하는지는 구현 확인 필요(`side_05`가 동일 패턴 사용 중이므로 동작 추정 가능하나, 적용 전 `QuestSystem` objective 처리 재확인할 것). 만약 특정 npcId가 필요하면 기존 타워 NPC(`npc_tower_security` 등) 중 하나를 재지정하고 대사만 파트너용으로 바꾼다.

---

## 문제 7 — 서사-목표 정합 · side 퀘스트 prerequisite 점검

**[점검 결과]**
- 사이드 체인 prerequisite 사슬: `side_01`(prereq `mq_homeless_10`) → `side_02`(`side_01`) → `side_03`(`side_02`) → `side_04`(`side_03`) → `side_05`(`side_04`) → [신규] `side_06`(`side_05`). 사슬이 끊김 없이 이어진다. 정합 확인.
- 사이드 체인이 `mq_homeless_10`(분기점) 직후부터 풀린다. A/B 어느 분기든 진입 가능. 단, 사이드 서사가 "타워 진료소/경비대/주방"을 전제하므로 **A경로(강남 치료소) 플레이어에게는 장소 괴리**가 있다.

  → 권고(선택): 사이드 체인 `prerequisite`를 `mq_homeless_10`에서 `mq_homeless_b_11`(롯데타워 입주)로 바꾸면 타워 서사와 행선지가 일치한다. 단 이 경우 A경로 플레이어는 사이드 체인을 못 받는다. 분리 정책 결정은 PD/디렉터 승인 필요 — 본 설계서는 텍스트 보강에 한정하므로 prerequisite 변경은 **별도 승인 항목**으로 남긴다.
- `goal` 수정(문제 4)으로 캐릭터 목표와 A/B 분기 서사가 정합된다.

---

## 적용 체크리스트

- [ ] `shared.js` `mq_homeless_07.narrative.start` — 행선지 중립화 (문제 4 보조)
- [ ] `shared.js` `mq_homeless_09.narrative` — 낚시꾼 화자 추가, start/complete 전문 교체 (문제 3)
- [ ] `shared.js` `mq_homeless_10.branchOptions` — label에 행선지 추가, 양쪽 `warning` 추가 (문제 2)
- [ ] `shared.js` 신규 `mq_homeless_side_06` 추가 — 파트너 화해 (문제 6)
- [ ] `branch_a.js` `mq_homeless_a_11~a_15.narrative` — 5개 퀘스트 주도성 보강 (문제 1)
- [ ] `characters.js` `homeless.goal` — 분기 포용형 재정의 (문제 4)
- [ ] `endings.js` `char_homeless.condition` — songpa OR gangnam, narrative/subtitle 중립화 (문제 5)
- [ ] (별도 승인) 사이드 체인 prerequisite를 `mq_homeless_b_11`로 이전할지 PD 판단 (문제 7)

## 검증 방법

1. **데이터 무결성**: `node js/data/validate.js` 실행 → 퀘스트 id/prerequisite 사슬, flag 참조 오류 0건 확인.
2. **분기 렌더 확인**: 게임 실행 후 `mq_homeless_10` 완료 시 `showBranchChoice` 모달에서 두 옵션의 `warning` 배지(빨간 경고)가 표시되는지 육안 확인.
3. **폴백 엔딩 도달성**: A경로 진입(강남만 방문) + 90일 + 아이템 50개 상태에서 `char_homeless.condition`이 `true`를 반환하는지 콘솔에서 조건식 평가. 수정 전(songpa만)은 `false`, 수정 후(gangnam OR)는 `true`여야 한다 (Red-Green).
4. **prerequisite 사슬**: `side_06.prerequisite === 'mq_homeless_side_05'`가 존재 퀘스트를 가리키는지, 신규 퀘스트가 `HOMELESS_SHARED` export에 포함되는지 확인.
5. **i18n**: 신규 대사에 영문 라벨(`nameEn`)이 필요한 데이터 필드가 없는지 확인(퀘스트 narrative는 한글 단일). 신규 NPC를 추가하지 않았으므로 NPC i18n 영향 없음.
6. **`treat_npc` 동작**: `side_06` 적용 전 `QuestSystem`의 `treat_npc` objective 처리에서 npcId 미지정 시 동작 여부 재확인(문제 6 주의 참고).

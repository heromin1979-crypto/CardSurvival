# 시나리오·설정 합동 — chef abilities 시작 인벤토리 감사

> 작성: 시나리오 한도연 + 설정 이수정 (합동) / 2026-05-11
> 대상: `js\data\characters.js`의 chef abilities에 `startingItems` 누락 사실 확인 + 처리 결정
> 결정: **option (b) 채택.** chef abilities `knife_mastery`에 startingItems 추가. **PR 머지 완료 2026-05-11.**
> 추가 발견: **`pharmacist` 캐릭터 정의 자체가 부재.** 별도 P0 hotfix v2로 해소 (`PD_HOTFIX_PHARMACIST_v2.md`).
> 정정 (2026-05-11): §4 chef startDistrict junggoo는 dangerLevel **5** (실측, `SYS_PR1_sim_v2_report.md` §5). 본 문서 작성 시점 추정 "3"은 오류.

---

## 1. 검증 목적

`SYS_DESIGN_sim_v2_v2.md` §4.1과 `PD_MEETING_sim_v2_gate.md` 후속 액션 A4.

검증 v1 시점에 "chef는 시작 인벤토리 = 물병 1개"가 의도된 설계인지 결함인지 미상 → 합동 감사로 결정.

---

## 2. 6직업 startingItems 실측 (`characters.js` 기준)

`_getStarterItems()` = `['water_bottle']`은 모든 직업 공통. 추가 시작 아이템은 character abilities 중 `effect.startingItems` 키를 가진 ability에서 결정.

| 직업 | abilities 중 startingItems 보유 ability | 시작 아이템 (+ water_bottle) | 합계 |
|------|------------------------------------------|------------------------------|------|
| doctor | `medical_supply` (line 51~56) | bandage×4, antiseptic, stethoscope, combat_scalpel, canned_food×2, energy_bar×2 + water_bottle | **12** |
| soldier | `tactical_gear` (line 115~120) | knife, alcohol_swab×2, bandage + water_bottle | **5** |
| firefighter | `firefighter_gear`(추정, line 190 영역) | rope, hand_axe + water_bottle | **3** |
| homeless | `street_kit`(추정, line 252 영역) | battered_can, old_blanket, newspaper_bundle, box_cutter + water_bottle | **5** |
| engineer | `engineer_kit` (line 375~377) | scrap_metal, wire + water_bottle | **3** |
| **chef** (PR C1 머지 전) | ~~없음~~ | ~~water_bottle (1개)~~ | ~~**1**~~ |
| **chef** (PR C1 머지 후, 2026-05-11) | `knife_mastery` (line 314~321) | water_bottle + **knife + canned_food×2 + preserved_ration** | **5** |
| pharmacist (P0 hotfix v2 머지 후) | `pharma_kit` | water_bottle + painkiller + antiseptic×2 + bandage | **5** |

**chef만 시작 인벤토리 1개.** 다른 5직업 평균 5.6개. 격차 명백.

---

## 3. chef abilities 4종 분석 (`characters.js:287~316`)

```
1. gourmet_sense (미식 감각)        → effect: { cookingEffectBonus: 1.6 }
2. ingredient_eye (식재료 감별)      → effect: { toxinDetect: true }
3. warm_meal (따뜻한 한 끼)          → effect: { companionMoraleOnCook: 10 }
4. knife_mastery (칼 다루기)         → effect: { knifeDmgBonus: 1.25 }
```

**분석:**
- 4 abilities 모두 **장기 효과** (요리 시 보너스, 독성 감지, 동료 사기, 칼 데미지). 즉시 사용 가능한 시작 아이템 없음.
- `knife_mastery`는 **knife 장착 시** 작동 — 그러나 chef 시작 인벤토리에 knife 없음. **능력이 발동 불가능한 시작 상태.**
- `gourmet_sense`도 **요리 재료** 보유 시 작동 — 시작 식재료 없음.
- `warm_meal`도 동료 + 요리 필요 — 동료 부재 (chef는 `startingNPCs` 없음, doctor·soldier만 보유).
- 즉 **chef 4 abilities 중 즉시 발동 가능한 것 0건.** 다른 직업은 시작 즉시 ability 1개 이상 활성화.

---

## 4. 시나리오·설정 시각의 문제

### 4.1 시나리오 한도연 시각
> "chef 직업의 정체성은 '남대문시장 → 식량 자급 체계'(`characters.js:286` goal). 그러나 시작 인벤토리에 식자재·칼·요리 도구가 0건. 메인 퀘스트 첫 단계(`mq_chef_01` '식재료 확보 — 식량 3개 수집')를 시작 즉시 trigger 받지만 **수집 도구가 없는 상태.** 회색지대가 아니라 단순 결함."

### 4.2 설정 이수정 시각
> "`characters.js:281~285` story는 '주방 칼을 집어 들고 지하 식품 저장고로 피신' 명시. 즉 **chef는 칼을 가지고 호텔을 떠난다**는 설정. 그런데 시작 인벤토리에 knife 없음 — story와 시작 상태 불일치. 또한 `characters.js:298` "지하 식품 저장고로 피신했다" — 즉 식품 보유 가능성이 story에 시사. 그런데 시작 인벤토리에 canned_food·preserved_ration·dry_meat 0건."

### 4.3 합동 결론
chef의 startingItems 부재는 **결함**. 의도된 설계 아님. story와 abilities가 모두 시작 아이템을 가정하고 있지만 effect로 표현이 누락.

---

## 5. 결정 옵션 평가

`SYS_DESIGN_sim_v2_v2.md` §4.1에서 PD가 (a) 채택 권고했으나, 본 합동 감사 결과 (b)가 정합.

| 옵션 | 내용 | 시나리오·설정 평가 |
|------|------|-----|
| (a) 게임 현행 그대로 (water_bottle 1개) | 시뮬 baseline에서 측정 | story·abilities 정합 깨짐. baseline K1이 매우 낮을 것이고 그 결과로 (b) 후속 PR 트리거되는 우회 경로. **시간 낭비.** |
| **(b) chef abilities에 startingItems 추가 PR** | story·abilities 발동 조건과 정합 | **권고.** 시뮬 v2 baseline 측정 전 머지. baseline 결과의 신뢰도 확보. |
| (c) 새 ability 신설 ('호텔 출발 키트' 등) | 기존 abilities 4종 외 5번째 추가 | abilities 4종으로 충분. 신설은 over-engineering. **거절.** |

### 5.1 (b) 권고 시작 아이템 (시나리오·설정 합의)

```js
{
  id: 'hotel_origin',          // 신규 ability id
  name: '호텔 출발',
  icon: '🍳',
  desc: '주방 칼·통조림·보존식·생수 추가 지급 (호텔 출발 키트)',
  effect: {
    startingItems: ['knife', 'canned_food', 'canned_food', 'preserved_ration', 'water_bottle'],
  },
}
```

또는 **기존 `knife_mastery` ability에 startingItems 추가** (ability 신설 회피):

```diff
 {
   id: 'knife_mastery',
   name: '칼 다루기',
   icon: '🔪',
-  desc: '나이프/칼 무기 데미지 +25%',
-  effect: { knifeDmgBonus: 1.25 },
+  desc: '나이프/칼 무기 데미지 +25%, 시작 시 주방 칼·식재료 지급',
+  effect: { knifeDmgBonus: 1.25, startingItems: ['knife', 'canned_food', 'canned_food', 'preserved_ration'] },
 },
```

→ **후자 권고.** 기존 패턴(other 5직업의 ability 1개에 startingItems 결합) 일관.

합계: water_bottle + 위 4 = 5개. 다른 5직업 평균 5.6개와 정합.

### 5.2 시뮬 v2 영향
- `characterAdapter.mjs`(시뮬 v2 §4)는 `ch.abilities[].effect.startingItems`를 그대로 derive하므로 **게임 측 (b) PR 머지 시 시뮬 v2도 자동 반영.**
- baseline 차수에서 chef K1 측정값이 다른 6직업과 의미 있게 비교 가능.
- `PD_MEETING_sim_v2_gate.md` 후속 액션 A5(chef 200회 추가 측정)는 옵션 (b) 후에는 **불필요할 수 있음.** baseline 결과 보고 시 재판단.

---

## 6. 추가 P0 발견 — `pharmacist` 캐릭터 정의 부재

본 감사 중 grep 결과 발견.

### 6.1 사실
- `js\data\characters.js` 4~388행 `CHARACTERS` 배열에 6직업만 정의: doctor, soldier, firefighter, homeless, chef, engineer.
- **`pharmacist` 정의 0건.** id·name·abilities·startingSkills·homeDist 모두 없음.
- `js\screens\CharCreate.js` 전체에서 `pharmacist` grep 0건.
- `js\data\mainQuests\pharmacist\` 폴더(branch_a, branch_b, shared) 26개 퀘스트는 존재 (M0 hotfix로 등록).

### 6.2 결과
**약사 직업은 게임에서 캐릭터로 선택 가능하지 않다.** 메인 퀘스트는 등록됐지만 직업 자체가 캐릭터 생성 화면에 없으므로 그 퀘스트는 **영원히 트리거되지 않는다.**

→ **M0 pharmacist hotfix는 절반의 해결책.** 메인 퀘스트 등록은 했지만 캐릭터 정의 부재로 게임 도달 0%.

### 6.3 P0 hotfix v2 후속

`pharmacist` 캐릭터 정의를 `characters.js`에 추가하는 PR 필요. 시나리오·설정 합동.

**최소 정의 (PR 후보):**
```js
{
  id: 'pharmacist',
  name: '한소희',                    // LORE_GLOSSARY v0.2 §3.5 정식
  gender: 'F',                       // (시나리오·설정 결정)
  age: 28,                           // (mainQuests/pharmacist 본문에서 정합 추출 필요)
  maxHp: 80,
  strength: 55,
  endurance: 50,                     // → stamina ≈ 75
  maxCarryWeight: 32,
  title: '약사',
  englishLabel: 'PHARMACIST',
  koreanLabel: '연구형',
  portrait: '💊',
  portraitFull:  'assets/images/characters/han_sohui_full.png',
  portraitSmall: 'assets/images/characters/han_sohui_portrait.png',
  strengths: ['약품 조제', '독성 감별', '의료 지식'],
  weaknesses: ['전투 경험 부족', '체력 한계', '근접 약함'],
  story: `(시나리오 한도연 후속)`,
  goal: '(mainQuests/pharmacist 본문 기반)',
  abilities: [
    {
      id: 'pharma_kit',
      name: '약품 키트',
      icon: '💊',
      desc: '진통제·소독약·붕대 지급',
      effect: { startingItems: ['painkiller', 'antiseptic', 'antiseptic', 'bandage'] },
    },
    {
      id: 'compounding',
      name: '조제 능력',
      icon: '🧪',
      desc: '의약품 제작 효율 +30%',
      effect: { medicineCraftBonus: 1.3 },
    },
    // ... 추가 abilities 시나리오 작성
  ],
  startingSkills: {
    medicine:   3,
    crafting:   3,
    scavenging: 2,
  },
  specialtySkills: ['medicine', 'crafting'],
  homeDist: 'gwanak',  // sim_firefighter_300days 시뮬 정의에 'gwanak' 사용. 검증 필요.
},
```

본 정의는 **시안.** 시나리오·설정 합동 검토 후 정식 PR.

### 6.4 영향
- **M0 hotfix를 약사 직업이 진짜 게임에 도달하기까지 미완성.** PD 김재훈에 즉시 보고.
- 시뮬 v2 baseline 측정이 7직업이라고 가정했지만 게임 측은 6직업만. **시뮬 v2 baseline 차수도 7직업이 가능한가**가 다음 게이트.
- `PD_MEETING_sim_v2_gate.md` 후속 액션에 신규 항목 추가 — A7. `pharmacist` 캐릭터 정의 추가 PR.

---

## 7. 권고 / 후속 액션

| ID | 작업 | 담당 | 분류 | 상태 |
|----|------|------|------|------|
| C1 | chef `knife_mastery` ability에 `startingItems: ['knife', 'canned_food', 'canned_food', 'preserved_ration']` 추가 | 시나리오 한도연 (PR 작성) + 설정 이수정 (어휘 검수) | **P1** | ✅ **완료 (2026-05-11)** — `js/data/characters.js` 311~322. validate.js 통과. 시뮬 v2 startInv 5개 확인 |
| C2 | 시뮬 v2 §4.1 갱신 — option (a) → (b) 채택, A5 (chef 200회) 보류 | 시스템 백승호 | P2 | C1 머지 후 |
| **P1** | `pharmacist` 캐릭터 정의 `characters.js` 추가 (게임 도달 가능화) | 시나리오 + 설정 합동 (시안 §6.3 기반) | **P0** | M1 D+3 (PR1과 병렬) |
| P2 | `CharCreate.js` 캐릭터 선택 화면에 약사 노출 검증 | 시스템 백승호 | P0 | P1 머지 직후 |
| P3 | 시뮬 v2 baseline 차수 7직업 가능 여부 재확정 | 밸런스 권지나 | P1 | P1 머지 후 |

---

## 8. 글로서리 갱신 트리거

`LORE_GLOSSARY.md` v0.3 후보 등록 항목 (P1·C1 머지 시):
- chef knife_mastery 신규 desc 어휘 검수
- pharmacist abilities 어휘 (pharma_kit, compounding 등) 시나리오 작성 후 등록
- pharmacist 나이·직함 등록 (현재 v0.2 §3.5에서 미기재로 표시)

---

## 9. PD 김재훈 게이트 결정 대기

본 감사는 두 결정을 PD에 요청:
1. **chef startingItems 옵션 (b) 채택 승인** — `SYS_DESIGN_sim_v2_v2.md` §4.1 권고 (a) 무효화.
2. **pharmacist 캐릭터 정의 P0 hotfix 승인** — `characters.js` 추가 PR. 시뮬 v2 PR1과 병렬 진행 가능.

승인 시 시나리오·설정 합동 PR 즉시 진입.

---

*문서 끝. 6에서 발견한 pharmacist 부재가 가장 큰 임팩트. 이슈 1(M0 pharmacist hotfix)이 사실상 미완료 상태였음을 회의록 갱신 필요.*

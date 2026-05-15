# PD 결정 — pharmacist 캐릭터 정의 P0 hotfix v2

> 작성: PD 김재훈 / 2026-05-11
> 목적: M0 pharmacist hotfix v1의 누락분(캐릭터 정의 부재)을 차단하고, 약사 직업이 게임에서 실제 선택 가능하게 만든다.
> 결정: **한다 — 즉시 hotfix 적용 완료.**

---

## 1. 컨텍스트 (Why)

`SCN_AUDIT_chef_abilities.md` § 6 발견 — `js\data\characters.js`의 CHARACTERS 배열에 6직업만 정의(doctor, soldier, firefighter, homeless, chef, engineer). **pharmacist 정의 0건.**

영향:
- M0 hotfix v1(`PD_HOTFIX_PHARMACIST.md`)이 `mainQuests/index.js`에 `PHARMACIST_QUESTS` 등록은 했지만, 약사 직업 선택 자체가 불가능.
- 약사 26개 메인 퀘스트는 영원히 트리거 안 됨.
- M0 KPI "약사 시작 → 첫 퀘스트 노출"은 충족됐지만 "약사 시작" 경로가 부재.

**M0 hotfix v1은 절반의 해결책이었다.** v2 hotfix로 캐릭터 정의를 추가해 게임 도달 경로를 완성한다.

---

## 2. 수용 기준 (Definition of Done)

- `characters.js`의 CHARACTERS 배열에 `id: 'pharmacist'` 정의 존재
- `CharCreate.js` 캐릭터 선택 화면에 약사 직업 자동 노출 (CHARACTERS.map 의존)
- `node js/data/validate.js` 통과
- 다른 6직업 회귀 없음
- 약사 시작 → 첫 메인 퀘스트(`mq_pharma_01`) 트리거 가능

---

## 3. 적용된 변경

### 3.1 `js/data/characters.js`

CHARACTERS 배열 끝(engineer 다음)에 7번째 항목 추가.

```js
{
  id: 'pharmacist',
  name: '한소희',
  gender: 'F',
  age: 31,
  maxHp: 80,
  strength: 50,
  endurance: 50,        // → stamina ≈ 75 (CHAR_GAUGE_KEYS endurance × 1.5)
  maxCarryWeight: 32,
  title: '약국 원장',
  englishLabel: 'PHARMA',
  koreanLabel: '연구형',
  portrait: '💊',
  portraitFull:  'assets/images/characters/han_sohui_full.png',
  portraitSmall: 'assets/images/characters/han_sohui_portrait.png',
  strengths: ['약품 조제', '천연물 지식', '독성 감별'],
  weaknesses: ['전투 미숙', '체력 한계', '근접 약함'],
  story: `한소희(31세)는 홍대 입구 골목의 작은 약국 원장이었다. ... (5줄)`,
  goal: '삼성병원과 홍대 약국을 거점으로 항바이러스제를 합성하고, ...',
  abilities: [
    { id: 'pharma_kit',          desc: '진통제·소독약 2개·붕대 추가 지급',
      effect: { startingItems: ['painkiller', 'antiseptic', 'antiseptic', 'bandage'] } },
    { id: 'compounding',         desc: '의약품 제작 성공률 +20%',
      effect: { craftSuccessBonus: 0.20 } },
    { id: 'natural_remedy',      desc: '독성 음식 섭취 전 경고',
      effect: { toxinDetect: true } },
    { id: 'medicine_efficacy',   desc: '의료 아이템 사용 효과 향상 (붕대 +3 HP)',
      effect: { bandageHpBonus: 3 } },
  ],
  startingSkills: {
    medicine:   3,
    crafting:   3,
    scavenging: 2,
    cooking:    1,    // 천연물 활용 기초
  },
  specialtySkills: ['medicine', 'crafting'],
  homeDist: 'gangnam',  // mq_pharma_01 narrative: 삼성병원 피신
},
```

### 3.2 변경된 파일
- `js/data/characters.js` — 1 항목 추가 (engineer 직후, 약 65 줄)

### 3.3 변경되지 않은 파일
- `js/screens/CharCreate.js` — `CharCreate.js:108`이 `CHARACTERS.map()`으로 그리드 자동 생성. 약사가 자동 노출됨. **UI 코드 변경 불필요.**

---

## 4. narrative·설정 정합성

본 정의는 다음 게임 데이터와 정합.

| 출처 | 사실 | 적용 |
|------|------|------|
| `mainQuests/pharmacist/shared.js:16` mq_pharma_01 narrative | "한소희(31세). 홍대 입구 골목 작은 약국 원장." | name·age·title 일치 |
| `mainQuests/pharmacist/shared.js:42` mq_pharma_03 | "대학원 시절 천연물 화학 수업" | abilities `natural_remedy` 정합 |
| `mainQuests/pharmacist/shared.js:16` | "삼성병원으로 피신했다" | homeDist `gangnam` (삼성병원 = 강남구 lm_gangnam) |
| `mainQuests/pharmacist/shared.js:130` mq_pharma_09 | "홍대 약국 귀환" → 마포구 이동 | story와 일치 (홍대 약국 = mapo) |
| `LORE_GLOSSARY.md` v0.2 §3.5 | 한소희 / Han So-hui / 약사 | name·title 일치 |

---

## 5. 사이드 이펙트 검증

### 5.1 validate.js 결과
```
=== JOB QUEST INDEX REGISTRATION CHECK ===
  doctor: 33 quests registered
  soldier: 26 quests registered
  firefighter: 23 quests registered
  homeless: 28 quests registered
  chef: 39 quests registered
  engineer: 44 quests registered
  pharmacist: 26 quests registered

=== SUMMARY ===
Errors: 0
✅ ALL CLEAR
```

다른 6직업 등록 회귀 없음.

### 5.2 시뮬 v2 영향
`SYS_DESIGN_sim_v2_v2.md` §4 `characterAdapter.mjs`는 `CHARACTERS.find(c => c.id === charId)` 형태로 derive. 본 PR 머지 시점부터 시뮬 v2도 자동으로 약사 캐릭터를 7직업에 포함 가능.

`PD_MEETING_sim_v2_gate.md` 후속 액션 P3 ("시뮬 v2 baseline 7직업 가능 여부 재확정") **충족.**

### 5.3 시작 인벤토리
`pharma_kit` ability의 `startingItems` 4개 + `_getStarterItems()` water_bottle 1 = 합계 5개. 다른 5직업 평균 5.6개와 정합. SCN_AUDIT_chef_abilities.md §2 비대칭 표 갱신 가능.

---

## 6. 미해결·후속

| 항목 | 분류 | 후속 |
|------|------|------|
| `assets/images/characters/han_sohui_*.png` 이미지 자산 부재 | P2 | 이미지 부재 시 `portrait: '💊'`로 fallback (CharCreate.js:111 onerror 처리) — 동작에는 문제 없음 |
| chef knife_mastery startingItems 추가 PR (`SCN_AUDIT_chef_abilities.md` C1) | **P1** | 별도 PR. 시나리오·설정 합동. 본 hotfix와 분리. |
| LORE_GLOSSARY.md v0.3 — 한소희 나이·직함 갱신 | P2 | 본 PR 후속. 설정 이수정 |

---

## 7. KPI 검증

- ✅ `MAIN_QUESTS`에 약사 prefix quest 26건 노출 (validate.js §JOB QUEST INDEX REGISTRATION)
- ✅ `CHARACTERS` 배열에 `id: 'pharmacist'` 1건 존재 (validate.js Errors: 0 → 모듈 로드 성공)
- ✅ 다른 6직업 quest 등록 수 회귀 없음
- ⏳ 게임 실제 시작 → 첫 퀘스트 발화 회귀 확인 — **시나리오 한도연 후속** (`SCN_REGRESS_pharmacist_load_v2.md`)

---

## 8. 결론

M0 pharmacist hotfix가 v2 hotfix로 완성됨. 약사 직업이 게임 캐릭터 선택 화면에 자동 노출되며, 26개 메인 퀘스트가 실제 트리거 가능 상태. 시뮬 v2 baseline 차수에서 7직업 측정 가능.

**M0 hotfix 종결 표기를 "절반 완료"에서 "완료"로 갱신** — `README.md` 후속 갱신.

---

*문서 끝. 게임 실제 시작 회귀 확인은 시나리오 한도연 별도. ability 이미지 자산은 백로그.*

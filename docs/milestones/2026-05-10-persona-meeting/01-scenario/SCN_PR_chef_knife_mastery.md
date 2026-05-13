# 시나리오·설정 합동 — chef knife_mastery startingItems 추가 PR

> 작성: 시나리오 한도연 + 설정 이수정 (합동) / 2026-05-11
> 대상: `js/data/characters.js` chef abilities `knife_mastery` (line 311~322)
> 결정: **한다 — PR 적용 완료.**
> 선행: `SCN_AUDIT_chef_abilities.md` § 5.1 권고 (option b).

---

## 1. 컨텍스트 (Why)

`SCN_AUDIT_chef_abilities.md` § 4 합동 결론:
- chef 시작 인벤토리 = water_bottle 1개. 다른 5직업 평균 5.6개.
- chef 4 abilities(gourmet_sense, ingredient_eye, warm_meal, knife_mastery) 모두 **시작 즉시 발동 불가능.**
- `characters.js:281~285` story("주방 칼을 집어 들고 지하 식품 저장고로 피신")와 시작 상태 불일치.

이는 의도된 설계가 아닌 **결함.** option (b) — `knife_mastery` ability에 startingItems 추가 — 채택.

---

## 2. 수용 기준 (Definition of Done)

- ✅ chef `knife_mastery` ability의 `effect`에 `startingItems` 키 존재.
- ✅ 4개 아이템(`knife`, `canned_food` × 2, `preserved_ration`) 모두 `js/data/items.js`에 정식 정의 존재.
- ✅ `node js/data/validate.js` 통과 (Errors: 0).
- ✅ 시뮬 v2 `characterAdapter.test.mjs` 회귀 없음 (72/72).
- ✅ 시뮬 v2 CLI `--info --char chef` 출력에 `startInv` 5개 포함.
- ✅ chef 다른 직업과 startInv 합계 정합 (다른 5직업 평균 5.6, chef 5).

---

## 3. 적용된 변경

### 3.1 `js/data/characters.js` (line 311~322)

```diff
   {
     id: 'knife_mastery',
     name: '칼 다루기',
     icon: '🔪',
-    desc: '나이프/칼 무기 데미지 +25%',
-    effect: { knifeDmgBonus: 1.25 },
+    desc: '나이프/칼 무기 데미지 +25%, 시작 시 주방 칼·식재료 지급',
+    effect: {
+      knifeDmgBonus: 1.25,
+      startingItems: ['knife', 'canned_food', 'canned_food', 'preserved_ration'],
+    },
   },
```

추가된 시작 아이템: knife 1 + canned_food 2 + preserved_ration 1 = 4개.
`_getStarterItems()` water_bottle 1과 합산 = **5개.**

### 3.2 변경되지 않은 파일

- `CharCreate.js` — `effect.startingItems`는 line 283에서 자동 적용. 추가 코드 변경 불필요.
- 다른 chef abilities 3종(gourmet_sense, ingredient_eye, warm_meal) — 그대로 유지. 본 PR 범위 밖.

---

## 4. 정합성 검증

### 4.1 아이템 정식 정의 확인

`node -e "import('./js/data/items.js').then(m => ...)"` 실행 결과:

| ID | 정의 | type/subtype |
|----|------|---------------|
| `knife` | ✓ 칼 | weapon/melee |
| `canned_food` | ✓ 통조림 | consumable/food |
| `preserved_ration` | ✓ 보존 식량 | consumable/food |

3 아이템 모두 game data에 실재. dangling reference 없음.

### 4.2 narrative 정합 (설정 이수정 검수)

| 출처 | 사실 | 적용 |
|------|------|------|
| `characters.js:281~285` chef story | "주방 칼을 집어 들고 지하 식품 저장고로 피신" | knife + 보존 식품 정합 |
| chef goal `characters.js:286` | "남대문시장 → 서울 식량 자급" | canned_food×2 + preserved_ration이 식량 자급 첫 단계 |
| chef abilities `knife_mastery` (PR 후) | "knifeDmgBonus 1.25" + knife 지급 | **knife 보유로 ability 발동 즉시 활성화** |

기존 `knife_mastery`의 `knifeDmgBonus 1.25`는 chef가 knife를 가지고 있을 때만 의미가 있다. PR 적용으로 ability가 시작 즉시 발동 가능 상태가 됨.

### 4.3 LORE_GLOSSARY 어휘 검수

`desc: '나이프/칼 무기 데미지 +25%, 시작 시 주방 칼·식재료 지급'`
- "주방 칼": chef story와 정합.
- "식재료": chef 직업 어휘 표(LORE_GLOSSARY v0.2 §3 chef row)와 정합.
- 영어 음역 0건, 클리셰 0건. ✓

---

## 5. 사이드 이펙트 검증

### 5.1 validate.js
```
=== JOB QUEST INDEX REGISTRATION CHECK ===
  chef: 39 quests registered    ← 변경 없음
  ...
Errors: 0   ✅ ALL CLEAR
```

### 5.2 시뮬 v2 회귀
```
characterAdapter.test  Pass: 72, Fail: 0  ✅
```

### 5.3 시뮬 v2 CLI 실측
```bash
$ node tools/sim/v2/index.mjs --info --char chef
{
  ...
  "startInv": {
    "water_bottle": 1,
    "knife": 1,
    "canned_food": 2,
    "preserved_ration": 1
  },
  ...
}
```

✅ 5개 합계. 다른 5직업 평균 5.6과 정합.

---

## 6. 7직업 startInv 합계 비대칭 해소

| 직업 | startInv 합계 (water_bottle 포함) |
|------|-----------------------------------|
| doctor | 12 |
| soldier | 5 |
| firefighter | 3 |
| homeless | 5 |
| engineer | 3 |
| **chef (PR 후)** | **5** ← 비대칭 해소 |
| pharmacist (P0 hotfix v2 후) | 5 |

- 평균: (12+5+3+5+3+5+5) / 7 = **5.4**
- 표준편차: 약 2.5
- chef는 더 이상 outlier 아님 (이전 1 → 5).

doctor가 12개로 다른 직업 대비 outlier로 남음(2배 이상). 별도 분석 후보지만 본 PR 범위 밖.

---

## 7. baseline 측정 영향

`SYS_PR1_sim_v2_report.md` § 5에서 발견된 **chef 시작 환경 비대칭**(자원·dangerLevel 양 측면 최악) 중 자원 측면 해소.

남은 비대칭:
- chef `homeDist: 'junggoo'` dangerLevel **5** (다른 6직업 1~3).
- 이는 game 정체성(`mq_chef_01` "남대문시장으로 이동") 기반. Director 게이트 별도 결정.

baseline에서 chef K1이 다른 직업 대비 더 나아질 것이지만 여전히 격차 가능성. 측정 후 재판단.

---

## 8. 미해결 / 후속

| 항목 | 분류 | 후속 |
|------|------|------|
| chef startDistrict dangerLevel 5 격차 (자원 외 환경 측면) | **P1** | Director 게이트 별도 (8.3) |
| doctor startInv 12개 outlier 여부 검토 | P3 | 백로그. baseline 결과 후 재판단 |
| LORE_GLOSSARY v0.4 — chef "주방 칼·식재료" 어휘 등록 | P3 | 다음 글로서리 갱신 차수 |
| 게임 실제 시작 → chef knife_mastery startingItems 발화 회귀 | P1 | 시나리오 후속 (`SCN_REGRESS_chef_load.md`) |

---

## 9. KPI 검증

- ✅ `characters.js` chef.abilities[3].effect.startingItems 존재
- ✅ 3 아이템 정식 정의 존재 (knife / canned_food / preserved_ration)
- ✅ validate.js Errors: 0
- ✅ characterAdapter.test 72/72 회귀 없음
- ✅ 시뮬 startInv 5개 확인
- ✅ chef startInv 합계가 직업 평균 ±1 이내

---

## 10. 결론

chef abilities의 자기 모순(능력은 있으나 발동 도구 없음) 해소. 직업 startInv 비대칭 5직업 평균 수준으로 정합. 게임 정체성(story·goal) 정합. validate.js 회귀 없음.

**남은 chef 비대칭은 startDistrict dangerLevel 5뿐.** 자원 측면은 본 PR로 해소. 환경 측면은 Director 결정 대기.

---

*문서 끝. baseline 결과 도착 시 chef K1 측정값을 본 문서 § 7에 갱신.*

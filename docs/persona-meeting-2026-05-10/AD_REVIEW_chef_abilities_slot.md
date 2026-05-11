# AD 검수 — chef abilities 5개 슬롯 시각

> 작성: AD 정해린 / 2026-05-11
> 대상: chef abilities 4 → 5 (cook_intuition 추가, `DIR_GATE_chef_start_environment.md` option c)
> 결정: **통과. UI 시각 영향 0.** 단 strengths 배열 정합성 후속 권고.

---

## 1. 검수 범위

`characters.js` chef abilities가 PR D1.2로 4개 → 5개로 증가:
1. gourmet_sense
2. ingredient_eye
3. warm_meal
4. knife_mastery
5. **cook_intuition (신규)**

UI 시각 슬롯 영향 분석.

## 2. UI 렌더링 분석

### 2.1 캐릭터 선택 화면 (`CharCreate.js`)

`CharCreate.js:161~162` 렌더:
```js
const strengthsHtml  = (c.strengths  ?? []).map(s => `<li>${s}</li>`).join('');
const weaknessesHtml = (c.weaknesses ?? []).map(w => `<li>${w}</li>`).join('');
```

→ `abilities` 배열은 **렌더 0건.** `strengths` / `weaknesses` 배열만 시각.

chef strengths/weaknesses (`characters.js:279~280`):
```js
strengths: ['미식 감각', '식재료 감별', '칼 다루기'],   // 3개
weaknesses: ['전투 경험 부족', '낯선 환경 약함', '제작 한계'],  // 3개
```

다른 6직업도 strengths 3 / weaknesses 3 형식. **chef도 3/3 그대로** = UI 정합.

### 2.2 장비 모달 (`EquipmentModal._renderActiveAbilities`)

`EquipmentModal.js:197~`:
```js
_renderActiveAbilities() {
  const p = GameState.player;
  const rows = [];
  if ((p.fleeBonus ?? 0) > 0) rows.push(...);
  if ((p.exploreBonus ?? 0) > 0) rows.push(...);
  // ...
}
```

→ ability 효과(`player.encounterRateReduct`·`fleeBonus`·`exploreBonus` 등)가 활성화된 경우만 표시. `abilities` 배열 개수 무관.

cook_intuition은 `encounterMultDays` effect를 사용 → 이 effect는 `_renderActiveAbilities`의 if 분기에 **현재 미등록**. 즉 chef의 cook_intuition 효과가 EquipmentModal에 표시되지 않음.

## 3. AD 검수 결과

### 3.1 시각 영향
- ✅ 캐릭터 선택 화면: 0 (strengths/weaknesses만 렌더)
- ⚠️ 장비 모달: cook_intuition 효과가 표시 누락 — 시스템 백승호 후속 권고

### 3.2 능력 카드 슬롯 (이론상)
abilities는 GameState/CharCreate 입력만이고 시각 카드 슬롯 없음. **AD 트랙에서 카드 슬롯 조정 필요 0.**

### 3.3 strengths 정합성 (선택)
chef strengths는 3 항목(gourmet_sense·ingredient_eye·knife_mastery 매칭). cook_intuition·warm_meal 빠짐. 옵션:
- (a) 현행 유지 — 모든 직업 strengths 3개 형식. 통일성 우선. **권고.**
- (b) chef strengths 5개로 확장 — abilities와 1:1 매칭. 다른 직업과 비대칭.

→ **(a) 채택.** strengths는 "주요 3가지" 시각 어휘로 통일.

## 4. 후속 액션

| ID | 작업 | 담당 |
|----|------|------|
| 4.1 | `EquipmentModal._renderActiveAbilities`에 `encounterMultDuringGrace` 분기 추가 (장비 모달 표시) | 시스템 백승호 |
| 4.2 | `_renderActiveAbilities` 신규 effect 등록 룰 — ability effect 키별 표시 row 정의 룰 신설 | 시스템 백승호 (M2) |

## 5. 결론

UI 시각 슬롯 영향 0. **chef abilities 5개 추가 PR (D1.2) AD 검수 통과.** strengths 배열은 현행 3개 유지.

EquipmentModal 표시 정합성은 시스템 후속 (4.1).

---

*문서 끝. AD 시각 검수는 본 PR로 종료. 후속 시스템 작업은 별도 PR.*

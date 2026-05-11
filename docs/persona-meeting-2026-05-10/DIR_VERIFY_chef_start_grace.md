# Director 검수 — chef start grace 결정 (option c) 실측 검증

> 작성: Director 서민호 / 2026-05-11
> 대상: `DIR_GATE_chef_start_environment.md` option (c) 결정의 PR 정합성 + 6 게이트 재검증
> 결정: **코드 정합 통과. 6 게이트 재검증 통과.** 실측 baseline은 PR5.5(자원 채집) 후로 이연.

---

## 1. 검수 범위

`DIR_GATE_chef_start_environment.md` § 5의 후속 PR 1~4 머지 결과 검증:

| PR | 머지 |
|----|------|
| D1.1 encounterMultDays 시스템 도입 | ✅ (`characters.js`, `CharCreate.js`, `ExploreSystem.js`) |
| D1.2 chef abilities 5번째 `cook_intuition` | ✅ (`characters.js` chef line 320~326) |
| D1.3 LORE_GLOSSARY v0.4 어휘 등록 | ⏳ (어휘 등록 후속, 본 검수에서는 음어 미사용) |
| D1.4 시뮬 v2 characterAdapter 자동 derive | ✅ (`tools/sim/v2/index.mjs --info --char chef`로 검증) |

## 2. 코드 정합 실측

시뮬 환경에서 `chef` 1 TP 후 GameState 실측:

```
encounterMultDaysEnd: 7
encounterMultDuringGrace: 0.5
characterId: chef
startDistrict: junggoo
```

비교 — `doctor`:
```
encounterMultDaysEnd: undefined
encounterMultDuringGrace: undefined
```

→ **결정 (option c)이 코드 레벨에서 정확히 구현.** chef 전용 7일 grace, 다른 직업 미영향.

## 3. ExploreSystem.js 분기 검증

```js
const charGraceMult = (gs.player.encounterMultDaysEnd && gs.time.day <= gs.player.encounterMultDaysEnd)
  ? (gs.player.encounterMultDuringGrace ?? 1.0)
  : 1.0;
const encounterChance = district.encounterChance × seasonMult × nightMult × earlyMult × charGraceMult × (1 - reduction);
```

- chef day 1~7: charGraceMult = 0.5 → encounter ×0.5
- chef day 8+: encounterMultDaysEnd(7) < 8 → charGraceMult = 1.0
- 다른 6직업: encounterMultDaysEnd undefined → charGraceMult = 1.0 (영향 없음)

`BALANCE.encounter.earlyGameGraceDays/Mult` 글로벌 grace(3일 ×0.45)와 합산 시 chef day 1~3: 0.45 × 0.5 = 0.225 (가장 낮은 encounter).

## 4. 6 게이트 재검증

| 게이트 | 결과 |
|--------|------|
| 1. 약속 강화 | ✅ 필러 §3 (chef 정체성 junggoo 유지) + §4 (자원 부족 유지, 절단 회피) |
| 2. 카드 표현 | ✅ cook_intuition ability 카드 + junggoo 카드 분리 |
| 3. 트레이드오프 | ✅ chef는 7일 윈도우에 채집 vs 이주 결정 (시뮬 측정 PR5.5 이연) |
| 4. 6직업 차이 | ✅ chef만의 시작 메커니즘 — 시뮬 실측에서 undefined 차이 확인 |
| 5. 세계관 정합 | ✅ chef = 호텔 셰프 = 명동(junggoo) 익숙함, narrative 100% |
| 6. 삭제 가능성 | ✅ 보정 빼면 chef 직업 dangerLevel 5에서 게임 불가능 |

**6/6 통과.**

## 5. baseline 측정 — PR5.5 이연 사유

현재 player AI는 자원 채집·이동 행동 안 함. chef는 day 4에 아사 사망. encounter 발생 시점(시작 구 매일 1회 탐색 시도) 이전.

→ **cook_intuition 7일 grace 효과 측정 불가** (실제 encounter 발화 0건).

PR5.5(자원 채집 AI 도입) 후 chef baseline 재측정:
- chef 평균 사망일 day 7 이상으로 늘어나면 grace 효과 측정 가능
- chef K1 vs 다른 직업 비교에서 격차 5%p 이내 검증
- 미달 시 grace 윈도우(7일) 또는 mult(0.5) 재조정

`BAL_TUNING_chef_grace.md` (밸런스 권지나) — PR5.5 머지 후 산출.

## 6. 남은 후속

| ID | 작업 | 담당 | 데드라인 |
|----|------|------|----------|
| 6.1 | LORE_GLOSSARY v0.4 — "셰프의 직감" 어휘 등록 | 설정 이수정 | M2 |
| 6.2 | PR5.5 — 자원 채집 AI 도입 | 시스템 백승호 | M2 |
| 6.3 | chef baseline grace 효과 측정 | 밸런스 권지나 | PR5.5 후 |
| 6.4 | grace 수치 (7일/×0.5) 최종 확정 | 밸런스 + Director | 측정 결과 후 |

## 7. AD 트랙 — 능력 카드 시각

chef abilities가 4 → 5개로 증가. 능력 카드 시각 슬롯 검토 — AD 정해린 후속 (`AD_REVIEW_chef_abilities_slot.md`). 본 Director 검수에서는 슬롯 영향만 명시, 시각 결정은 AD 위임.

## 8. 결론

option (c) 결정의 PR 1~4 정상 머지. 코드 정합 100%. 6 게이트 재검증 통과. baseline 실측은 PR5.5 이연.

**Director 승인 완료.**

---

*문서 끝. PR5.5 머지 후 본 문서 § 5 baseline 결과 채움.*

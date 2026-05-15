# 미도달 기능 (Unreachable / Implemented-Unused) 감사 v1

> 작성: 시스템 백승호 / 2026-05-10
> 대상: 정의되어 있으나 게임 런타임에 도달 못 하거나 도달이 까다로운 콘텐츠/시스템
> 결정: **즉시 fix 필요 P0/P1 항목 0건**, 다만 도달 경로 모호 또는 단일 진리 위반 발견 다수.

---

## 1. 결론 요약

광범위 grep + validate.js 결과 + main.js SystemRegistry 등록 표를 교차 검증한 결과, **명백히 게임에 도달 못 하는 기능은 의외로 적다.** 단, 도달 경로가 둘 이상이거나(단일 진리 위반), 도달 조건이 까다로워 실측 미확인인 경우가 많다. 진짜 미도달 1건은 **시뮬에서의 chef 직업 모델링 부재**(`SIM_AUDIT_v1.md` 별도 항목).

---

## 2. validate.js dead-end 10건 재검증

`validate.js` 실행 결과 `material dead-ends` 10건 보고됨. 하지만 이는 `requiredItems` 사용처만 보고 quest objective·enemy loot·hidden location 보상은 안 본다 — **false positive 다수**.

| 아이템 | 실제 사용처 | 분류 |
|--------|-------------|------|
| `emergency_kit` | enemies.js / blueprints / hiddenLocations | 도달 |
| `bone` | items_base / blueprints | 도달 (자주 안 쓰일 뿐) |
| `nettle_fiber` | items_misc / blueprints / blueprints_advanced | 도달 |
| `rotor_blade` | engineer/branch_b objective `collect_item` 4개 | **도달 (퀘스트 전용)** |
| `piston_engine` | engineer/branch_b objective | **도달 (퀘스트 전용)** |
| `avionics_module` | engineer/branch_b objective | **도달 (퀘스트 전용)** |
| `tail_rotor_assembly` | engineer/branch_b objective | **도달 (퀘스트 전용)** |
| `fuselage_frame` | engineer/branch_b objective | **도달 (퀘스트 전용)** |
| `avgas_drum` | engineer/branch_b objective | **도달 (퀘스트 전용)** |
| `fishing_bait` | items_base / blueprints / hiddenLocations | 도달 |

**결론:** 10건 모두 도달 가능. 단 **항공기 부품 6종은 engineer/branch_b 메인 퀘스트(엔지니어 항공 탈출 엔딩)에서만 사용**. 다른 직업·상황에서는 절대 안 쓰임. 이건 의도된 설계.

**개선 권고:** `validate.js`의 dead-end 검사에 quest objective·enemy loot·hidden location 보상도 사용처로 포함하도록 확장. 현재 false positive 10건이 진짜 dead-end를 가린다.

---

## 3. SystemRegistry 등록 vs 실제 사용

main.js에서 SystemRegistry에 register된 시스템과 다른 시스템에서 직접 import 사용되는 시스템 분리.

### 3.1 register만 되고 사용처 0건 (의심)
| 시스템 | register 위치 | `SystemRegistry.get` 호출처 |
|--------|---------------|------------------------------|
| (검사 결과 명백한 0건 사례 없음) | — | — |

### 3.2 register 안 했지만 직접 import로 사용 (정상)
| 시스템 | register | 직접 import 위치 |
|--------|----------|-------------------|
| `TraitSystem` | ❌ | ExploreSystem, NoiseSystem, StatSystem |

→ TraitSystem은 register는 안 됐지만 3 시스템에서 직접 import해서 사용 중 (도달). 정책 일관성을 위해 register 추가는 권고하나 dead code는 아님.

### 3.3 register + 실제 사용 확인됨
| 시스템 | register | 사용 확인 |
|--------|----------|----------|
| TrapSystem | ✅ | `CardFactory.js`에서 `SystemRegistry.get('TrapSystem')` |
| HospitalSiegeSystem | ✅ | `EventBus` 채널 `tpAdvance` 구독 (자체 동작) |
| GuardSystem | ✅ | (사용처 추가 검증 필요 — 본 감사 범위 외) |
| DispatchSystem | ✅ | (사용처 추가 검증 필요) |

→ Guard/Dispatch는 추가 검증 필요. 본 감사에서 사용처 0건 단정 못 함.

---

## 4. 단일 진리 위반 (정의처 둘 이상)

### 4.1 이벤트 전용 랜드마크 6종 — `landmarks.js`에 정의됨

`SCN_AUDIT_location_refs.md`에서 "정의 누락 의심"으로 분류했던 6종:
- `lm_raider_camp_small` `lm_raider_camp_medium` `lm_raider_camp_large` (soldier/shared.js 참조)
- `lm_power_station` `lm_water_plant` `lm_comms_tower` (engineer/branch_b.js 참조)

**재검증 결과:** 6종 모두 `js/data/landmarks.js` 1714~1995행에 정식 정의됨. `items.js` `ITEMS_LANDMARK`에는 없음 → 두 개의 정의처가 공존.

**상태:** 도달 가능. **단 단일 진리 위반.** 이슈 4 마이그레이션 시 `landmarks.js` 정의를 어떻게 통합할지 시스템 백승호 결정 필요. `SYS_DESIGN_location_card_factory.md` § 5의 ITEMS_LANDMARK_SPECIAL 부분에 6종 추가 정의 또는 별도 LANDMARK_DATA 통합 결정.

### 4.2 `loc_gangnam.encounterChance: 0.35` vs `districts.gangnam.encounterChance: 0.15`
이미 이슈 4 P1로 분류됨 (`README.md`). 어느 값이 런타임에 쓰이는지 grep 후속 필요.

---

## 5. 도달 경로 까다로움 (확률·조건 의존)

### 5.1 legendaryItems.js 24+ 전설 아이템
- 도달 경로: `hiddenLocations.js` 보상으로만.
- `hidden_dobong_hermit_cave.unlockConditions`: `minVisits: 3, minDay: 14` — 비교적 무난.
- 다른 24개 히든 위치의 unlockConditions 분포는 본 감사에서 미검사 (밸런스 권지나 후속). 일부는 `requiredItems: ['lockpick']` 같은 까다로운 조건 보유.
- **권고:** 100회 시뮬에서 legendary 아이템 도달 회차 비율을 측정 KPI로 추가. 0건이면 사실상 dead content.

### 5.2 secretEnemies.js 26개 보스
- 도달 경로: `HiddenElementSystem.js`가 SECRET_ENEMIES 처리.
- 각 보스의 spawn 조건(`districts`, `minDay`, `season`, `weather`, `minDl`) 충족 가능 여부 미실측.
- **권고:** baseline 시뮬에 보스 spawn 회차 분포 KPI 추가. 100회 중 0회 spawn 보스는 사실상 dead.

### 5.3 secretCombinations.js 46개 비밀 조합
- `validate.js` 보고 — `Total secret combos: 46`.
- `SecretCombinationSystem.js`가 처리. 도달 경로 있음.
- 발견 빈도는 미실측. 일부 조합이 100회 시뮬 0건이면 발견 조건 재검토 필요.

---

## 6. 데드코드 후보 (M1 정리 권고)

### 6.1 `mainQuests/pharmacist.js` 단일파일 (chef 잔재)
- 사용처 코드 grep 0건 (M0 hotfix 시 확인).
- **결정:** M1에 시스템이 안전 삭제. 이미 `README.md` P2로 분류됨.

### 6.2 `sim_*.mjs` 7건 (현행 시뮬)
- 시뮬 v2 도입 시 readonly 회귀 비교용 1회 후 폐기 권고 (`SIM_AUDIT_v1.md` § 5.3).

---

## 7. 신규 발견 정리 표

| 발견 | 분류 | 후속 |
|------|------|------|
| validate.js dead-end 검사 false positive 10건 | **개선** | 검사 룰에 quest objective·enemy loot·hidden location 보상 사용처 추가 |
| 항공기 부품 6종 = engineer/branch_b 전용 → 다른 직업에서 절대 안 쓰임 | **의도** | 정상. 단 이 사실을 `LORE_GLOSSARY.md`에 명시 권고 |
| TraitSystem register 누락 (사용은 됨) | **P3** | 일관성을 위해 register 추가, dead code 아님 |
| 이벤트 랜드마크 6종 정의처가 `landmarks.js` (의심 해소) | **확인** | SCN_AUDIT 내용 갱신 |
| GuardSystem / DispatchSystem 사용처 미실측 | **추가 검증** | 본 감사 범위 외, 후속 spot check |
| legendaryItems / secretEnemies / secretCombinations 도달 빈도 미실측 | **추가 KPI** | baseline 시뮬에 도달 회차 분포 측정 추가 |
| `pharmacist.js` 단일파일 chef 잔재 | **P2** (이미 분류) | M1 안전 삭제 |
| 시뮬 v1 chef 직업 모델링 0건 | **P1** (`SIM_AUDIT_v1.md`) | 시뮬 v2 인프라에서 7직업 정의 |

---

## 8. 전체 결론

이 게임은 **"도달 못 하는 기능"보다 "도달 조건이 까다로워 실측이 안 된 기능"이 더 많다.** 즉 dead code 문제가 아니라 **시뮬·텔레메트리 부재** 문제. 시뮬 v2 도입(`SIM_AUDIT_v1.md`)이 이 감사의 후속 액션과 사실상 동일.

**즉시 fix가 필요한 P0/P1는 없다.** P1은 모두 시뮬 v2 인프라가 선행되어야 측정 가능한 항목.

---

*문서 끝. baseline 시뮬 결과 도착 후 § 5 ~ § 6 KPI 채움 형태로 갱신.*

# Craft System Diversity Analysis

> 생성일: 2026-04-27
> Phase 2 (Sub-spec 2A/2B/2C) + Phase 1 Track A 머지 후 master 기준
> 데이터 출처: `js/data/blueprints.js` + `js/data/blueprints_advanced.js` + `js/data/hiddenRecipes.js`

---

## TL;DR

**다양성은 이미 CST(Card Survival: Tropical Island) 수준 이상으로 풍부하다.** 329개 레시피, 198개 input 카드 종류. 핵심 자원 분기율은 CST 코코넛(8-10개)을 압도하는 수준이다 — `scrap_metal`은 70개, `rope`는 41개, `wire`는 40개 레시피의 input.

**문제는 "다양성이 부족"한 게 아니라 "다양성이 보이지 않음"이었다.** 329 중 209개(63%)가 hidden 레시피로 시간/스킬/보스/장소 게이트로 가려져 있었음. Phase 2 + Phase 1 작업으로 모든 hidden은 drop 시도로 발견 가능해졌고, 순수 시간 잠금 22개는 완전 제거됨.

---

## 1. 전체 통계

| 지표 | 값 |
|------|-----|
| 총 레시피 | **329** |
| 공개(hidden=false) | 120 (36.5%) |
| Hidden | 209 (63.5%) |
| Hidden + unlockConditions 있음 | 187 |
| Hidden + drop-only (Phase 1 결과) | 22 |

### Stage 분포 (제작 복잡도)

| Stage 수 | 레시피 | 비율 |
|----------|--------|------|
| 1-stage (즉시 제작) | 242 | **73.6%** |
| 2-stage | 76 | 23.1% |
| 3-stage | 11 | 3.3% |

CST와 유사하게 **대부분 1-stage 즉시 제작**. 다단계는 고급 무기/방어구/구조물 위주.

---

## 2. 카테고리별 분포

| 카테고리 | 레시피 수 | 비율 |
|----------|-----------|------|
| food | 70 | 21.3% |
| structure | 59 | 17.9% |
| material | 58 | 17.6% |
| medical | 45 | 13.7% |
| tool | 31 | 9.4% |
| weapon | 26 | 7.9% |
| armor | 18 | 5.5% |
| upgrade | 15 | 4.6% |
| consumable | 7 | 2.1% |

food/structure/material 3개가 전체의 56%로 메인 축. medical/tool도 두꺼움.

---

## 3. Branching 다양성 (input 1개 → 사용 레시피 수)

### 분포 요약

| 지표 | 값 |
|------|-----|
| 총 input 카드 종류 | 198 |
| 분기율 = 1 (단일 사용) | **96 (48.5%)** |
| 분기율 ≥ 5 | 40 |
| 분기율 ≥ 10 | 23 |
| 분기율 ≥ 20 | 13 |
| 분기율 ≥ 40 | 3 |

> 분기율 1인 input이 절반 가량 — 이들은 대부분 최종 제작물 또는 특화 재료 (다음 가공 단계 없음).

### Top 30 input — 가장 많이 분기하는 재료

`Total` = 전체 레시피 수, `Public` = hidden 제외 즉시 보이는 수 (Phase 2 전 기준 — 머지 후엔 Total 모두 발견 가능).

| Rank | item | name | Total | Public | Public 비율 |
|------|------|------|-------|--------|-------------|
| 1 | `scrap_metal` | 고철 | **70** | 27 | 38.6% |
| 2 | `rope` | 로프 | 41 | 11 | 26.8% |
| 3 | `wire` | 철사 | 40 | 6 | **15.0%** |
| 4 | `wood` | 목재 | 29 | 8 | 27.6% |
| 5 | `herb` | 약초 | 28 | 15 | 53.6% |
| 6 | `salt` | 소금 | 26 | 20 | **76.9%** |
| 7 | `wood_plank` | 나무 판자 | 23 | 6 | 26.1% |
| 8 | `cloth` | 천 | 23 | 5 | 21.7% |
| 9 | `leather` | 가죽 | 23 | 5 | 21.7% |
| 10 | `purified_water` | 정수된 물 | 23 | 14 | 60.9% |
| 11 | `nail` | 못 | 22 | 6 | 27.3% |
| 12 | `charcoal` | 숯 | 21 | 5 | 23.8% |
| 13 | `rubber` | 고무 | 20 | 6 | 30.0% |
| 14 | `duct_tape` | 덕트 테이프 | 19 | 7 | 36.8% |
| 15 | `electronic_parts` | 전자부품 | 19 | 9 | 47.4% |
| 16 | `boiled_water` | 끓인 물 | 16 | 4 | 25.0% |
| 17 | `alcohol_solution` | 알코올 용액 | 15 | 6 | 40.0% |
| 18 | `glass_shard` | 유리 조각 | 13 | 6 | 46.2% |
| 19 | `raw_meat` | 생고기 | 13 | 10 | 76.9% |
| 20 | `antiseptic` | 소독제 | 12 | 1 | **8.3%** |
| 21 | `spring` | 스프링 | 11 | 4 | 36.4% |
| 22 | `thread` | 실 | 11 | 2 | 18.2% |
| 23 | `antibiotics` | 항생제 | 10 | 1 | **10.0%** |
| 24 | `rice` | 쌀 | 9 | 6 | 66.7% |
| 25 | `sharp_blade` | 날카로운 칼날 | 9 | 4 | 44.4% |
| 26 | `refined_metal` | 정련된 금속 | 9 | **0** | **0%** |
| 27 | `iron_pipe` | 철 파이프 | 8 | 1 | 12.5% |
| 28 | `empty_bottle` | 빈 병 | 8 | 2 | 25.0% |
| 29 | `cloth_scrap` | 천 조각 | 8 | 3 | 37.5% |
| 30 | `wild_berry` | 야생 베리 | 8 | 6 | 75.0% |

### CST 코코넛 패턴 비교

CST의 코코넛(트로피컬 아일랜드 핵심 자원)은 ~8-10개 레시피의 input. 본 프로젝트의 동급 자원 비교:

| 본 프로젝트 핵심 자원 | 분기율 (Total) | CST 코코넛 대비 |
|----------------------|----------------|------------------|
| `scrap_metal` | 70 | **7~8배** |
| `rope` | 41 | 4~5배 |
| `wire` | 40 | 4~5배 |
| `wood` | 29 | 3배 |
| `herb` | 28 | 3배 |
| `cloth`/`leather` | 23 | 2~3배 |

**다양성은 CST를 능가**한다. 진단 메모리(`project_discovery_diagnosis.md`) 그대로:
> 깊이는 데이터에 있다. 그런데 그 분기의 50-75%가 hidden + minDay/minSkillLevel로 잠겨 있어서 플레이어가 1-3갈래만 본다.

Phase 2 + Phase 1 머지 후 → **모든 hidden은 drop 시도로 발견 가능**. CST 코코넛 패턴이 활성화된 상태.

---

## 4. Depth 분포 (재료 → 결과물 chain 깊이)

> Depth 정의: Raw 재료(어떤 레시피의 output도 아닌 것) = 0. X = 1 + min(max(depth(input)) for each producing recipe). 즉 가장 짧은 chain 기준.

| Depth | 결과물 수 | 비고 |
|-------|-----------|------|
| 0 (raw) | 88 | scrap_metal, wood, herb, etc. |
| 1 | 90 | 즉석 가공품 — purified_water, charcoal, etc. |
| 2 | 78 | 1단계 조합품 |
| 3 | 60 | |
| 4 | 37 | |
| 5 | 39 | |
| 6 | 10 | |
| 7 | **3** | **최종 목표 — auto_turret, katana, powered_exosuit** |

게임 후반 목표 = depth 5+ (총 52개).

---

## 5. Depth ≥ 5 결과물 전체 (52개)

| Depth | id | 이름 |
|-------|-----|------|
| 7 | `auto_turret` | 자동 터렛 |
| 7 | `katana` | 카타나 |
| 7 | `powered_exosuit` | 파워 엑소수트 |
| 6 | `pistol_ammo` | 권총 탄약 |
| 6 | `shotgun_ammo` | 산탄 실탄 |
| 6 | `rifle_ammo` | 소총 탄약 |
| 6 | `master_blade` | 명검 |
| 6 | `alloy_armor_plate` | 합금 장갑판 |
| 6 | `universal_cure` | 만병통치약 |
| 6 | `powered_drill` | 전동 드릴 |
| 6 | `composite_armor` | 복합 장갑 |
| 6 | `master_wrench` | 마스터 렌치 |
| 6 | `master_angler_lure` | 명인의 루어 |
| 5 | `empty_cartridge` | 탄피 (빈) |
| 5 | `axe` | 도끼 |
| 5 | `shovel` | 삽 |
| 5 | `hammer` | 망치 |
| 5 | `detonator_cap` | 뇌관 |
| 5 | `acorn_jelly` | 도토리묵 |
| 5 | `truffle_risotto` | 송로 리조또 |
| 5 | `special_soup` | 원기 회복탕 |
| 5 | `iv_saline` | 생리식염수 IV |
| 5 | `herbal_tonic` | 약초 강장제 |
| 5 | `kimchi_stew` | 김치찌개 |
| 5 | `soybean_stew` | 된장찌개 |
| 5 | `cold_noodles` | 냉면 |
| 5 | `cream_soup` | 크림 수프 |
| 5 | `mushroom_risotto` | 버섯 리조토 |
| 5 | `pudding` | 푸딩 |
| 5 | `recovery_stew` | 보양식 |
| 5 | `vaccine` | 백신 |
| 5 | `ghillie_suit` | 길리 수트 |
| 5 | `armor_plate` | 강철 장갑판 |
| 5 | `electric_blade` | 전기 칼날 |
| 5 | `acid_whip` | 산성 채찍 |
| 5 | `explosive_bolt` | 폭발 석궁 화살 |
| 5 | `radiation_cleanser` | 방사선 정화제 |
| 5 | `survivors_feast` | 생존자의 만찬 |
| 5 | `field_laboratory` | 야전 연구실 |
| 5 | `reinforced_wall` | 강화 벽 |
| 5 | `portable_generator` | 발전기 |
| 5 | `solar_panel` | 태양광 패널 |
| 5 | `solar_charger` | 태양광 충전기 |
| 5 | `water_recycler` | 물 재활용기 |
| 5 | `electric_fence` | 전기 울타리 |
| 5 | `surgery_station` | 야전 수술대 |
| 5 | `watchtower` | 감시탑 |
| 5 | `night_vision` | 야시경 |
| 5 | `electronic_lockpick` | 전자 락픽 |
| 5 | `automated_fish_trap` | 자동 어획 장치 |
| 5 | `fishing_rod_advanced` | 낚싯대 개량 |
| 5 | `improve_pipe_wrench` | 파이프렌치 개량 |
| 5 | `detox` | 해독제 |

---

## 6. 카테고리별 대표 레시피 (Top 5 by depth)

`[H]` = hidden, 괄호 = (stages, requiredSkills)

### structure (59)
- d7 [H] `auto_turret` (3st, building:8 weaponcraft:5 crafting:4) — 자동 터렛
- d5 [H] `build_reinforced_wall` (1st, building:9) — 강화 벽 건설
- d5 [H] `field_laboratory` (2st, building:5 medicine:4) — 야전 연구실
- d5 [H] `build_portable_generator` (2st, building:10 crafting:8) — 발전기 건설
- d4 [H] `medical_station` (2st, building:4 medicine:2) — 의무 거점

### material (58)
- d6 [H] `craft_pistol_ammo` (2st, weaponcraft:3 crafting:3) — 권총탄 9mm
- d6 [H] `craft_shotgun_ammo` (2st, weaponcraft:4 crafting:3) — 산탄 12게이지
- d6 [H] `craft_rifle_ammo` (2st, weaponcraft:5 crafting:4) — 소총탄 5.56mm
- d5 [H] `forge_empty_cartridge` (1st, crafting:3) — 탄피 제작
- d5 [H] `synthesize_detonator_cap` (1st, crafting:3 medicine:2) — 뇌관 합성

### food (70)
- d5 `make_acorn_jelly` (2st, cooking:2) — 도토리묵
- d5 [H] `truffle_risotto` (1st, cooking:3) — 송로 리조또
- d5 [H] `special_soup` (1st, cooking:3) — 원기 회복탕
- d5 `cook_kimchi_stew` (1st, cooking:2) — 김치찌개
- d5 `cook_soybean_stew` (1st, cooking:2) — 된장찌개

### medical (45)
- d6 [H] `brew_universal_cure` (2st, medicine:15) — 만병통치약 (medicine 15 필요)
- d5 `craft_iv_saline` (1st, medicine:3) — 생리식염수 IV
- d5 `craft_herbal_tonic` (1st, medicine:2) — 약초 강장제
- d5 [H] `make_detox` (1st, medicine:5) — 해독제
- d5 [H] `vaccine` (3st, crafting:5 medicine:6) — 백신

### weapon (26)
- d7 [H] `forge_katana` (2st, weaponcraft:15) — 카타나 (최고난도)
- d6 [H] `forge_master_blade` (1st, weaponcraft:12) — 명검
- d5 [H] `craft_axe` (2st, weaponcraft:3) — 도끼
- d5 [H] `craft_shovel` (2st, crafting:3) — 삽
- d5 [H] `craft_hammer` (2st, crafting:3) — 망치

### armor (18)
- d7 [H] `build_powered_exosuit` (2st, armorcraft:15 crafting:12) — 엑소수트 (최고난도)
- d6 [H] `forge_alloy_armor_plate` (1st, armorcraft:12) — 합금 장갑판
- d6 [H] `make_composite_armor` (1st, armorcraft:10) — 복합 장갑
- d5 [H] `forge_armor_plate` (1st, armorcraft:10) — 강철 장갑판
- d5 [H] `make_ghillie_suit` (1st, armorcraft:7) — 길리 수트

### tool (31)
- d6 [H] `make_powered_drill` (1st, crafting:12) — 전동 드릴
- d6 [H] `make_master_wrench` (1st, crafting:12) — 마스터 렌치
- d6 [H] `make_master_lure` (1st, fishing:15) — 명인의 루어
- d5 [H] `improve_pipe_wrench` (1st, crafting:7) — 파이프렌치 개량
- d5 [H] `make_fishing_rod_advanced` (1st, fishing:8) — 낚싯대 개량

### upgrade (15) — 모두 비-hidden
- d3 `upgrade_machete` (1st, weaponcraft:4 crafting:2) — 출혈 마체테
- d3 `upgrade_spear` (1st, weaponcraft:4 crafting:2) — 관통 창
- d3 `upgrade_crossbow` (1st, weaponcraft:4 crafting:3) — 정밀 석궁
- d2 `upgrade_iron_pipe` (1st, weaponcraft:3 crafting:2) — 강화 철봉
- d2 `upgrade_vest` (1st, armorcraft:3 crafting:2) — 강화 전술조끼

### consumable (7)
- d5 [H] `survivors_feast` (3st, cooking:7) — 생존자의 만찬
- d5 [H] `radiation_cleanser` (2st, crafting:5 medicine:4) — 방사선 정화제
- d3 `make_sterile_water` (1st, medicine:8) — 멸균수
- d3 [H] `universal_antidote` (2st, crafting:5 medicine:8) — 만능 해독제
- d2 [H] `distill_water` (1st, cooking:5) — 물 증류

---

## 7. CST 패턴 적용 평가

| 측면 | CST | 본 프로젝트 (현재) | 평가 |
|------|-----|---------------------|------|
| 핵심 자원 분기율 | 코코넛 ~8-10 | scrap_metal 70, rope 41, wire 40 | **압도** |
| 1-stage 즉시 제작 비율 | 대부분 | 73.6% | **유사** |
| 발견 메커니즘 | 시도해서 unlock | (Phase 2 후) drop으로 unlock | **달성** |
| 모호 힌트 | "?" 또는 카테고리 | ✨ 무언가 만들 수 있을 것 같다 | **유사** |
| 시간 게이팅 | 거의 없음 | (Phase 1 후) 22개 제거 + 나머지는 drop으로 우회 | **달성** |
| 깊이 chain | 5-6 단계 | max 7 (3개), 5+ 52개 | **약간 더 깊음** |
| 카테고리 다양성 | 4-5개 | 9개 (food/struct/mat/med/tool/weap/armor/upg/cons) | **더 다양** |

**결론**: 데이터 측면에서는 CST 수준 또는 그 이상의 다양성을 이미 갖추고 있다. Phase 2 이전엔 visibility 문제로 가려져 있었으나, **현 master 시점에서는 모든 분기가 player에게 발견 가능한 상태**.

---

## 8. Phase 2 + Phase 1 작업 후 변화 요약

| 변경 | Before | After |
|------|--------|-------|
| Hidden unlock 메커니즘 | minDay + minSkillLevel + boss + location | drop 시도 (모든 경로) |
| Hover 시 모호 힌트 | 없음 (locked는 null) | ✨ 모호 힌트 (Sub-spec 2B) |
| unlock notify 메시지 | 하드코딩 | i18n 토큰 (`hidden.recipeUnlockByAttempt`) |
| 순수 시간 잠금 22개 | minDay 15-40 | unlockConditions 제거 → drop-only |
| `_checkRecipeUnlocks` 자동 발동 | 시간 도달 시 모든 hidden | unlockConditions 있는 187개 한정 (boss/location/character 의미있는 것만) |

---

## Appendix: 측정 검증 가이드 (memory Assignment)

본인 플레이로 다음을 카운트:

1. **Day 1-7 동안 카타나 직접 만들기 시도** (depth 7, weaponcraft 15 필요 — 발견과 제작은 별개)
2. **Day 1-7 동안 ✨ 새 조합 발견 알림 카운트**
3. 0-1개면 진단 정확 (visibility만 풀어도 다양성 체감 어려움 → 추가 onboarding 필요), 5+면 Phase 2 효과 확인됨

## Appendix: 데이터 재생성 방법

```bash
# 본 문서의 모든 통계는 다음 스크립트로 재생성 가능:
node --input-type=module scripts/analyze-craft.mjs  # (별도 작성 필요)

# 또는 JSON 추출:
node --input-type=module -e "
import('./js/data/blueprints.js').then(...);
" > craft-analysis.json
```

데이터 출처:
- `js/data/blueprints.js` — 공개 + 일반 hidden 레시피
- `js/data/blueprints_advanced.js` — 고급 hidden 레시피
- `js/data/hiddenRecipes.js` — 전설 hidden 레시피 (49개)
- `js/data/items.js` — 아이템 메타데이터 (이름/카테고리)
- `js/systems/CraftDiscovery.js` — 발견 로직
- `js/systems/HiddenElementSystem.js:556` — `unlockByAttempt` (Sub-spec 2A)

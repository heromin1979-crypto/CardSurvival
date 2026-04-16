# 전투 화면 전면 리디자인 — 3열 레이아웃 + 정보 카드형 UI

> 최종 업데이트: 2026-04-14
> 상태: Phase 7 대기중

## 목표
현재 2열 레이아웃 → 3열(플레이어/씬/적) + 상단바 + 하단 액션카드 구조로 전면 교체

## 페이즈 진행 현황

- [x] Phase 1 — CSS 레이아웃 뼈대 재설계 (`screens-combat.css`)
- [x] Phase 2 — 상단 상태 바 (위치/시간/날씨/턴/위험도)
- [x] Phase 3 — 좌측 플레이어 패널 (HP/스태미나/감염/무기/방어구/버프)
- [x] Phase 4 — 중앙 전투 장면 재구성 (실루엣 대치 + 맥락 오버레이)
- [x] Phase 5 — 우측 적 정보 패널 (HP바/방어력/감염확률/특성)
- [x] Phase 6 — 하단 액션 카드 바 (예상 피해/성공률 미리보기)
- [ ] Phase 7 — Encounter 화면 연동 정리

## 수정 파일
- `css/screens-combat.css` — 전면 재작성 ✓
- `js/ui/CombatUI.js` — 대규모 수정 ✓ (v4)
- `js/systems/CombatSystem.js` — previewAttack() 추가 ✓
- `js/screens/Encounter.js` — 스타일 정리 (Phase 7 대기)

---

# 야간 시간대 변경 — 자정(00:00)~05:00

> 최종 업데이트: 2026-04-14
> 상태: 완료

## 결과 요약

| 항목 | 이전 | 이후 |
|------|------|------|
| 야간 시작 | 20:00 | 00:00 (자정) |
| 야간 종료 | 06:00 | 05:00 |
| 이동 제한 시간 | 20:00~05:59 | 00:00~04:59 |
| 게임 시간 표현 범위 | 06:00~23:00 고정 | 06:00~05:00 (24시간 순환) |

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `js/core/TickEngine.js` | 시간 공식 `(tp*24/72+6)%24` — 자정 이후 표현 가능 |
| `js/data/gameBalance.js` | `startHour: 20→0`, `endHour: 6→5` |
| `js/systems/NightSystem.js` | `isNight()` — startHour<endHour일 때 AND 조건 처리 추가 |
| `js/systems/BGMSystem.js` | 야간 BGM 트리거 `hour>=22\|\|hour<5` → `hour<5` |
| `js/systems/HiddenElementSystem.js` | timeOfDay 판별 기준 6/20 → 5/0 |

---

# 랜드마크 전투 밸런스 조정 — 구역 난이도 연동 위험도 정규화

> 최종 업데이트: 2026-04-14
> 상태: 완료

## 결과 요약

| 항목 | 내용 |
|------|------|
| 수정 파일 | `js/data/gameBalance.js`, `js/data/landmarks.js`, `js/systems/ExploreSystem.js` |
| 조정 대상 | 랜드마크 서브 장소 13곳 dangerMod 하향 |
| 적용 기준 | 구역 0.10 → dangerMod 상한 0.20 / 구역 0.15 → 상한 0.25 / 구역 0.25 → 상한 0.35 |

## 변경 내용

### ExploreSystem.js — 랜드마크 전역 5% 감소 (신규)
- `baseEncounter`에 `BALANCE.encounter.landmarkDangerReduct (0.05)` 차감
- `gameBalance.js`에 `landmarkDangerReduct: 0.05` 상수 추가

### landmarks.js — dangerMod 하향 (13곳)

| 구역 (encounterChance) | 서브 장소 | 변경 전 | 변경 후 |
|---|---|---|---|
| 도봉구 (0.10) | 암벽 지대 | 0.35 | 0.20 |
| 관악구 (0.10) | 화학과 실험실 | 0.25 | 0.20 |
| 강서구 (0.15) | 격납고 | 0.35 | 0.25 |
| 강서구 (0.15) | 연료 저장소 | 0.45 | 0.25 |
| 금천구 (0.15) | 화학 공장 | 0.40 | 0.25 |
| 금천구 (0.15) | 폐기물 처리장 | 0.40 | 0.25 |
| 금천구 (0.15) | 발전소 | 0.35 | 0.25 |
| 광진구 (0.15) | 동물원 구역 | 0.35 | 0.25 |
| 구로구 (0.15) | 지하 주차장 | 0.35 | 0.25 |
| 동대문구 (0.15) | 중환자실 | 0.35 | 0.25 |
| 중랑구 (0.15) | 지하 보일러실 | 0.35 | 0.25 |
| 강북구 (0.15) | 무기고 터 | 0.30 | 0.25 |
| 용산구 (0.25) | 무기고 | 0.45 | 0.35 |

---

# 스토리 분기 + NPC 동반자 시스템 구현

> 최종 업데이트: 2026-04-13
> 상태: 완료

## 결과 요약

| 항목 | 내용 |
|------|------|
| 캐릭터별 엔딩 수 | 1개 → **6개** (A1/A2/A3 + B1/B2/B3) |
| 분기 구조 | Q10 이진 분기 + Q15 3방향 분기 |
| NPC 동반자 | 5명 추가 (강민준·한소희·이지수·박영철·정대한) |
| 퀘스트 총 수 | 185개 → ~156개 (각 26개 × 6캐릭터) |

## 수정/생성 파일

| 파일 | 변경 |
|------|------|
| `js/systems/QuestSystem.js` | requiresFlag 체크 + branchChoice 이벤트 |
| `js/systems/NPCSystem.js` | forceRecruit() 추가 |
| `js/ui/ModalManager.js` | showBranchChoice() + 비닫힘 모달 |
| `js/data/npcs.js` | 5개 스토리 NPC 추가 |
| `js/data/mainQuests/doctor/` | shared + branch_a + branch_b + index |
| `js/data/mainQuests/soldier/` | shared + branch_a + branch_b + index |
| `js/data/mainQuests/firefighter/` | shared + branch_a + branch_b + index |
| `js/data/mainQuests/homeless/` | shared + branch_a + branch_b + index |
| `js/data/mainQuests/pharmacist/` | shared + branch_a + branch_b + index |
| `js/data/mainQuests/engineer/` | shared + branch_a + branch_b + index |
| `js/data/mainQuests/index.js` | 서브폴더 import로 업데이트 |
| `css/modals.css` | 분기 선택 UI CSS 추가 |

## 엔딩 구조 (예: 이지수)

```
Q10 분기 ┬ A: 한소희 협력 → Q15 분기 ┬ A1: 백신 완성
         │                           ├ A2: 치료제 배포
         │                           └ A3: 연구 데이터 배포
         └ B: 강민준 합류 → Q15 분기 ┬ B1: 군 의료본부
                                     ├ B2: 최전선 야전병원
                                     └ B3: 민간 귀환
```

## NPC 동반자 배치

| NPC | 등장 조건 |
|-----|---------|
| npc_minjun (강민준) | 이지수 B경로 |
| npc_sohee (한소희) | 이지수 A경로 |
| npc_jisu (이지수) | 최형식·한소희 A경로 |
| npc_yeongcheol (박영철) | 강민준 A경로, 정대한 B경로 |
| npc_daehan (정대한) | 박영철 B경로, 한소희 B경로 |

---

## 이전 계획 아카이브

# 시뮬레이터 업데이트 — 30퀘스트 체인 반영

> 최종 업데이트: 2026-04-13
> 상태: 완료

## 결과 요약

| 항목 | 이전 | 이후 |
|------|------|------|
| 캐릭터별 퀘스트 수 | ~8-10개 | **30개** |
| 시뮬레이터 파일 | 구 형식 | 6캐릭터 × 30퀘스트 반영 |

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `sim_firefighter_300days.mjs` | 6개 캐릭터 퀘스트 배열(각 30개) 추가, `getCharQuests()`, `tryCraftMedical()`, `countMaterial()` 신규 |
| `testdata/sim_jisu_quests.mjs` | DOCTOR_QUESTS 30개 반영 |
| `testdata/sim_jisu_300days.mjs` | 이지수 300일 시뮬 퀘스트 반영 |
| `testdata/sim_soldier_50runs.mjs` | SOLDIER_QUESTS 30개 반영 |

## 주요 기술 사항

- `craft_item + category:structure` → `craft_structure` 타입 매핑
- `craft_item + category:medical` → `craft_medical` (totalMedicalCrafted 카운터)
- `collect_item_type material` → `countMaterial(gs)` (wood+rope+cloth+scrap_metal+nail+wire+electronic_parts)
- herb(20% 드롭), rubber(금속≥2 구역 10%), nail/wire/flashlight 드롭 추가
- 보상 아이템 확장: antiseptic, antibiotics, scrap_metal

## 시뮬 결과 (50회 실행)

| 캐릭터 | 생존율 | 평균 생존일 |
|--------|--------|------------|
| 박영철 (소방관) | 16% | D134 |
| 이지수 (의사) | 6% | D96 |
| 강민준 (군인) | 12% | D145 |
| 최형식 (노숙인) | 18% | D98 |
| 한소희 (약사) | 12% | D106 |
| 정대한 (기계공) | 8% | D103 |

---

## 이전 계획 아카이브

# 랜드마크 아이템 재배치 — 지역 특성 반영

> 최종 업데이트: 2026-04-13
> 상태: 완료

## 결과 요약

| 항목 | 내용 |
|------|------|
| 수정 파일 | `js/data/landmarks.js` |
| 수정 장소 수 | 약 25개 세부 장소(subLocation) |
| 문서 | `doc/랜드마크_아이템_배치_리스트.md` |

## 주요 변경

| 테마 | 적용 장소 | 추가 아이템 |
|------|---------|-----------|
| 군사·무기 | 경복궁 광화문, 전쟁기념관 무기고·벙커, 북한산성 막사 | pistol_ammo, smoke_bomb, tactical_vest |
| 병원 개선 | 경희의료원 의무기록실·지하창고, 세브란스 지하창고, 강남세브란스 VIP | antibiotics, stimulant, duct_tape, pipe_wrench |
| 고위험 보상 | 롯데타워 전망대·발전기실·쇼핑몰 | tactical_vest, pistol_ammo, lootCount↑ |
| 공항·면세점 | 김포공항 면세점·격납고·연료 | antibiotics, vitamins, electronic_parts, molotov↑ |
| 식량 강화 | 영등포 식품관, 남대문 식료품, 롯데타워 지하 | canned_food↑, dried_meat, purified_water↑ |

---

## 이전 계획 아카이브

# 캐릭터 메인 퀘스트 3배 확장

> 최종 업데이트: 2026-04-13
> 상태: 완료

## 결과 요약

| 항목 | 이전 | 이후 |
|------|------|------|
| 총 퀘스트 수 | 58개 | **185개** |
| 캐릭터별 평균 | ~10개 | **30개** |
| 파일 구조 | mainQuests.js (단일) | mainQuests/ (7개 분리) |

## 변경 파일

| 파일 | 내용 |
|------|------|
| `js/data/mainQuests/doctor.js` | 이지수 30개 — 삼성병원 의료 허브 엔딩 |
| `js/data/mainQuests/soldier.js` | 강민준 30개 — KBS 방송 + 생존자 집결 |
| `js/data/mainQuests/firefighter.js` | 박영철 30개 — 가족 구출 + 은평 대피소 |
| `js/data/mainQuests/homeless.js` | 최형식 30개 — 롯데타워 커뮤니티 리더 |
| `js/data/mainQuests/pharmacist.js` | 한소희 30개 — 항바이러스 합성 + 약국 허브 |
| `js/data/mainQuests/engineer.js` | 정대한 30개 — 아버지 설계도 + 서울 탈출 |
| `js/data/mainQuests/global.js` | 공통 퀘스트 5개 |
| `js/data/mainQuests/index.js` | 통합 export |
| `js/systems/QuestSystem.js` | import 경로 업데이트 |

## 주요 개선 사항

- **이지수**: KBS 방송 중복 제거 → 삼성병원 의료 허브 구축으로 독립 엔딩
- **정대한**: 아버지 메모 복선 완전 해결 → 아버지 설계도 발견·완성·탈출 서사
- **전체**: 4페이즈 구조 (생존→목적→위기→해결) 통일

---

## 이전 계획 아카이브

# 식량 생태계 개편 — 낚시·채집·드롭 재조정

> 상태: 완료

---

## 요구사항

| 항목 | 세부 내용 |
|------|-----------|
| **낚시 시스템** | 한강 인접 9개 구에서 낚시 액션, 숙련도 성장, 낚시 장비 제작 |
| **숲 채집 확장** | 산악·숲 구역 과일나무·산딸기·버섯 등 식생 추가 |
| **탐색 드롭 하향** | 가공식품 탐색 드롭 제거, 오브젝트 분해로만 획득 |
| **사냥 드롭 상향** | 전투 처치 후 날고기(raw_meat) 드롭률 상향 |

---

## 한강 인접 구역 (hasFishing: true)

마포, 용산, 성동, 광진 (강북) / 영등포, 동작, 강남, 송파, 강동 (강남)

---

## 파일 영향 범위

| 파일 | 변경 |
|------|------|
| `js/data/skillDefs.js` | fishing 스킬 추가 |
| `js/data/items_misc.js` | 낚시 장비·생선·식물 아이템 |
| `js/data/blueprints.js` | 낚시 장비 블루프린트 3개 |
| `js/data/districts.js` | hasFishing 플래그 + 숲 식생 lootTable |
| `js/systems/FishingSystem.js` | **신규** |
| `js/systems/ExploreSystem.js` | 탐색 드롭 하향 |
| `js/systems/CombatSystem.js` | 사냥 드롭 상향 |
| `js/data/gameBalance.js` | 낚시 수치 상수 |

---

---

# 크래프팅 체인 확장 + 스킬 임계값 세분화

> 최종 업데이트: 2026-04-15
> 상태: 완료

## 결과 요약

| 항목 | 기존 | 추가 | 합계 |
|------|------|------|------|
| 아이템 | ~280 | 93 | 458 |
| 블루프린트 (표준) | 140 | 56 | 196 |
| 히든 레시피 | 26 | 22 | 48 |
| 시크릿 조합 | 31 | 15 | 46 |
| **총 레시피** | **197** | **93** | **290** |

## 구현 완료 항목

- [x] 전자부품/배관/석조/금속/요리/의료/방어구/물정제/에너지/도구/낚시 체인 (11개)
- [x] 전투 스킬 시크릿 조합 15개
- [x] 품질 수정 14건 + 탐색 루트/stackConfig/파일 분할/중복 방어/검증 스크립트
- [x] UI: 아이템 미리보기 + 디스커버리 힌트 + 테크 트리 시각화 + 디자인 리뷰 4건
- [x] 92개 카드 이미지 생성 및 적용

## 수정 파일

신규 7개 + 수정 16개 + PNG 92개 = 총 115개 파일

---

---

# 대규모 밸런스 업데이트 — 365일 생존 + 약사→셰프 교체 + 스킬/NPC/퀘스트 개편

> 최종 업데이트: 2026-04-16
> 상태: 완료

## 목표
캐릭터별 시뮬레이션에서 드러난 불균형 해소 — 의사 생존율 4%, 기계공 퀘스트 완료율 6.7%, 약사-의사 역할 중복, 스킬 성장 정체.

## 결과 요약

| 영역 | 변경 내용 |
|------|----------|
| 생존 목표 | 100일 → **365일** (6캐릭터) |
| 캐릭터 교체 | 약사(한소희) → **셰프(윤재혁)** — 호텔 셰프, homeDist: junggoo |
| 캐릭터 버프 | 노숙인 HP 65→75, 군인 강아지 동반, 기계공 시작지 seongdong→yongsan |
| 노숙인 능력 | street_sense에 `fleeBonus: 0.15` (도주 확률 +15%) |
| 스킬 XP | LEVEL_XP_TABLE 전체 × 0.65 (35% 가속) |
| 특화 스킬 | 6캐릭터 specialtySkills 정의 — 해당 스킬 1.5배 XP |
| 훈련 레시피 | 4종 추가 (practice_bandage/wooden_sword/cloth_guard/training_shield) + skillOverride 시스템 |
| NPC 시스템 | 강아지 탐색/전투 분리 (foragingToday 플래그), 간호사 combatDmgReduce 0.10 + tauntChance 0.15 |
| 전투 보너스 | 기계공 자작 무기 +15%, 셰프 knifeDmgBonus ×1.25, 도주 fleeBonus 적용 |
| 네메시스 | 소방관 nemesis spawnChance 0.08 (기본 0.03 대비 상향), boss_chef_nemesis 신설 (식칼 난도질/끓는 기름 스킬) |
| 방사선 | ExploreSystem 방사선 경고 다이얼로그 + rad_blocker 제작 레시피 |

## 셰프 캐릭터 구현

| 항목 | 값 |
|------|-----|
| ID / 이름 | `chef` / 윤재혁(33) |
| HP/STR/END/무게 | 95 / 65 / 65 / 35kg |
| 시작 지역 | `junggoo` (중구 남대문시장) |
| 능력 | 미식감각(요리효과+60%), 식재료감별(독성경고), 따뜻한한끼(동료사기+10), 칼다루기(나이프+25%) |
| 시작 스킬 | cooking 4, harvesting 3, melee 2 |

## 퀘스트 모듈 신설

`js/data/mainQuests/chef/` 폴더 생성 — 30 퀘스트 (분기 포함):
- `shared.js`: 공통 10퀘스트 (mq_chef_01~10) — 호텔 탈출→남대문 급식소
- `branch_a.js`: 강남 식량 네트워크 (mq_chef_a_11~20)
- `branch_b.js`: 용산 동료 셰프 합류 (mq_chef_b_11~20)
- `index.js`: 애그리게이터

## 기계공 B3 엔딩 — 헬기 제작 9단계 (히든급 진엔딩)

아버지의 R22 설계도 + 7종 신규 부품 + 항공 가솔린 정제:

| # | 퀘스트 | Day | 목표 |
|---|--------|-----|------|
| 1 | 아버지의 마지막 설계도 | D205 | 성동구 방문 |
| 2 | 항공용 합금 단조 | D215 | aviation_alloy x8 |
| 3 | 로터 블레이드 | D230 | rotor_blade x4 |
| 4 | 피스톤 엔진 조립 | D245 | piston_engine x1 |
| 5 | 꼬리 로터 + 항공 전자 | D260 | avionics_module x1 |
| 6 | 동체 프레임 | D275 | fuselage_frame x1 |
| 7 | 최종 조립 | D290 | 구조물 x3 |
| 8 | 항공 가솔린 정제 | D305 | avgas_drum x2 |
| 9 | 호버링 테스트 | D315 | 전자부품 x4 |
| 10 | 하늘로 탈출 | D325 | 식량 x10 |

**신규 아이템 7종**: aviation_alloy, rotor_blade, piston_engine, avionics_module, tail_rotor_assembly, fuselage_frame, avgas_drum
**신규 블루프린트 7종**: 각 부품별 제작 레시피 (최대 crafting Lv8, weaponcraft Lv5, building Lv5 요구)

## 스킬 XP 경로 다양화

기초 제작 반복 외 플레이 스타일별 레벨업 지원:

| 스킬 | 추가된 XP 경로 |
|------|---------------|
| weaponcraft | 무기 분해 +2, 무기 제작 시 보조 +1 (crafting/melee 동반) |
| armorcraft | 방어구 분해 +2, 방어구 제작 시 defense 동반, 구조물 제작 시 +1 |
| building | 구조물 분해 +2, 구조물 제작 보조 |
| medicine | 의료 아이템 분해 +2, NPC 치료 +4 |
| cooking | 수집한 음식 섭취 +1, 물 음용 +1, 의료 제작 보조 +0.5/단계 |
| harvesting | 자연 재료 탐색 발견 +1, 음식 제작 보조 |
| crafting | 모든 전문 제작 시 자동 보조 XP |

## 수정 파일

### 신규 생성
- `js/data/mainQuests/chef/` (4 파일: shared/branch_a/branch_b/index)
- 헬기 부품 7종 + 블루프린트 7종 추가 (items_misc.js, blueprints.js)

### 수정
- `js/data/characters.js` — 스탯/능력/특화스킬/셰프 교체
- `js/data/mainQuests.js` — 365일 + 셰프 퀘스트 + 군인/소방관/노숙인/기계공 퀘스트 수정
- `js/data/mainQuests/index.js` — pharmacist → chef
- `js/data/mainQuests/engineer/branch_b.js` — B3 헬기 제작 9단계
- `js/data/skillDefs.js` — XP 테이블 × 0.65
- `js/systems/SkillSystem.js` — 특화 스킬 1.5배
- `js/systems/CraftSystem.js` — skillOverride + 보조 스킬 XP + _crafted 태깅
- `js/systems/NPCSystem.js` — 강아지 탐색/전투 분리, getNpcDef API, healCompanion XP
- `js/systems/CombatSystem.js` — fleeBonus + 간호사 taunt/dmgReduce + 자작무기 보너스
- `js/systems/DismantleSystem.js` — 분해 타입별 스킬 XP 분기
- `js/systems/ExploreSystem.js` — 방사선 경고 + 자연재료 harvesting XP
- `js/systems/StatSystem.js` — 음식/물 섭취 XP 확대
- `js/systems/HiddenElementSystem.js` — boss spawnChance 지원
- `js/screens/Encounter.js` + `js/screens/CharCreate.js` — fleeBonus 적용 및 chef 초기화
- `js/data/secretEnemies.js` — boss_chef_nemesis (식칼/끓는 기름), firefighter spawnChance
- `js/data/endings.js` — char_chef + mq_chef + mq_engineer_heli 신규 엔딩
- `js/data/secretEvents.js` — 셰프 이벤트 2종 (호텔 주방, 식자재 창고)
- `js/data/npcs.js` — 간호사 combatDmgReduce/tauntChance
- `js/data/stackConfig.js` — 헬기 부품 + 훈련 아이템 등록
- `js/ui/CardFactory.js` — 헬기 부품 + 훈련 아이템 이미지 매핑
- `js/data/locales.js` + `js/data/endingImages.js` + `js/data/hiddenLocations.js` + `js/data/hiddenRecipes.js` + `js/data/charDialogues.js` + `js/data/cinematicScenes.js` + `js/data/legendaryItems.js` + `js/main.js` + `js/screens/EndingGallery.js` + `js/core/PurchaseManager.js` + `js/systems/MentalSystem.js` — pharmacist → chef 참조 전면 교체

## 검증
- `node --input-type=module js/data/validate.js` 통과 (기존 sc_rain_shower/sc_snow_compress 에러 외 없음)
- 셰프 퀘스트 30개, 기계공 퀘스트 32개 정상 로드 확인

---

# 엔딩 구조 간소화 — 100일 게이트 통합 + 3~4엔딩 축소

> 최종 업데이트: 2026-04-16
> 상태: 완료

## 목표
Card Survival: Tropical Island 방식 벤치마킹 — 장기 생존 조건(365일)을 엔딩 자격 요건으로 통합하되 100일로 축소, 6캐릭터 × 6엔딩의 엔딩 거품을 3~4개로 간소화해 각 엔딩의 서사 깊이 강화.

## Phase 1: 100일 생존 조건을 엔딩 게이트로 통합
- `mainQuests.js`: 6캐릭터 최종 퀘스트 `survive_days` **365 → 100**
- `endings.js`: 모든 메인 캐릭터 엔딩에 **`gs.time.day >= 100`** 조건 추가 (7개 엔딩)
- 내러티브 전체 "365일" → "100일"
- 모듈 Q15 survive_days: doctor/soldier/engineer **180 → 100**, fire/homeless (이미 100)
- `cinematicScenes.js`: Day 365 → Day 100
- `gameBalance.js` 주석 동기화

## Phase 2: 엔딩 수 축소 (38 → 19, 50% 감소)

| 캐릭터 | Before | After | 유지된 엔딩 (테마) |
|-------|:------:|:-----:|-------------------|
| 🩺 의사 | 6 | **3** | a1 백신(각성) · a3 연구 노트(탈출) · b1 군 의료본부(정착) |
| ⚔️ 군인 | 6 | **3** | a1 서울 집결(정착) · b1 전국 통신망(각성) · b3 수원 이동(탈출) |
| 🔥 소방관 | 6 | **3** | a1 은평 대피소(정착) · a3 이재훈 추모(각성) · b3 함께 탈출(탈출) |
| 🏕️ 노숙인 | 6 | **3** | a3 함께 이주(탈출) · b1 두 번째 제국(정착) · b3 서울 중개자(각성) |
| 🍳 셰프 | 2 | **3** ⬆️ | a1 급식 네트워크 · a2 가락 자급 급식소 · b1 용산 미식 복원 |
| 🔧 기계공 | 6 | **4** | a1 서울 탈출 · a3 구로 거점 · b1 도시 재건 · b3 하늘로 탈출(헬기) |

## 설계 철학
Tropical Island 벤치마킹 — 공통 테마(탈출/정착/각성)를 캐릭터별로 재해석. 엔딩 거품 제거로 각 엔딩의 내러티브 깊이 보존.

## 검증
- validate.js 통과 (기존 에러만 잔존)
- 모든 prerequisite 체인 + branchOptions → setsFlag 매핑 확인 ✓

---

## 이전 계획 아카이브

이전 계획(카드 서바이벌 시스템 확장 세부 기획서 — 2026-03-20)은
doc/ 폴더의 PDF 문서 참조.

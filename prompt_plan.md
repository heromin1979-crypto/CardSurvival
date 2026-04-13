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

## 이전 계획 아카이브

이전 계획(카드 서바이벌 시스템 확장 세부 기획서 — 2026-03-20)은
doc/ 폴더의 PDF 문서 참조.

# 재미강화 프레임워크 통합 — 처방전·골든타임·환자 기록장 + 스택 부산물 버그

> 최종 업데이트: 2026-04-19
> 상태: 완료

## 목표
의사(doctor) 재미강화 P5~P7 마무리 + 동일 프레임워크를 homeless/pharmacist/chef
3개 캐릭터에 이식. 스택 아이템 소비 시 부산물 누락 버그 수정.

## P5~P7: 의사 재미강화 마무리
- **P5 — 환자 누적 기록 + 엔딩 사기 보너스** (commit `408c47a`)
  - `GameState.flags.doctor_patients_treated` 카운터 + `doctor_patient_roster`
  - `QuestSystem.getPatientMoraleBonus()` — 엔딩 시 마일스톤 보너스 반영
- **P6 — 동반자 에필로그 대사** (commit `acaccd9`) — Q05/Q07/Q08 완료 시 NPC 대사
- **P7 — 환자 기록장 모달 UI** (commit `0ff4b72`)
  - 신규 `js/ui/DoctorPatientModal.js` + `css/doctor-modal.css`
  - 의사 전용 툴바 버튼 (Main/Basecamp 양쪽) + `isAvailable()` 가드
  - 마일스톤 4단계 (5/10/25/50) 진행률 바 + 환자 NPC 로스터

## 크로스 캐릭터 프레임워크 이식
의사 P1~P7에서 확립된 3가지 재미강화 패턴을 다른 캐릭터 메인퀘스트에 적용.

| 캐릭터 | 골든타임 보너스 | 처방전 시스템 | 동반자 에필로그 | 커밋 |
|--------|----------------|--------------|---------------|------|
| 최형식 (homeless) | Q01 (5일, canned_food+1) | side_03 배식 이벤트 (밥/생선/샐러드/잼) | side_01/02/04/05 NPC 대사 | `d2b9cdd` |
| 한소희 (pharmacist) | Q01 (5일, bandage+2) | Q07 1차 합성 (허브차/소독약/진통제/붕대) | Q07 한소희 대사 | `66dede5` |
| 윤재혁 (chef) | Q01 (5일, salt+2) | Q06 첫 한 끼 (밥/생선/샐러드/라면) | Q06/side_06 대사 | `86e8f63` |

### 프레임워크 구성 요소 (재사용 스키마)
- `bonusCondition: { type: 'completeWithinDays', days }` — 골든타임 추가 보상
- `prescriptionOptions` / `prescriptionLabels` — 시작 시 4지선다 처방전
- `bonusCondition: { type: 'prescriptionMatch' }` — 관찰 일지 표적 일치 보너스
- `companionEpilogue: { default, success }` — 완료 시 NPC 대사 분기

## 🐛 스택 부산물 누락 버그 수정 (commit `6aa455a`)

### 증상
`sterile_water` 2스택에서 1개 사용 시 `empty_bottle`이 보드에 생성되지 않음.
`canned_food` 등 스택 가능 소비 아이템 전체가 동일 증상.

### 원인
`js/systems/StatSystem.js:693` — `stackable && qty > 1` 분기가 `quantity--`만
수행하고 `def.leaveOnConsume` 스폰 로직을 건너뜀. 스택이 마지막 1개로 줄어들어야만
부산물이 생성됨.

### 수정
- `_spawnLeaveOnConsume(gs, leave)` 헬퍼 추출
- 스택 감소 / 마지막 1개 제거 두 분기 모두에서 헬퍼 호출
- 보드가 가득 차면 인스턴스 제거 + `statSys.boardFullLeftover` 알림

## 수정 파일 (9)

| 파일 | 변경 |
|------|------|
| `js/systems/StatSystem.js` | `_spawnLeaveOnConsume` 헬퍼 + 스택 분기 호출 |
| `js/ui/DoctorPatientModal.js` | 신규 — 환자 기록장 모달 |
| `css/doctor-modal.css` | 신규 — 환자 모달 스타일 |
| `index.html` | doctor-modal.css 링크 |
| `js/screens/Main.js` | DoctorPatientModal init + 툴바 버튼 |
| `js/screens/Basecamp.js` | DoctorPatientModal init + 툴바 버튼 |
| `js/data/mainQuests/homeless/shared.js` | Q01 골든타임 + side_03 처방전 + 4개 side NPC 에필로그 |
| `js/data/mainQuests/pharmacist/shared.js` | Q01 골든타임 + Q07 처방전/에필로그 |
| `js/data/mainQuests/chef/shared.js` | Q01 골든타임 + Q06 처방전/에필로그 + side_06 에필로그 |

## 검증
- `validate.js` 통과 (기존 255 경고만 잔존, 0 에러)
- 스택 버그: 사용자 재현 시나리오 — `sterile_water` 2개 보유 상태에서 1개 사용 시
  `empty_bottle` 카드가 보드에 자동 스택

---

# 이지수(doctor) 초반 몰입감 강화 — 응급실 오프닝 + NPC 크로스오버 + 감염 저항 체감

> 최종 업데이트: 2026-04-19
> 상태: 완료 (Phase 1 + Phase 2)

## 목표
의사 이지수 캐릭터의 초반 1~5일 경험을 강화.
① "3일 창고 생존 → 응급실" 오프닝 시나리오, ② Q1~Q6 "수집 6연속" 단조로움 해소,
③ 보라매병원 서브로케이션 개별화, ④ 감염 저항 -35% 능력 체감 유도.

## Phase 1 — 오프닝 시나리오 + NPC 서사 강화

### 응급실 오프닝 (이지수 전용 시작 시퀀스)
- `CharCreate._doctorEmergencyOpening()` — 베이스캠프 대신 응급실 서브로케이션에서 시작
- `ModalManager.showOpeningScene()` — 2지선다 (치료 vs 탈출) 오프닝 모달
- `ExploreSystem.enterLandmark('dongjak')` + 직접 `currentSubLocation` 설정 (TP/encounter/loot 우회)
- 탈출 선택 시 `abandoned_soldier` 플래그, morale -10

### 부상 군인 NPC 서사 구체화
- 이름: "부상당한 군인" → **박상훈 하사** (25세, 국립현충원 경비소대)
- backstory + 소대원 상실 대사 추가
- trustEvent `soldier_wounded_healed` — 강민준 군의관 Q10 분기 복선
- specialDay 7 — 현충원 귀환 개인 퀘스트 훅

### Q1 교체
- 기존 "식량 3개 수집" → **"응급실의 첫 환자"** (박상훈 하사 치료, treat_npc)
- 의사 본분과 직결된 첫 목표 — 의사 정체성 즉시 각인

## Phase 2 — NPC 크로스오버 + 공간 개별화 + 능력 체감

### Q2 간호사 크로스오버
- 기존 "처치실 방벽(구조물 제작)" → **"간호사와의 공조"**
- 신규 objective 타입 `npc_quest_complete` — `npc_nurse` / `nurse_quest_emergency` 완료 추적
- `NPCQuestSystem`: `npcQuestCompleted` 이벤트 emit
- `QuestSystem.startQuest`: 타깃 NPC 퀘스트가 이미 완료된 경우 소급 적용
- 효과: NPC 퀘스트 ↔ 메인 퀘스트 교차 → "진료소 운영 게임" 각인

### 보라매병원 서브로케이션 개별화
| Sub | 특화 | 주요 아이템 |
|------|------|------------|
| 응급실 | 기본 응급 | bandage, antiseptic, splint |
| 수술실 | 외과 도구 | scalpel, surgery_kit, combat_scalpel |
| 약품 창고 | 처방약 | antibiotics, stimulant, antidote |
| 영안실 (danger 0.15→0.18) | 고위험 희귀품 | iv_saline, reinforced_bandage |
| 옥상 **약초정원** (개명) | 병원 정원 약초 | herb, herbal_tea |

### 감염 저항 HUD 배지
- `GameState.modStat` — `infection.rateMultiplier` 실제 적용 (기존 정의만 있고 미사용)
- `StatRenderer._renderPassiveBadges` — 🛡️ 감염 저항 -35% + 티어(안정/경계/위험/치명)
- `ui.css` — 배지 스타일 + `badgePulse` 애니메이션

### survive_infection objective + 초반 사이드 퀘스트
- 신규 타입 `survive_infection` — 감염 ≥ minInfection 상태 N일 연속 유지
- `mq_doctor_side_early` — Day 3 활성화, 감염 ≥5로 3일 연속 (능력 체감 강제)

## 수정 파일

| 파일 | 변경 |
|------|------|
| `js/screens/CharCreate.js` | `_doctorEmergencyOpening` 메서드 추가 |
| `js/ui/ModalManager.js` | `openingScene` 이벤트 + `showOpeningScene` |
| `js/data/npcs.js` | 박상훈 하사 이름/백스토리/trustEvent |
| `js/data/mainQuests/doctor/shared.js` | Q1 교체, Q2 교체, `mq_doctor_side_early` 추가 |
| `js/systems/NPCQuestSystem.js` | `npcQuestCompleted` 이벤트 발행 |
| `js/systems/QuestSystem.js` | `npc_quest_complete` / `survive_infection` objective + 핸들러 |
| `js/data/landmarks.js` | 보라매병원 5개 서브로케이션 개별화 |
| `js/core/GameState.js` | `modStat` 감염 `rateMultiplier` 적용 |
| `js/ui/StatRenderer.js` | 패시브 배지 렌더링 |
| `css/ui.css` | 배지 스타일 |

---

# 부상 NPC 드래그 치료 UX + 몬스터 드랍 조정

> 최종 업데이트: 2026-04-19
> 상태: 완료

## 목표
의무 거점 시스템 후속 — 부상 NPC 치료 UX를 드래그 기반 + HP 게이지로 직관화,
좀비/개 드랍을 세계관에 맞게 재정비.

## 주요 변경

### 부상 군인 NPC 치료 개선
- 붕대 필요 수량: 단계당 2개 → **1개** (붕대 1개 = HP 1/3 회복)
- 완치 후 영입 trust: 3 → **1** (즉시 영입 가능)
- 드래그 치료 UX: 붕대 카드를 부상 NPC에 드롭하여 치료
- HP 게이지 시각화 (woundLevel 3→0 기준 0/33/66/100%)

### 몬스터 드랍 재조정
- **신규 아이템**: `tattered_rags` (거적대기) — textile material, weight 0.3
- 좀비: cloth/raw_meat 제거 → tattered_rags 주 드랍
- 광견(dog): raw_meat → tattered_rags (개 시체에서 고기 부적절 수정)
- 변이 좀비·폭주 좀비·방사능 좀비 lootTable 동기화

### 트러스트 0 퀘스트 활성화 fix
- 시작 NPC(간호사 등)의 첫 퀘스트 `triggerTrust: 0`일 때 조건 체크 오류 수정
- 만나자마자 첫 퀘스트 수주 가능하도록 NPCQuestSystem 조건 보정

## 수정 파일

| 파일 | 변경 |
|------|------|
| `js/data/enemies.js` | 좀비/개/변이/폭주/방사능 좀비 lootTable 교체 |
| `js/data/items_base.js` | tattered_rags 아이템 추가 |
| `js/data/stackConfig.js` | tattered_rags 등록 |
| `js/data/npcs.js` | 부상 군인 woundHealQty 2→1, recruitTrust 3→1 |
| `js/board/DragDrop.js` | 붕대 → 부상 NPC 드롭 치료 로직 |
| `js/board/TouchDrag.js` | 모바일 터치 드래그 치료 지원 |
| `js/ui/CardFactory.js` | 부상 NPC HP 게이지 렌더링 |
| `js/ui/NPCDialogueModal.js` | HP 게이지 표시 |
| `js/screens/CharCreate.js` | 이지수 시작 아이템 조정 |
| `css/cards.css` | HP 게이지 스타일 |
| `css/animations.css` | 치료 애니메이션 |

---

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

# 캐릭터 컨텐츠 심화 업데이트 — Phase 2 (퀘스트 다양화)

> 최종 업데이트: 2026-04-16
> 상태: 완료

## 목표
"수집 반복" 위주의 퀘스트 문제를 해결하기 위해 각 캐릭터에 **신규 objective 타입** 기반 다양한 사이드 퀘스트를 대량 추가.

## 신규 인프라 — QuestSystem objective 타입 3종
- **`track_infected`**: 특정 감염자/보스 N마리 처치 (enemyType 또는 enemyId 필터)
- **`treat_npc`**: NPC 치료 N회 (특정 NPC 지정 가능)
- **`rescue_npc`**: 랜드마크 소탕 + NPC 구출 (landmarkId, npcId 지정)
- 이벤트: `enemyKilled` (enemyId/enemyType 포함), `npcHealed`, `landmarkCleared` 발화

## 캐릭터별 사이드 퀘스트 추가 (총 23개)

### 🩺 의사 — 5 사이드 퀘스트
1. 감염 패턴 추적 (track_infected zombie x10)
2. 환자 진료 (treat_npc x3)
3. 역학 조사 (visit junggoo)
4. 격리 거점 구축 (craft medical x3)
5. 특수 감염자 표본 (track_infected boss_patient_zero)

### ⚔️ 군인 — 3 사이드 퀘스트 + 3 랜드마크
**신규 랜드마크 3종**: lm_raider_camp_small/medium/large
- 소규모 소굴 정리 (rescue_npc raider_camp_small)
- 중형 거점 침투 (rescue_npc raider_camp_medium + NPC 영입)
- 요새 강습 (rescue_npc raider_camp_large + `raider_fortress_cleared` 플래그)
- ExploreSystem.markLandmarkCleared() 헬퍼 추가

### 🏕️ 노숙인 — 5 사이드 퀘스트 + 5 타워 NPC
**신규 타워 NPC 5명**: 경비대장·상인·주방장·정비공·의사
- 타워 경비대와 친해지기 (treat_npc npc_tower_security x2)
- 상인과의 거래 (material x10)
- 주방 도우미 (craft food x5)
- 타워 정비 지원 (craft material x8)
- 진료소 협력 (treat_npc x3)

**시작지 변경**: yangcheon → **gwangjin** (동호대교 인근, 스토리 일치)

### 🍳 셰프 — 5 사이드 퀘스트 + 10 희귀 식재료 + 5 특별 요리 + 3 식량 약탈자
**신규 아이템 10종**: 트러플·한우·송이버섯·전복·킹크랩·인삼·꿀·캐비어·와규·사프란
**신규 요리 5종**: gourmet_steak·traditional_feast·truffle_risotto·seafood_platter·special_soup
**신규 적 3종**: food_raider·black_market_dealer·food_warlord(보스)
- 가락시장 탐사 (visit songpa)
- 희귀 식재료 확보 (food x8)
- 식량 약탈자 소탕 (track human x5)
- 특별 요리 제작 (craft food x5)
- 암시장 보스 대면 (track food_warlord x1)

### 🔧 기계공 — 5 선택적 중반 퀘스트
- 장비 개조 도전 (craft weapon x1)
- 전자상가 위험 탐사 (electronic_parts x5)
- 폐공장 탐험 (visit seongdong)
- 군수공장 잠입 (visit jongno, 방사선 지역)
- 연구소 기계 분석 (visit gwanak)

## 수정 파일 (18)
- `js/systems/QuestSystem.js` — 신규 objective 처리 + 이벤트 리스너
- `js/systems/CombatSystem.js` — enemyKilled에 enemyId/enemyType 전달
- `js/systems/NPCSystem.js` — npcHealed 이벤트 발화
- `js/systems/ExploreSystem.js` — markLandmarkCleared 헬퍼
- `js/data/characters.js` — homeless homeDist gwangjin
- `js/screens/CharCreate.js` — gwangjin 바닥 아이템
- `js/data/mainQuests/{chef,doctor,engineer,homeless,soldier}/shared.js` — 23개 사이드 퀘스트
- `js/data/npcs.js` — 타워 NPC 5명
- `js/data/landmarks.js` — 약탈자 소굴 3개
- `js/data/items_misc.js` — 희귀 식재료 10 + 특별 요리 5
- `js/data/blueprints.js` — 특별 레시피 5
- `js/data/secretEnemies.js` — 식량 약탈자 3종
- `js/data/stackConfig.js` + `js/ui/CardFactory.js` — 신규 아이템 등록

## 검증
- validate.js 통과 (기존 에러만 잔존)
- 총 사이드 퀘스트: 23개 (doctor 5 + soldier 3 + homeless 5 + chef 5 + engineer 5)
- 신규 NPC 5, 랜드마크 3, 적 3, 아이템 15 (식재료 10 + 요리 5)

---

# 캐릭터 컨텐츠 심화 업데이트 — Phase 3 (신규 시스템)

> 최종 업데이트: 2026-04-16
> 상태: 완료

## 목표
4개 대형 신규 시스템 구현 — 게임 메카닉 확장으로 캐릭터별 고유 경험 강화.

## 3-A: 군견 유대감 시스템

**NPCSystem 확장**:
- `state.bond` 스탯 추가 (0~100)
- `modBond(npcId, delta)`, `getBondTier(npcId)` API
- `onPlayerConsumedFood(foodId)` — 식사 함께 시 +3 (프리미엄은 +5)

**유대감 단계별 전투 보너스**:
- 0-30: 기본 (1.0x)
- 31-60: 친밀 (1.2x)
- 61-90: 유대 (1.4x)
- 91-100: 교감 (1.6x + 특수 능력)

**트리거**: 식사 +3/+5, 전투 승리 +3, 간식 주기 +5, 일일 +1

**UI**: CombatUI 동반자 패널에 유대감 바 표시, CardContextMenu에 "🦴 간식 주기" 액션

## 3-B: 장비 개조 시스템

**신규 카테고리**: `upgrade` (CraftSystem.js skillMap 확장)

**15 업그레이드 블루프린트**:
- 무기 (6): iron_pipe_reinforced, sharpened_knife_plus, reinforced_bat_plus, machete_plus, spear_plus, crossbow_plus
- 방어구 (5): tactical_vest_plus, helmet_plus, combat_boots_plus, work_gloves_plus, raincoat_plus
- 도구 (4): pipe_wrench_master, flashlight_plus, compass_advanced, binoculars_pro

**전부 워크벤치 + weaponcraft/armorcraft 3~4 요구**

**신규 기계공 퀘스트**: `mq_eng_side_06` 장비 개조 마스터 (upgrade x3)

## 3-C: 아버지 회상 플래시백

**5 시네마틱 씬 추가** (cinematicScenes.js):
- `flashback_young_dae` — 2006 공장 방문 (8살)
- `flashback_father_blueprint` — 20년 전 R22 설계도
- `flashback_last_words` — 2020 유언
- `flashback_r22_hangar` — 정비 기술자 시절
- `flashback_graduation` — 2013 공대 졸업식

**트리거 매핑** (QUEST_TO_FLASHBACK, 8 매핑):
- mq_eng_09 → young_dae / mq_eng_b3_1 → blueprint / mq_eng_07 → last_words
- mq_eng_b3_3 → r22_hangar / 모든 엔딩(a1/a3/b1/b3) → graduation

**구현**: QuestSystem._triggerFlashbackIfAny() + `_flashback_*_played` 일회성 플래그

## 3-D: 발전기 재건 시스템

**신규 랜드마크 3종** (landmarks.js):
- `lm_power_station` — 구로 발전소 (dangerLevel 6, 4 subLocations)
- `lm_water_plant` — 은평 정수장 (dangerLevel 4, 4 subLocations)
- `lm_comms_tower` — 남산 N서울타워 (dangerLevel 5, 4 subLocations)

**B1 엔딩 구체화** (branch_b.js):
- 병렬 3미션: `mq_eng_b1_power/water/comms` (D205/210/215)
- 각 rescue_npc objective + 플래그 (power_station_cleared 등)
- `mq_eng_end_b1`에 `requiresAllFlags: [3개 플래그]` 조건 추가
- 최종 구조물 4개 제작 (변전 패널·수도 허브·통신 중계·관제대)

## 수정 파일 (16)
- `js/systems/NPCSystem.js` — bond API + 유대감 보너스
- `js/systems/CombatSystem.js` — 전투 승리 bond 이벤트
- `js/systems/StatSystem.js` — 식사 bond 트리거
- `js/systems/CraftSystem.js` — upgrade 카테고리 매핑
- `js/systems/QuestSystem.js` — 플래시백 트리거
- `js/data/cinematicScenes.js` — 5 플래시백 + QUEST_TO_FLASHBACK
- `js/data/blueprints.js` — 15 업그레이드 블루프린트
- `js/data/items_misc.js` — 15 업그레이드 결과물
- `js/data/landmarks.js` — 3 재건 랜드마크
- `js/data/mainQuests/engineer/branch_b.js` — B1 병렬 3미션
- `js/data/mainQuests/engineer/shared.js` — 장비 개조 퀘스트
- `js/data/endings.js` — 엔딩 조건 강화
- `js/data/stackConfig.js` + `js/ui/CardFactory.js` — 신규 아이템 등록
- `js/ui/CombatUI.js` — 유대감 바 표시
- `js/ui/CardContextMenu.js` — 간식 주기 액션

## 검증
- 총 아이템 504 (+15), 블루프린트 276 (+15)
- 플래시백 씬 5개, 트리거 매핑 8개
- validate.js 통과 (기존 에러만 잔존)

---

# 캐릭터 컨텐츠 심화 업데이트 — Phase 4 (컨텐츠 확장)

> 최종 업데이트: 2026-04-17
> 상태: 완료

## 목표
블루프린트/아이템 대량 확장 + NPC 퀘스트 체인 + 팀 리더십 시스템으로 플레이 깊이 강화.

## 4-A: 요리 블루프린트 20종
- 한식 5 (김치찌개·된장찌개·갈비찜·비빔밥·냉면)
- 양식 5 (토마토파스타·스테이크·크림수프·샐러드·버섯리조토)
- 디저트 5 (빵·쿠키·케이크·푸딩·초콜릿)
- 특수 5 (보양식·해장국·어묵탕·전골·죽)

## 4-B: 의료 10 + 야전병원 구조물 10
### 의료 (10)
강화붕대·야전해독제·비타민복합제·생리식염수IV·안정제·감염혈청·강화방사선차단제·야전진통제·아드레날린·약초강장제

### 야전병원 구조물 (10)
의료침대·수술대·격리병동·약품보관장·정수시설·혈액은행·방역스테이션·X-ray·인큐베이터·분석실

### 추가 사이드 퀘스트
- `mq_doctor_side_06` — 야전병원 확장 (구조물 3개 제작)
- `mq_eng_side_06` — 장비 개조 마스터 (Phase 3에서 추가됨)

## 4-C: 간호사 NPC 퀘스트 체인 5개
1. 의약품 확보 (기존)
2. 응급 환자 발생
3. 간호사 자격증 복원
4. 의료팀 구성
5. 대규모 진료소 개설 (flag `nurse_clinic_open`)

## 4-D: 셰프 팀 리더십 시스템
### 신규 NPC 2명
- `npc_sous_chef` 박민호 (부주방장, cooking +0.3, moralBonus 0.15)
- `npc_kitchen_helper` 김지은 (주방보조, cooking +0.15, 적은 식비)

### 팀 사기 시스템
- NPCSystem `modNpcMorale(npcId, delta)` + `getTeamAverageMorale()` API
- CraftSystem 요리 품질: 팀 평균 사기 > 85 → +20%, > 70 → +10%

### 추가 사이드 퀘스트
- `mq_chef_side_06` — 주방 팀 구성 (요리 10회 제작)

## 수정 파일 (6)
- `js/data/items_misc.js` — 40 아이템 추가
- `js/data/blueprints.js` — 40 블루프린트 추가
- `js/data/stackConfig.js` — 40 아이템 등록
- `js/ui/CardFactory.js` — 40 이미지 매핑
- `js/data/npcs.js` — 간호사 퀘스트 4개 추가 + 셰프 팀 NPC 2명
- `js/systems/NPCSystem.js` — modNpcMorale/getTeamAverageMorale
- `js/systems/CraftSystem.js` — 셰프 팀 사기 요리 품질 보너스
- `js/data/mainQuests/chef/shared.js` — mq_chef_side_06
- `js/data/mainQuests/doctor/shared.js` — mq_doctor_side_06

## 검증
- validate.js 통과 (기존 에러만 잔존)
- 총 아이템: 504 → 544 (+40, bibimbap은 기존 활용)
- 총 블루프린트: 276 → 316 (+40)
- 셰프 팀 NPC 2명, 간호사 퀘스트 1→5개 체인

---

# 버그 수정 및 UX 개선 — 2026-04-17

> 최종 업데이트: 2026-04-17
> 상태: 완료

## 목표
이지수(의사) 플레이 중 전투 버튼 클릭 후 전투 화면으로 진입하지
못하고 게임이 멈추는 증상 + 소음 UX 혼란 + 기타 UI 버그 해결.

## 🎯 근본 원인 — NoiseSystem `_triggerInflux` 버그

소음이 influxThreshold(60) 초과 시 조우 강제 발동 코드에서
`StateMachine.transition`을 사용하지 않고 **`EventBus.emit` 직접 호출**.

**결과**: `GameState.ui.currentState`가 'main' 그대로 유지되는데
stateTransition 이벤트만 발화. Renderer는 encounter 화면을 활성화하고
Encounter._render는 버튼을 생성하지만, **내부 state는 여전히 main**.
사용자가 전투 버튼 클릭 시 guard가 차단하여 게임 멈춤처럼 보임.

**수정** (`NoiseSystem.js:313~327`):
```javascript
setTimeout(() => {
  if (gs.ui.currentState !== 'main' && gs.ui.currentState !== 'explore') return;
  StateMachine.transition('encounter', { forced: true, noiseInflux: true });
}, 1500);
```

## 🛡️ 방어 코드 계층 (5단)

범인 특정 과정에서 방어 계층을 구축, 향후 유사 버그 방지:

1. **StateMachine 디버그 로그** — encounter/combat/main 전환 시 스택 기록
2. **GameState.deserialize 방어** — 저장 파일의 encounter/combat/combat_result
   state를 'main'으로 강제 복원
3. **Renderer.loaded 리스너 방어** — 동일한 state 복구 로직
4. **Encounter.init() DOM 강제 초기화** — 브라우저 캐시된 잔존 DOM 차단
5. **Encounter guard 자동 복구** — state 불일치 시 DOM 정리 + 올바른 화면 활성화
6. **StatRenderer._syncScreenState** — 매 HUD 업데이트마다 화면-state
   동기화 감시 (범인 포착에 결정적 역할)

## 🎨 UX 개선

### 소음 HUD 감소율 표시
소음 수치 옆에 TP당 감소량 실시간 표시:
- 0~69: `-1.0/TP` (기본)
- 70~79: `-1.5/TP`
- 80~89: `-2.0/TP`
- 90~100: `-2.5/TP` (급가속)

"대기" 버튼 사용 시 소음 급감 현상의 이유를 플레이어에게 명확히 전달.

### favicon 404 해결
`index.html`에 data URI SVG 인라인 favicon 추가 (♠ 스페이드 심볼).
별도 파일 없이 GitHub Pages에서도 정상 표시.

### 캐시 버스팅
`main.js?v=20260417c` 쿼리 추가로 구버전 JS 캐시 무효화.

## 부가 버그 수정

### BoardRenderer `loaded` 리스너 null 방어
메인 메뉴에서 "불러오기" 클릭 시 `board-container`가 아직 DOM에
없어 TypeError 발생하던 문제 해결. null 가드 + Basecamp 진입 시
`reinit()`으로 정상 초기화.

### CombatUI/CombatSystem try/catch 래퍼
전투 화면 진입 실패 시 fallback UI 표시로 완전 멈춤 방지 + 콘솔
에러 상세 로그.

## 수정 파일 (10)
- `js/systems/NoiseSystem.js` — **근본 원인 수정**
- `js/core/StateMachine.js` — 디버그 로그
- `js/core/GameState.js` — deserialize state 복원 방어
- `js/screens/Encounter.js` — init DOM 초기화 + guard 자동 복구
- `js/systems/CombatSystem.js` — _setupCombat try/catch
- `js/ui/CombatUI.js` — render try/catch + fallback UI
- `js/ui/BoardRenderer.js` — loaded null 방어
- `js/ui/Renderer.js` — loaded state 검증
- `js/ui/StatRenderer.js` — 감시견 _syncScreenState + 소음 감소율 표시
- `index.html` — 캐시 버스팅 + favicon

## 검증
- validate.js 통과 (기존 에러만 잔존)
- 사용자 로그에서 StatRenderer 감시견이 범인 스택 트레이스 포착으로
  확정 — `NoiseSystem.js:321` EventBus 직접 emit

---

---

# 의무 거점 내구도 + 5티어 의료 구조물 + NPC 동행 시스템

> 최종 업데이트: 2026-04-18
> 상태: 완료

## 결과 요약

### 의료 구조물 5티어

| Tier | ID | 이름 | onTick | 내구도 |
|------|------|------|--------|--------|
| 1 | medical_station | 의무 거점 | hp:3, inf:-1 | 100 |
| 2 | medical_clinic | 야전 의원 | hp:5, inf:-2 | 130 |
| 3 | medical_ward | 의료 병동 | hp:7, inf:-3, morale:+1 | 170 |
| 4 | field_surgery_station | 야전 수술대 | hp:10, inf:-4, morale:+2 | 220 |
| 5 | field_hospital | 야전 병원 | hp:15, inf:-5, fatigue:-1, morale:+3 | 300 |

- 내구도 감소 0.093/TP (~15일 수명), 0 도달 시 카드 제거
- 분해 불가, 수리 가능 (카드 검사 모달에서 재료 소모)
- 바닥(middle) 가장 왼쪽에 배치

### NPC 동행 시스템 개편

- 대화로 trust 증가 안 함 → 퀘스트 완료로만 증가
- 모든 NPC 첫 퀘스트 triggerTrust: 0 (만나자마자 의뢰 가능)
- 친밀도 기반 능력 스케일링: trust 0→×1.0, trust 5→×1.3 (식량 소모 제외)
- 영입 시 보드 카드 제거, 해제 시 카드 재생성
- 동반자 치료 보너스(healBonus) 의료 아이템에 적용

### 이지수 시작 시나리오

- 보라매병원 응급실 컨셉
- 바닥: 의무 거점 + 부상 군인 NPC + 간호사 NPC
- 간호사 첫 퀘스트: 부상 군인 치료 → 완료 시 간호사 동료 가능
- 부상 군인: 3단계 치료(붕대×2/단계) → 완치 후 동료 가능
- 메스(scalpel) 무기 추가: dmg[8-14], 크리 30%, 소음 0

## 수정 파일

| 파일 | 변경 |
|------|------|
| `js/core/GameState.js` | installedStructures 객체화 + 마이그레이션 |
| `js/data/items_structures.js` | 5티어 의료 구조물 + repairRecipe |
| `js/data/blueprints.js` | 3개 블루프린트 + 이름 수정 |
| `js/data/gameBalance.js` | medicalStation 상수 |
| `js/data/npcs.js` | 부상 군인 NPC + trust 체인 조정 |
| `js/data/characters.js` | 이지수 시나리오 변경 |
| `js/data/items_combat.js` | 메스 무기 |
| `js/systems/StatSystem.js` | 내구도 감소 + 동반자 healBonus |
| `js/systems/CraftSystem.js` | 의료 구조물 왼쪽 배치 |
| `js/systems/NPCSystem.js` | 영입/해제 카드 연동 + trust 스케일링 |
| `js/systems/NPCQuestSystem.js` | treat_npc 타입 + trust 0 활성화 |
| `js/ui/ModalManager.js` | 수리 버튼 + 재료 표시 |
| `js/ui/StatRenderer.js` | 스태미나 바 사이드바 |
| `js/ui/NPCPanel.js` | hidden 해제 + 클릭 이벤트 |
| `js/ui/NPCDialogueModal.js` | 부상 치료 UI + 방어 로직 |

---

## 이전 계획 아카이브

이전 계획(카드 서바이벌 시스템 확장 세부 기획서 — 2026-03-20)은
doc/ 폴더의 PDF 문서 참조.

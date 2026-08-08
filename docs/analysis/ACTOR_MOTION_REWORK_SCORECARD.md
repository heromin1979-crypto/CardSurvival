# Actor Motion Rework Scorecard

이 문서는 `ACTOR_MOTION_REWORK_SCORECARD.json`의 사람이 읽는 결정론적 표현이다. 점수와 issue의 canonical source는 JSON이며, 아래 표의 각 행은 JSON `characters` 순서를 그대로 따른다.

## 채점 기준과 provenance

- rubric: readability 25, continuity 25, identity 20, equipment 15, technical 15, 합계 100.
- 계약: 교체 대상 sheet 각각 80점 이상, 26종 전체 평균 88점 이상.
- 기존 설계 문서에 남은 aggregate는 player 86.0, companion 80.8, overall 82.0이며 개별 원본 점수는 없다.
- 개별 `beforeScore`는 aggregate에서 추정하거나 역산하지 않았다. commit `cdd905a406b7fe7d09d8efeab9d780be33eca22c`의 runtime PNG 26종을 추출해 같은 rubric으로 원본 해상도 재채점했다.
- 재채점 baseline은 player 86.000, companion 79.750, overall 81.192다. 문서 aggregate 82.0과의 -0.808 차이는 개별 원본 부재로 인한 독립 재채점 차이며 두 값을 모두 보존한다.
- current는 runtime 26종과 review preview를 원본 해상도로 판정했다. 20 target row는 current runtime, canonical source alpha, review preview를 대조했다. 각 파일 SHA-256은 JSON `evidence`에 있다.
- baseline/current가 byte-identical인 13종은 SHA-256 일치 확인 후 같은 점수를 재사용했다. 나머지 13종은 서로 다른 SHA-256과 target row 실물을 직접 비교했다.

## 결과

| 집단 | baseline 재채점 | current | 계약 |
|---|---:|---:|---|
| player 6종 | 86.000 | 87.833 | 참고 집계 |
| companion 20종 | 79.750 | 88.300 | 참고 집계 |
| 전체 26종 | 81.192 | 88.192 | >= 88 PASS |
| target sheet 최저 | - | 88 | >= 80 PASS |

## 26종 sheet 점수

`breakdown` 순서는 readability/continuity/identity/equipment/technical이다.

| # | sheetKey | 분류 | before | after | delta | before breakdown | after breakdown | target row | remaining issue 요약 |
|---:|---|---|---:|---:|---:|---|---|---|---|
| 1 | doctor_f | player | 88 | 88 | 0 | 22/20/18/13/15 | 22/20/18/13/15 | - | idle/guard 일부 phase 변화가 작음 |
| 2 | soldier_m | player | 89 | 89 | 0 | 22/20/18/14/15 | 22/20/18/14/15 | - | 일부 recovery가 정지 자세와 가까움 |
| 3 | firefighter_m | player | 81 | 92 | +11 | 18/15/19/14/15 | 23/21/19/14/15 | r2 | 발사 전 f2-f3 차이가 작음 |
| 4 | homeless_m | player | 85 | 85 | 0 | 21/19/18/12/15 | 21/19/18/12/15 | - | 일부 소품 크기 변화 |
| 5 | chef_m | player | 87 | 87 | 0 | 22/19/18/13/15 | 22/19/18/13/15 | - | 일부 move 보폭 차이가 작음 |
| 6 | engineer_m | player | 86 | 86 | 0 | 21/19/18/13/15 | 21/19/18/13/15 | - | support/guard 일부 자세 반복 |
| 7 | old_survivor_companion | companion | 76 | 89 | +13 | 18/14/18/11/15 | 22/19/19/14/15 | r5 | 높은 무릎과 보폭 변화가 다소 큼 |
| 8 | soldier_companion | companion | 83 | 92 | +9 | 20/17/18/13/15 | 23/21/19/14/15 | r2 | 중간 조준 두 phase가 유사함 |
| 9 | nurse_companion | companion | 88 | 88 | 0 | 22/20/18/13/15 | 22/20/18/13/15 | - | move 보폭 변화가 작음 |
| 10 | child_companion | companion | 80 | 92 | +12 | 19/15/18/13/15 | 23/21/19/14/15 | r6 | recovery 마지막 두 phase가 유사함 |
| 11 | mechanic_companion | companion | 74 | 88 | +14 | 17/14/17/11/15 | 21/19/19/14/15 | r1, r4 | toolbox 원근 크기 변화가 남음 |
| 12 | student_companion | companion | 77 | 89 | +12 | 18/15/17/12/15 | 22/19/19/14/15 | r4 | guard f3-f6 변화가 작음 |
| 13 | dog_companion | companion | 76 | 91 | +15 | 18/14/18/11/15 | 23/20/19/14/15 | r6, r7 | death 마지막 hold가 의도적으로 유사함 |
| 14 | former_colleague_companion | companion | 84 | 84 | 0 | 21/18/18/12/15 | 21/18/18/12/15 | - | guard 반복, death 마지막 연결이 짧음 |
| 15 | minjun_companion | companion | 81 | 90 | +9 | 19/16/18/13/15 | 22/20/19/14/15 | r6 | 피격 강도 변화가 미세함 |
| 16 | sohee_companion | companion | 67 | 91 | +24 | 15/11/16/10/15 | 23/20/19/14/15 | r3, r5, r6, r7 | move 중간 보폭 두 장이 유사함 |
| 17 | jisu_companion | companion | 87 | 87 | 0 | 22/19/18/13/15 | 22/19/18/13/15 | - | hit 후반이 death와 다소 가까움 |
| 18 | yeongcheol_companion | companion | 80 | 91 | +11 | 19/15/18/13/15 | 23/20/19/14/15 | r6 | brace가 guard로도 읽힐 여지 |
| 19 | daehan_companion | companion | 62 | 90 | +28 | 13/10/14/10/15 | 22/20/19/14/15 | r2, r6, r7 | ranged 소형 투사체의 축소 식별력 |
| 20 | tower_security_companion | companion | 85 | 85 | 0 | 21/19/18/12/15 | 21/19/18/12/15 | - | flashlight 크기 변화, death 빈 cell |
| 21 | tower_merchant_companion | companion | 84 | 84 | 0 | 21/18/18/12/15 | 21/18/18/12/15 | - | hit가 death와 가까움 |
| 22 | tower_cook_companion | companion | 85 | 85 | 0 | 21/19/18/12/15 | 21/19/18/12/15 | - | move 마지막이 피격 자세와 가까움 |
| 23 | tower_engineer_companion | companion | 86 | 86 | 0 | 21/19/18/13/15 | 21/19/18/13/15 | - | hit가 직립 recovery 없이 끝남 |
| 24 | tower_doctor_companion | companion | 81 | 91 | +10 | 19/16/18/13/15 | 23/20/19/14/15 | r6 | 짧은 피격이라 중간 변위가 작음 |
| 25 | sous_chef_companion | companion | 75 | 89 | +14 | 17/14/17/12/15 | 22/19/19/14/15 | r5 | move 조명이 강하고 f2/f4 유사함 |
| 26 | kitchen_helper_companion | companion | 84 | 84 | 0 | 21/18/18/12/15 | 21/18/18/12/15 | - | guard 소품 위치 변화와 약한 hit recovery |

## 20개 target row 판정

| sheetKey | row | motion | before | after | current에서 보이는 근거 |
|---|---:|---|---:|---:|---|
| firefighter_m | 2 | ranged | 70 | 93 | flare launcher 준비, 조준, 발사/투사체, 회수 |
| old_survivor_companion | 5 | move | 65 | 89 | 직립 이동, 교대 보폭, 지팡이 보유 |
| soldier_companion | 2 | ranged | 75 | 92 | ready, aim, muzzle flash, recoil/settle, ready |
| child_companion | 6 | hit | 74 | 92 | impact, recoil, 직립 recovery, backpack 유지 |
| mechanic_companion | 1 | melee | 72 | 90 | 동일 wrench의 준비, 휘두름, 회수 |
| mechanic_companion | 4 | guard | 68 | 86 | toolbox를 들어 막고 내려오는 sequence |
| student_companion | 4 | guard | 69 | 89 | backpack을 앞으로 옮겨 양손 방어 |
| dog_companion | 6 | hit | 66 | 90 | 네 발 flinch 후 직립 회복, harness 유지 |
| dog_companion | 7 | death | 70 | 92 | 직립, crouch, 측면 낙하, 바닥 hold |
| minjun_companion | 6 | hit | 74 | 90 | backpack/pistol 유지, impact와 recovery |
| sohee_companion | 3 | support | 55 | 92 | 가방과 의약품 사용, firearm 공격 없음 |
| sohee_companion | 5 | move | 58 | 88 | rifle과 bag을 유지한 전진 보행 |
| sohee_companion | 6 | hit | 61 | 90 | impact, 굽힘, 직립 recovery |
| sohee_companion | 7 | death | 64 | 94 | 직립, 무릎, 측면 낙하, 바닥 hold |
| yeongcheol_companion | 6 | hit | 70 | 91 | 중량 impact, 도끼 brace, 직립 회복 |
| daehan_companion | 2 | ranged | 42 | 90 | 본인 외형/wrench 유지, 장치 투사와 회수 |
| daehan_companion | 6 | hit | 58 | 89 | wrench 유지, 직립 impact와 recovery |
| daehan_companion | 7 | death | 55 | 91 | 부상, 무릎, 손 짚기, 측면 낙하, hold |
| tower_doctor_companion | 6 | hit | 70 | 91 | case 유지, 짧은 flinch 후 직립 recovery |
| sous_chef_companion | 5 | move | 65 | 89 | cleaver를 낮춰 든 교대 보행과 직립 복귀 |

## 판정

current 전체 평균은 88.192이고 target sheet 최저점은 88이므로 두 정량 계약을 충족한다. 다만 `remainingIssues`는 0으로 만들거나 숨기지 않았으며 후속 polishing 후보로 그대로 남긴다.

# 전투 모션 개편 최종 QA

- 검증일: 2026-08-01
- 기준 커밋: `99250c1 fix(combat): wire focused motion lifecycle`
- 환경: Windows 11, Node.js 25.8, Vite 8.0.5, Playwright 1.61 Chromium headless, Python bundled runtime + Pillow 12.2
- 판정: **PASS** — 계획 대상 59종과 보조 소환수 1종을 합친 runtime sheet 60/60이 연결되며, 필수 테스트·감사·빌드·패키지 검증에서 실패가 없다.

## 1. 범위와 정확한 roster

계획 대상은 플레이어 6 + 동료 20 + 일반 몬스터 12 + 보스 21 = **59종**이다. `food_raider`는 식량 군벌이 소환하는 보조 전투원으로 계획 대상과 중복되지 않으며, 이를 포함한 `DISPLAYED_COMBAT_SHEET_KEYS`의 실행 시점 총계는 **60종**이다.

### 플레이어 6

| 캐릭터/성별 | sheet key |
| --- | --- |
| `doctor:F` | `doctor_f` |
| `soldier:M` | `soldier_m` |
| `firefighter:M` | `firefighter_m` |
| `homeless:M` | `homeless_m` |
| `chef:M` | `chef_m` |
| `engineer:M` | `engineer_m` |

### 동료 20

`npc_old_survivor→old_survivor_companion`, `npc_nurse→nurse_companion`, `npc_soldier_deserter→soldier_companion`, `npc_child→child_companion`, `npc_mechanic→mechanic_companion`, `npc_student→student_companion`, `npc_dog→dog_companion`, `npc_former_colleague→former_colleague_companion`, `npc_minjun→minjun_companion`, `npc_sohee→sohee_companion`, `npc_jisu→jisu_companion`, `npc_yeongcheol→yeongcheol_companion`, `npc_daehan→daehan_companion`, `npc_tower_security→tower_security_companion`, `npc_tower_merchant→tower_merchant_companion`, `npc_tower_cook→tower_cook_companion`, `npc_tower_engineer→tower_engineer_companion`, `npc_tower_doctor→tower_doctor_companion`, `npc_sous_chef→sous_chef_companion`, `npc_kitchen_helper→kitchen_helper_companion`.

### 일반 몬스터 12

`zombie_patient_dormant`, `zombie_common`, `zombie_runner`, `zombie_brute`, `raider`, `raider_elite`, `zombie_horde`, `rabid_dog`, `zombie_acid`, `zombie_bloater`, `zombie_screamer`, `zombie_charger`.

### 보스 21

`boss_patient_zero`, `boss_radiation_colossus`, `boss_acid_queen`, `boss_horde_mother`, `boss_frozen_giant`, `boss_raider_warlord`, `boss_phantom_sniper`, `boss_cult_leader`, `boss_mutant_alpha_tiger`, `boss_sewer_king`, `boss_swarm_queen_bee`, `boss_feral_dog_alpha`, `boss_penthouse_survivor`, `boss_escaped_experiment`, `boss_blizzard_wraith`, `boss_soldier_nemesis`, `boss_firefighter_nemesis`, `boss_homeless_nemesis`, `boss_chef_nemesis`, `boss_doctor_nemesis`, `food_warlord`.

### 보조 전투원 1

`food_raider` — `food_warlord` 소환 전용이며 계획 59종 밖의 runtime 보조 sheet다.

## 2. roster·semantic row 검증

| 구분 | 검증 결과 | 근거 |
| --- | --- | --- |
| 플레이어 | 6/6 sheet, 수동 QA row 48/48 | `verify_player_motion_qa.py`: 6 records, 48 manual rows |
| 동료 | 20/20 고유 sheet, 60/60 skill, hit/death 40/40, 960 cells | `verify_companion_motion_qa.mjs`: issues 0, rework 0 |
| 일반 몬스터 | 12/12 manifest 연결 | 일반 전용 verifier 9 sheet/51 rows 통과; 공용 4-row 계열 포함 전체는 manifest/audit 60종 검사로 확인 |
| 보스 | 21/21 sheet, 설계 action 84개, semantic rows 147, 1,008 cells | `verify_boss_motion_qa.mjs`: issues 0, rework 0, strict chroma issues 0 |
| 보조 전투원 | 1/1 sheet | `food_raider` manifest·Web·ASAR 포함 확인 |

모든 표시 대상은 각자의 `cols`, `rows`, motion row를 manifest에서 읽는다. 누락 sheet 0, 잘못된 공유 sheet 0, manifest export drift 0이다.

## 3. 실제 focused DOM E2E

`combat-test.html`의 실제 `CombatSystem._setupCombat()`, `CombatUI.render()` 및 focused renderer를 사용했다. legacy sprite span을 fixture에 미리 삽입하지 않았으며, 첫 semantic motion에서 `.combat-sprite-sheet`가 동적으로 만들어지는지 확인했다.

| 시나리오 | 실제 관찰값 | 판정 |
| --- | --- | --- |
| 원거리 플레이어 공격 | `doctor_f`, 6×8, row `28.5714%`, iteration `1`, fill 없음, `motion-move-forward` 없음; 종료 후 idle `0.0000%`/infinite 복귀 | PASS |
| 간호사 근접/치료 분리 | `nurse_scalpel` row `14.2857%` + 접근, `nurse_triage` row `42.8571%` + 접근 없음 | PASS |
| 피격/사망 분리 | `zombie_common` hit `66.6667%` 후 idle, death `100.0000%` + terminal `death` + fill `forwards` | PASS |
| 휴면 환자 기상 | wake queue 1회, row `25.0000%`; 재평가 시 queued wake 0 | PASS |
| bloater 자폭 순서 | self-destruct body row `60.0000%`, fill `forwards`; impact 시 body가 존재하고 이후 제거 | PASS |
| feral alpha 5개 의미 동작 | `neck_bite` `14.2857%`, `frenzy_bite` `28.5714%`, `pack_howl` `42.8571%`, `alpha_hunt` `57.1429%`, `charge` `85.7143%`; howl/charge는 접근 class 없음 | PASS |
| 배속·skip·소유권 | speed 2 finite lifetime 약 374 ms; skip 후 생존자는 idle, 사망/downed/victory/defeat는 terminal 유지, active actor/timer 0; same-root 재렌더와 detached screen의 stale callback 모두 폐기 | PASS |

전체 E2E 보고서는 **64 passed / 0 failed**이며 `tmp/combat-full-playwright/report.json`과 시나리오 screenshot은 검증 산출물로만 두고 커밋하지 않았다. `combat-screen`은 desktop과 mobile page 모두 console warning/error, pageerror, document/script/stylesheet request failure를 수집해 새 브라우저 오류가 있으면 실패한다.

## 4. 자동 검증 결과

| 검증 | 결과 |
| --- | --- |
| 집중 Vitest 8개 파일 | 153 tests PASS |
| 전체 `npm test` | 139 files, 1,666 tests PASS |
| manifest export | 최신 상태, drift 0 |
| sprite audit | total 60, referenced 60, pass 57, warn 3, fail 0 |
| chroma cleanup | 23 sheet pinned, historical unexpected alpha loss 0 |
| 일반 몬스터 motion QA | 9 specialized sheet, 51 rows PASS |
| 플레이어 motion QA | 6 records, 48 manual rows PASS |
| 동료 motion QA | 20 sheet, 60 skills, 960 cells, issues 0 |
| 보스 component contract/build | component contract 및 21개 deterministic target PASS |
| 보스 motion QA | 21 bosses, 147 semantic rows, 1,008 cells, issues 0 |
| 데이터 validator | skills 81/enemies 12/bosses 21/displayed sheets 60, errors 0 |

Chroma 감사에서 opaque green, fringe green, hidden transparent RGB, 미허용 isolated green component, stale allowlist는 모두 0이다. 잘못된 grid, 빈 프레임, idle foot drift 실패, edge-touch 실패도 0이다. 수동 QA 상태는 저장소에 연결되었으나 외부 인증 시스템과 연동하지 않는 `linked-not-authenticated`로 기록된다.

## 5. 빌드·패키지 자산 검증

| 산출물 | runtime sheet | 누락 | `art_sources` leak |
| --- | ---: | ---: | ---: |
| Vite Web build | 60/60 | 0 | 0 |
| Electron `dist/win-unpacked/resources/app.asar` (5,170 entries) | 60/60 | 0 | 0 |

`npm run build:web`과 `npm run build:dir`가 모두 성공했다. 원본 제작용 `art_sources`는 배포 산출물에 포함되지 않았다.

## 6. fallback 판정

- semantic/identity fallback: 캐릭터 성별·동료 ID·몬스터 ID를 고유 sheet key로 해석하며, registry에 없는 의미 동작은 manifest alias/기본 motion으로만 축소된다.
- cosmetic/static fallback: 안전하게 해석할 manifest가 없을 때만 기존 정적 portrait를 유지하고 임의의 타 캐릭터 sheet를 생성하지 않는다.
- 최종 근거: 표시 대상 누락 0, 의도하지 않은 sheet 공유 0, chroma 오류 0, Web/ASAR runtime 누락 0. 따라서 fallback은 외형 열화 경로일 뿐 roster 정체성을 바꾸지 않는다.

## 7. 경고와 후속 조치

실패는 없지만 아래 비차단 경고를 숨기지 않고 유지한다.

- sprite audit `white-bg-risk` 3건: `boss_raider_warlord` 647 opaque white pixels, `boss_penthouse_survivor` 606, `boss_chef_nemesis` 503. 녹색 잔여·투명도·빈 프레임 문제는 아니며 현재 렌더링을 차단하지 않는다. 후속 아트 검수에서 흰색이 의도된 섬광/장식인지 확인하고, 배경 잔여라면 해당 frame만 정리한다.
- 데이터 validator의 기존 `stackConfig` warning 215건: motion roster 오류가 아니며 errors 0이다. 아이템 데이터 정규화 작업으로 분리한다.
- Vite의 기존 dynamic import 최적화 warning과 Electron package의 author 누락 warning: 빌드·패키지 생성에는 영향이 없다. 번들 구성과 package metadata 정리 작업으로 분리한다.
- Node의 module type warning: 테스트 결과에는 영향이 없다. `package.json` 모듈 형식 정리는 별도 호환성 검토 후 진행한다.

## 8. 결론

계획 대상 **59/59**와 보조 소환수 **1/1**, 즉 runtime **60/60**이 실제 focused combat DOM, lifecycle, manifest, sprite 자산, Web build, Electron ASAR에서 일관되게 확인되었다. 필수 실패 0이므로 전투 모션 개편 최종 QA는 PASS다.

# 일반 몬스터 12종 전투 모션 QA

검수 일자: 2026-08-01  
프리뷰: `output/combat/normal_enemy_motion_preview.png`  
격자 규격: 전 시트 6열, 셀당 256×256px

## 판정 기준

- 대기 모션만 반복하며 공격·예고·피격·사망 모션은 1회 재생한다.
- 원거리 공격, 조준, 포효, 충전은 제자리에서 재생한다.
- 돌진·근접 타격만 대상 방향 접근 이동을 사용한다.
- 모든 프레임은 하단 중심에 고정되고 셀 경계를 침범하지 않는다.
- 투명 배경, 크로마 잔여, 빈 프레임, 행/열 규격을 자동 감사와 함께 확인한다.

## 모션별 판정

| 몬스터 | 행 수 | 모션 판정 | 결과 |
|---|---:|---|---|
| `zombie_patient_dormant` | 5 | `dormant` 통과 · `wake` 통과 · `basic_attack` 통과 · `hit` 통과 · `death` 통과 | 통과 |
| `zombie_common` | 4 | `idle` 통과 · `basic_attack` 통과 · `hit` 통과 · `death` 통과 | 통과 |
| `zombie_runner` | 6 | `idle` 통과 · `basic_attack` 통과 · `telegraph` 통과 · `runner_rush` 통과 · `hit` 통과 · `death` 통과 | 통과 |
| `zombie_brute` | 6 | `idle` 통과 · `basic_attack` 통과 · `telegraph` 통과 · `slam` 통과 · `hit` 통과 · `death` 통과 | 통과 |
| `raider` | 5 | `idle` 통과 · `basic_attack` 통과 · `reload` 통과 · `hit` 통과 · `death` 통과 | 통과 |
| `raider_elite` | 6 | `idle` 통과 · `basic_attack` 통과 · `aim` 통과 · `aimed_shot` 통과 · `hit` 통과 · `death` 통과 | 통과 |
| `zombie_horde` | 4 | `idle` 통과 · `basic_attack` 통과 · `hit` 통과 · `death` 통과 | 통과 |
| `rabid_dog` | 4 | `idle` 통과 · `basic_attack` 통과 · `hit` 통과 · `death` 통과 | 통과 |
| `zombie_acid` | 5 | `idle` 통과 · `basic_attack` 통과 · `acid_lash` 통과 · `hit` 통과 · `death` 통과 | 통과 |
| `zombie_bloater` | 6 | `idle` 통과 · `basic_attack` 통과 · `charge` 통과 · `self_destruct` 통과 · `hit` 통과 · `death` 통과 | 통과 |
| `zombie_screamer` | 6 | `idle` 통과 · `basic_attack` 통과 · `charge` 통과 · `summon_horde` 통과 · `hit` 통과 · `death` 통과 | 통과 |
| `zombie_charger` | 6 | `idle` 통과 · `basic_attack` 통과 · `charge` 통과 · `charge_strike` 통과 · `hit` 통과 · `death` 통과 | 통과 |

## 런타임 연결 판정

| 항목 | 확인 결과 | 판정 |
|---|---|---|
| 휴면 환자 기상 | `_dormantRemaining`이 0이 되는 시점에 `wake`를 1회만 큐에 추가 | 통과 |
| 예고/발동 분리 | 러너·브루트의 `telegraph`, 엘리트의 `aim`, 충전형 몬스터의 `charge`를 발동 행과 분리 | 통과 |
| 원거리 제자리 공격 | 레이더·엘리트·산성 좀비·스크리머의 공격/조준/포효에 `stationary` 적용 | 통과 |
| 접근 공격 | `runner_rush`, `slam`, `charge_strike`에만 `approach` 적용 | 통과 |
| 자폭 순서 | `self_destruct` 몸체 파열 행 → 폭발 overlay → 적 DOM 제거 순서를 타이머 테스트로 확인 | 통과 |

## 흰색 픽셀 감사 근거

`raider_elite`의 불투명 흰색 528px를 원본 크기 시트와 프리뷰에서 확인했다. 이 중 390px는 총구 섬광이 있는 `basic_attack` 1행과 `aimed_shot` 3행에 있고, 나머지 행은 갑옷·눈 하이라이트 138px다. 전역 임계값을 완화하지 않고 `tools/audit_combat_sprites.mjs`에 이 시트의 1·3행만 허용하는 상한 420px, 기타 행 상한 150px의 행 단위 감사 메타데이터를 추가했다. 다른 시트 또는 허용 행 밖의 흰 배경 증가는 계속 `white-bg-risk`로 검출된다.

## 자동 검증 결과

- normal 프리뷰 감사: 활성 12종, 고유 시트 12개, 누락 0, 잘못된 크기 0, 빈 행 0
- 전체 스프라이트 감사: 총 23개, 통과 23, 경고 0, 실패 0
- 관련 Vitest: 4개 파일, 74개 테스트 통과
- 전체 Vitest: 135개 파일, 1,582개 테스트 통과
- 데이터 검증: 오류 0(기존 `stackConfig` 경고 215건)
- 웹 빌드: 264개 모듈 변환 성공
- 재작업 항목: **0**

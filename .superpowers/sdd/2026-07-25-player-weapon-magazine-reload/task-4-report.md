# Task 4 완료 보고서

## 변경 요약

- 랭크 전투 command context가 플레이어의 `weapon_main` 장착 무기만 `canFire()`로 발사 가능 여부를 확인하도록 변경했습니다.
- 랭크 비용은 `magazineRound`를 가장 먼저 `consumeRound()`로 소비합니다. 빈 탄창 실패 시 스태미나·소음·내구도는 변경되지 않습니다.
- 원거리 숙련도의 보드 탄약 절약/차감 분기를 제거했습니다. 탄약 카드 수량은 재장전에서만 탄창 20발 팩으로 소비됩니다.
- 동료 combatant에 정의의 양수 `companion.combatDmg`를 `combatDamageMultiplier`로 전달하고, 동료 자신의 피해에 한 번만 적용했습니다.
- 명중·빗나감 발사 비용, 빈 탄창 원자성, NPC 비용 격리, NPC 피해 배율을 단위·통합 테스트로 추가했습니다.

## TDD 검증

### RED

```powershell
npx.cmd vitest run tests/unit/CombatantAdapter.test.js tests/unit/CombatSystem_rankedPipeline.test.js tests/integration/WeaponAmmoCombat.int.test.js
```

결과: 3개 테스트 파일 중 7개 실패, 31개 통과. 실패는 `combatDamageMultiplier`가 `undefined`, 탄창이 `2`에서 감소하지 않음, 빈 탄창이 성공 처리됨, 동료 피해가 배율 없이 `10`으로 계산됨, 실제 권총 명령이 발사 검증 context 부재로 실패한 경우였습니다.

### GREEN

```powershell
npx.cmd vitest run tests/unit/CombatantAdapter.test.js tests/unit/CombatSystem_rankedPipeline.test.js tests/integration/WeaponAmmoCombat.int.test.js
```

결과: 3개 테스트 파일, 38개 테스트 모두 통과.

### 전체 회귀

```powershell
npm.cmd test
```

결과: 91개 테스트 파일, 1,042개 테스트 모두 통과.

## 커밋

완료 후 아래에 기록합니다.

## 우려 사항

- 레거시 비랭크 `_attackAction`에는 기존 `ammoSave` 분기가 남아 있습니다. 이번 Task는 랭크 파이프라인만 변경하도록 정의되어 있어 해당 경로는 수정하지 않았습니다.

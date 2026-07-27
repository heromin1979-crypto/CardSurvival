# Task 7 완료 보고 — 전투 명령 덱 탄창/재장전 상태

## 변경 사항

- `js/ui/CombatUI.js`
  - 플레이어의 `magazineRound` 원거리 스킬에만 `getMagazineState()`와 `canReload()`를 적용하는 `_magazineActionState()`를 추가했다.
  - 장전됨: 공격 명령과 현재 탄창 수를 표시한다.
  - 빈 탄창 + 호환 탄약 팩: 동일 카드가 재장전 명령으로 전환되며, 클릭은 `CombatSystem.reloadActiveWeapon()`에 위임한다.
  - 빈 탄창 + 호환 탄약 팩 없음: 명확한 탄약 없음 상태로 비활성화한다.
  - 재장전 상태에는 원거리 스킬의 위치 제한을 적용하지 않아, 위치 변경 없이 재장전할 수 있다.
- `css/screens-combat.css`
  - 기존 명령 덱 카드 스타일과 디자인 토큰 `--accent-primary`, `--text-danger`를 사용해 재장전/탄약 없음 상태를 표시했다.
- `js/data/locales.js`
  - 한국어/영어에 재장전, 탄약 없음, 탄약 팩 소비, 장전 수 locale을 추가했다.
- `tests/integration/WeaponAmmoUI.int.test.js`
  - 장전 공격(탄약 팩이 있어도 top-off 재장전으로 전환되지 않음), 재장전 성공, 탄약 없음 비활성, 근접 보조무기 독립 활성 상태를 통합 테스트했다.

## TDD 및 검증

- RED: `npx.cmd vitest run tests/integration/WeaponAmmoUI.int.test.js tests/integration/CombatFocusedUI.int.test.js`
  - 새 테스트 3개가 `data-command` 미구현으로 실패하는 것을 확인했다.
- GREEN: 위 focused UI 테스트를 다시 실행해 2개 파일, 24개 테스트 통과를 확인했다.
- 전체 회귀: `npx.cmd vitest run`으로 92개 파일, 1063개 테스트 통과를 확인했다.
- 데이터 검증: `node js/data/validate.js` 실행 결과 오류 0, `ALL CLEAR`를 확인했다. 기존 `stackConfig.js` 누락 219건 및 material dead-end 10건 경고는 발생했으나 이번 locale/UI 변경과 무관하다.
- `git diff --check`를 통과했다.

## 커밋

- Task 7 파일만 단일 커밋으로 기록했다.

## 우려 사항

- `node --input-type=module js/data/validate.js`는 현재 Node.js 25에서 파일 인수와 함께 사용할 수 없어 `ERR_INPUT_TYPE_NOT_ALLOWED`가 발생했다. 동일 검증은 `node js/data/validate.js`로 정상 완료했다.

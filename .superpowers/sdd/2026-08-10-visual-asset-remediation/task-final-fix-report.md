# 최종 검토 후속 보완 보고

## 원인과 변경

- 소방관 퀘스트는 `fire_ending`에 서브 엔딩 코드를 저장하지만, 엔딩 화면과 `EndingSystem.unlockEnding()`은 `firefighter_ending`을 읽고 있었다. `EndingSystem.getCharacterEndingCode()`에서 소방관의 실제 키를 해석하고 두 소비 경로가 같은 로직을 사용하도록 통일했다.
- 노숙자 B3 퀘스트의 실제 코드 `b3_network`를 기존 `homeless_b3_wanderer.png` 이미지에 연결했다. 새 이미지나 엔딩 데이터는 만들지 않았다.
- 이미지가 없는 sublocation fallback은 `def.icon`을 먼저 사용하고, 값이 없을 때만 `uiIcon('location')`을 사용하도록 수정했다. 일반 아이템/NPC/동적 카드 분기는 변경하지 않았다.

## TDD RED

수정 전 아래 명령을 실행했다.

```powershell
npm.cmd test -- --run tests/unit/EndingImages.test.js tests/unit/SublocationSceneAssets.test.js
```

- 2개 파일 중 2개 실패, 26개 테스트 중 4개 실패했다.
- 소방관 엔딩 화면 이미지 `src`가 `undefined`였다.
- 갤러리 저장 메타가 `{ day: 42, subEnding: null }`이었다.
- `getEndingImage('homeless', 'b3_network')`가 `undefined`를 반환했다.
- 동적 sublocation 아이콘 `🧭` 대신 `ui-icon--location`이 렌더링됐다.

## GREEN 및 전체 검증

```powershell
npm.cmd test -- --run tests/unit/EndingImages.test.js tests/unit/SublocationSceneAssets.test.js
```

- 2개 파일, 26개 테스트 통과.

```powershell
npm.cmd test -- --run tests/unit/EndingImages.test.js tests/unit/UiIcon.test.js tests/unit/SublocationSceneAssets.test.js tests/unit/HiddenLocationWiring.test.js
```

- 4개 파일, 282개 테스트 통과.

```powershell
npm.cmd test
```

- 187개 파일 통과.
- 2,446개 테스트 통과, 3개 skipped.
- 기존 `combatMotionManifest.js`의 `MODULE_TYPELESS_PACKAGE_JSON` 경고 외 실패는 없었다.

활성 `js`/`tests` 경로에서 `firefighter_ending` 검색 결과는 0건이었다.

## 범위

- 수정: `js/data/endingImages.js`, `js/screens/Ending.js`, `js/systems/EndingSystem.js`, `js/ui/CardFactory.js`
- 테스트: `tests/unit/EndingImages.test.js`, `tests/unit/SublocationSceneAssets.test.js`
- 미수정: `js/data/endings.js`, `js/data/hiddenLocations.js`, 모든 이미지 파일

## 커밋

- 메시지: `fix: align ending image keys and fallback icons`
- 이 보고서를 포함한 커밋 해시는 최종 완료 보고에 기록한다.

## 재검토 후속: 기존 갤러리 메타 복구

- 기존 저장에 `{ day: 42, subEnding: null }`을 seed한 뒤 `unlockEnding()`을 다시 호출하는 회귀 테스트를 먼저 추가했다.
- RED: `tests/unit/EndingImages.test.js` 9개 중 1개 실패. 기존 `subEnding: null`이 복구되지 않았다.
- `unlockEnding()`은 기존 메타의 `subEnding`이 nullish이고 현재 캐릭터 플래그에서 유효 코드가 확인될 때만 해당 필드를 backfill한다.
- 기존 `day` 및 유효한 `subEnding`은 덮어쓰지 않는다.
- GREEN: `tests/unit/EndingImages.test.js` 9개 전부 통과.
- 지정 검증: 4개 파일, 284개 테스트 통과. 전체 suite는 187개 파일, 2,448개 테스트 통과 및 3개 skipped.
- 별도 커밋 메시지: `fix: backfill missing ending gallery metadata`

## 최종 재검토: 갤러리 read-path lazy migration

- `unlockEnding()` 재호출 없이 기존 `{ day: 42, subEnding: null }` 저장을 `EndingGallery._buildCard()`로 직접 렌더링하는 회귀 테스트를 추가했다.
- RED: `tests/unit/EndingImages.test.js` 10개 중 1개 실패. 실제 갤러리 카드의 이미지 `src`가 `undefined`였다.
- `EndingSystem.resolveEndingSubCode()`는 저장된 유효 코드를 우선 사용하고, nullish인 경우에만 현재 `GameState.flags`의 실제 키로 해석한다.
- 기존 메타 항목이 있으면 `subEnding`만 lazy backfill하며 `day`와 유효한 기존 코드는 보존한다.
- 갤러리 카드와 lightbox가 동일한 resolution API를 사용한다.
- GREEN: `tests/unit/EndingImages.test.js` 10개 전부 통과.
- 지정 검증: 4개 파일, 285개 테스트 통과. 전체 suite는 187개 파일, 2,449개 테스트 통과 및 3개 skipped.
- 별도 커밋 메시지: `fix: migrate ending metadata on gallery read`

## 갤러리 migration 분기 검증 보완

- legacy B3 메타에 현재 `fire_ending: 'a1_shelter'` 또는 bogus 코드를 주입하고 실제 갤러리 렌더링 경로를 실행하는 회귀 테스트를 추가했다.
- RED: `tests/unit/EndingImages.test.js` 13개 중 2개 실패. mismatch는 A1 이미지를 B3 카드에 표시했고 bogus 코드는 메타에 영속됐다.
- 후보 코드는 `getEndingImage()`의 실제 매핑으로 유효성을 확인하고, `ENDINGS[id].condition`의 실제 분기 조건으로 엔딩 ID와의 연관성을 확인한다.
- 새 하드코딩 ID↔코드 목록은 추가하지 않았다.
- 올바른 B3 코드는 계속 복구되고, 유효한 기존 메타는 현재 플래그와 달라도 보존된다.
- GREEN: `tests/unit/EndingImages.test.js` 13개 전부 통과.
- 지정 검증: 4개 파일, 288개 테스트 통과. 전체 suite는 187개 파일, 2,452개 테스트 통과 및 3개 skipped.
- 별도 커밋 메시지: `fix: validate gallery ending metadata migration`

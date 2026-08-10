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

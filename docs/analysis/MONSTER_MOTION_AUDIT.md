# 몬스터 전투 동작 이미지 감사

작성 기준: 2026-07-28 production 코드와 실제 자산 기준

- 활성 몬스터 원본: `js/data/GameData.js`
- 보스 원본: `js/data/secretEnemies.js`
- 보스 행동 선택: `js/systems/combat/BossPatternController.js`
- 보스 효과 실행: `js/systems/combat/EnemyActionExecutor.js`
- 전투 스프라이트 선언/직접 매핑: `js/ui/combat/combatUiAssets.js`
- 전투 스프라이트 fallback: `js/ui/combat/CombatFxPlayer.js`
- 스프라이트 자산 폴더: `assets/images/combat/spritesheets/enemies`
- 모션 계약: `docs/analysis/COMBAT_CHARACTER_MOTION_LIST.md`

`tools/render_monster_motion_preview.py`는 아직 `CombatUI.js` 안에 상수가 있던 이전 구조를
파싱한다. 현재 상수는 `combatUiAssets.js`로 분리됐으므로 이 도구의 프리뷰/JSON은 파서를
갱신하기 전까지 현재 매핑의 근거로 사용하지 않는다. 아래 수치는 production 모듈을 직접
import해 `GameData.enemies`, `ENEMY_SPRITE_KEYS`, `COMBAT_SPRITE_SHEETS`를 대조하고 실제
PNG 파일을 검사한 결과다.

## 현재 스프라이트시트 계약

전투 UI는 6열 x 4행 PNG 시트를 사용한다. 최종 표시용 파일 크기는 `1536 x 1024`이며, 각 셀은 `256 x 256`이다.

| 행 | 용도 | 연결 CSS |
|---:|---|---|
| 0 | idle / combat-ready | `.motion-zombie-idle`, `.motion-combat-ready` |
| 1 | attack / special / advance | `.motion-zombie-lunge`, `.motion-zombie-heavy`, `.motion-zombie-spit`, `.motion-zombie-advance`, `.motion-zombie-scream` |
| 2 | hit / debuff / knockback | `.motion-zombie-hit`, `.motion-hit-light`, `.motion-hit-heavy`, `.motion-knockback`, `.motion-debuff-pulse` |
| 3 | death | `.motion-zombie-death`, `.is-dead` |

## 검사 결과

| 항목 | 결과 |
|---|---:|
| 활성 몬스터 수 | 33 |
| 고유 스프라이트시트가 있는 활성 몬스터 | 19 |
| 고유 스프라이트시트가 없는 활성 몬스터 | 14 |
| 크기 오류 | 0 |
| 비어 있는 모션 행 | 0 |
| 삭제된 적의 UI 매핑 잔존 | 0 |

기존 표시용 시트에는 순수 초록 크로마키 배경 픽셀이 남아 있었고, 이번 감사 중 최종 표시용 `*_sheet.png`에서 투명 처리했다. `_src.png` 원본은 보존했다.

## production 보스 패턴과 효과 경로

`GameData.enemies`는 일반 적 12종과 `SECRET_ENEMIES` 보스 21종을 합쳐 총 33종을
노출한다. 21종 모두 `isBoss: true`와 `bossPattern`을 가지며, 각 패턴은 기본공격 2개,
특수기 1개, 필살기 1개로 구성되어 production action은 총 84개다.

1. `CombatAiTurns._commitBossAction()`이 `commitNextBossAction()`에 실제 적, 생존 대상,
   소환 수, 쿨다운을 전달한다.
2. `BossPatternController`는 조건과 쿨다운이 충족된 때만 특수기 30% 판정을 수행하고,
   유효한 두 기본공격 사이에서는 직전 기본공격을 제외한다.
3. `CombatRankedEffects._applyRankedDamageEffect()`가 생존한 보스의 HP가 30% 임계점을
   처음 통과할 때 `reserveUltimateAfterDamage()`를 호출한다. 진행 중인 예고 행동은
   유지하고 필살기를 다음 행동으로 예약하는 B안이다. 필살기 기회는 commit/예고 시점에
   한 번 소비되고 이후 발동 또는 취소로 종결된다.
4. 준비된 action은 `executeEnemyAction()`에서 `damage`, `status`, `targetStatus`,
   `move`, `forcedMove`, `selfHeal`, `selfStatus`, `summon`, `consumeSummons`, `partyDamage`,
   `battlefieldStatus`, `resource`, `weaponLock`, `noise`로 해석된다.
5. `CombatFxPlayer`는 action의 `motionKey`, `impactFx`, `movement`, `camera`를 받아
   전용 시트가 있으면 해당 시트를 사용하고, 없으면 적 타입별 공용 시트로 fallback한다.

`node tools/simulate_boss_patterns.mjs --runs 500 --seed 20260728 --out tmp/boss-pattern-qa.md`
로 보스별 500전투·전투별 20턴을 검사했다. 특수기 분모는 조건과 쿨다운이 충족되어
컨트롤러가 실제 30% 판정을 수행한 90,531회만 사용했다. 선택은 26,867회였고 보스별
선택률은 28.67~30.98%였다. 임계 통과, 예약, 예고, 발동은 각각 10,500회였으며
전투당 필살기 최대 사용은 1회였다. 두 기본공격은 21종 모두 사용됐고 불필요한 연속
기본공격, 지원되지 않은 effect, 대상 없음/무효 action은 모두 0회였다. 생성된
`tmp/boss-pattern-qa.md`는 검증 산출물이므로 커밋하지 않는다.

## 고유 시트가 있는 활성 몬스터

| ID | 비고 |
|---|---|
| `zombie_patient_dormant` | 일반 좀비 |
| `zombie_common` | 일반 좀비 |
| `zombie_runner` | 일반 좀비 |
| `zombie_brute` | 일반 좀비 |
| `raider` | 인간 |
| `raider_elite` | 인간 |
| `zombie_horde` | 일반 좀비 |
| `rabid_dog` | 동물 |
| `zombie_acid` | 일반 좀비 |
| `zombie_bloater` | 일반 좀비 |
| `zombie_screamer` | 일반 좀비 |
| `zombie_charger` | 일반 좀비 |
| `boss_horde_mother` | 보스 |
| `boss_raider_warlord` | 보스 |
| `boss_feral_dog_alpha` | 보스 |
| `boss_penthouse_survivor` | 보스 |
| `boss_soldier_nemesis` | 보스 |
| `boss_homeless_nemesis` | 보스 |
| `food_warlord` | 보스 |

## 고유 시트 생성이 필요한 활성 몬스터

21종 보스 중 위 목록의 7종만 `ENEMY_SPRITE_KEYS`에 직접 연결되어 있다. 아래 14종은
`CombatFxPlayer._enemySpriteSheetKey()`의 타입 fallback 때문에 전투 화면에서 각각
`zombie_common`, `raider`, `rabid_dog` 공용 시트로 표시된다. 저장소 루트의
`assets/images/combat_generated_secret_boss_*_v1.png`는 카드/일러스트 자산이며,
6열 x 4행 전투 시트가 아니므로 전용 combat sheet 완료로 세지 않는다.

보스 개성을 실제 전투 모션에 반영하려면 아래 14종 각각에
`*_sheet.png`, `*_sheet_src.png`, `COMBAT_SPRITE_SHEETS`,
`ENEMY_SPRITE_KEYS` 연결이 모두 필요하다.

| ID | 타입 | 핵심 스킬 |
|---|---|---|
| `boss_patient_zero` | zombie | `infected_charge`, `mutation_regeneration` |
| `boss_radiation_colossus` | zombie | `ground_slam`, `fallout_zone` |
| `boss_acid_queen` | zombie | `acid_spray`, `acid_pool` |
| `boss_frozen_giant` | zombie | `frost_breath`, `ice_armor` |
| `boss_phantom_sniper` | human | `precision_shot`, `camouflage` |
| `boss_cult_leader` | human | `cultist_bomb`, `sermon` |
| `boss_mutant_alpha_tiger` | animal | `pounce_assault`, `roar` |
| `boss_sewer_king` | animal | `death_roll`, `submerge` |
| `boss_swarm_queen_bee` | animal | `stinger_barrage`, `royal_jelly` |
| `boss_escaped_experiment` | zombie | `mutant_claw`, `adaptive_mutation` |
| `boss_blizzard_wraith` | zombie | `freezing_touch`, `blizzard_cloak` |
| `boss_firefighter_nemesis` | zombie | `fire_axe`, `burning_charge` |
| `boss_chef_nemesis` | zombie | `cleaver_flurry`, `boiling_oil_field` |
| `boss_doctor_nemesis` | zombie | `surgical_strike`, `virus_injection` |

## 이미지 생성 프롬프트 공통 규격

각 누락 몬스터는 아래 규격으로 생성한다.

```text
Use case: game asset sprite sheet
Asset type: CardSurvival side-view enemy combat sprite sheet
Primary request: create one 6 columns x 4 rows sprite sheet for <enemy id>.
Canvas: 1536x1024 PNG source sheet, each frame is 256x256.
Rows: row 0 idle/combat-ready, row 1 attack/special/advance, row 2 hit/debuff/knockback, row 3 death/collapse.
Style/medium: gritty 2D game sprite, ruined Seoul survival horror, painterly pixel-sprite hybrid, dark utilitarian palette.
Composition/framing: full body side-view facing left, bottom-center anchored in every frame, generous padding inside each 256x256 cell.
Background: perfectly flat solid #00ff00 chroma-key background only, no shadows, no scenery, no labels.
Constraints: same character identity across all 24 frames, no UI, no text, no watermark, no camera angle changes.
Avoid: poster composition, close-up portraits, cropped body, inconsistent scale, extra characters, transparent holes inside the body.
```

생성 후 처리:

1. `#00ff00` 크로마키를 제거해 최종 `*_sheet.png`를 만든다.
2. 원본 생성본은 `*_sheet_src.png`로 보존한다.
3. `js/ui/combat/combatUiAssets.js`의 `COMBAT_SPRITE_SHEETS`,
   `ENEMY_SPRITE_KEYS`에 새 ID를 등록한다.
4. `cmd /c npm.cmd test -- tests/unit/CombatSpriteSheetAssets.test.js tests/integration/CombatUIRankLineup.int.test.js`를 실행한다.

## gpt-image-2 생성 준비 상태

실제 배치 프롬프트는 `tools/build_monster_sprite_image_prompts.py`로 생성한다. 현재 배경색은 몬스터의 초록/산성 계열과 충돌을 줄이기 위해 `#ff00ff` 자주색 크로마키를 사용한다. 게임 적용본은 `tools/apply_monster_sprite_outputs.py`가 자주색 배경을 투명 처리해 만든다.

프롬프트 생성:

```powershell
python tools\build_monster_sprite_image_prompts.py
```

API 호출 전 dry-run:

```powershell
python C:\Users\USER\.codex\skills\.system\imagegen\scripts\image_gen.py generate-batch `
  --input tmp\imagegen\monster_sprites_missing14.jsonl `
  --out-dir output\imagegen\monster-sprites-missing14 `
  --concurrency 2 `
  --dry-run
```

실제 gpt-image-2 생성:

```powershell
python C:\Users\USER\.codex\skills\.system\imagegen\scripts\image_gen.py generate-batch `
  --input tmp\imagegen\monster_sprites_missing14.jsonl `
  --out-dir output\imagegen\monster-sprites-missing14 `
  --concurrency 2
```

생성본 적용:

```powershell
python tools\apply_monster_sprite_outputs.py output\imagegen\monster-sprites-missing14
```

검증:

```powershell
cmd /c npm.cmd test -- tests/unit/CombatSpriteSheetAssets.test.js tests/integration/CombatUIRankLineup.int.test.js
node tools/audit_combat_sprites.mjs --check
```

`tools/render_monster_motion_preview.py`는 위에 기록한 상수 분리 대응을 먼저 완료한 뒤
프리뷰 재생성 검증에 다시 포함한다.

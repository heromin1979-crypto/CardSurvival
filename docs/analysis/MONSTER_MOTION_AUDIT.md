# 몬스터 전투 동작 이미지 감사

작성 기준: 현재 코드 기준

- 활성 몬스터 원본: `js/data/GameData.js`
- 전투 스프라이트 매핑: `js/ui/CombatUI.js`
- 스프라이트 자산 폴더: `assets/images/combat/spritesheets/enemies`
- 모션 계약: `docs/analysis/COMBAT_CHARACTER_MOTION_LIST.md`
- 생성 프리뷰: `output/combat/monster_motion_preview_active_sheets.png`
- 감사 JSON: `output/combat/monster_motion_audit.json`

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

현재 이 14종은 `CombatUI._enemySpriteSheetKey()`의 타입 fallback 때문에 전투 화면에서 공용 이미지로 대체될 수 있다. 보스 개성을 살리려면 각 몬스터별 `*_sheet.png`와 `*_sheet_src.png`가 필요하다.

| ID | 타입 | 핵심 스킬 |
|---|---|---|
| `boss_patient_zero` | zombie | `viral_burst` |
| `boss_radiation_colossus` | zombie | `ground_slam` |
| `boss_acid_queen` | zombie | `acid_spray`, `acid_pool` |
| `boss_frozen_giant` | zombie | `frost_breath`, `ice_armor` |
| `boss_phantom_sniper` | human | `headshot`, `camouflage` |
| `boss_cult_leader` | human | `fanatic_bomb`, `sermon` |
| `boss_mutant_alpha_tiger` | animal | `pounce`, `roar` |
| `boss_sewer_king` | animal | `death_roll`, `submerge` |
| `boss_swarm_queen_bee` | animal | `swarm_cloud`, `royal_jelly_heal` |
| `boss_escaped_experiment` | zombie | `resistance_shift`, `toxic_blood` |
| `boss_blizzard_wraith` | zombie | `frost_touch`, `blizzard_cloak` |
| `boss_firefighter_nemesis` | zombie | `fire_axe`, `burning_charge` |
| `boss_chef_nemesis` | zombie | `cleaver_slash`, `boiling_splash` |
| `boss_doctor_nemesis` | zombie | `surgical_strike`, `inject_virus` |

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
3. `js/ui/CombatUI.js`의 `COMBAT_SPRITE_SHEETS`, `ENEMY_SPRITE_KEYS`에 새 ID를 등록한다.
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
python tools\render_monster_motion_preview.py
```

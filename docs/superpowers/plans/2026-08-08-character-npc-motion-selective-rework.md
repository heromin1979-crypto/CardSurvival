# Character and Companion Motion Selective Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 플레이어 1개 행과 동료 NPC 19개 행을 기존 외형 그대로 재제작하고, 나머지 188개 행을 픽셀 단위로 보존하면서 전체 모션 평균 점수를 88점 이상으로 높인다.

**Architecture:** 현재 runtime PNG를 기준선 계약으로 고정한 뒤, built-in `imagegen`으로 대상별 chroma 원본만 생성한다. 플레이어는 Python 빌더, 동료는 PowerShell 빌더의 명시적 source/row 매핑으로 대상 행만 교체하며, 공통 verifier가 비대상 188개 행의 해시 보존과 대상 20개 행의 변경을 검사한다.

**Tech Stack:** built-in imagegen, PNG/RGBA, Python 3 + Pillow/NumPy, PowerShell + System.Drawing, Node.js ESM, Vitest, Vite production build

## Global Constraints

- 작업 브랜치는 사용자 요청에 따라 `master`를 유지한다.
- 기존 얼굴, 헤어, 체형, 의상 색상, 장비, 3/4 측면 시점과 렌더링 밀도를 변경하지 않는다.
- runtime 규격은 1536×2048 RGBA, 6열×8행, 셀 256×256을 유지한다.
- 행 순서는 `idle`, `melee`, `ranged`, `support`, `guard`, `move`, `hit`, `death`이다.
- `ranged=680ms`, `support=760ms`, `guard=640ms`, `move=650ms`, `hit=500ms`, `death=1100ms holdLast` 계약을 유지한다.
- opaque green, fringe green, hidden RGB, boundary green은 모두 0이어야 한다.
- 승인된 20개 행만 변경하고 나머지 188개 행의 row pixel SHA-256은 기준선과 동일해야 한다.
- 사용자 소유 미커밋 파일은 수정·스테이징하지 않으며 각 커밋은 계획에 명시된 파일만 경로 지정해 스테이징한다.
- 기존 runtime PNG를 imagegen 참조로 사용하기 전 `view_image`로 원본 해상도를 확인한다.
- 생성물은 기존 파일을 바로 덮어쓰지 않고 `art_sources/combat/task8_players/` 또는 `art_sources/combat/task9_companions/`에 chroma 원본으로 먼저 저장한다.
- 설계 기준은 `docs/superpowers/specs/2026-08-08-character-npc-motion-selective-rework-design.md`이다.

## File Map

### 새로 만들 파일

- `art_sources/combat/actor_motion_rework_contract.json`: 26종 208행의 작업 전 row hash와 승인된 20개 대상 목록.
- `tools/verify_actor_motion_rework.mjs`: 비대상 188개 행 보존 및 대상 20개 행 변경 검증 CLI.
- `tools/clean_combat_chroma_source.py`: 임의의 chroma contact sheet를 grid 단위로 RGBA alpha source로 정규화하는 CLI.
- `tests/unit/CombatActorMotionReworkContract.test.js`: 계약 수, 비대상 보존, target 변경 모드, chroma cleaner 테스트.
- `docs/analysis/ACTOR_MOTION_REWORK_SCORECARD.json`: 26종의 전후 점수와 행별 판정 데이터.
- `docs/analysis/ACTOR_MOTION_REWORK_SCORECARD.md`: 사용자 검토용 점수표.
- 승인 대상 chroma/alpha source 13쌍: 플레이어 1쌍과 동료 12쌍.

### 수정할 파일

- `tools/build_player_motion_sheets.py`: `firefighter_m/ranged` rework source 등록과 r2 매핑.
- `art_sources/combat/task8_players/assembly_recipe.json`: 플레이어 새 source 및 target hash.
- `assets/images/combat/spritesheets/firefighter_m_sheet.png`: r2만 교체.
- `tools/build_companion_motion_sheets.ps1`: 동료 rework source 12개와 19개 target row 매핑.
- `art_sources/combat/task9_companions/assembly_recipe.json`: 재구성된 source, row, runtime hash.
- `art_sources/combat/task9_companions/generation_provenance.json`: 12개 rework 생성 기록.
- 대상 동료 runtime PNG 12개: 지정된 19개 행만 교체.
- `docs/analysis/PLAYER_MOTION_MANUAL_OBSERVATIONS.json`, `PLAYER_MOTION_QA.json`, `PLAYER_MOTION_QA.md`: 플레이어 재검토 증거.
- `docs/analysis/COMPANION_MOTION_MANUAL_OBSERVATIONS.json`, `COMPANION_MOTION_QA.json`, `COMPANION_MOTION_QA.md`: 동료 재검토 증거.
- `docs/analysis/generated/player_motion_preview.png`, `art_sources/combat/task9_companions/preview_manifest.json`, `companion_motion_contact_sheet.png`, `review_previews/*.png`: 새 runtime 시트 기반 확대 증거.

---

### Task 1: 208행 기준선과 선택적 변경 검증기

**Files:**
- Create: `art_sources/combat/actor_motion_rework_contract.json`
- Create: `tools/verify_actor_motion_rework.mjs`
- Create: `tools/clean_combat_chroma_source.py`
- Create: `tests/unit/CombatActorMotionReworkContract.test.js`
- Read: `tools/audit_combat_sprites.mjs`
- Read: `tools/normalize_combat_sprite_sheets.py`

**Interfaces:**
- Consumes: `readPng(path) -> { width, height, pixels }` from `tools/audit_combat_sprites.mjs`; `cleanup_chroma_grid(image, cols, rows)` and `analyze_chroma_grid(image, cols, rows)` from `tools/normalize_combat_sprite_sheets.py`.
- Produces: `verifyActorMotionRework(root, contract, { requireTargetsChanged?: boolean }) -> { sheets, rows, targets, changedTargets, unchangedRows }`; CLI flags `--capture`, `--check`, `--require-targets-changed`; chroma CLI `INPUT OUTPUT --cols N --rows N`.

- [ ] **Step 1: 실패하는 계약 테스트 작성**

`tests/unit/CombatActorMotionReworkContract.test.js`에 정확한 대상 목록을 고정한다.

```js
const EXPECTED_TARGETS = [
  ['firefighter_m', 2],
  ['old_survivor_companion', 5],
  ['soldier_companion', 2],
  ['child_companion', 6],
  ['mechanic_companion', 1],
  ['mechanic_companion', 4],
  ['student_companion', 4],
  ['dog_companion', 6],
  ['dog_companion', 7],
  ['minjun_companion', 6],
  ['sohee_companion', 3],
  ['sohee_companion', 5],
  ['sohee_companion', 6],
  ['sohee_companion', 7],
  ['yeongcheol_companion', 6],
  ['daehan_companion', 2],
  ['daehan_companion', 6],
  ['daehan_companion', 7],
  ['tower_doctor_companion', 6],
  ['sous_chef_companion', 5],
];

it('freezes 26 sheets, 208 rows, 20 targets and 188 unchanged rows', () => {
  const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
  expect(contract.sheets).toHaveLength(26);
  expect(contract.sheets.flatMap(sheet => sheet.rows)).toHaveLength(208);
  expect(contract.targets.map(({ sheetKey, row }) => [sheetKey, row])).toEqual(EXPECTED_TARGETS);
  const result = verifyActorMotionRework(ROOT, contract);
  expect(result).toMatchObject({ sheets: 26, rows: 208, targets: 20, unchangedRows: 188 });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm.cmd test -- tests/unit/CombatActorMotionReworkContract.test.js`

Expected: FAIL because `actor_motion_rework_contract.json` and `verify_actor_motion_rework.mjs` do not exist.

- [ ] **Step 3: verifier와 capture CLI 구현**

`tools/verify_actor_motion_rework.mjs`는 manifest의 플레이어·동료 26종만 읽고 각 256px 행의 raw RGBA bytes를 SHA-256으로 계산한다.

```js
export const TARGET_ROWS = Object.freeze([
  ['firefighter_m', 2], ['old_survivor_companion', 5], ['soldier_companion', 2],
  ['child_companion', 6], ['mechanic_companion', 1], ['mechanic_companion', 4],
  ['student_companion', 4], ['dog_companion', 6], ['dog_companion', 7],
  ['minjun_companion', 6], ['sohee_companion', 3], ['sohee_companion', 5],
  ['sohee_companion', 6], ['sohee_companion', 7], ['yeongcheol_companion', 6],
  ['daehan_companion', 2], ['daehan_companion', 6], ['daehan_companion', 7],
  ['tower_doctor_companion', 6], ['sous_chef_companion', 5],
]);

function rowSha256(image, row) {
  const bytes = Buffer.alloc(image.width * 256 * 4);
  const start = row * 256 * image.width * 4;
  bytes.set(image.pixels.subarray(start, start + bytes.length));
  return createHash('sha256').update(bytes).digest('hex');
}

export function verifyActorMotionRework(root, contract, options = {}) {
  const targetSet = new Set(contract.targets.map(entry => `${entry.sheetKey}:${entry.row}`));
  let changedTargets = 0;
  let unchangedRows = 0;
  for (const sheet of contract.sheets) {
    const image = readPng(path.join(root, sheet.path.replace(/^\//, '')));
    for (const baseline of sheet.rows) {
      const actual = rowSha256(image, baseline.row);
      const key = `${sheet.sheetKey}:${baseline.row}`;
      if (targetSet.has(key)) changedTargets += Number(actual !== baseline.rowPixelSha256);
      else {
        if (actual !== baseline.rowPixelSha256) throw new Error(`unchanged row drift: ${key}`);
        unchangedRows += 1;
      }
    }
  }
  if (options.requireTargetsChanged && changedTargets !== contract.targets.length) {
    throw new Error(`target rows changed ${changedTargets}/${contract.targets.length}`);
  }
  return { sheets: contract.sheets.length, rows: 208, targets: targetSet.size, changedTargets, unchangedRows };
}
```

`--capture`은 contract 파일이 이미 있으면 실패하고, manifest의 현재 경로와 208개 row hash를 canonical JSON으로 한 번만 기록한다. `--check`는 비대상 행을 검사하고, `--require-targets-changed`는 20개 대상 모두가 기준선과 달라졌는지도 검사한다.

- [ ] **Step 4: 공용 chroma cleaner 구현**

`tools/clean_combat_chroma_source.py`는 기존 normalizer 함수를 재사용하고 잔여 지표가 0이 아니면 파일을 쓰지 않는다.

```python
def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--cols", type=int, required=True)
    parser.add_argument("--rows", type=int, required=True)
    args = parser.parse_args()
    source = Image.open(args.input).convert("RGBA")
    cleaned, _ = cleanup_chroma_grid(source, cols=args.cols, rows=args.rows, path=args.input)
    metrics = analyze_chroma_grid(cleaned, cols=args.cols, rows=args.rows, path=args.output)
    if any(metrics.values()):
        raise SystemExit(f"strict chroma residue: {metrics}")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    cleaned.save(args.output)
    print(json.dumps(metrics, sort_keys=True))
    return 0
```

- [ ] **Step 5: 현재 runtime에서 기준선 계약 생성**

Run: `node tools/verify_actor_motion_rework.mjs --capture`

Expected: `captured 26 sheets, 208 rows, 20 targets` and a new `art_sources/combat/actor_motion_rework_contract.json`.

- [ ] **Step 6: 테스트 통과 확인**

Run: `npm.cmd test -- tests/unit/CombatActorMotionReworkContract.test.js`

Expected: PASS with `changedTargets: 0` and `unchangedRows: 188`.

- [ ] **Step 7: 기준선 독립 커밋**

```powershell
git add -- art_sources/combat/actor_motion_rework_contract.json tools/verify_actor_motion_rework.mjs tools/clean_combat_chroma_source.py tests/unit/CombatActorMotionReworkContract.test.js
git commit -m "test(assets): freeze actor motion rework baseline"
```

### Task 2: 플레이어 소방관 원거리 행

**Files:**
- Create: `art_sources/combat/task8_players/firefighter_m_ranged_rework_chroma.png`
- Create: `art_sources/combat/task8_players/firefighter_m_ranged_rework_alpha.png`
- Modify: `tools/build_player_motion_sheets.py`
- Modify: `art_sources/combat/task8_players/assembly_recipe.json`
- Modify: `assets/images/combat/spritesheets/firefighter_m_sheet.png`
- Modify: `docs/analysis/PLAYER_MOTION_MANUAL_OBSERVATIONS.json`
- Modify: `docs/analysis/PLAYER_MOTION_QA.json`
- Modify: `docs/analysis/PLAYER_MOTION_QA.md`
- Modify: `docs/analysis/generated/player_motion_preview.png`
- Test: `tests/unit/CombatPlayerMotionAssets.test.js`
- Test: `tests/unit/CombatActorMotionReworkContract.test.js`

**Interfaces:**
- Consumes: `clean_combat_chroma_source.py INPUT OUTPUT --cols 6 --rows 1`; player builder `_row(source, source_row, columns)`.
- Produces: canonical source key `firefighter_m_ranged_rework_alpha`; `firefighter_m` target row 2 mapped to source row 0.

- [ ] **Step 1: 원본 참조 확인**

`view_image`로 `assets/images/combat/spritesheets/firefighter_m_sheet.png`를 original detail로 열고 r0/r1/r3의 얼굴, 체형, 황갈색 소방복, 검은 장화와 소방 도끼를 기준으로 고정한다.

- [ ] **Step 2: exact 6×1 chroma 행 생성**

`imagegen`에 runtime sheet를 참조 이미지로 넣고 다음 프롬프트를 그대로 사용한다.

```text
Edit the referenced Korean male firefighter into one exact 6-column by 1-row combat sprite contact sheet. Preserve his face, short dark hair, stocky build, worn ochre Seoul firefighter turnout gear, reflective stripes, black boots, hand-painted realistic post-apocalyptic game style, three-quarter side view facing right, scale and lighting. Create six progressive ranged rescue-tool frames: 1 ready with a compact red emergency flare launcher held low, 2 raise and aim, 3 steady aim, 4 launch one visible flare toward the right with a small muzzle spark, 5 controlled recoil, 6 lower the same launcher back to ready. The launcher must remain the same shape and size in every frame. Full body in every cell, wide gutters, no overlap. Perfectly flat uniform #00ff00 chroma background, no floor, shadow, gradient, grid, border, text, labels, watermark, extra person, blood, injury, axe thrust, duplicated pose, or transparent background.
```

출력을 `firefighter_m_ranged_rework_chroma.png`로 보관하고 `view_image`로 여섯 프레임을 확인한다.

- [ ] **Step 3: alpha source 정규화**

Run: `python tools/clean_combat_chroma_source.py art_sources/combat/task8_players/firefighter_m_ranged_rework_chroma.png art_sources/combat/task8_players/firefighter_m_ranged_rework_alpha.png --cols 6 --rows 1`

Expected: all printed chroma metrics are 0.

- [ ] **Step 4: 빌더 source와 r2 매핑 변경**

`SOURCE_GRIDS`, `ARCHIVAL_GRIDS`, `SIMPLE_ROW_SOURCES`, `ROW_RECIPES['firefighter_m'][2]`에 `firefighter_m_ranged_rework_alpha`를 등록한다. 기존 `firefighter_m_ranged_alpha`는 provenance 보존을 위해 삭제하지 않는다.

```python
"firefighter_m_ranged_rework_alpha": ("firefighter_m_ranged_rework_alpha.png", 6, 1),

_row("firefighter_m_ranged_rework_alpha", 0),
```

- [ ] **Step 5: runtime과 recipe 재생성**

Run: `python tools/build_player_motion_sheets.py --write`

Expected: six targets built; `firefighter_m` r2 source is `firefighter_m_ranged_rework_alpha`.

- [ ] **Step 6: player QA 증거 갱신**

Run: `python tools/render_player_motion_preview.py`

새 image hash에 맞춰 `PLAYER_MOTION_MANUAL_OBSERVATIONS.json`의 `firefighter_m/ranged`를 PASS로 다시 작성한 후 실행한다.

Run: `python tools/verify_player_motion_qa.py --write-markdown`

Expected: `verified 6 player motion QA records with 48 manual row observations`.

- [ ] **Step 7: 비대상 행과 player tests 검증**

Run: `node tools/verify_actor_motion_rework.mjs --check`

Run: `npm.cmd test -- tests/unit/CombatPlayerMotionAssets.test.js tests/unit/CombatActorMotionReworkContract.test.js`

Expected: PASS; non-target 188 rows remain valid and `firefighter_m:2` is the only changed player row.

- [ ] **Step 8: 플레이어 행 커밋**

```powershell
git add -- tools/build_player_motion_sheets.py art_sources/combat/task8_players/firefighter_m_ranged_rework_chroma.png art_sources/combat/task8_players/firefighter_m_ranged_rework_alpha.png art_sources/combat/task8_players/assembly_recipe.json assets/images/combat/spritesheets/firefighter_m_sheet.png docs/analysis/PLAYER_MOTION_MANUAL_OBSERVATIONS.json docs/analysis/PLAYER_MOTION_QA.json docs/analysis/PLAYER_MOTION_QA.md docs/analysis/generated/player_motion_preview.png
git commit -m "feat(assets): rework firefighter ranged motion"
```

### Task 3: 이동 의미 오류 2개 행

**Files:**
- Create: `art_sources/combat/task9_companions/old_survivor_move_rework_chroma.png`
- Create: `art_sources/combat/task9_companions/old_survivor_move_rework_alpha.png`
- Create: `art_sources/combat/task9_companions/sous_chef_move_rework_chroma.png`
- Create: `art_sources/combat/task9_companions/sous_chef_move_rework_alpha.png`
- Modify: `tools/build_companion_motion_sheets.ps1`
- Modify: `art_sources/combat/task9_companions/assembly_recipe.json`
- Modify: `art_sources/combat/task9_companions/generation_provenance.json`
- Modify: `assets/images/combat/spritesheets/companions/old_survivor_companion_sheet.png`
- Modify: `assets/images/combat/spritesheets/companions/sous_chef_companion_sheet.png`
- Test: `tests/unit/CompanionMotionQuality.test.js`
- Test: `tests/unit/CombatActorMotionReworkContract.test.js`

**Interfaces:**
- Consumes: companion `$sourceSpecs` and `$targets`; each new source is 6 columns×1 row with key `green`.
- Produces: `old_survivor_move_rework` at target r5; `sous_chef_move_rework` at target r5.

- [ ] **Step 1: 두 runtime sheet 원본 확인**

`view_image` original detail로 `old_survivor_companion_sheet.png`와 `sous_chef_companion_sheet.png`를 확인한다.

- [ ] **Step 2: old survivor 이동 행 생성**

```text
Edit the referenced elderly Korean survivor into one exact 6-column by 1-row movement sprite contact sheet. Preserve his same lined face, short gray hair, slim elderly build, patched charcoal coat, olive trousers, worn shoes, wooden cane, realistic hand-painted post-apocalyptic Seoul style and three-quarter view facing right. Six progressive cane-assisted walking frames forming one complete gait cycle: left foot step, weight on cane, right foot pass, right foot step, cane advance, balanced return. He remains upright and alert, keeps the same cane in hand, and never kneels, falls, drops the cane, bleeds, or changes clothes. Full body in every cell, same scale, feet aligned, wide gutters. Flat uniform #00ff00 background only; no shadow, floor, grid, border, text, labels, watermark, duplicate frame, extra person, or transparency.
```

- [ ] **Step 3: sous chef 이동 행 생성**

```text
Edit the referenced Korean male sous chef into one exact 6-column by 1-row movement sprite contact sheet. Preserve his same face, black hair and beard, athletic build, dark green chef jacket, black striped apron, black trousers, boots and one rectangular meat cleaver held low and safely beside the body. Six progressive brisk walking frames facing right with alternating feet and weight transfer, ending in a loop-compatible balanced stride. No hit reaction, blood, wound, backward lean, collapse, raised attack, or weapon morph. Detailed realistic hand-painted survival-game style, full body, same scale and lighting, feet aligned, wide gutters. Perfect flat #00ff00 chroma background; no floor, shadow, gradient, grid, border, text, watermark, extra person, or transparency.
```

- [ ] **Step 4: sourceSpec와 target r5 매핑 구현**

```powershell
old_survivor_move_rework = @{ file = 'old_survivor_move_rework_chroma.png'; cols = 6; rows = 1; key = 'green' }
sous_chef_move_rework = @{ file = 'sous_chef_move_rework_chroma.png'; cols = 6; rows = 1; key = 'green' }
```

`old_survivor_companion.rows[5]`와 `sous_chef_companion.rows[5]`를 새 source key로 바꾸고 `sourceRows[5]=0`으로 둔다. `generation_provenance.json.supplements`에 두 프롬프트와 archive 이름을 기록한다.

- [ ] **Step 5: 동료 시트 재생성 및 검사**

Run: `powershell -ExecutionPolicy Bypass -File tools/build_companion_motion_sheets.ps1`

Run: `powershell -ExecutionPolicy Bypass -File tools/build_companion_motion_sheets.ps1 -Check`

Run: `node tools/verify_actor_motion_rework.mjs --check`

Run: `npm.cmd test -- tests/unit/CompanionMotionQuality.test.js tests/unit/CombatActorMotionReworkContract.test.js`

Expected: PASS and no non-target row drift.

- [ ] **Step 6: 이동 행 커밋**

```powershell
git add -- tools/build_companion_motion_sheets.ps1 art_sources/combat/task9_companions/old_survivor_move_rework_chroma.png art_sources/combat/task9_companions/old_survivor_move_rework_alpha.png art_sources/combat/task9_companions/sous_chef_move_rework_chroma.png art_sources/combat/task9_companions/sous_chef_move_rework_alpha.png art_sources/combat/task9_companions/assembly_recipe.json art_sources/combat/task9_companions/generation_provenance.json assets/images/combat/spritesheets/companions/old_survivor_companion_sheet.png assets/images/combat/spritesheets/companions/sous_chef_companion_sheet.png
git commit -m "feat(assets): correct companion movement rows"
```

### Task 4: Sohee 4개 행 재구성

**Files:**
- Create: `art_sources/combat/task9_companions/sohee_support_move_hit_death_rework_chroma.png`
- Create: `art_sources/combat/task9_companions/sohee_support_move_hit_death_rework_alpha.png`
- Modify: `tools/build_companion_motion_sheets.ps1`
- Modify: `art_sources/combat/task9_companions/assembly_recipe.json`
- Modify: `art_sources/combat/task9_companions/generation_provenance.json`
- Modify: `assets/images/combat/spritesheets/companions/sohee_companion_sheet.png`
- Test: `tests/unit/CompanionMotionQuality.test.js`
- Test: `tests/unit/CombatActorMotionReworkContract.test.js`

**Interfaces:**
- Produces: `sohee_support_move_hit_death_rework`, 6 columns×4 rows; target mapping r3→source0, r5→source1, r6→source2, r7→source3.

- [ ] **Step 1: Sohee 원본 확인 후 6×4 생성**

`view_image`로 Sohee runtime을 확인하고 다음 prompt를 사용한다.

```text
Edit the referenced Korean woman Sohee into one exact 6-column by 4-row combat sprite contact sheet. Preserve the identical face, tied dark hair, glasses, slim adult build, long dark-purple coat, gray trousers, white sneakers, olive medical shoulder bag and black rifle, realistic hand-painted post-apocalyptic Seoul style, three-quarter view facing right. Row 1 support/focus: inspect one medicine vial, take a measured dose, breathe and focus, then return to ready; never aim or fire the rifle. Row 2 move: six-frame tactical walk with rifle lowered, alternating steps and stable feet; no blood or hit reaction. Row 3 hit: sudden torso impact, maximum recoil, regain footing and finish combat-ready with rifle retained; no collapse or death. Row 4 death: standing injury, knees weaken, controlled side fall and final still prone pose suitable for holding the last frame. Exactly six progressive full-body frames per row, consistent scale and equipment, wide gutters. Flat uniform #00ff00 chroma background, no shadow, floor, gradient, grid, borders, text, labels, watermark, extra person, duplicate pose, weapon morph, transparent background, gore, or dismemberment.
```

- [ ] **Step 2: builder source와 4개 target row 연결**

```powershell
sohee_support_move_hit_death_rework = @{ file = 'sohee_support_move_hit_death_rework_chroma.png'; cols = 6; rows = 4; key = 'green' }
```

Sohee target 배열을 `@('sohee','sohee','sohee','sohee_support_move_hit_death_rework','sohee','sohee_support_move_hit_death_rework','sohee_support_move_hit_death_rework','sohee_support_move_hit_death_rework')`로 만들고 sourceRows를 `@(0,1,2,0,4,1,2,3)`으로 지정한다.

- [ ] **Step 3: build, check, contract tests 실행**

Run: `powershell -ExecutionPolicy Bypass -File tools/build_companion_motion_sheets.ps1`

Run: `powershell -ExecutionPolicy Bypass -File tools/build_companion_motion_sheets.ps1 -Check`

Run: `node tools/verify_actor_motion_rework.mjs --check`

Run: `npm.cmd test -- tests/unit/CompanionMotionQuality.test.js tests/unit/CombatActorMotionReworkContract.test.js`

Expected: Sohee 4 target rows changed; all non-target rows unchanged.

- [ ] **Step 4: Sohee 커밋**

```powershell
git add -- tools/build_companion_motion_sheets.ps1 art_sources/combat/task9_companions/sohee_support_move_hit_death_rework_chroma.png art_sources/combat/task9_companions/sohee_support_move_hit_death_rework_alpha.png art_sources/combat/task9_companions/assembly_recipe.json art_sources/combat/task9_companions/generation_provenance.json assets/images/combat/spritesheets/companions/sohee_companion_sheet.png
git commit -m "feat(assets): rebuild Sohee support and reaction motions"
```

### Task 5: Daehan 외형 불일치 3개 행

**Files:**
- Create: `art_sources/combat/task9_companions/daehan_ranged_hit_death_rework_chroma.png`
- Create: `art_sources/combat/task9_companions/daehan_ranged_hit_death_rework_alpha.png`
- Modify: `tools/build_companion_motion_sheets.ps1`
- Modify: `art_sources/combat/task9_companions/assembly_recipe.json`
- Modify: `art_sources/combat/task9_companions/generation_provenance.json`
- Modify: `assets/images/combat/spritesheets/companions/daehan_companion_sheet.png`
- Test: `tests/unit/CompanionMotionQuality.test.js`
- Test: `tests/unit/CombatActorMotionReworkContract.test.js`

**Interfaces:**
- Produces: `daehan_ranged_hit_death_rework`, 6×3; r2→source0, r6→source1, r7→source2.

- [ ] **Step 1: Daehan identity reference 확인**

`view_image`에서 r0, r1, r3, r4, r5를 기준으로 얼굴, 회색 작업복, 갈색 가죽 앞치마, 대형 렌치를 고정한다. 현재 군인으로 바뀐 r2는 identity 참조로 사용하지 않는다.

- [ ] **Step 2: 6×3 source 생성**

```text
Edit the referenced Korean metalworker Daehan into one exact 6-column by 3-row combat sprite contact sheet. Preserve the same narrow face, short black hair, lean build, worn gray workshop coveralls, brown leather apron, tool belt, boots and large steel wrench seen in the idle/melee/support/guard/move rows. Never turn him into a soldier, medic or armored character. Row 1 ranged overcharge: prepare a compact homemade electrical charge, arm it, throw it right, visible small blue spark on release, follow through, return while retaining the wrench at the belt. Row 2 hit: torso impact, recoil, brace with the wrench and recover to the original standing stance. Row 3 death: standing injury, knees buckle, fall to the side and finish fully prone with the same clothes and wrench. Six distinct progressive full-body frames per row, consistent face, scale, camera and equipment. Detailed realistic hand-painted post-apocalyptic Seoul style. Perfect flat #00ff00 background, wide gutters, no shadow, floor, gradient, grid, border, text, watermark, extra character, rifle, military uniform, body morph, gore, transparency, or duplicate frames.
```

- [ ] **Step 3: builder 매핑과 provenance 갱신**

새 source를 6×3 green으로 등록하고 Daehan target sourceRows를 r2=0, r6=1, r7=2로 연결한다.

- [ ] **Step 4: build, contract, quality tests 실행**

Run: `powershell -ExecutionPolicy Bypass -File tools/build_companion_motion_sheets.ps1`

Run: `powershell -ExecutionPolicy Bypass -File tools/build_companion_motion_sheets.ps1 -Check`

Run: `node tools/verify_actor_motion_rework.mjs --check`

Run: `npm.cmd test -- tests/unit/CompanionMotionQuality.test.js tests/unit/CombatActorMotionReworkContract.test.js`

Expected: PASS with Daehan non-target r0/r1/r3/r4/r5 unchanged.

- [ ] **Step 5: Daehan 커밋**

```powershell
git add -- tools/build_companion_motion_sheets.ps1 art_sources/combat/task9_companions/daehan_ranged_hit_death_rework_chroma.png art_sources/combat/task9_companions/daehan_ranged_hit_death_rework_alpha.png art_sources/combat/task9_companions/assembly_recipe.json art_sources/combat/task9_companions/generation_provenance.json assets/images/combat/spritesheets/companions/daehan_companion_sheet.png
git commit -m "feat(assets): restore Daehan motion identity"
```

### Task 6: 피격·사망 의미 6개 행

**Files:**
- Create: `art_sources/combat/task9_companions/child_hit_rework_chroma.png`
- Create: `art_sources/combat/task9_companions/child_hit_rework_alpha.png`
- Create: `art_sources/combat/task9_companions/dog_hit_death_rework_chroma.png`
- Create: `art_sources/combat/task9_companions/dog_hit_death_rework_alpha.png`
- Create: `art_sources/combat/task9_companions/minjun_hit_rework_chroma.png`
- Create: `art_sources/combat/task9_companions/minjun_hit_rework_alpha.png`
- Create: `art_sources/combat/task9_companions/yeongcheol_hit_rework_chroma.png`
- Create: `art_sources/combat/task9_companions/yeongcheol_hit_rework_alpha.png`
- Create: `art_sources/combat/task9_companions/tower_doctor_hit_rework_chroma.png`
- Create: `art_sources/combat/task9_companions/tower_doctor_hit_rework_alpha.png`
- Modify: `tools/build_companion_motion_sheets.ps1`
- Modify: `art_sources/combat/task9_companions/assembly_recipe.json`
- Modify: `art_sources/combat/task9_companions/generation_provenance.json`
- Modify: `assets/images/combat/spritesheets/companions/child_companion_sheet.png`
- Modify: `assets/images/combat/spritesheets/companions/dog_companion_sheet.png`
- Modify: `assets/images/combat/spritesheets/companions/minjun_companion_sheet.png`
- Modify: `assets/images/combat/spritesheets/companions/yeongcheol_companion_sheet.png`
- Modify: `assets/images/combat/spritesheets/companions/tower_doctor_companion_sheet.png`
- Test: `tests/unit/CompanionMotionQuality.test.js`
- Test: `tests/unit/CombatActorMotionReworkContract.test.js`

**Interfaces:**
- Produces: four 6×1 hit sources and one 6×2 dog hit/death source.

- [ ] **Step 1: 각 runtime 원본을 `view_image`로 확인**

확인 대상은 `child`, `dog`, `minjun`, `yeongcheol`, `tower_doctor` runtime sheet이다.

- [ ] **Step 2: exact source 다섯 개 생성**

각 prompt는 해당 runtime을 참조 이미지로 사용한다.

```text
Child hit: same 11-year-old Korean survivor girl, yellow rain jacket, red scarf, navy school backpack, skirt, leggings and sneakers. Exact 6x1 non-graphic hit reaction: startled impact, torso recoil, one unsteady step, catch balance, recover, guarded standing finish. Full body, no fall, death, blood, injury mark or changed age. Flat #00ff00, no text/grid/shadow.

Dog hit and death: same cream Korean Jindo rescue dog with identical blue harness and pouches. Exact 6x2. Row 1 hit: flinch, shoulders compress, one paw lifts, regain four-foot stance, alert finish. Row 2 death: standing, legs weaken, lower to side, final still lying pose. No sitting-as-hit, no first-frame corpse, no blood, no harness morph. Flat #00ff00, no text/grid/shadow.

Minjun hit: same Korean tactical medic, short buzzed hair, olive combat medical uniform, Korean flag patch, vest, backpack and black pistol retained. Exact 6x1 impact, recoil, brace, recover to standing; no floating backward pose, fall or death. Flat #00ff00, no text/grid/shadow.

Yeongcheol hit: same stocky middle-aged Korean firefighter, moustache, soot-dark turnout gear with reflective bands, red rescue helmet at belt and fire axe retained. Exact 6x1 heavy impact, weight shifts through planted boots, short recoil, recover upright; no floating, prolonged backward lean, fall or death. Flat #00ff00, no text/grid/shadow.

Tower doctor hit: same Korean woman tower doctor, tied dark hair, black medical jacket and trousers, gray medical case retained. Exact 6x1 sudden hit, case swings, one knee softens, she catches balance and returns standing combat-ready. The final frame must not be kneeling, prone or dead. Flat #00ff00, no text/grid/shadow.
```

각 prompt에 공통으로 `detailed realistic hand-painted post-apocalyptic Seoul style, three-quarter view facing right, six distinct progressive full-body frames, consistent face/scale/equipment, wide gutters, no extra character, transparency, watermark or duplicate pose`를 포함한다.

- [ ] **Step 3: sourceSpecs와 target rows 연결**

```powershell
child_hit_rework = @{ file = 'child_hit_rework_chroma.png'; cols = 6; rows = 1; key = 'green' }
dog_hit_death_rework = @{ file = 'dog_hit_death_rework_chroma.png'; cols = 6; rows = 2; key = 'green' }
minjun_hit_rework = @{ file = 'minjun_hit_rework_chroma.png'; cols = 6; rows = 1; key = 'green' }
yeongcheol_hit_rework = @{ file = 'yeongcheol_hit_rework_chroma.png'; cols = 6; rows = 1; key = 'green' }
tower_doctor_hit_rework = @{ file = 'tower_doctor_hit_rework_chroma.png'; cols = 6; rows = 1; key = 'green' }
```

r6 또는 dog r6/r7만 새 source로 연결한다.

- [ ] **Step 4: build와 QA 실행**

Run: `powershell -ExecutionPolicy Bypass -File tools/build_companion_motion_sheets.ps1`

Run: `powershell -ExecutionPolicy Bypass -File tools/build_companion_motion_sheets.ps1 -Check`

Run: `node tools/verify_actor_motion_rework.mjs --check`

Run: `npm.cmd test -- tests/unit/CompanionMotionQuality.test.js tests/unit/CombatActorMotionReworkContract.test.js`

Expected: five runtime sheets pass; non-target rows unchanged.

- [ ] **Step 5: reaction rows 커밋**

```powershell
git add -- tools/build_companion_motion_sheets.ps1 art_sources/combat/task9_companions/child_hit_rework_chroma.png art_sources/combat/task9_companions/child_hit_rework_alpha.png art_sources/combat/task9_companions/dog_hit_death_rework_chroma.png art_sources/combat/task9_companions/dog_hit_death_rework_alpha.png art_sources/combat/task9_companions/minjun_hit_rework_chroma.png art_sources/combat/task9_companions/minjun_hit_rework_alpha.png art_sources/combat/task9_companions/yeongcheol_hit_rework_chroma.png art_sources/combat/task9_companions/yeongcheol_hit_rework_alpha.png art_sources/combat/task9_companions/tower_doctor_hit_rework_chroma.png art_sources/combat/task9_companions/tower_doctor_hit_rework_alpha.png art_sources/combat/task9_companions/assembly_recipe.json art_sources/combat/task9_companions/generation_provenance.json assets/images/combat/spritesheets/companions/child_companion_sheet.png assets/images/combat/spritesheets/companions/dog_companion_sheet.png assets/images/combat/spritesheets/companions/minjun_companion_sheet.png assets/images/combat/spritesheets/companions/yeongcheol_companion_sheet.png assets/images/combat/spritesheets/companions/tower_doctor_companion_sheet.png
git commit -m "feat(assets): improve companion hit and death motions"
```

### Task 7: 장비 연속성과 공격 가독성 4개 행

**Files:**
- Create: `art_sources/combat/task9_companions/soldier_ranged_rework_chroma.png`
- Create: `art_sources/combat/task9_companions/soldier_ranged_rework_alpha.png`
- Create: `art_sources/combat/task9_companions/mechanic_melee_guard_rework_chroma.png`
- Create: `art_sources/combat/task9_companions/mechanic_melee_guard_rework_alpha.png`
- Create: `art_sources/combat/task9_companions/student_guard_rework_chroma.png`
- Create: `art_sources/combat/task9_companions/student_guard_rework_alpha.png`
- Modify: `tools/build_companion_motion_sheets.ps1`
- Modify: `art_sources/combat/task9_companions/assembly_recipe.json`
- Modify: `art_sources/combat/task9_companions/generation_provenance.json`
- Modify: `assets/images/combat/spritesheets/soldier_companion_sheet.png`
- Modify: `assets/images/combat/spritesheets/companions/mechanic_companion_sheet.png`
- Modify: `assets/images/combat/spritesheets/companions/student_companion_sheet.png`
- Test: `tests/unit/CompanionMotionQuality.test.js`
- Test: `tests/unit/CombatActorMotionReworkContract.test.js`

**Interfaces:**
- Produces: `soldier_ranged_rework` 6×1, `mechanic_melee_guard_rework` 6×2, `student_guard_rework` 6×1.
- Preserves: `soldier_companion` ranged detached-component fingerprints remain six empty arrays because the muzzle flash touches the rifle muzzle.

- [ ] **Step 1: 세 runtime 원본 확인**

`view_image`로 soldier, mechanic, student 확대 보드를 확인한다.

- [ ] **Step 2: 세 source 생성**

```text
Soldier ranged: same rugged Korean deserter in charcoal tactical gear with the identical black assault rifle. Exact 6x1: shoulder rifle, acquire aim, fire with one small muzzle flash physically touching the rifle muzzle, controlled recoil, settle sights, return ready. Preserve rifle geometry and hands. No static repeated aim, extra gun, weapon morph or detached debris. Flat #00ff00.

Mechanic melee and guard: same Korean automobile mechanic, black hair, goggles, grease-dark coveralls, tool belt and one identical large adjustable wrench. Exact 6x2. Row 1 melee: ready, wind-up, wrench strike, impact follow-through, recover, ready; wrench never changes shape or leaves the hands. Row 2 guard: lift one identical rectangular red metal toolbox, brace it before torso, absorb one small impact, lower slightly, stable guard finish; toolbox dimensions remain constant. Flat #00ff00.

Student guard: same Korean female student with glasses, dark bob hair, navy school jacket, hoodie, jeans, sneakers and navy backpack. Exact 6x1 backpack guard: bring the same backpack from shoulder to chest, brace behind it, absorb impact, remain protected, return guarded. No umbrella, attack, weapon swing, backpack morph or dropped prop. Flat #00ff00.
```

모든 prompt에 realistic hand-painted Seoul survival sprite, three-quarter right-facing, six progressive full-body frames, consistent scale, wide gutters, no shadow/floor/grid/text/watermark/transparency/extra person를 포함한다.

- [ ] **Step 3: builder mapping과 provenance 갱신**

Soldier r2, mechanic r1/r4, student r4만 새 source로 연결한다.

- [ ] **Step 4: soldier ranged detached component 계약 보존 확인**

새 runtime을 빌드했을 때 `tools/verify_companion_ranged_contract.mjs`가 기존 `soldier_companion.frames = [[], [], [], [], [], []]` 계약으로 통과해야 한다. 실패하면 ranged contract를 넓히지 말고 muzzle flash가 총구 본체에 연결되도록 source를 다시 생성한다.

- [ ] **Step 5: build와 tests 실행**

Run: `powershell -ExecutionPolicy Bypass -File tools/build_companion_motion_sheets.ps1`

Run: `powershell -ExecutionPolicy Bypass -File tools/build_companion_motion_sheets.ps1 -Check`

Run: `node tools/verify_actor_motion_rework.mjs --check`

Run: `npm.cmd test -- tests/unit/CompanionMotionQuality.test.js tests/unit/CombatActorMotionReworkContract.test.js`

Expected: PASS; soldier ranged contract valid and only four approved rows change.

- [ ] **Step 6: continuity rows 커밋**

```powershell
git add -- tools/build_companion_motion_sheets.ps1 art_sources/combat/task9_companions/soldier_ranged_rework_chroma.png art_sources/combat/task9_companions/soldier_ranged_rework_alpha.png art_sources/combat/task9_companions/mechanic_melee_guard_rework_chroma.png art_sources/combat/task9_companions/mechanic_melee_guard_rework_alpha.png art_sources/combat/task9_companions/student_guard_rework_chroma.png art_sources/combat/task9_companions/student_guard_rework_alpha.png art_sources/combat/task9_companions/assembly_recipe.json art_sources/combat/task9_companions/generation_provenance.json assets/images/combat/spritesheets/soldier_companion_sheet.png assets/images/combat/spritesheets/companions/mechanic_companion_sheet.png assets/images/combat/spritesheets/companions/student_companion_sheet.png
git commit -m "feat(assets): improve companion prop continuity"
```

### Task 8: 전수 evidence와 점수 재평가

**Files:**
- Create: `docs/analysis/ACTOR_MOTION_REWORK_SCORECARD.json`
- Create: `docs/analysis/ACTOR_MOTION_REWORK_SCORECARD.md`
- Modify: `art_sources/combat/task9_companions/preview_manifest.json`
- Modify: `art_sources/combat/task9_companions/companion_motion_contact_sheet.png`
- Modify: `art_sources/combat/task9_companions/review_previews/old_survivor_companion_review.png`
- Modify: `art_sources/combat/task9_companions/review_previews/soldier_companion_review.png`
- Modify: `art_sources/combat/task9_companions/review_previews/child_companion_review.png`
- Modify: `art_sources/combat/task9_companions/review_previews/mechanic_companion_review.png`
- Modify: `art_sources/combat/task9_companions/review_previews/student_companion_review.png`
- Modify: `art_sources/combat/task9_companions/review_previews/dog_companion_review.png`
- Modify: `art_sources/combat/task9_companions/review_previews/minjun_companion_review.png`
- Modify: `art_sources/combat/task9_companions/review_previews/sohee_companion_review.png`
- Modify: `art_sources/combat/task9_companions/review_previews/yeongcheol_companion_review.png`
- Modify: `art_sources/combat/task9_companions/review_previews/daehan_companion_review.png`
- Modify: `art_sources/combat/task9_companions/review_previews/tower_doctor_companion_review.png`
- Modify: `art_sources/combat/task9_companions/review_previews/sous_chef_companion_review.png`
- Modify: `docs/analysis/COMPANION_MOTION_MANUAL_OBSERVATIONS.json`
- Modify: `docs/analysis/COMPANION_MOTION_QA.json`
- Modify: `docs/analysis/COMPANION_MOTION_QA.md`
- Test: `tests/unit/CompanionMotionQuality.test.js`
- Test: `tests/unit/CombatPlayerMotionAssets.test.js`
- Test: `tests/unit/CombatActorMotionReworkContract.test.js`

**Interfaces:**
- Consumes: final runtime hashes and the 100-point rubric from the design spec.
- Produces: scorecard schema `{ version, rubric, before, after, characters }`, where each character has `sheetKey`, `beforeScore`, `afterScore`, `rows`, `remainingIssues`.

- [ ] **Step 1: final target 변경 계약 실행**

Run: `node tools/verify_actor_motion_rework.mjs --check --require-targets-changed`

Expected: `changedTargets=20`, `unchangedRows=188`.

- [ ] **Step 2: player 및 companion preview 재생성**

Run: `python tools/render_player_motion_preview.py`

Run: `powershell -ExecutionPolicy Bypass -File tools/render_companion_motion_preview.ps1`

Expected: player preview 6종, companion review board 20종과 contact sheet가 현재 runtime hash를 가리킨다.

- [ ] **Step 3: 20개 행을 원본 해상도로 수동 판정**

각 행에 다음 다섯 점수를 기록한다.

```json
{
  "readability": 0,
  "continuity": 0,
  "identity": 0,
  "equipment": 0,
  "technical": 0
}
```

실제 값의 허용 범위는 readability 0–25, continuity 0–25, identity 0–20, equipment 0–15, technical 0–15이다. 합계는 `afterScore`이며 교체 대상 각 sheet는 80 이상, 전체 26종 평균은 88 이상이어야 한다. 0은 schema 예시일 뿐 최종 파일에 0점 판정을 남기지 않는다.

- [ ] **Step 4: manual observations와 QA report relink**

`PLAYER_MOTION_MANUAL_OBSERVATIONS.json`과 `COMPANION_MOTION_MANUAL_OBSERVATIONS.json`의 실제 hash와 행별 관찰을 새 preview를 보고 작성한다.

Run: `python tools/verify_player_motion_qa.py --write-markdown`

Run: `node tools/relink_companion_motion_manual_evidence.mjs`

Run: `node tools/verify_companion_motion_qa.mjs --write`

Run: `node tools/verify_companion_motion_qa.mjs`

Expected: player 48 rows and companion 960 cells all linked; open rework 0.

- [ ] **Step 5: focused tests 실행**

Run: `npm.cmd test -- tests/unit/CombatActorMotionReworkContract.test.js tests/unit/CombatPlayerMotionAssets.test.js tests/unit/CompanionMotionQuality.test.js`

Expected: PASS.

- [ ] **Step 6: evidence 커밋**

```powershell
git add -- docs/analysis/ACTOR_MOTION_REWORK_SCORECARD.json docs/analysis/ACTOR_MOTION_REWORK_SCORECARD.md docs/analysis/PLAYER_MOTION_MANUAL_OBSERVATIONS.json docs/analysis/PLAYER_MOTION_QA.json docs/analysis/PLAYER_MOTION_QA.md docs/analysis/generated/player_motion_preview.png docs/analysis/COMPANION_MOTION_MANUAL_OBSERVATIONS.json docs/analysis/COMPANION_MOTION_QA.json docs/analysis/COMPANION_MOTION_QA.md art_sources/combat/task9_companions/preview_manifest.json art_sources/combat/task9_companions/companion_motion_contact_sheet.png art_sources/combat/task9_companions/review_previews/old_survivor_companion_review.png art_sources/combat/task9_companions/review_previews/soldier_companion_review.png art_sources/combat/task9_companions/review_previews/child_companion_review.png art_sources/combat/task9_companions/review_previews/mechanic_companion_review.png art_sources/combat/task9_companions/review_previews/student_companion_review.png art_sources/combat/task9_companions/review_previews/dog_companion_review.png art_sources/combat/task9_companions/review_previews/minjun_companion_review.png art_sources/combat/task9_companions/review_previews/sohee_companion_review.png art_sources/combat/task9_companions/review_previews/yeongcheol_companion_review.png art_sources/combat/task9_companions/review_previews/daehan_companion_review.png art_sources/combat/task9_companions/review_previews/tower_doctor_companion_review.png art_sources/combat/task9_companions/review_previews/sous_chef_companion_review.png
git commit -m "docs(assets): publish actor motion rework QA"
```

### Task 9: runtime 재생과 전체 회귀 검증

**Files:**
- Verify only: `js/data/combatMotionManifest.js`
- Verify only: `js/ui/combat/CombatFxPlayer.js`
- Verify only: `assets/images/combat/spritesheets/motionLibrary.json`
- Test: full repository test/build outputs

**Interfaces:**
- Consumes: final 26 runtime sheets, manifest durations, scorecard and evidence.
- Produces: completion report with exact commands, test counts, score delta and any remaining warnings.

- [ ] **Step 1: deterministic builders와 manifest 확인**

Run: `python tools/build_player_motion_sheets.py --check`

Run: `powershell -ExecutionPolicy Bypass -File tools/build_companion_motion_sheets.ps1 -Check`

Run: `node tools/export_combat_motion_manifest.mjs --check`

Run: `node tools/verify_actor_motion_rework.mjs --check --require-targets-changed`

Expected: all PASS; changed 20, unchanged 188.

- [ ] **Step 2: runtime duration으로 20개 행 재생 검사**

전투 화면에서 player firefighter와 12종 동료를 차례로 소환해 대상 motion을 실행한다. `CombatFxPlayer._playSpriteMotion()`이 manifest의 row와 duration을 사용하고, `death`만 마지막 프레임을 유지하는지 확인한다. 팝, 발 미끄러짐, 외형 전환, prop 순간 이동이 있으면 해당 이미지 task로 돌아가 source부터 다시 생성한다.

Run: `npm.cmd run test:e2e:combat`

Run: `npm.cmd run test:e2e:combat:full`

Expected: 두 Playwright 전투 시나리오가 종료 코드 0으로 끝나고, combat screen 진입·행동 선택·공격 해결·전투 종료 흐름에서 sprite motion 관련 console error가 없다. 사람의 눈으로만 판정할 수 있는 20개 행의 자연스러움은 Task 8의 원본 해상도 preview와 이 단계의 실제 duration 재생을 함께 보고 판정한다.

- [ ] **Step 3: 전체 테스트**

Run: `npm.cmd test`

Expected: all Vitest files and tests PASS.

- [ ] **Step 4: production build**

Run: `npm.cmd run build:web`

Expected: Vite production build exits 0.

- [ ] **Step 5: 최종 worktree audit**

Run: `git status --short --branch`

Run: `git diff --check`

Run: `git log --oneline -10`

Expected: task commits are separated; unrelated pre-existing user changes remain unstaged and unmodified by this task.

- [ ] **Step 6: 최종 보고**

사용자에게 다음을 한글로 보고한다.

- 변경된 13종·20개 행 목록
- 26종 전후 점수와 전체 평균 변화
- changed 20 / unchanged 188 계약 결과
- chroma 지표 0 결과
- focused tests, full tests, build의 실제 통과 수
- 남은 경고와 후속 개선 후보

---

## Self-Review Result

- Spec coverage: 20개 대상, 외형 고정, 188개 행 보존, chroma 0, provenance, runtime duration, 수동 재점수, 전체 테스트와 build가 Task 1–9에 모두 연결되어 있다.
- Placeholder scan: `TBD`, `TODO`, “implement later”, 무내용 error handling 지시가 없다. 모든 image generation task에는 대상별 exact prompt와 source/target row가 있다.
- Type consistency: `sheetKey`, `row`, `rowPixelSha256`, `requireTargetsChanged`, source key와 target row 번호가 모든 task에서 동일하다.
- Scope control: 보스·일반 적, 수치, AI, targeting, UI/CSS 변경은 포함하지 않는다.

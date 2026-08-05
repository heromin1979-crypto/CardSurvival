from __future__ import annotations

import argparse
import json

from PIL import Image

from build_boss_motion_sheets import (
    BOSS_IDS,
    COLS,
    CONTRACT_PATH,
    ROWS,
    SELECTION_PATH,
    SOURCE_COLS_BY_BOSS,
    SOURCE_ROOT,
    component_descriptor,
    sha256_file,
    motion_row_groups,
)


def materialize() -> dict:
    selection = json.loads(SELECTION_PATH.read_text(encoding="utf-8"))
    if selection.get("version") != 2 or "selectedRows" in selection:
        raise ValueError("detached component selection schema mismatch")
    selected_frames = selection.get("selectedFrames", [])
    selection_lookup = {}
    for selected in selected_frames:
        key = (selected.get("bossId"), selected.get("motionKey"), selected.get("col"))
        if key in selection_lookup:
            raise ValueError(f"duplicate selected frame: {key}")
        boss_id, motion_key, col = key
        indexes = selected.get("componentIndexes")
        if (
            boss_id not in BOSS_IDS
            or motion_key not in ROWS
            or not isinstance(col, int)
            or not 0 <= col < COLS
            or not isinstance(indexes, list)
            or not indexes
            or len(indexes) != len(set(indexes))
            or any(not isinstance(index, int) or index < 0 for index in indexes)
            or not selected.get("rationale")
        ):
            raise ValueError(f"invalid selected frame: {selected}")
        selection_lookup[key] = selected

    frames = []
    sources = {}
    for boss_id in BOSS_IDS:
        alpha_path = SOURCE_ROOT / f"{boss_id}_alpha.png"
        source = Image.open(alpha_path).convert("RGBA")
        sources[boss_id] = sha256_file(alpha_path)
        for row, motion_key in enumerate(ROWS):
            row_image, groups, bounds, _ = motion_row_groups(source, boss_id, row)
            for col in range(COLS):
                selected = selection_lookup.get((boss_id, motion_key, col))
                if selected is None:
                    continue
                _, detached = groups[col]
                indexes = selected["componentIndexes"]
                if max(indexes) >= len(detached):
                    raise ValueError(
                        f"selected detached component missing: {boss_id}:{motion_key}:{col} "
                        f"indexes={indexes} available={len(detached)}"
                    )
                frames.append({
                    "bossId": boss_id,
                    "motionKey": motion_key,
                    "row": row,
                    "col": col,
                    "sourceColumns": SOURCE_COLS_BY_BOSS.get(boss_id, COLS),
                    "sourceCell": list(bounds[col]),
                    "selectedDetachedComponents": [
                        component_descriptor(row_image, detached[index]) for index in indexes
                    ],
                    "rationale": selected["rationale"],
                })

    return {
        "version": 2,
        "policy": (
            "Human-selected semantic projectile/effect components. Each frame entry pins only "
            "the approved detached masks by exact cell, mask SHA-256, area, and bbox."
        ),
        "selectionPath": "/art_sources/combat/task10_bosses/detached_component_selection.json",
        "selectionSha256": sha256_file(SELECTION_PATH),
        "rowContract": list(ROWS),
        "sources": sources,
        "frames": frames,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Explicitly author/check the immutable Task 10 detached-component contract"
    )
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true")
    mode.add_argument("--check", action="store_true")
    args = parser.parse_args()

    expected = json.dumps(materialize(), ensure_ascii=False, indent=2) + "\n"
    if args.write:
        CONTRACT_PATH.write_text(expected, encoding="utf-8")
        print(f"wrote {CONTRACT_PATH}")
        return
    if not CONTRACT_PATH.exists() or CONTRACT_PATH.read_text(encoding="utf-8") != expected:
        raise ValueError("detached component contract drift")
    print("detached component contract verified")


if __name__ == "__main__":
    main()

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
    detached_union_descriptor,
    sha256_file,
    source_cell_bounds,
    source_row_groups,
)


def materialize() -> dict:
    selection = json.loads(SELECTION_PATH.read_text(encoding="utf-8"))
    selected_rows = selection.get("selectedRows", {})
    unknown_bosses = sorted(set(selected_rows) - set(BOSS_IDS))
    if unknown_bosses:
        raise ValueError(f"unknown boss ids in selection: {unknown_bosses}")

    frames = []
    sources = {}
    for boss_id in BOSS_IDS:
        alpha_path = SOURCE_ROOT / f"{boss_id}_alpha.png"
        source = Image.open(alpha_path).convert("RGBA")
        sources[boss_id] = sha256_file(alpha_path)
        rows = selected_rows.get(boss_id, [])
        if len(rows) != len(set(rows)) or any(row not in ROWS for row in rows):
            raise ValueError(f"invalid selected rows for {boss_id}: {rows}")
        for motion_key in rows:
            row = ROWS.index(motion_key)
            row_image, groups, _ = source_row_groups(source, boss_id, row)
            for col in range(COLS):
                bounds = source_cell_bounds(source, boss_id, row, col)
                _, detached = groups[col]
                frames.append({
                    "bossId": boss_id,
                    "motionKey": motion_key,
                    "row": row,
                    "col": col,
                    "sourceColumns": SOURCE_COLS_BY_BOSS.get(boss_id, COLS),
                    "sourceCell": list(bounds),
                    "detached": detached_union_descriptor(row_image, detached),
                })

    return {
        "version": 1,
        "policy": (
            "Human-selected semantic effect rows. Each entry pins every detached source "
            "component by exact cell, union mask SHA-256, area, bbox, and component count."
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

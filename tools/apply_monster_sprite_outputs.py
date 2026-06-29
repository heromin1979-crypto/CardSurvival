from __future__ import annotations

import json
import re
import shutil
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE_DIR = ROOT / "output" / "imagegen" / "monster-sprites-missing14"
ASSET_DIR = ROOT / "assets" / "images" / "combat" / "spritesheets" / "enemies"
AUDIT_PATH = ROOT / "output" / "combat" / "monster_motion_audit.json"
COMBAT_UI_PATH = ROOT / "js" / "ui" / "CombatUI.js"

CHROMA = (255, 0, 255)
MISSING_IDS = [
    "boss_patient_zero",
    "boss_radiation_colossus",
    "boss_acid_queen",
    "boss_frozen_giant",
    "boss_phantom_sniper",
    "boss_cult_leader",
    "boss_mutant_alpha_tiger",
    "boss_sewer_king",
    "boss_swarm_queen_bee",
    "boss_escaped_experiment",
    "boss_blizzard_wraith",
    "boss_firefighter_nemesis",
    "boss_chef_nemesis",
    "boss_doctor_nemesis",
]


def remove_chroma_key(src: Path, out: Path) -> int:
    image = Image.open(src).convert("RGBA")
    if image.size != (1536, 1024):
        raise ValueError(f"{src} must be 1536x1024, got {image.size}")

    pixels = image.load()
    changed = 0
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            distance = abs(r - CHROMA[0]) + abs(g - CHROMA[1]) + abs(b - CHROMA[2])
            if a > 0 and distance <= 90 and r > 180 and b > 180 and g < 100:
                pixels[x, y] = (r, g, b, 0)
                changed += 1
    out.parent.mkdir(parents=True, exist_ok=True)
    image.save(out)
    return changed


def ensure_combat_ui_mapping(enemy_ids: list[str]) -> None:
    source = COMBAT_UI_PATH.read_text(encoding="utf-8")

    for enemy_id in enemy_ids:
        sheet_line = f"  {enemy_id}: spriteSheet('/assets/images/combat/spritesheets/enemies/{enemy_id}_sheet.png'),"
        key_line = f"  {enemy_id}: '{enemy_id}',"

        if sheet_line not in source:
            marker = "  food_warlord: spriteSheet('/assets/images/combat/spritesheets/enemies/food_warlord_sheet.png'),"
            source = source.replace(marker, f"{marker}\n{sheet_line}")

        if key_line not in source:
            marker = "  food_warlord: 'food_warlord',"
            source = source.replace(marker, f"{marker}\n{key_line}")

    COMBAT_UI_PATH.write_text(source, encoding="utf-8")


def main() -> None:
    source_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE_DIR
    if not source_dir.exists():
        raise SystemExit(f"Source directory not found: {source_dir}")

    applied = []
    missing = []
    for enemy_id in MISSING_IDS:
        src = source_dir / f"{enemy_id}_sheet_src.png"
        if not src.exists():
            missing.append(str(src))
            continue

        src_asset = ASSET_DIR / f"{enemy_id}_sheet_src.png"
        final_asset = ASSET_DIR / f"{enemy_id}_sheet.png"
        shutil.copyfile(src, src_asset)
        transparent_pixels = remove_chroma_key(src, final_asset)
        applied.append({
            "id": enemy_id,
            "source": str(src_asset.relative_to(ROOT)).replace("\\", "/"),
            "final": str(final_asset.relative_to(ROOT)).replace("\\", "/"),
            "transparentPixels": transparent_pixels,
        })

    if missing:
        print(json.dumps({"applied": applied, "missing": missing}, ensure_ascii=False, indent=2))
        raise SystemExit(1)

    ensure_combat_ui_mapping(MISSING_IDS)
    print(json.dumps({"applied": applied}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

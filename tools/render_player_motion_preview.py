"""Render Task 8 player sheets and emit automatic image metrics only."""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SHEETS = ("doctor_f", "soldier_m", "firefighter_m", "homeless_m", "chef_m", "engineer_m")
MOTIONS = ("idle", "melee", "ranged", "support", "guard", "move", "hit", "death")
SHEET_DIR = ROOT / "assets/images/combat/spritesheets"
NORMALIZER_PATH = ROOT / "tools/normalize_combat_sprite_sheets.py"
STRICT_BOUNDARY_ROWS = {"firefighter_m": (2,)}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def pixel_sha256(image: Image.Image) -> str:
    return hashlib.sha256(image.convert("RGBA").tobytes()).hexdigest()


def load_normalizer():
    spec = importlib.util.spec_from_file_location("player_motion_chroma_normalizer", NORMALIZER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {NORMALIZER_PATH}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def image_metrics(key: str, path: Path, image: Image.Image, normalizer) -> dict:
    strict_boundary_rows = STRICT_BOUNDARY_ROWS.get(key, ())
    strict_boundary_cells = {
        (row, col) for row in strict_boundary_rows for col in range(6)
    }
    rows = []
    for row, motion in enumerate(MOTIONS):
        frames = [image.crop((col * 256, row * 256, (col + 1) * 256, (row + 1) * 256))
                  for col in range(6)]
        rows.append({
            "row": row,
            "motion": motion,
            "alphaCoverage": [sum(alpha > 12 for alpha in frame.getchannel("A").get_flattened_data())
                              for frame in frames],
            "boundingBoxes": [list(frame.getchannel("A").getbbox() or ()) for frame in frames],
            "framePixelSha256": [pixel_sha256(frame) for frame in frames],
            "distinctFrameCount": len({pixel_sha256(frame) for frame in frames}),
        })
    return {
        "sheetKey": key,
        "path": f"/assets/images/combat/spritesheets/{key}_sheet.png",
        "width": image.width,
        "height": image.height,
        "mode": image.mode,
        "fileSha256": sha256(path),
        "strictBoundaryRows": list(strict_boundary_rows),
        "chromaMetrics": normalizer.analyze_chroma_grid(
            image, 6, 8, path, strict_boundary_cells=strict_boundary_cells
        ),
        "rows": rows,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="docs/analysis/generated/player_motion_preview.png")
    parser.add_argument("--metrics-json", default="docs/analysis/PLAYER_MOTION_QA.json")
    args = parser.parse_args()
    preview_path = ROOT / args.output
    metrics_path = ROOT / args.metrics_json
    normalizer = load_normalizer()
    panel_w, panel_h = 384, 548
    canvas = Image.new("RGBA", (panel_w * 3, panel_h * 2), (18, 22, 20, 255))
    draw = ImageDraw.Draw(canvas)
    records = []
    for index, key in enumerate(SHEETS):
        path = SHEET_DIR / f"{key}_sheet.png"
        image = Image.open(path).convert("RGBA")
        if image.size != (1536, 2048):
            raise SystemExit(f"invalid sheet size: {key} {image.size}")
        thumb = image.resize((384, 512), Image.Resampling.LANCZOS)
        x, y = (index % 3) * panel_w, (index // 3) * panel_h
        canvas.alpha_composite(thumb, (x, y + 24))
        draw.text((x + 8, y + 6), key, fill=(226, 220, 199, 255))
        records.append(image_metrics(key, path, image, normalizer))
    preview_path.parent.mkdir(parents=True, exist_ok=True)
    metrics_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(preview_path, quality=94)
    metrics_path.write_text(json.dumps({
        "version": 2,
        "generatedBy": "/tools/render_player_motion_preview.py",
        "preview": f"/{preview_path.relative_to(ROOT).as_posix()}",
        "motions": list(MOTIONS),
        "characters": records,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"rendered {len(records)} player sheets")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

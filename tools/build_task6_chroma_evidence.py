"""Build the immutable Task 6 chroma-cleanup evidence from explicit source checkouts.

This builder intentionally accepts directories instead of Git revisions. The runtime
verifier never calls it and exposes no write mode.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import io
import json
import sys
import zipfile
from pathlib import Path

from PIL import Image

from provenance_hash import PROVENANCE_HASH_SCHEME


SUPERSEDED_BY = {
    "doctor_f": "task8-player-motion",
    "nurse_companion": "task9-companion-motion",
    "soldier_companion": "task9-companion-motion",
    "raider": "task7-normal-motion",
    "raider_elite": "task7-normal-motion",
    "zombie_acid": "task7-normal-motion",
    "zombie_bloater": "task7-normal-motion",
    "zombie_brute": "task7-normal-motion",
    "zombie_charger": "task7-normal-motion",
    "zombie_patient_dormant": "task7-normal-motion",
    "zombie_runner": "task7-normal-motion",
    "zombie_screamer": "task7-normal-motion",
}


def superseded_source(sheet_key: str) -> str | None:
    if sheet_key == "doctor_f":
        return "/art_sources/combat/task8_players/doctor_f_existing_alpha.png"
    if sheet_key in {"nurse_companion", "soldier_companion"}:
        return f"/art_sources/combat/task9_companions/{sheet_key}_task6_after.png"
    if SUPERSEDED_BY.get(sheet_key) == "task7-normal-motion":
        return f"/art_sources/combat/task7_normal/baseline/{sheet_key}_sheet.png"
    return None


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def png_bytes(image: Image.Image) -> bytes:
    stream = io.BytesIO()
    image.save(stream, format="PNG", optimize=True)
    return stream.getvalue()


def load_normalizer(path: Path):
    spec = importlib.util.spec_from_file_location("task6_evidence_normalizer", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--before-root", type=Path, required=True)
    parser.add_argument("--after-root", type=Path, required=True)
    parser.add_argument("--historical-report", type=Path, required=True)
    parser.add_argument("--runtime-root", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()

    runtime_root = args.runtime_root.resolve()
    normalizer = load_normalizer(runtime_root / "tools/normalize_combat_sprite_sheets.py")
    historical = json.loads(args.historical_report.read_text(encoding="utf-8-sig"))
    if historical.get("sheetCount") != 23 or historical.get("unexpectedAlphaLoss") != 0:
        raise SystemExit("Task 6 historical report contract mismatch")

    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    archive_path = output_dir / "alpha_evidence.zip"
    sheets = []
    with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for source in historical["sheets"]:
            relative = source["path"].lstrip("/")
            before_bytes = (args.before_root / relative).read_bytes()
            after_bytes = (args.after_root / relative).read_bytes()
            current_bytes = (runtime_root / relative).read_bytes()
            if sha256_bytes(before_bytes) != source["beforeSha256"]:
                raise SystemExit(f"before source hash mismatch: {source['sheetKey']}")
            if sha256_bytes(after_bytes) != source["afterSha256"]:
                raise SystemExit(f"after source hash mismatch: {source['sheetKey']}")
            before = Image.open(io.BytesIO(before_bytes)).convert("RGBA")
            after = Image.open(io.BytesIO(after_bytes)).convert("RGBA")
            if before.size != after.size or before.size != (source["width"], source["height"]):
                raise SystemExit(f"historical dimensions mismatch: {source['sheetKey']}")

            before_mask = Image.new("L", before.size, 0)
            before_mask.putdata([
                pixel[3] if pixel[3] > 0 and not normalizer.is_green_screen_pixel(pixel) else 0
                for pixel in before.get_flattened_data()
            ])
            after_alpha = after.getchannel("A")
            before_name = f"before_non_chroma/{source['sheetKey']}.png"
            after_name = f"after_alpha/{source['sheetKey']}.png"
            before_mask_bytes = png_bytes(before_mask)
            after_alpha_bytes = png_bytes(after_alpha)
            archive.writestr(before_name, before_mask_bytes)
            archive.writestr(after_name, after_alpha_bytes)
            sheets.append({
                "sheetKey": source["sheetKey"],
                "path": source["path"],
                "width": source["width"],
                "height": source["height"],
                "cols": source["cols"],
                "rows": source["rows"],
                "beforeSha256": source["beforeSha256"],
                "task6AfterSha256": source["afterSha256"],
                "currentSha256": sha256_bytes(current_bytes),
                "changedPixels": source["changedPixels"],
                "beforeMaskEntry": before_name,
                "beforeMaskSha256": sha256_bytes(before_mask_bytes),
                "afterAlphaEntry": after_name,
                "afterAlphaSha256": sha256_bytes(after_alpha_bytes),
                "currentPolicy": "superseded" if source["sheetKey"] in SUPERSEDED_BY else "direct",
                "supersededBy": SUPERSEDED_BY.get(source["sheetKey"]),
                "supersededSource": superseded_source(source["sheetKey"]),
            })

    archive_hash = sha256_bytes(archive_path.read_bytes())
    manifest = {
        "version": 2,
        "hashScheme": PROVENANCE_HASH_SCHEME,
        "scope": "Task 6 historical 23 displayed-sheet chroma cleanup",
        "archive": "/art_sources/combat/task6_chroma/alpha_evidence.zip",
        "archiveSha256": archive_hash,
        "sheetCount": len(sheets),
        "changedSheetCount": historical["changedSheetCount"],
        "changedPixels": historical["changedPixels"],
        "sheets": sheets,
    }
    (output_dir / "evidence_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"writtenSheets": len(sheets), "archiveSha256": archive_hash}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

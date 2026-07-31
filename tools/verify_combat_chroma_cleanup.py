"""Produce and independently verify the committed combat chroma-cleanup invariant report."""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import io
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
BASELINE_COMMIT = "50b75fb"
REPORT_PATH = ROOT / "docs" / "analysis" / "COMBAT_CHROMA_CLEANUP_REPORT.json"
NORMALIZER_PATH = ROOT / "tools" / "normalize_combat_sprite_sheets.py"


def _normalizer():
    spec = importlib.util.spec_from_file_location("combat_chroma_normalizer", NORMALIZER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {NORMALIZER_PATH}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def _png_from_bytes(data: bytes) -> Image.Image:
    with Image.open(io.BytesIO(data)) as image:
        return image.convert("RGBA")


def _baseline_bytes(relative: str) -> bytes:
    return subprocess.check_output(["git", "show", f"{BASELINE_COMMIT}:{relative}"], cwd=ROOT)


def frame_metrics(before: Image.Image, after: Image.Image, is_chroma) -> dict:
    if before.size != after.size:
        raise ValueError(f"frame dimensions changed from {before.size} to {after.size}")
    before = before.convert("RGBA")
    after = after.convert("RGBA")
    alpha_before = alpha_after = non_chroma_before = non_chroma_after = unexpected_loss = changed_pixels = 0
    for source, result in zip(before.get_flattened_data(), after.get_flattened_data()):
        alpha_before += int(source[3] > 0)
        alpha_after += int(result[3] > 0)
        non_chroma_before += int(source[3] > 0 and not is_chroma(source))
        non_chroma_after += int(result[3] > 0 and not is_chroma(result))
        unexpected_loss += int(result[3] < source[3] and not is_chroma(source))
        changed_pixels += int(source != result)
    return {
        "alphaCoverageBefore": alpha_before,
        "alphaCoverageAfter": alpha_after,
        "nonChromaAlphaCoverageBefore": non_chroma_before,
        "nonChromaAlphaCoverageAfter": non_chroma_after,
        "unexpectedAlphaLoss": unexpected_loss,
        "changedPixels": changed_pixels,
    }


def build_report() -> dict:
    normalizer = _normalizer()
    manifest = json.loads(normalizer.MANIFEST_PATH.read_text(encoding="utf-8"))
    sheets = []
    for sheet_key, entry in sorted(manifest.items()):
        relative = entry["src"].lstrip("/")
        before_bytes = _baseline_bytes(relative)
        after_bytes = (ROOT / relative).read_bytes()
        before = _png_from_bytes(before_bytes)
        after = _png_from_bytes(after_bytes)
        if before.size != after.size:
            raise ValueError(f"{relative} dimensions changed from {before.size} to {after.size}")
        grid = normalizer.grid_for(ROOT / relative, after)
        frames = []
        for index, box in enumerate(normalizer._frame_boxes(before, grid.cols, grid.rows)):
            row, col = divmod(index, grid.cols)
            metrics = frame_metrics(before.crop(box), after.crop(box), normalizer.is_green_screen_pixel)
            frames.append({"row": row, "col": col, "width": grid.cell_width, "height": grid.cell_height, **metrics})
        changed_pixels = sum(frame["changedPixels"] for frame in frames)
        sheets.append({
            "sheetKey": sheet_key,
            "path": entry["src"],
            "width": before.width,
            "height": before.height,
            "cols": grid.cols,
            "rows": grid.rows,
            "beforeSha256": hashlib.sha256(before_bytes).hexdigest(),
            "afterSha256": hashlib.sha256(after_bytes).hexdigest(),
            "changedPixels": changed_pixels,
            "unexpectedAlphaLoss": sum(frame["unexpectedAlphaLoss"] for frame in frames),
            "frames": frames,
        })
    return {
        "reportVersion": 1,
        "baselineCommit": BASELINE_COMMIT,
        "sheetCount": len(sheets),
        "changedSheetCount": sum(sheet["beforeSha256"] != sheet["afterSha256"] for sheet in sheets),
        "changedPixels": sum(sheet["changedPixels"] for sheet in sheets),
        "unexpectedAlphaLoss": sum(sheet["unexpectedAlphaLoss"] for sheet in sheets),
        "sheets": sheets,
    }


def report_bytes(report: dict) -> bytes:
    return (json.dumps(report, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true", help="regenerate the committed report from the baseline commit")
    parser.add_argument("--check", action="store_true", help="recalculate and require exact equality with the committed report")
    args = parser.parse_args()
    if args.write == args.check:
        parser.error("choose exactly one of --write or --check")
    report = build_report()
    if report["unexpectedAlphaLoss"] != 0:
        raise SystemExit(f"unexpected non-chroma alpha loss: {report['unexpectedAlphaLoss']}")
    if report["changedSheetCount"] != 20:
        raise SystemExit(f"expected 20 changed production sheets, found {report['changedSheetCount']}")
    expected = report_bytes(report)
    if args.write:
        REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
        REPORT_PATH.write_bytes(expected)
        print(json.dumps({"written": REPORT_PATH.relative_to(ROOT).as_posix(), "changedSheetCount": report["changedSheetCount"]}))
        return 0
    if not REPORT_PATH.exists() or REPORT_PATH.read_bytes() != expected:
        raise SystemExit("combat chroma cleanup report is stale; run tools/verify_combat_chroma_cleanup.py --write")
    print(json.dumps({"checked": REPORT_PATH.relative_to(ROOT).as_posix(), "changedSheetCount": report["changedSheetCount"], "unexpectedAlphaLoss": 0}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

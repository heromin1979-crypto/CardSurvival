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
ASSEMBLY_PATH = ROOT / "tools" / "build_normal_enemy_motion_sheets.py"
ASSEMBLY_RECIPE_PATH = (
    ROOT / "art_sources" / "combat" / "task7_normal" / "assembly_recipe.json"
)


def _normalizer():
    spec = importlib.util.spec_from_file_location("combat_chroma_normalizer", NORMALIZER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {NORMALIZER_PATH}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def _assembly():
    spec = importlib.util.spec_from_file_location("task7_normal_sheet_assembly", ASSEMBLY_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {ASSEMBLY_PATH}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def _png_from_bytes(data: bytes) -> Image.Image:
    with Image.open(io.BytesIO(data)) as image:
        return image.convert("RGBA")


def _baseline_bytes(relative: str, commit: str = BASELINE_COMMIT) -> bytes:
    return subprocess.check_output(["git", "show", f"{commit}:{relative}"], cwd=ROOT)


def _source_provenance(relative: str) -> dict:
    source_relative = relative.replace("_sheet.png", "_sheet_src.png")
    source_path = ROOT / source_relative
    if source_relative == relative or not source_path.exists():
        return {"sourcePath": None, "sourcePreserved": None}
    try:
        before_bytes = _baseline_bytes(source_relative)
    except subprocess.CalledProcessError:
        return {
            "sourcePath": f"/{source_relative}",
            "sourcePreserved": None,
        }
    after_bytes = source_path.read_bytes()
    return {
        "sourcePath": f"/{source_relative}",
        "sourceBeforeSha256": hashlib.sha256(before_bytes).hexdigest(),
        "sourceAfterSha256": hashlib.sha256(after_bytes).hexdigest(),
        "sourcePreserved": before_bytes == after_bytes,
    }


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


def pixel_mismatch_count(expected: Image.Image, actual: Image.Image) -> int:
    if expected.size != actual.size:
        raise ValueError(f"frame dimensions changed from {expected.size} to {actual.size}")
    return sum(
        expected_pixel != actual_pixel
        for expected_pixel, actual_pixel in zip(
            expected.convert("RGBA").get_flattened_data(),
            actual.convert("RGBA").get_flattened_data(),
        )
    )


def canonical_json_sha256(value: dict) -> str:
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def build_report() -> dict:
    normalizer = _normalizer()
    assembly = _assembly()
    recipe = json.loads(ASSEMBLY_RECIPE_PATH.read_text(encoding="utf-8"))
    recipe_verification = assembly.verify_recipe(recipe)
    assembled_targets = assembly.assemble_sheets()
    manifest = json.loads(normalizer.MANIFEST_PATH.read_text(encoding="utf-8"))
    sheets = []
    for sheet_key, entry in sorted(manifest.items()):
        relative = entry["src"].lstrip("/")
        before_bytes = _baseline_bytes(relative)
        after_bytes = (ROOT / relative).read_bytes()
        before = _png_from_bytes(before_bytes)
        after = _png_from_bytes(after_bytes)
        grid = normalizer.grid_for(ROOT / relative, after)
        dimension_changed = before.size != after.size
        source_provenance = _source_provenance(relative) if dimension_changed else {
            "sourcePath": None,
            "sourcePreserved": None,
        }
        if dimension_changed and source_provenance.get("sourcePreserved") is not True:
            raise ValueError(f"{relative} was rebuilt but its _sheet_src.png provenance is not preserved")
        chroma = normalizer.analyze_chroma_grid(after, grid.cols, grid.rows, ROOT / relative) if dimension_changed else None
        if chroma is not None and any(chroma.values()):
            raise ValueError(f"{relative} has chroma artifacts: {chroma}")
        frames = []
        if dimension_changed:
            target_recipe = recipe["targets"].get(sheet_key)
            expected_target = assembled_targets.get(sheet_key)
            if target_recipe is None or expected_target is None:
                raise ValueError(f"{relative} changed dimensions without a deterministic assembly recipe")
            retained_rows = {
                mapping["targetRow"]: mapping["baselineRow"]
                for mapping in target_recipe["retainedRows"]
            }
            new_rows = {entry["row"]: entry["sources"] for entry in target_recipe["newRows"]}
            retained_baseline = _png_from_bytes(_baseline_bytes(relative, assembly.BASELINE_COMMIT))
            for index, box in enumerate(normalizer._frame_boxes(after, grid.cols, grid.rows)):
                row, col = divmod(index, grid.cols)
                actual_frame = after.crop(box)
                if row in retained_rows:
                    baseline_row = retained_rows[row]
                    baseline_box = (
                        col * grid.cell_width,
                        baseline_row * grid.cell_height,
                        (col + 1) * grid.cell_width,
                        (baseline_row + 1) * grid.cell_height,
                    )
                    frames.append({
                        "row": row,
                        "col": col,
                        "width": grid.cell_width,
                        "height": grid.cell_height,
                        "comparison": "retained-baseline-row",
                        "baselineRow": baseline_row,
                        **frame_metrics(
                            retained_baseline.crop(baseline_box),
                            actual_frame,
                            normalizer.is_green_screen_pixel,
                        ),
                    })
                    continue
                if row not in new_rows:
                    raise ValueError(f"{relative} row {row} lacks retained/new provenance")
                expected_frame = expected_target.crop(box)
                expected_coverage = sum(alpha > 12 for alpha in expected_frame.getchannel("A").get_flattened_data())
                actual_coverage = sum(alpha > 12 for alpha in actual_frame.getchannel("A").get_flattened_data())
                frames.append({
                    "row": row,
                    "col": col,
                    "width": grid.cell_width,
                    "height": grid.cell_height,
                    "comparison": "deterministic-assembly",
                    "sourceRefs": new_rows[row],
                    "expectedForegroundCoverage": expected_coverage,
                    "actualForegroundCoverage": actual_coverage,
                    "verificationMismatchPixels": pixel_mismatch_count(expected_frame, actual_frame),
                })
        else:
            for index, box in enumerate(normalizer._frame_boxes(before, grid.cols, grid.rows)):
                row, col = divmod(index, grid.cols)
                metrics = frame_metrics(before.crop(box), after.crop(box), normalizer.is_green_screen_pixel)
                frames.append({"row": row, "col": col, "width": grid.cell_width, "height": grid.cell_height, **metrics})
        sheet_report = {
            "sheetKey": sheet_key,
            "path": entry["src"],
            "width": after.width,
            "height": after.height,
            "baselineWidth": before.width,
            "baselineHeight": before.height,
            "cols": grid.cols,
            "rows": grid.rows,
            "dimensionChanged": dimension_changed,
            "provenanceMode": "rebuilt-target-source-preserved" if dimension_changed else "pixel-comparable-cleanup",
            **source_provenance,
            "beforeSha256": hashlib.sha256(before_bytes).hexdigest(),
            "afterSha256": hashlib.sha256(after_bytes).hexdigest(),
            "chromaArtifacts": chroma,
            "frames": frames,
        }
        if dimension_changed:
            retained_frames = [frame for frame in frames if frame["comparison"] == "retained-baseline-row"]
            generated_frames = [frame for frame in frames if frame["comparison"] == "deterministic-assembly"]
            sheet_report.update({
                "retainedChangedPixels": sum(frame["changedPixels"] for frame in retained_frames),
                "retainedUnexpectedAlphaLoss": sum(frame["unexpectedAlphaLoss"] for frame in retained_frames),
                "verificationMismatchPixels": sum(frame["verificationMismatchPixels"] for frame in generated_frames),
            })
        else:
            sheet_report.update({
                "changedPixels": sum(frame["changedPixels"] for frame in frames),
                "unexpectedAlphaLoss": sum(frame["unexpectedAlphaLoss"] for frame in frames),
            })
        sheets.append(sheet_report)
    unexpected_alpha_loss = sum(
        sheet.get("unexpectedAlphaLoss", sheet.get("retainedUnexpectedAlphaLoss", 0))
        for sheet in sheets
    )
    rebuilt_mismatch = sum(sheet.get("verificationMismatchPixels", 0) for sheet in sheets)
    return {
        "reportVersion": 3,
        "baselineCommit": BASELINE_COMMIT,
        "rebuiltBaselineCommit": assembly.BASELINE_COMMIT,
        "assemblyRecipePath": f"/{ASSEMBLY_RECIPE_PATH.relative_to(ROOT).as_posix()}",
        "assemblyRecipeSha256": canonical_json_sha256(recipe),
        "assemblyVerification": recipe_verification,
        "sheetCount": len(sheets),
        "changedSheetCount": sum(sheet["beforeSha256"] != sheet["afterSha256"] for sheet in sheets),
        "rebuiltSheetCount": sum(sheet["dimensionChanged"] for sheet in sheets),
        "pixelComparableChangedPixels": sum(sheet.get("changedPixels", 0) for sheet in sheets),
        "retainedRebuiltChangedPixels": sum(sheet.get("retainedChangedPixels", 0) for sheet in sheets),
        "rebuiltVerificationMismatchPixels": rebuilt_mismatch,
        "unexpectedAlphaLoss": unexpected_alpha_loss,
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
    if report["rebuiltVerificationMismatchPixels"] != 0:
        raise SystemExit(f"rebuilt sprite mismatch: {report['rebuiltVerificationMismatchPixels']}")
    expected = report_bytes(report)
    if args.write:
        REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
        REPORT_PATH.write_bytes(expected)
        print(json.dumps({"written": REPORT_PATH.relative_to(ROOT).as_posix(), "changedSheetCount": report["changedSheetCount"]}))
        return 0
    if not REPORT_PATH.exists() or REPORT_PATH.read_bytes() != expected:
        raise SystemExit("combat chroma cleanup report is stale; run tools/verify_combat_chroma_cleanup.py --write")
    print(json.dumps({
        "checked": REPORT_PATH.relative_to(ROOT).as_posix(),
        "changedSheetCount": report["changedSheetCount"],
        "unexpectedAlphaLoss": report["unexpectedAlphaLoss"],
        "rebuiltVerificationMismatchPixels": report["rebuiltVerificationMismatchPixels"],
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

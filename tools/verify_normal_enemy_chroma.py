"""Reassemble Task 7 targets and verify the current normal-enemy roster without Git."""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
TASK7_NORMAL_ROSTER = (
    "zombie_patient_dormant", "zombie_common", "zombie_runner", "zombie_brute",
    "zombie_horde", "rabid_dog", "zombie_acid", "zombie_bloater",
    "zombie_screamer", "zombie_charger", "raider", "raider_elite",
)
ZERO_CHROMA = {
    "opaqueGreen": 0,
    "fringeGreen": 0,
    "hiddenRgb": 0,
    "removedComponents": 0,
    "staleAllowlist": 0,
}


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def pixel_sha256(image: Image.Image) -> str:
    return hashlib.sha256(image.convert("RGBA").tobytes()).hexdigest()


def canonical_json_sha256(value: object) -> str:
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def resolve_repo_path(root: Path, value: str) -> Path:
    if not isinstance(value, str) or not value.startswith("/") or value.startswith("//") or "\\" in value:
        raise ValueError(f"invalid repository path: {value!r}")
    path = (root / value.lstrip("/")).resolve()
    try:
        path.relative_to(root.resolve())
    except ValueError as error:
        raise ValueError(f"repository path escapes root: {value}") from error
    return path


def load_normalizer(root: Path):
    path = root / "tools/normalize_combat_sprite_sheets.py"
    spec = importlib.util.spec_from_file_location("task7_current_chroma_normalizer", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def load_assembler(root: Path):
    path = root / "tools/build_normal_enemy_motion_sheets.py"
    spec = importlib.util.spec_from_file_location("task7_current_chroma_assembler", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def build_report(root: Path) -> dict:
    root = root.resolve()
    manifest_path = root / "assets/images/combat/spritesheets/manifest.json"
    recipe_path = root / "art_sources/combat/task7_normal/assembly_recipe.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    recipe = json.loads(recipe_path.read_text(encoding="utf-8"))
    normalizer = load_normalizer(root)
    assembler = load_assembler(root)
    assembly_result = assembler.verify_recipe(recipe)
    canonical_count = assembly_result["verifiedCanonicalSources"]
    baseline_count = assembly_result["verifiedBaselineSources"]
    archival_count = assembly_result["verifiedArchivalSources"]
    targets = recipe.get("targets")
    if not isinstance(targets, dict) or set(targets) - set(TASK7_NORMAL_ROSTER):
        raise ValueError("Task 7 recipe target scope mismatch")
    sheets = []
    for key in TASK7_NORMAL_ROSTER:
        entry = manifest.get(key)
        if not isinstance(entry, dict):
            raise ValueError(f"Task 7 roster missing from current manifest: {key}")
        path = resolve_repo_path(root, entry.get("src"))
        image = Image.open(path).convert("RGBA")
        cols, rows = entry.get("cols"), entry.get("rows")
        if not isinstance(cols, int) or not isinstance(rows, int) or cols <= 0 or rows <= 0:
            raise ValueError(f"invalid current grid: {key}")
        if image.width % cols or image.height % rows:
            raise ValueError(f"current runtime sheet is not divisible by its grid: {key}")
        chroma = normalizer.analyze_chroma_grid(image, cols, rows, path)
        if chroma != ZERO_CHROMA:
            raise ValueError(f"current runtime chroma residue: {key} {chroma}")
        target = targets.get(key)
        recipe_match = target is not None
        if recipe_match:
            if (target.get("path") != entry["src"]
                    or target.get("width") != image.width
                    or target.get("height") != image.height
                    or target.get("fileSha256") != file_sha256(path)
                    or target.get("pixelSha256") != pixel_sha256(image)):
                raise ValueError(f"current Task 7 runtime differs from recipe: {key}")
        sheets.append({
            "sheetKey": key,
            "path": entry["src"],
            "cols": cols,
            "rows": rows,
            "width": image.width,
            "height": image.height,
            "fileSha256": file_sha256(path),
            "pixelSha256": pixel_sha256(image),
            "recipeTarget": recipe_match,
            "chromaArtifacts": chroma,
        })
    return {
        "reportVersion": 1,
        "scopePolicy": "explicit current-runtime Task 7 normal roster; later task additions are ignored",
        "assemblyRecipePath": "/art_sources/combat/task7_normal/assembly_recipe.json",
        "assemblyRecipeSha256": canonical_json_sha256(recipe),
        "sheetCount": len(sheets),
        "recipeTargetCount": sum(sheet["recipeTarget"] for sheet in sheets),
        "verifiedCanonicalSources": canonical_count,
        "verifiedBaselineSources": baseline_count,
        "verifiedArchivalSources": archival_count,
        "chromaArtifacts": dict(ZERO_CHROMA),
        "sheets": sheets,
    }


def report_bytes(report: dict) -> bytes:
    return (json.dumps(report, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.write == args.check:
        parser.error("choose exactly one of --write or --check")
    root = args.root.resolve()
    report_path = args.report or (root / "docs/analysis/COMBAT_CHROMA_TASK7_CURRENT_REPORT.json")
    if not report_path.is_absolute():
        report_path = root / report_path
    try:
        report = build_report(root)
    except (OSError, ValueError, KeyError, TypeError, json.JSONDecodeError) as error:
        raise SystemExit(str(error)) from error
    expected = report_bytes(report)
    if args.write:
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_bytes(expected)
        print(json.dumps({
            "written": report_path.relative_to(root).as_posix(),
            "sheetCount": report["sheetCount"],
            "recipeTargetCount": report["recipeTargetCount"],
        }))
        return 0
    if not report_path.exists() or report_path.read_bytes() != expected:
        raise SystemExit("Task 7 current-roster report is stale; run tools/verify_normal_enemy_chroma.py --write")
    print(json.dumps({
        "checked": report_path.relative_to(root).as_posix(),
        "sheetCount": report["sheetCount"],
        "recipeTargetCount": report["recipeTargetCount"],
        "chromaArtifacts": report["chromaArtifacts"],
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Deterministically assemble and verify Task 7 normal-enemy motion sheets."""
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
BASELINE_COMMIT = "1312cf9"
CELL = 256
COLS = 6
ENEMY_DIR = ROOT / "assets/images/combat/spritesheets/enemies"
SOURCE_DIR = ROOT / "art_sources/combat/task7_normal"
RECIPE_PATH = SOURCE_DIR / "assembly_recipe.json"
NORMALIZER_PATH = ROOT / "tools/normalize_combat_sprite_sheets.py"

CANONICAL_SOURCE_FILES = (
    "raider_generated_alpha.png",
    "raider_elite_generated_alpha.png",
    "zombie_bloater_self_destruct_alpha.png",
    "zombie_screamer_spit_alpha.png",
)
ARCHIVAL_SOURCE_FILES = (
    "raider_generated_chroma.png",
    "raider_elite_generated_chroma.png",
    "zombie_bloater_self_destruct_chroma.png",
    "zombie_screamer_spit_chroma.png",
)

ROW_PROVENANCE = {
    "zombie_patient_dormant": {
        "retained": {1: 0, 2: 1, 3: 2, 4: 3},
        "new": {0: ["baseline:zombie_patient_dormant:0"]},
    },
    "zombie_runner": {
        "retained": {0: 0, 3: 1, 4: 2, 5: 3},
        "new": {1: ["baseline:zombie_runner:1"], 2: ["baseline:zombie_runner:0", "baseline:zombie_runner:1"]},
    },
    "zombie_brute": {
        "retained": {0: 0, 3: 1, 4: 2, 5: 3},
        "new": {1: ["baseline:zombie_brute:1"], 2: ["baseline:zombie_brute:0", "baseline:zombie_brute:1"]},
    },
    "raider": {
        "retained": {3: 2, 4: 3},
        "new": {
            0: ["raider_generated_alpha.png"],
            1: ["raider_generated_alpha.png"],
            2: ["raider_generated_alpha.png"],
        },
    },
    "raider_elite": {
        "retained": {0: 0, 4: 2, 5: 3},
        "new": {
            1: ["raider_elite_generated_alpha.png"],
            2: ["raider_elite_generated_alpha.png"],
            3: ["raider_elite_generated_alpha.png"],
        },
    },
    "zombie_acid": {
        "retained": {0: 0, 2: 1, 3: 2, 4: 3},
        "new": {1: ["baseline:zombie_acid:1"]},
    },
    "zombie_bloater": {
        "retained": {0: 0, 1: 1, 4: 2, 5: 3},
        "new": {
            2: ["zombie_bloater_self_destruct_alpha.png"],
            3: ["zombie_bloater_self_destruct_alpha.png"],
        },
    },
    "zombie_screamer": {
        "retained": {0: 0, 3: 1, 4: 2, 5: 3},
        "new": {
            1: ["zombie_screamer_spit_alpha.png"],
            2: ["baseline:zombie_screamer:0", "baseline:zombie_screamer:1"],
        },
    },
    "zombie_charger": {
        "retained": {0: 0, 3: 1, 4: 2, 5: 3},
        "new": {1: ["baseline:zombie_charger:1"], 2: ["baseline:zombie_charger:0", "baseline:zombie_charger:1"]},
    },
}


def _normalizer():
    spec = importlib.util.spec_from_file_location("task7_normalizer", NORMALIZER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {NORMALIZER_PATH}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def text_sha256(path: Path) -> str:
    normalized = path.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def resolve_repo_path(repo_path: str) -> Path:
    if not isinstance(repo_path, str) or not repo_path or repo_path.startswith("//"):
        raise ValueError(f"invalid repository path: {repo_path!r}")
    relative = repo_path[1:] if repo_path.startswith("/") else repo_path
    relative_path = Path(relative)
    if relative_path.is_absolute():
        raise ValueError(f"repository path must be relative: {repo_path}")
    candidate = (ROOT / relative_path).resolve()
    try:
        candidate.relative_to(ROOT.resolve())
    except ValueError as exc:
        raise ValueError(f"repository path escapes root: {repo_path}") from exc
    return candidate


def pixel_sha256(image: Image.Image) -> str:
    return hashlib.sha256(image.convert("RGBA").tobytes()).hexdigest()


def verify_source_hash(path: Path, expected_sha256: str) -> None:
    actual = file_sha256(path)
    if actual != expected_sha256:
        raise ValueError(f"source hash changed: {path} expected {expected_sha256}, got {actual}")


def baseline_bytes(relative: str, commit: str = BASELINE_COMMIT) -> bytes:
    return subprocess.check_output(["git", "show", f"{commit}:{relative}"], cwd=ROOT)


def baseline_sheet(enemy_id: str) -> Image.Image:
    relative = f"assets/images/combat/spritesheets/enemies/{enemy_id}_sheet.png"
    return Image.open(io.BytesIO(baseline_bytes(relative))).convert("RGBA")


def existing_cell(sheet: Image.Image, row: int, col: int) -> Image.Image:
    return sheet.crop((col * CELL, row * CELL, (col + 1) * CELL, (row + 1) * CELL))


def fitted_generated_cell(sheet: Image.Image, row: int, col: int, rows: int) -> Image.Image:
    cell_width = sheet.width // COLS
    cell_height = sheet.height // rows
    cell = sheet.crop((col * cell_width, row * cell_height, (col + 1) * cell_width, (row + 1) * cell_height))
    bbox = cell.getchannel("A").getbbox()
    if bbox is None:
        return Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    subject = cell.crop(bbox)
    scale = min(236 / subject.width, 244 / subject.height)
    size = (max(1, round(subject.width * scale)), max(1, round(subject.height * scale)))
    subject = subject.resize(size, Image.Resampling.LANCZOS)
    result = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    result.alpha_composite(subject, ((CELL - subject.width) // 2, CELL - subject.height - 6))
    return result


def existing_row(sheet: Image.Image, row: int, cols: list[int] | None = None) -> list[Image.Image]:
    return [existing_cell(sheet, row, col) for col in (cols if cols is not None else range(COLS))]


def generated_row(sheet: Image.Image, row: int, rows: int, cols: list[int] | None = None) -> list[Image.Image]:
    return [
        fitted_generated_cell(sheet, row, col, rows)
        for col in (cols if cols is not None else range(COLS))
    ]


def make_sheet(rows: list[list[Image.Image]]) -> Image.Image:
    output = Image.new("RGBA", (COLS * CELL, len(rows) * CELL), (0, 0, 0, 0))
    for row_index, frames in enumerate(rows):
        if len(frames) != COLS:
            raise ValueError(f"row {row_index} has {len(frames)} frames")
        for col_index, frame in enumerate(frames):
            output.alpha_composite(frame, (col_index * CELL, row_index * CELL))
    return output


def assemble_sheets() -> dict[str, Image.Image]:
    generated = {
        name: Image.open(SOURCE_DIR / name).convert("RGBA")
        for name in CANONICAL_SOURCE_FILES
    }
    baseline = {enemy_id: baseline_sheet(enemy_id) for enemy_id in ROW_PROVENANCE}
    sheets: dict[str, Image.Image] = {}

    old = baseline["zombie_patient_dormant"]
    sheets["zombie_patient_dormant"] = make_sheet([
        existing_row(old, 0, [0, 1, 0, 1, 0, 1]), existing_row(old, 0),
        existing_row(old, 1), existing_row(old, 2), existing_row(old, 3),
    ])

    old = baseline["zombie_runner"]
    sheets["zombie_runner"] = make_sheet([
        existing_row(old, 0), existing_row(old, 1, [0, 0, 1, 2, 3, 0]),
        [existing_cell(old, 0, 0), existing_cell(old, 0, 1), existing_cell(old, 0, 2),
         existing_cell(old, 0, 3), existing_cell(old, 1, 0), existing_cell(old, 1, 0)],
        existing_row(old, 1), existing_row(old, 2), existing_row(old, 3),
    ])

    old = baseline["zombie_brute"]
    sheets["zombie_brute"] = make_sheet([
        existing_row(old, 0), existing_row(old, 1, [2, 3, 4, 5, 5, 5]),
        [existing_cell(old, 0, 5), existing_cell(old, 1, 0), existing_cell(old, 1, 0),
         existing_cell(old, 1, 1), existing_cell(old, 1, 1), existing_cell(old, 1, 0)],
        existing_row(old, 1), existing_row(old, 2), existing_row(old, 3),
    ])

    old = baseline["raider"]
    new = generated["raider_generated_alpha.png"]
    sheets["raider"] = make_sheet([
        generated_row(new, 0, 2, [0, 5, 0, 5, 0, 5]), generated_row(new, 0, 2),
        generated_row(new, 1, 2), existing_row(old, 2), existing_row(old, 3),
    ])

    old = baseline["raider_elite"]
    new = generated["raider_elite_generated_alpha.png"]
    sheets["raider_elite"] = make_sheet([
        existing_row(old, 0),
        [fitted_generated_cell(new, 0, 0, 2), fitted_generated_cell(new, 0, 1, 2),
         fitted_generated_cell(new, 1, 2, 2), fitted_generated_cell(new, 1, 3, 2),
         fitted_generated_cell(new, 0, 1, 2), fitted_generated_cell(new, 0, 0, 2)],
        generated_row(new, 0, 2), generated_row(new, 1, 2),
        existing_row(old, 2), existing_row(old, 3),
    ])

    old = baseline["zombie_acid"]
    sheets["zombie_acid"] = make_sheet([
        existing_row(old, 0), existing_row(old, 1, [0, 1, 2, 3, 2, 1]),
        existing_row(old, 1), existing_row(old, 2), existing_row(old, 3),
    ])

    old = baseline["zombie_bloater"]
    new = generated["zombie_bloater_self_destruct_alpha.png"]
    sheets["zombie_bloater"] = make_sheet([
        existing_row(old, 0), existing_row(old, 1), generated_row(new, 0, 1, [0, 0, 1, 1, 2, 2]),
        generated_row(new, 0, 1), existing_row(old, 2), existing_row(old, 3),
    ])

    old = baseline["zombie_screamer"]
    new = generated["zombie_screamer_spit_alpha.png"]
    sheets["zombie_screamer"] = make_sheet([
        existing_row(old, 0), generated_row(new, 0, 1),
        [existing_cell(old, 0, 0), existing_cell(old, 0, 1), existing_cell(old, 1, 0),
         existing_cell(old, 1, 1), existing_cell(old, 1, 2), existing_cell(old, 1, 2)],
        existing_row(old, 1), existing_row(old, 2), existing_row(old, 3),
    ])

    old = baseline["zombie_charger"]
    sheets["zombie_charger"] = make_sheet([
        existing_row(old, 0), existing_row(old, 1, [0, 0, 1, 2, 2, 0]),
        [existing_cell(old, 0, 0), existing_cell(old, 0, 1), existing_cell(old, 0, 2),
         existing_cell(old, 1, 0), existing_cell(old, 1, 0), existing_cell(old, 1, 0)],
        existing_row(old, 1), existing_row(old, 2), existing_row(old, 3),
    ])

    normalizer = _normalizer()
    for enemy_id, sheet in list(sheets.items()):
        target_path = ENEMY_DIR / f"{enemy_id}_sheet.png"
        sheets[enemy_id], _ = normalizer.cleanup_chroma_grid(
            sheet, COLS, sheet.height // CELL, target_path,
        )
    return sheets


def frame_foreground_coverage(image: Image.Image) -> list[list[int]]:
    rows = image.height // CELL
    return [
        [
            sum(alpha > 12 for alpha in existing_cell(image, row, col).getchannel("A").get_flattened_data())
            for col in range(COLS)
        ]
        for row in range(rows)
    ]


def validate_foreground_coverage(
    actual: list[list[int]], expected: list[list[int]], required_rows: list[int],
) -> None:
    if actual != expected:
        raise ValueError("rebuilt foreground coverage changed")
    for row in required_rows:
        if row >= len(actual) or any(value <= 0 for value in actual[row]):
            raise ValueError(f"rebuilt row {row} has blank or lost foreground frames")


def recipe_document() -> dict:
    assembled = assemble_sheets()
    canonical_sources = {
        name: {"path": f"/art_sources/combat/task7_normal/{name}", "sha256": file_sha256(SOURCE_DIR / name)}
        for name in CANONICAL_SOURCE_FILES
    }
    archival_sources = {
        name: {"path": f"/art_sources/combat/task7_normal/{name}", "sha256": file_sha256(SOURCE_DIR / name)}
        for name in ARCHIVAL_SOURCE_FILES
    }
    targets = {}
    for enemy_id, image in assembled.items():
        target_path = ENEMY_DIR / f"{enemy_id}_sheet.png"
        targets[enemy_id] = {
            "path": f"/assets/images/combat/spritesheets/enemies/{enemy_id}_sheet.png",
            "width": image.width,
            "height": image.height,
            "pixelSha256": pixel_sha256(image),
            "fileSha256": file_sha256(target_path),
            "foregroundCoverage": frame_foreground_coverage(image),
            "retainedRows": [
                {"targetRow": target_row, "baselineRow": baseline_row}
                for target_row, baseline_row in sorted(ROW_PROVENANCE[enemy_id]["retained"].items())
            ],
            "newRows": [
                {"row": row, "sources": source_names}
                for row, source_names in sorted(ROW_PROVENANCE[enemy_id]["new"].items())
            ],
        }
    return {
        "version": 2,
        "baselineCommit": BASELINE_COMMIT,
        "assemblyScript": "/tools/build_normal_enemy_motion_sheets.py",
        "assemblyScriptSha256": text_sha256(Path(__file__)),
        "provenancePolicy": {
            "canonical": "cleaned alpha PNGs are the sole deterministic assembly inputs",
            "archival": "chroma PNGs are retained image-generation archives; no derivation relationship to canonical alpha PNGs is asserted",
        },
        "canonicalSources": canonical_sources,
        "archivalSources": archival_sources,
        "targets": targets,
    }


def verify_recipe(recipe: dict) -> dict:
    if recipe.get("version") != 2 or recipe.get("baselineCommit") != BASELINE_COMMIT:
        raise ValueError("assembly recipe version or baseline mismatch")
    if text_sha256(Path(__file__)) != recipe["assemblyScriptSha256"]:
        raise ValueError("assembly script hash changed")
    if set(recipe.get("canonicalSources", {})) != set(CANONICAL_SOURCE_FILES):
        raise ValueError("canonical source inventory mismatch")
    if set(recipe.get("archivalSources", {})) != set(ARCHIVAL_SOURCE_FILES):
        raise ValueError("archival source inventory mismatch")
    for source in recipe["canonicalSources"].values():
        verify_source_hash(resolve_repo_path(source["path"]), source["sha256"])
    for source in recipe["archivalSources"].values():
        verify_source_hash(resolve_repo_path(source["path"]), source["sha256"])

    assembled = assemble_sheets()
    if set(recipe.get("targets", {})) != set(assembled):
        raise ValueError("target inventory mismatch")
    for enemy_id, expected in recipe["targets"].items():
        image = assembled[enemy_id]
        target_path = resolve_repo_path(expected["path"])
        actual = Image.open(target_path).convert("RGBA")
        if image.size != (expected["width"], expected["height"]):
            raise ValueError(f"assembled dimensions changed for {enemy_id}")
        if pixel_sha256(image) != expected["pixelSha256"] or pixel_sha256(actual) != expected["pixelSha256"]:
            raise ValueError(f"assembled pixels changed for {enemy_id}")
        if file_sha256(target_path) != expected["fileSha256"]:
            raise ValueError(f"target file hash changed for {enemy_id}")
        validate_foreground_coverage(
            frame_foreground_coverage(actual),
            expected["foregroundCoverage"],
            [entry["row"] for entry in expected["newRows"]],
        )

        baseline = baseline_sheet(enemy_id)
        for mapping in expected["retainedRows"]:
            target_row = mapping["targetRow"]
            baseline_row = mapping["baselineRow"]
            for col in range(COLS):
                if existing_cell(actual, target_row, col).tobytes() != existing_cell(baseline, baseline_row, col).tobytes():
                    raise ValueError(f"retained baseline row changed for {enemy_id}:{target_row}:{col}")

        source_relative = f"assets/images/combat/spritesheets/enemies/{enemy_id}_sheet_src.png"
        if (ROOT / source_relative).read_bytes() != baseline_bytes(source_relative):
            raise ValueError(f"preserved source changed for {enemy_id}")
    return {
        "verifiedTargets": len(assembled),
        "verifiedCanonicalSources": len(recipe["canonicalSources"]),
        "verifiedArchivalSources": len(recipe["archivalSources"]),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write-targets", action="store_true")
    parser.add_argument("--write-recipe", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if sum((args.write_targets, args.write_recipe, args.check)) != 1:
        parser.error("choose exactly one action")
    if args.write_targets:
        for enemy_id, image in assemble_sheets().items():
            image.save(ENEMY_DIR / f"{enemy_id}_sheet.png", optimize=True)
        print(json.dumps({"writtenTargets": len(ROW_PROVENANCE)}))
        return 0
    if args.write_recipe:
        recipe = recipe_document()
        RECIPE_PATH.write_text(json.dumps(recipe, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps({"written": RECIPE_PATH.relative_to(ROOT).as_posix()}))
        return 0
    recipe = json.loads(RECIPE_PATH.read_text(encoding="utf-8"))
    print(json.dumps(verify_recipe(recipe)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

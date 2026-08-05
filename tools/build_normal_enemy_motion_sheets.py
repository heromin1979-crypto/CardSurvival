"""Deterministically assemble and verify Task 7 normal-enemy motion sheets."""
from __future__ import annotations

import argparse
import copy
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
CELL = 256
COLS = 6
ENEMY_DIR = ROOT / "assets/images/combat/spritesheets/enemies"
SOURCE_DIR = ROOT / "art_sources/combat/task7_normal"
RECIPE_PATH = SOURCE_DIR / "assembly_recipe.json"
NORMALIZER_PATH = ROOT / "tools/normalize_combat_sprite_sheets.py"

SOURCE_REPO_DIR = "/art_sources/combat/task7_normal"
CANONICAL_SOURCE_PATHS = {
    name: f"{SOURCE_REPO_DIR}/{name}"
    for name in (
        "raider_generated_alpha.png",
        "raider_elite_generated_alpha.png",
        "zombie_bloater_self_destruct_alpha.png",
        "zombie_screamer_spit_alpha.png",
    )
}
ARCHIVAL_SOURCE_PATHS = {
    name: f"{SOURCE_REPO_DIR}/{name}"
    for name in (
        "raider_generated_chroma.png",
        "raider_elite_generated_chroma.png",
        "zombie_bloater_self_destruct_chroma.png",
        "zombie_screamer_spit_chroma.png",
    )
}
CANONICAL_SOURCE_FILES = tuple(CANONICAL_SOURCE_PATHS)
ARCHIVAL_SOURCE_FILES = tuple(ARCHIVAL_SOURCE_PATHS)


def _cells(source: str, row: int, columns: list[int], source_rows: int | None = None) -> list[dict]:
    cells = [{"source": source, "row": row, "column": column} for column in columns]
    if source_rows is not None:
        for cell in cells:
            cell["sourceRows"] = source_rows
    return cells

ROW_PROVENANCE = {
    "zombie_patient_dormant": {
        "retainedRows": [
            {"targetRow": 1, "baselineRow": 0, "motion": "wake"},
            {"targetRow": 2, "baselineRow": 1, "motion": "basic_attack"},
            {"targetRow": 3, "baselineRow": 2, "motion": "hit"},
            {"targetRow": 4, "baselineRow": 3, "motion": "death"},
        ],
        "newRows": [{
            "row": 0,
            "motion": "dormant",
            "cells": _cells("baseline:zombie_patient_dormant", 0, [0, 1, 0, 1, 0, 1]),
        }],
    },
    "zombie_runner": {
        "retainedRows": [
            {"targetRow": 0, "baselineRow": 0, "motion": "idle"},
            {"targetRow": 3, "baselineRow": 1, "motion": "runner_rush"},
            {"targetRow": 4, "baselineRow": 2, "motion": "hit"},
            {"targetRow": 5, "baselineRow": 3, "motion": "death"},
        ],
        "newRows": [
            {"row": 1, "motion": "basic_attack", "cells": _cells("baseline:zombie_runner", 1, [0, 0, 1, 2, 3, 0])},
            {"row": 2, "motion": "telegraph", "cells": [
                *_cells("baseline:zombie_runner", 0, [0, 1, 2, 3]),
                *_cells("baseline:zombie_runner", 1, [0, 0]),
            ]},
        ],
    },
    "zombie_brute": {
        "retainedRows": [
            {"targetRow": 0, "baselineRow": 0, "motion": "idle"},
            {"targetRow": 3, "baselineRow": 1, "motion": "slam"},
            {"targetRow": 4, "baselineRow": 2, "motion": "hit"},
            {"targetRow": 5, "baselineRow": 3, "motion": "death"},
        ],
        "newRows": [
            {"row": 1, "motion": "basic_attack", "cells": _cells("baseline:zombie_brute", 1, [2, 3, 4, 5, 5, 5])},
            {"row": 2, "motion": "telegraph", "cells": [
                *_cells("baseline:zombie_brute", 0, [5]),
                *_cells("baseline:zombie_brute", 1, [0, 0, 1, 1, 0]),
            ]},
        ],
    },
    "raider": {
        "retainedRows": [
            {"targetRow": 3, "baselineRow": 2, "motion": "hit"},
            {"targetRow": 4, "baselineRow": 3, "motion": "death"},
        ],
        "newRows": [
            {"row": 0, "motion": "idle", "cells": _cells("raider_generated_alpha.png", 0, [0, 5, 0, 5, 0, 5], 2)},
            {"row": 1, "motion": "basic_attack", "cells": _cells("raider_generated_alpha.png", 0, list(range(COLS)), 2)},
            {"row": 2, "motion": "reload", "cells": _cells("raider_generated_alpha.png", 1, list(range(COLS)), 2)},
        ],
    },
    "raider_elite": {
        "retainedRows": [
            {"targetRow": 0, "baselineRow": 0, "motion": "idle"},
            {"targetRow": 4, "baselineRow": 2, "motion": "hit"},
            {"targetRow": 5, "baselineRow": 3, "motion": "death"},
        ],
        "newRows": [
            {"row": 1, "motion": "basic_attack", "cells": [
                *_cells("raider_elite_generated_alpha.png", 0, [0, 1], 2),
                *_cells("raider_elite_generated_alpha.png", 1, [2, 3], 2),
                *_cells("raider_elite_generated_alpha.png", 0, [1, 0], 2),
            ]},
            {"row": 2, "motion": "aim", "cells": _cells("raider_elite_generated_alpha.png", 0, list(range(COLS)), 2)},
            {"row": 3, "motion": "aimed_shot", "cells": _cells("raider_elite_generated_alpha.png", 1, list(range(COLS)), 2)},
        ],
    },
    "zombie_acid": {
        "retainedRows": [
            {"targetRow": 0, "baselineRow": 0, "motion": "idle"},
            {"targetRow": 2, "baselineRow": 1, "motion": "acid_lash"},
            {"targetRow": 3, "baselineRow": 2, "motion": "hit"},
            {"targetRow": 4, "baselineRow": 3, "motion": "death"},
        ],
        "newRows": [{
            "row": 1,
            "motion": "basic_attack",
            "cells": _cells("baseline:zombie_acid", 1, [0, 1, 2, 3, 2, 1]),
        }],
    },
    "zombie_bloater": {
        "retainedRows": [
            {"targetRow": 0, "baselineRow": 0, "motion": "idle"},
            {"targetRow": 1, "baselineRow": 1, "motion": "basic_attack"},
            {"targetRow": 4, "baselineRow": 2, "motion": "hit"},
            {"targetRow": 5, "baselineRow": 3, "motion": "death"},
        ],
        "newRows": [
            {"row": 2, "motion": "charge", "cells": _cells("zombie_bloater_self_destruct_alpha.png", 0, [0, 0, 1, 1, 2, 2], 1)},
            {"row": 3, "motion": "self_destruct", "cells": _cells("zombie_bloater_self_destruct_alpha.png", 0, list(range(COLS)), 1)},
        ],
    },
    "zombie_screamer": {
        "retainedRows": [
            {"targetRow": 0, "baselineRow": 0, "motion": "idle"},
            {"targetRow": 3, "baselineRow": 1, "motion": "summon_horde"},
            {"targetRow": 4, "baselineRow": 2, "motion": "hit"},
            {"targetRow": 5, "baselineRow": 3, "motion": "death"},
        ],
        "newRows": [
            {"row": 1, "motion": "basic_attack", "cells": _cells("zombie_screamer_spit_alpha.png", 0, list(range(COLS)), 1)},
            {"row": 2, "motion": "charge", "cells": [
                *_cells("baseline:zombie_screamer", 0, [0, 1]),
                *_cells("baseline:zombie_screamer", 1, [0, 1, 2, 2]),
            ]},
        ],
    },
    "zombie_charger": {
        "retainedRows": [
            {"targetRow": 0, "baselineRow": 0, "motion": "idle"},
            {"targetRow": 3, "baselineRow": 1, "motion": "charge_strike"},
            {"targetRow": 4, "baselineRow": 2, "motion": "hit"},
            {"targetRow": 5, "baselineRow": 3, "motion": "death"},
        ],
        "newRows": [
            {"row": 1, "motion": "basic_attack", "cells": _cells("baseline:zombie_charger", 1, [0, 0, 1, 2, 2, 0])},
            {"row": 2, "motion": "charge", "cells": [
                *_cells("baseline:zombie_charger", 0, [0, 1, 2]),
                *_cells("baseline:zombie_charger", 1, [0, 0, 0]),
            ]},
        ],
    },
}

BASELINE_SOURCE_PATHS = {
    f"baseline/{enemy_id}_sheet.png": f"{SOURCE_REPO_DIR}/baseline/{enemy_id}_sheet.png"
    for enemy_id in ROW_PROVENANCE
}
PRESERVED_SOURCE_PATHS = {
    f"{enemy_id}_sheet_src.png":
        f"/assets/images/combat/spritesheets/enemies/{enemy_id}_sheet_src.png"
    for enemy_id in ROW_PROVENANCE
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


def baseline_sheet(enemy_id: str) -> Image.Image:
    return Image.open(SOURCE_DIR / "baseline" / f"{enemy_id}_sheet.png").convert("RGBA")


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


def make_sheet(rows: list[list[Image.Image]]) -> Image.Image:
    output = Image.new("RGBA", (COLS * CELL, len(rows) * CELL), (0, 0, 0, 0))
    for row_index, frames in enumerate(rows):
        if len(frames) != COLS:
            raise ValueError(f"row {row_index} has {len(frames)} frames")
        for col_index, frame in enumerate(frames):
            output.alpha_composite(frame, (col_index * CELL, row_index * CELL))
    return output


def _assemble_new_cell(
    enemy_id: str,
    cell: dict,
    baseline: Image.Image,
    generated: dict[str, Image.Image],
) -> Image.Image:
    source = cell["source"]
    if source == f"baseline:{enemy_id}":
        return existing_cell(baseline, cell["row"], cell["column"])
    if source not in generated:
        raise ValueError(f"unknown assembly source for {enemy_id}: {source}")
    return fitted_generated_cell(
        generated[source], cell["row"], cell["column"], cell["sourceRows"],
    )


def assemble_sheets(row_provenance: dict | None = None) -> dict[str, Image.Image]:
    provenance = ROW_PROVENANCE if row_provenance is None else row_provenance
    generated = {
        name: Image.open(SOURCE_DIR / name).convert("RGBA")
        for name in CANONICAL_SOURCE_FILES
    }
    baseline = {enemy_id: baseline_sheet(enemy_id) for enemy_id in provenance}
    sheets: dict[str, Image.Image] = {}
    for enemy_id, metadata in provenance.items():
        rows: dict[int, list[Image.Image]] = {}
        for retained in metadata["retainedRows"]:
            target_row = retained["targetRow"]
            if target_row in rows:
                raise ValueError(f"duplicate assembly row for {enemy_id}:{target_row}")
            rows[target_row] = existing_row(baseline[enemy_id], retained["baselineRow"])
        for new_row in metadata["newRows"]:
            target_row = new_row["row"]
            if target_row in rows:
                raise ValueError(f"duplicate assembly row for {enemy_id}:{target_row}")
            rows[target_row] = [
                _assemble_new_cell(enemy_id, cell, baseline[enemy_id], generated)
                for cell in new_row["cells"]
            ]
        expected_rows = list(range(len(rows)))
        if sorted(rows) != expected_rows:
            raise ValueError(f"assembly rows must be contiguous for {enemy_id}: {sorted(rows)}")
        sheets[enemy_id] = make_sheet([rows[row] for row in expected_rows])

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
        name: {"path": path, "sha256": file_sha256(SOURCE_DIR / name)}
        for name, path in CANONICAL_SOURCE_PATHS.items()
    }
    archival_sources = {
        name: {"path": path, "sha256": file_sha256(SOURCE_DIR / name)}
        for name, path in ARCHIVAL_SOURCE_PATHS.items()
    }
    baseline_sources = {
        name: {"path": path, "sha256": file_sha256(SOURCE_DIR / name)}
        for name, path in BASELINE_SOURCE_PATHS.items()
    }
    preserved_sources = {
        name: {"path": path, "sha256": file_sha256(resolve_repo_path(path))}
        for name, path in PRESERVED_SOURCE_PATHS.items()
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
            "retainedRows": copy.deepcopy(ROW_PROVENANCE[enemy_id]["retainedRows"]),
            "newRows": copy.deepcopy(ROW_PROVENANCE[enemy_id]["newRows"]),
        }
    return {
        "version": 3,
        "baselineSourceSet": "build-only Task 7 source checkout",
        "assemblyScript": "/tools/build_normal_enemy_motion_sheets.py",
        "assemblyScriptSha256": text_sha256(Path(__file__)),
        "provenancePolicy": {
            "canonical": "cleaned alpha PNGs are the sole deterministic assembly inputs",
            "archival": "chroma PNGs are retained image-generation archives; no derivation relationship to canonical alpha PNGs is asserted",
        },
        "canonicalSources": canonical_sources,
        "baselineSources": baseline_sources,
        "archivalSources": archival_sources,
        "preservedSources": preserved_sources,
        "targets": targets,
    }


def _validate_source_mapping(kind: str, actual: object, expected_paths: dict[str, str]) -> None:
    if not isinstance(actual, dict) or list(actual) != list(expected_paths):
        raise ValueError(f"{kind} source inventory mismatch")
    for name, expected_path in expected_paths.items():
        entry = actual[name]
        if not isinstance(entry, dict) or set(entry) != {"path", "sha256"}:
            raise ValueError(f"{kind} source schema mismatch for {name}")
        source_path = resolve_repo_path(entry["path"])
        if entry["path"] != expected_path:
            raise ValueError(f"{kind} source path mismatch for {name}")
        sha256 = entry["sha256"]
        if not isinstance(sha256, str) or len(sha256) != 64:
            raise ValueError(f"{kind} source hash schema mismatch for {name}")
        verify_source_hash(source_path, sha256)


def _normalized_json(value: object) -> object:
    return json.loads(json.dumps(value, ensure_ascii=False))


def validate_recipe_contract(recipe: dict) -> dict:
    if recipe.get("version") != 3 or recipe.get("baselineSourceSet") != "build-only Task 7 source checkout":
        raise ValueError("assembly recipe version or baseline mismatch")
    if recipe.get("assemblyScript") != "/tools/build_normal_enemy_motion_sheets.py":
        raise ValueError("assembly script path mismatch")
    if text_sha256(Path(__file__)) != recipe["assemblyScriptSha256"]:
        raise ValueError("assembly script hash changed")
    _validate_source_mapping("canonical", recipe.get("canonicalSources"), CANONICAL_SOURCE_PATHS)
    _validate_source_mapping("baseline", recipe.get("baselineSources"), BASELINE_SOURCE_PATHS)
    _validate_source_mapping("archival", recipe.get("archivalSources"), ARCHIVAL_SOURCE_PATHS)
    _validate_source_mapping("preserved", recipe.get("preservedSources"), PRESERVED_SOURCE_PATHS)

    targets = recipe.get("targets")
    if not isinstance(targets, dict) or list(targets) != list(ROW_PROVENANCE):
        raise ValueError("target inventory mismatch")
    validated_provenance = {}
    for enemy_id, authoritative in ROW_PROVENANCE.items():
        target = targets[enemy_id]
        target_path = target.get("path")
        resolve_repo_path(target_path)
        expected_target_path = f"/assets/images/combat/spritesheets/enemies/{enemy_id}_sheet.png"
        if target_path != expected_target_path:
            raise ValueError(f"target path mismatch for {enemy_id}")
        actual_metadata = {
            "retainedRows": target.get("retainedRows"),
            "newRows": target.get("newRows"),
        }
        if _normalized_json(actual_metadata) != _normalized_json(authoritative):
            raise ValueError(f"row provenance mismatch for {enemy_id}")
        validated_provenance[enemy_id] = copy.deepcopy(actual_metadata)
    return validated_provenance


def verify_recipe(recipe: dict) -> dict:
    validated_provenance = validate_recipe_contract(recipe)

    assembled = assemble_sheets(validated_provenance)
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
            [entry["row"] for entry in validated_provenance[enemy_id]["newRows"]],
        )

        baseline = baseline_sheet(enemy_id)
        for mapping in validated_provenance[enemy_id]["retainedRows"]:
            target_row = mapping["targetRow"]
            baseline_row = mapping["baselineRow"]
            for col in range(COLS):
                if existing_cell(actual, target_row, col).tobytes() != existing_cell(baseline, baseline_row, col).tobytes():
                    raise ValueError(f"retained baseline row changed for {enemy_id}:{target_row}:{col}")

    return {
        "verifiedTargets": len(assembled),
        "verifiedCanonicalSources": len(recipe["canonicalSources"]),
        "verifiedBaselineSources": len(recipe["baselineSources"]),
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

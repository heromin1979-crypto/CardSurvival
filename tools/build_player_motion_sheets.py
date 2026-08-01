"""Deterministically assemble and verify Task 8 player combat motion sheets."""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
CELL = 256
COLS = 6
ROWS = 8
SOURCE_DIR = ROOT / "art_sources/combat/task8_players"
TARGET_DIR = ROOT / "assets/images/combat/spritesheets"
RECIPE_PATH = SOURCE_DIR / "assembly_recipe.json"
SOURCE_REPO_DIR = "/art_sources/combat/task8_players"
TARGET_REPO_DIR = "/assets/images/combat/spritesheets"

MOTIONS = ("idle", "melee", "ranged", "support", "guard", "move", "hit", "death")

SOURCE_GRIDS = {
    "doctor_f_existing_alpha": ("doctor_f_existing_alpha.png", 6, 4),
    "doctor_f_supplement_alpha": ("doctor_f_supplement_alpha.png", 6, 5),
    "soldier_m_generated_alpha": ("soldier_m_generated_alpha.png", 8, 8),
    "firefighter_m_generated_alpha": ("firefighter_m_generated_alpha.png", 6, 8),
    "homeless_m_generated_alpha": ("homeless_m_generated_alpha.png", 6, 7),
    "homeless_m_guard_alpha": ("homeless_m_guard_alpha.png", 6, 1),
    "homeless_m_move_alpha": ("homeless_m_move_alpha.png", 6, 1),
    "chef_m_generated_alpha": ("chef_m_generated_alpha.png", 6, 7),
    "chef_m_guard_alpha": ("chef_m_guard_alpha.png", 6, 1),
    "chef_m_move_alpha": ("chef_m_move_alpha.png", 6, 1),
    "engineer_m_generated_alpha": ("engineer_m_generated_alpha.png", 6, 8),
    "firefighter_m_death_alpha": ("firefighter_m_death_alpha.png", 6, 1),
    "chef_m_death_alpha": ("chef_m_death_alpha.png", 6, 1),
    "engineer_m_ranged_alpha": ("engineer_m_ranged_alpha.png", 6, 1),
    "engineer_m_support_alpha": ("engineer_m_support_alpha.png", 6, 1),
    "engineer_m_death_alpha": ("engineer_m_death_alpha.png", 6, 1),
    "firefighter_m_melee_alpha": ("firefighter_m_melee_alpha.png", 6, 1),
    "firefighter_m_ranged_alpha": ("firefighter_m_ranged_alpha.png", 6, 1),
    "homeless_m_melee_alpha": ("homeless_m_melee_alpha.png", 6, 1),
    "homeless_m_ranged_alpha": ("homeless_m_ranged_alpha.png", 6, 1),
    "homeless_m_death_alpha": ("homeless_m_death_alpha.png", 6, 1),
}

ARCHIVAL_GRIDS = {
    key.replace("_alpha", "_chroma"): (filename.replace("_alpha", "_chroma"), cols, rows)
    for key, (filename, cols, rows) in SOURCE_GRIDS.items()
}

SOURCE_ROW_FRAME_COUNTS = {
    "soldier_m_generated_alpha": (8, 8, 7, 8, 8, 8, 7, 7),
    "firefighter_m_generated_alpha": (6, 6, 6, 6, 6, 6, 6, 7),
    "homeless_m_generated_alpha": (6, 6, 6, 6, 6, 6, 7),
    "chef_m_generated_alpha": (6, 6, 6, 6, 6, 7, 7),
    "engineer_m_generated_alpha": (7, 7, 7, 7, 7, 7, 7, 7),
}

SIMPLE_ROW_SOURCES = {
    "firefighter_m_death_alpha",
    "chef_m_death_alpha",
    "engineer_m_ranged_alpha",
    "engineer_m_support_alpha",
    "engineer_m_death_alpha",
    "firefighter_m_melee_alpha",
    "firefighter_m_ranged_alpha",
    "homeless_m_melee_alpha",
    "homeless_m_ranged_alpha",
    "homeless_m_death_alpha",
}

EXPLICIT_ROW_BOUNDS = {
    "firefighter_m_death_alpha": (0, 350, 690, 1029, 1368, 1739, 2172),
    "homeless_m_death_alpha": (0, 350, 679, 1034, 1395, 1750, 2172),
}


def _row(source: str, source_row: int, columns: tuple[int, ...] = tuple(range(COLS))) -> dict:
    return {
        "source": source,
        "sourceRow": source_row,
        "sourceColumns": list(columns),
    }


ROW_RECIPES = {
    "doctor_f": [
        _row("doctor_f_existing_alpha", 0),
        _row("doctor_f_existing_alpha", 1),
        _row("doctor_f_supplement_alpha", 0),
        _row("doctor_f_existing_alpha", 2),
        _row("doctor_f_supplement_alpha", 1),
        _row("doctor_f_supplement_alpha", 2),
        _row("doctor_f_supplement_alpha", 3),
        _row("doctor_f_supplement_alpha", 4),
    ],
    "soldier_m": [_row("soldier_m_generated_alpha", row) for row in range(ROWS)],
    "firefighter_m": [
        _row("firefighter_m_generated_alpha", 0),
        _row("firefighter_m_melee_alpha", 0),
        _row("firefighter_m_ranged_alpha", 0),
        *[_row("firefighter_m_generated_alpha", row) for row in range(3, ROWS - 1)],
        _row("firefighter_m_death_alpha", 0),
    ],
    "homeless_m": [
        _row("homeless_m_generated_alpha", 0),
        _row("homeless_m_melee_alpha", 0),
        _row("homeless_m_ranged_alpha", 0),
        _row("homeless_m_generated_alpha", 3),
        _row("homeless_m_guard_alpha", 0),
        _row("homeless_m_move_alpha", 0),
        _row("homeless_m_generated_alpha", 5),
        _row("homeless_m_death_alpha", 0),
    ],
    "chef_m": [
        _row("chef_m_generated_alpha", 0),
        _row("chef_m_generated_alpha", 1),
        _row("chef_m_generated_alpha", 2),
        _row("chef_m_generated_alpha", 3),
        _row("chef_m_guard_alpha", 0),
        _row("chef_m_move_alpha", 0),
        _row("chef_m_generated_alpha", 5),
        _row("chef_m_death_alpha", 0),
    ],
    "engineer_m": [
        _row("engineer_m_generated_alpha", 0),
        _row("engineer_m_generated_alpha", 1),
        _row("engineer_m_ranged_alpha", 0),
        _row("engineer_m_support_alpha", 0),
        _row("engineer_m_generated_alpha", 4),
        _row("engineer_m_generated_alpha", 5),
        _row("engineer_m_generated_alpha", 6),
        _row("engineer_m_death_alpha", 0),
    ],
}


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def text_sha256(path: Path) -> str:
    text = path.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def pixel_sha256(image: Image.Image) -> str:
    return hashlib.sha256(image.convert("RGBA").tobytes()).hexdigest()


def resolve_repo_path(repo_path: str) -> Path:
    if not isinstance(repo_path, str) or not repo_path or repo_path.startswith("//"):
        raise ValueError(f"invalid repository path: {repo_path!r}")
    relative = repo_path[1:] if repo_path.startswith("/") else repo_path
    candidate = (ROOT / relative).resolve()
    try:
        candidate.relative_to(ROOT.resolve())
    except ValueError as exc:
        raise ValueError(f"repository path escapes root: {repo_path}") from exc
    return candidate


def adaptive_row_bounds(mask: np.ndarray, rows: int) -> list[int]:
    """Find quiet horizontal gutters near the nominal generated-sheet boundaries."""
    height = mask.shape[0]
    nominal = height / rows
    projection = mask.sum(axis=1)
    padded = np.pad(projection, (2, 2), mode="edge")
    smoothed = np.convolve(padded, np.ones(5, dtype=np.int64), mode="valid")
    bounds = [0]
    for boundary in range(1, rows):
        target = boundary * nominal
        start = max(bounds[-1] + 8, round(target - nominal * 0.22))
        end = min(height - 8, round(target + nominal * 0.22))
        if start >= end:
            raise ValueError(f"cannot resolve source row boundary {boundary}")
        candidates = np.arange(start, end)
        score = smoothed[start:end] * 1_000 + np.abs(candidates - target)
        bounds.append(int(candidates[int(np.argmin(score))]))
    bounds.append(height)
    return bounds


def local_density(mask: np.ndarray, ys: np.ndarray, xs: np.ndarray) -> np.ndarray:
    integral = np.pad(mask.astype(np.int32), ((1, 0), (1, 0))).cumsum(0).cumsum(1)
    radius = 12
    y0 = np.maximum(0, ys - radius)
    y1 = np.minimum(mask.shape[0], ys + radius + 1)
    x0 = np.maximum(0, xs - radius)
    x1 = np.minimum(mask.shape[1], xs + radius + 1)
    return integral[y1, x1] - integral[y0, x1] - integral[y1, x0] + integral[y0, x0]


def foreground_components(mask: np.ndarray, minimum_area: int = 20) -> list[dict]:
    visited = np.zeros(mask.shape, dtype=bool)
    components = []
    height, width = mask.shape
    for start_y, start_x in zip(*np.nonzero(mask), strict=True):
        if visited[start_y, start_x]:
            continue
        queue = deque([(int(start_y), int(start_x))])
        visited[start_y, start_x] = True
        points_y = []
        points_x = []
        while queue:
            y, x = queue.popleft()
            points_y.append(y)
            points_x.append(x)
            for dy, dx in ((-1, -1), (-1, 0), (-1, 1), (0, -1),
                           (0, 1), (1, -1), (1, 0), (1, 1)):
                ny, nx = y + dy, x + dx
                if (0 <= ny < height and 0 <= nx < width and mask[ny, nx]
                        and not visited[ny, nx]):
                    visited[ny, nx] = True
                    queue.append((ny, nx))
        if len(points_x) >= minimum_area:
            ys = np.asarray(points_y, dtype=np.int32)
            xs = np.asarray(points_x, dtype=np.int32)
            components.append({
                "ys": ys,
                "xs": xs,
                "area": len(points_x),
                "centerX": float((xs.min() + xs.max()) / 2),
                "left": int(xs.min()),
                "right": int(xs.max()) + 1,
            })
    return components


def segment_row_frames(rgba: np.ndarray, frame_count: int) -> list[Image.Image]:
    """Group disconnected effects by frame anchor and split only merged subjects."""
    strong = rgba[:, :, 3] > 12
    height, width = strong.shape
    labels = np.full((height, width), -1, dtype=np.int16)
    centers = np.asarray([(column + 0.5) * width / frame_count for column in range(frame_count)])
    components = foreground_components(strong)
    primary_area = sum(component["area"] for component in components if component["area"] >= 500)
    average_area = max(500.0, primary_area / frame_count)
    spacing = width / frame_count
    for component in components:
        ys = component["ys"]
        xs = component["xs"]
        merged_count = max(1, round(component["area"] / average_area))
        is_merged = merged_count > 1 and component["right"] - component["left"] > spacing * 1.2
        if is_merged:
            nearest = np.abs(xs[:, None] - centers[None, :]).argmin(axis=1)
            labels[ys, xs] = nearest.astype(np.int16)
        else:
            column = int(np.abs(centers - component["centerX"]).argmin())
            labels[ys, xs] = column

    present = [
        column for column in range(frame_count)
        if int((labels == column).sum()) >= 500
    ]
    if len(present) < COLS:
        diagnostics = sorted(
            ((component["area"], round(component["centerX"], 1)) for component in components),
            reverse=True,
        )[:12]
        raise ValueError(
            f"source row has only {len(present)} complete frame groups; components={diagnostics}"
        )
    normalized_labels = np.full(labels.shape, -1, dtype=np.int16)
    for target, source in enumerate(present[:COLS]):
        normalized_labels[labels == source] = target
    labels = normalized_labels

    cells = []
    for column in range(COLS):
        selected = labels == column
        if int(selected.sum()) < 500:
            raise ValueError(f"segmented frame {column} has no primary foreground")
        ys, xs = np.nonzero(selected)
        top, bottom = int(ys.min()), int(ys.max()) + 1
        left, right = int(xs.min()), int(xs.max()) + 1
        crop = np.zeros((bottom - top, right - left, 4), dtype=np.uint8)
        crop_mask = selected[top:bottom, left:right]
        source_crop = rgba[top:bottom, left:right]
        crop[crop_mask] = source_crop[crop_mask]
        cells.append(Image.fromarray(crop, "RGBA"))
    return cells


def component_grid_cells(image: Image.Image, cols: int, rows: int,
                         row_frame_counts: tuple[int, ...] | None = None,
                         required_rows: set[int] | None = None) -> list[list[Image.Image]]:
    """Extract generated frames using adaptive gutters and alpha-mask watershed."""
    rgba = np.asarray(image.convert("RGBA"))
    bounds = adaptive_row_bounds(rgba[:, :, 3] > 12, rows)
    counts = row_frame_counts or tuple(cols for _row in range(rows))
    cells = []
    for row in range(rows):
        if required_rows is not None and row not in required_rows:
            cells.append([Image.new("RGBA", (1, 1)) for _column in range(COLS)])
            continue
        try:
            cells.append(segment_row_frames(rgba[bounds[row]:bounds[row + 1]], counts[row]))
        except ValueError as exc:
            raise ValueError(f"source row {row}: {exc}") from exc
    return cells


def simple_row_cells(image: Image.Image, source_key: str) -> list[list[Image.Image]]:
    rgba = np.asarray(image.convert("RGBA"))
    if source_key in EXPLICIT_ROW_BOUNDS:
        bounds = EXPLICIT_ROW_BOUNDS[source_key]
        if bounds[-1] != image.width:
            raise ValueError(f"explicit row bounds width mismatch: {source_key}")
        return [[image.crop((bounds[column], 0, bounds[column + 1], image.height))
                 for column in range(COLS)]]
    strong = rgba[:, :, 3] > 12
    eroded = strong.copy()
    for _iteration in range(4):
        padded = np.pad(eroded, 1, constant_values=False)
        eroded = np.logical_and.reduce([
            padded[dy:dy + strong.shape[0], dx:dx + strong.shape[1]]
            for dy in range(3)
            for dx in range(3)
        ])
    primary = sorted(
        foreground_components(eroded, minimum_area=500),
        key=lambda component: component["area"],
        reverse=True,
    )[:COLS]
    if len(primary) != COLS:
        raise ValueError("dedicated row erosion did not isolate six body anchors")
    primary.sort(key=lambda component: component["centerX"])
    labels = np.full(strong.shape, -1, dtype=np.int16)
    queue: deque[tuple[int, int]] = deque()
    seeds = []
    for column, component in enumerate(primary):
        density = local_density(strong, component["ys"], component["xs"])
        index = int(np.argmax(density))
        seed = (int(component["ys"][index]), int(component["xs"][index]))
        seeds.append(seed)
        labels[seed] = column
        queue.append(seed)
    while queue:
        y, x = queue.popleft()
        label = labels[y, x]
        for dy, dx in ((-1, -1), (-1, 0), (-1, 1), (0, -1),
                       (0, 1), (1, -1), (1, 0), (1, 1)):
            ny, nx = y + dy, x + dx
            if (0 <= ny < strong.shape[0] and 0 <= nx < strong.shape[1]
                    and strong[ny, nx] and labels[ny, nx] < 0):
                labels[ny, nx] = label
                queue.append((ny, nx))
    unlabeled_y, unlabeled_x = np.nonzero(strong & (labels < 0))
    if len(unlabeled_x):
        seed_x = np.asarray([seed[1] for seed in seeds])
        nearest = np.abs(unlabeled_x[:, None] - seed_x[None, :]).argmin(axis=1)
        labels[unlabeled_y, unlabeled_x] = nearest.astype(np.int16)
    cells = []
    for column in range(COLS):
        selected = labels == column
        ys, xs = np.nonzero(selected)
        if len(xs) < 500:
            raise ValueError(f"dedicated row frame {column} has no complete body")
        top, bottom = int(ys.min()), int(ys.max()) + 1
        left, right = int(xs.min()), int(xs.max()) + 1
        crop = np.zeros((bottom - top, right - left, 4), dtype=np.uint8)
        crop_mask = selected[top:bottom, left:right]
        crop[crop_mask] = rgba[top:bottom, left:right][crop_mask]
        cells.append(Image.fromarray(crop, "RGBA"))
    return [cells]


def fit_cell(cell: Image.Image) -> Image.Image:
    cell = cell.convert("RGBA")
    bbox = cell.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("source cell has no foreground")
    subject = cell.crop(bbox)
    scale = min(236 / subject.width, 238 / subject.height)
    size = (max(1, round(subject.width * scale)), max(1, round(subject.height * scale)))
    subject = subject.resize(size, Image.Resampling.LANCZOS)
    output = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    output.alpha_composite(subject, ((CELL - subject.width) // 2, CELL - subject.height - 8))
    return output


def load_sources() -> dict[str, Image.Image]:
    sources = {}
    for key, (filename, _cols, _rows) in SOURCE_GRIDS.items():
        path = SOURCE_DIR / filename
        if not path.is_file():
            raise ValueError(f"missing canonical source: {path}")
        image = Image.open(path)
        if image.mode != "RGBA":
            image = image.convert("RGBA")
        sources[key] = image
    return sources


def assemble_sheets(row_recipes: dict | None = None) -> dict[str, Image.Image]:
    recipes = ROW_RECIPES if row_recipes is None else row_recipes
    sources = load_sources()
    source_cells = {}
    used_sources = {row["source"] for rows in recipes.values() for row in rows}
    required_source_rows = {
        source: {
            row["sourceRow"]
            for rows in recipes.values()
            for row in rows
            if row["source"] == source
        }
        for source in used_sources
    }
    for key in used_sources:
        image = sources[key]
        try:
            if key in SIMPLE_ROW_SOURCES:
                source_cells[key] = simple_row_cells(image, key)
            else:
                source_cells[key] = component_grid_cells(
                    image,
                    SOURCE_GRIDS[key][1],
                    SOURCE_GRIDS[key][2],
                    SOURCE_ROW_FRAME_COUNTS.get(key),
                    required_source_rows[key],
                )
        except ValueError as exc:
            raise ValueError(f"{key}: {exc}") from exc
    outputs = {}
    for sheet_key, rows in recipes.items():
        if len(rows) != ROWS:
            raise ValueError(f"{sheet_key} must define exactly {ROWS} rows")
        output = Image.new("RGBA", (COLS * CELL, ROWS * CELL), (0, 0, 0, 0))
        for target_row, row_spec in enumerate(rows):
            source_key = row_spec["source"]
            if source_key not in SOURCE_GRIDS:
                raise ValueError(f"unknown source: {source_key}")
            _filename, source_cols, source_rows = SOURCE_GRIDS[source_key]
            columns = row_spec.get("sourceColumns")
            if columns != list(range(COLS)):
                raise ValueError(f"{sheet_key}/{target_row} must select canonical columns 0..5")
            for target_col, source_col in enumerate(columns):
                raw = source_cells[source_key][row_spec["sourceRow"]][source_col]
                output.alpha_composite(fit_cell(raw), (target_col * CELL, target_row * CELL))
        outputs[sheet_key] = output
    return outputs


def foreground_coverage(image: Image.Image) -> list[list[int]]:
    coverage = []
    for row in range(ROWS):
        values = []
        for col in range(COLS):
            cell = image.crop((col * CELL, row * CELL, (col + 1) * CELL, (row + 1) * CELL))
            values.append(sum(alpha > 12 for alpha in cell.getchannel("A").get_flattened_data()))
        coverage.append(values)
    return coverage


def row_frame_hashes(image: Image.Image) -> list[list[str]]:
    return [
        [
            pixel_sha256(image.crop((col * CELL, row * CELL, (col + 1) * CELL, (row + 1) * CELL)))
            for col in range(COLS)
        ]
        for row in range(ROWS)
    ]


def validate_visual_contract(sheet_key: str, image: Image.Image) -> dict:
    if image.size != (COLS * CELL, ROWS * CELL) or image.mode != "RGBA":
        raise ValueError(f"{sheet_key} output must be RGBA 1536x2048")
    coverage = foreground_coverage(image)
    hashes = row_frame_hashes(image)
    for row, values in enumerate(coverage):
        if any(value < 800 for value in values):
            raise ValueError(f"{sheet_key}/{MOTIONS[row]} contains blank or tiny foreground")
        if len(set(hashes[row])) != COLS:
            raise ValueError(f"{sheet_key}/{MOTIONS[row]} must contain six distinct frames")
        for col in range(COLS):
            cell = image.crop((col * CELL, row * CELL, (col + 1) * CELL, (row + 1) * CELL))
            alpha = cell.getchannel("A")
            if alpha.crop((0, 0, CELL, 1)).getbbox() or alpha.crop((0, CELL - 1, CELL, CELL)).getbbox():
                raise ValueError(f"{sheet_key}/{MOTIONS[row]}/{col} clips vertically")
            if alpha.crop((0, 0, 1, CELL)).getbbox() or alpha.crop((CELL - 1, 0, CELL, CELL)).getbbox():
                raise ValueError(f"{sheet_key}/{MOTIONS[row]}/{col} clips horizontally")
    return {"foregroundCoverage": coverage, "framePixelSha256": hashes}


def source_inventory(grids: dict[str, tuple[str, int, int]]) -> dict:
    return {
        key: {
            "path": f"{SOURCE_REPO_DIR}/{filename}",
            "sha256": file_sha256(SOURCE_DIR / filename),
            "cols": cols,
            "rows": rows,
        }
        for key, (filename, cols, rows) in grids.items()
    }


def recipe_document(outputs: dict[str, Image.Image]) -> dict:
    targets = {}
    for sheet_key, image in outputs.items():
        target_path = TARGET_DIR / f"{sheet_key}_sheet.png"
        visual = validate_visual_contract(sheet_key, image)
        targets[sheet_key] = {
            "path": f"{TARGET_REPO_DIR}/{sheet_key}_sheet.png",
            "width": image.width,
            "height": image.height,
            "pixelSha256": pixel_sha256(image),
            "fileSha256": file_sha256(target_path),
            "rows": [
                {"targetRow": index, "motion": MOTIONS[index], **copy.deepcopy(row)}
                for index, row in enumerate(ROW_RECIPES[sheet_key])
            ],
            **visual,
        }
    return {
        "version": 1,
        "assemblyScript": "/tools/build_player_motion_sheets.py",
        "assemblyScriptSha256": text_sha256(Path(__file__)),
        "provenancePolicy": {
            "canonical": "cleaned alpha PNGs are the sole deterministic assembly inputs",
            "archival": "chroma PNGs are retained built-in image-generation archives",
        },
        "canonicalSources": source_inventory(SOURCE_GRIDS),
        "archivalSources": source_inventory(ARCHIVAL_GRIDS),
        "targets": targets,
    }


def normalized(value: object) -> object:
    return json.loads(json.dumps(value, ensure_ascii=False))


def validate_source_inventory(actual: object, authoritative: dict, label: str) -> None:
    expected_keys = list(authoritative)
    if not isinstance(actual, dict) or list(actual) != expected_keys:
        raise ValueError(f"{label} source inventory mismatch")
    for key, (filename, cols, rows) in authoritative.items():
        entry = actual[key]
        expected_path = f"{SOURCE_REPO_DIR}/{filename}"
        if set(entry) != {"path", "sha256", "cols", "rows"}:
            raise ValueError(f"{label} source schema mismatch: {key}")
        if entry["path"] != expected_path or entry["cols"] != cols or entry["rows"] != rows:
            raise ValueError(f"{label} source metadata mismatch: {key}")
        source_path = resolve_repo_path(entry["path"])
        if file_sha256(source_path) != entry["sha256"]:
            raise ValueError(f"{label} source hash changed: {key}")


def validate_recipe(recipe: dict) -> dict[str, list[dict]]:
    if recipe.get("version") != 1:
        raise ValueError("assembly recipe version mismatch")
    if recipe.get("assemblyScript") != "/tools/build_player_motion_sheets.py":
        raise ValueError("assembly script path mismatch")
    if recipe.get("assemblyScriptSha256") != text_sha256(Path(__file__)):
        raise ValueError("assembly script hash changed")
    validate_source_inventory(recipe.get("canonicalSources"), SOURCE_GRIDS, "canonical")
    validate_source_inventory(recipe.get("archivalSources"), ARCHIVAL_GRIDS, "archival")
    targets = recipe.get("targets")
    if not isinstance(targets, dict) or list(targets) != list(ROW_RECIPES):
        raise ValueError("target inventory mismatch")
    validated = {}
    for sheet_key, authoritative_rows in ROW_RECIPES.items():
        target = targets[sheet_key]
        expected_path = f"{TARGET_REPO_DIR}/{sheet_key}_sheet.png"
        if target.get("path") != expected_path:
            raise ValueError(f"target path mismatch: {sheet_key}")
        rows = target.get("rows")
        expected_rows = [
            {"targetRow": index, "motion": MOTIONS[index], **copy.deepcopy(row)}
            for index, row in enumerate(authoritative_rows)
        ]
        if normalized(rows) != normalized(expected_rows):
            raise ValueError(f"row provenance mismatch: {sheet_key}")
        validated[sheet_key] = copy.deepcopy(authoritative_rows)
    return validated


def verify_recipe(recipe: dict) -> None:
    validated_rows = validate_recipe(recipe)
    outputs = assemble_sheets(validated_rows)
    for sheet_key, expected in recipe["targets"].items():
        image = outputs[sheet_key]
        target_path = resolve_repo_path(expected["path"])
        actual = Image.open(target_path).convert("RGBA")
        visual = validate_visual_contract(sheet_key, image)
        if image.size != (expected["width"], expected["height"]):
            raise ValueError(f"dimensions changed: {sheet_key}")
        if pixel_sha256(image) != expected["pixelSha256"]:
            raise ValueError(f"recipe pixel hash changed: {sheet_key}")
        if pixel_sha256(actual) != expected["pixelSha256"]:
            raise ValueError(f"target pixels changed: {sheet_key}")
        if file_sha256(target_path) != expected["fileSha256"]:
            raise ValueError(f"target file hash changed: {sheet_key}")
        if normalized(visual) != normalized({
            "foregroundCoverage": expected["foregroundCoverage"],
            "framePixelSha256": expected["framePixelSha256"],
        }):
            raise ValueError(f"visual QA metrics changed: {sheet_key}")


def write_outputs(recipe_path: Path) -> None:
    outputs = assemble_sheets()
    for sheet_key, image in outputs.items():
        validate_visual_contract(sheet_key, image)
        image.save(TARGET_DIR / f"{sheet_key}_sheet.png", format="PNG", compress_level=9)
    document = recipe_document(outputs)
    recipe_path.parent.mkdir(parents=True, exist_ok=True)
    recipe_path.write_text(json.dumps(document, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(outputs)} player motion sheets and {recipe_path.relative_to(ROOT)}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--recipe", type=Path, default=RECIPE_PATH)
    args = parser.parse_args()
    if args.check == args.write:
        parser.error("choose exactly one of --check or --write")
    recipe_path = args.recipe if args.recipe.is_absolute() else ROOT / args.recipe
    try:
        if args.write:
            write_outputs(recipe_path)
        else:
            verify_recipe(json.loads(recipe_path.read_text(encoding="utf-8")))
            print("verified 6 player motion sheets")
    except (OSError, ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
        print(f"player motion assembly error: {exc}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

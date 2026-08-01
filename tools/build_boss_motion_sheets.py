from __future__ import annotations

import argparse
import hashlib
import json
import tempfile
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "art_sources" / "combat" / "task10_bosses"
RUNTIME_ROOT = ROOT / "assets" / "images" / "combat" / "spritesheets" / "enemies"
REVIEW_ROOT = SOURCE_ROOT / "review_previews"
RECIPE_PATH = SOURCE_ROOT / "assembly_recipe.json"
CONTRACT_PATH = SOURCE_ROOT / "detached_component_contract.json"
SELECTION_PATH = SOURCE_ROOT / "detached_component_selection.json"
ROWS = ("idle", "basic_a", "basic_b", "special", "ultimate", "hit", "charge", "death")
COLS = 6
CELL = 256
ALPHA_THRESHOLD = 12

BOSS_IDS = (
    "boss_patient_zero",
    "boss_radiation_colossus",
    "boss_acid_queen",
    "boss_horde_mother",
    "boss_frozen_giant",
    "boss_raider_warlord",
    "boss_phantom_sniper",
    "boss_cult_leader",
    "boss_mutant_alpha_tiger",
    "boss_sewer_king",
    "boss_swarm_queen_bee",
    "boss_feral_dog_alpha",
    "boss_penthouse_survivor",
    "boss_escaped_experiment",
    "boss_blizzard_wraith",
    "boss_soldier_nemesis",
    "boss_firefighter_nemesis",
    "boss_homeless_nemesis",
    "boss_chef_nemesis",
    "boss_doctor_nemesis",
    "food_warlord",
)

HISTORICAL_IDS = {
    "boss_horde_mother",
    "boss_raider_warlord",
    "boss_feral_dog_alpha",
    "boss_penthouse_survivor",
    "boss_soldier_nemesis",
    "boss_homeless_nemesis",
    "food_warlord",
}

SOURCE_COLS_BY_BOSS = {
    "boss_phantom_sniper": 7,
    "boss_firefighter_nemesis": 7,
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def sha256_pixels(image: Image.Image) -> str:
    return hashlib.sha256(image.convert("RGBA").tobytes()).hexdigest()


def alpha_components(image: Image.Image) -> list[list[int]]:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    alpha = rgba.getchannel("A").tobytes()
    seen = bytearray(width * height)
    components: list[list[int]] = []
    for start, value in enumerate(alpha):
        if value <= ALPHA_THRESHOLD or seen[start]:
            continue
        seen[start] = 1
        component = [start]
        queue = deque([start])
        while queue:
            index = queue.popleft()
            x, y = index % width, index // width
            for nx, ny in (
                (x - 1, y - 1), (x, y - 1), (x + 1, y - 1),
                (x - 1, y), (x + 1, y),
                (x - 1, y + 1), (x, y + 1), (x + 1, y + 1),
            ):
                if nx < 0 or ny < 0 or nx >= width or ny >= height:
                    continue
                neighbor = ny * width + nx
                if alpha[neighbor] > ALPHA_THRESHOLD and not seen[neighbor]:
                    seen[neighbor] = 1
                    component.append(neighbor)
                    queue.append(neighbor)
        components.append(component)
    components.sort(key=lambda component: (-len(component), component[0]))
    return components


def detached_union_descriptor(cell: Image.Image, components: list[list[int]]) -> dict:
    if not components:
        return {
            "componentCount": 0,
            "bbox": None,
            "area": 0,
            "maskSha256": None,
        }
    width, _ = cell.size
    indexes = [index for component in components for index in component]
    xs = [index % width for index in indexes]
    ys = [index // width for index in indexes]
    bbox = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
    mask_width = bbox[2] - bbox[0]
    mask = bytearray(mask_width * (bbox[3] - bbox[1]))
    for index in indexes:
        x, y = index % width, index // width
        mask[(y - bbox[1]) * mask_width + x - bbox[0]] = 1
    return {
        "componentCount": len(components),
        "bbox": list(bbox),
        "area": len(indexes),
        "maskSha256": hashlib.sha256(mask).hexdigest(),
    }


def load_component_contract() -> tuple[dict[tuple[str, str, int], dict], dict]:
    if not CONTRACT_PATH.exists():
        raise FileNotFoundError(
            "missing immutable detached component contract; run the separate authoring tool"
        )
    contract = json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))
    if contract.get("version") != 1 or contract.get("rowContract") != list(ROWS):
        raise ValueError("detached component contract schema mismatch")
    if contract.get("selectionSha256") != sha256_file(SELECTION_PATH):
        raise ValueError("detached component selection drift")
    lookup: dict[tuple[str, str, int], dict] = {}
    for entry in contract.get("frames", []):
        key = (entry.get("bossId"), entry.get("motionKey"), entry.get("col"))
        if key in lookup:
            raise ValueError(f"duplicate detached component contract entry: {key}")
        lookup[key] = entry
    return lookup, contract


def extract_selected_components(
    row_image: Image.Image,
    major: list[int],
    detached: list[list[int]],
    contract_entry: dict | None,
) -> tuple[Image.Image, dict]:
    rgba = row_image.convert("RGBA")
    observed_detached = detached_union_descriptor(rgba, detached)
    if contract_entry is not None:
        expected = contract_entry.get("detached")
        if expected != observed_detached:
            raise ValueError(
                "detached component contract mismatch "
                f"for {contract_entry.get('bossId')}:{contract_entry.get('motionKey')}:"
                f"{contract_entry.get('col')}"
            )
        keep_components = [major, *detached]
    else:
        keep_components = [major]
    width, _ = rgba.size
    kept_indexes = [index for component in keep_components for index in component]
    xs = [index % width for index in kept_indexes]
    ys = [index // width for index in kept_indexes]
    bbox = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
    pixels = bytearray(rgba.tobytes())
    keep = bytearray(rgba.width * rgba.height)
    for index in kept_indexes:
        keep[index] = 1
    for index in range(rgba.width * rgba.height):
        offset = index * 4
        if not keep[index]:
            pixels[offset:offset + 4] = b"\x00\x00\x00\x00"
        elif pixels[offset + 3] == 0:
            pixels[offset:offset + 3] = b"\x00\x00\x00"
    isolated = Image.frombytes("RGBA", rgba.size, bytes(pixels))
    return isolated.crop(bbox), {
        "sourceBbox": list(bbox),
        "majorArea": len(major),
        "preservedDetached": observed_detached if contract_entry is not None else None,
        "removedDetachedComponents": 0 if contract_entry is not None else len(detached),
    }


def component_descriptor(cell: Image.Image, component: list[int]) -> dict:
    width, _ = cell.size
    xs = [index % width for index in component]
    ys = [index // width for index in component]
    bbox = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
    mask = bytearray((bbox[2] - bbox[0]) * (bbox[3] - bbox[1]))
    for index in component:
        x, y = index % width, index // width
        mask[(y - bbox[1]) * (bbox[2] - bbox[0]) + x - bbox[0]] = 1
    return {
        "bbox": list(bbox),
        "area": len(component),
        "maskSha256": hashlib.sha256(mask).hexdigest(),
    }


def remove_exact_chroma_residue(image: Image.Image) -> Image.Image:
    """Remove every high-saturation chroma-green pixel; no component-size exemption is allowed."""
    rgba = image.convert("RGBA").copy()
    pixels = rgba.load()
    removed: set[tuple[int, int]] = set()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            maximum = max(r, g, b)
            minimum = min(r, g, b)
            chroma = maximum - minimum
            saturation = chroma / maximum if maximum else 0
            if chroma == 0:
                hue_degrees = 0
            elif maximum == r:
                hue_degrees = 60 * (((g - b) / chroma) % 6)
            elif maximum == g:
                hue_degrees = 60 * (((b - r) / chroma) + 2)
            else:
                hue_degrees = 60 * (((r - g) / chroma) + 4)
            if (
                a > 0
                and 78 <= hue_degrees <= 162
                and saturation >= 0.72
                and maximum >= 150
            ):
                pixels[x, y] = (0, 0, 0, 0)
                removed.add((x, y))
    if not removed:
        return rgba
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            if a == 0 or a > 200 or g <= max(r, b) + 40:
                continue
            if not any(
                (nx, ny) in removed
                for ny in range(max(0, y - 2), min(rgba.height, y + 3))
                for nx in range(max(0, x - 2), min(rgba.width, x + 3))
            ):
                continue
            neutral = round((r + b) / 2)
            pixels[x, y] = (neutral, neutral, neutral, a)
    return rgba


def source_cell_bounds(source: Image.Image, boss_id: str, row: int, col: int) -> tuple[int, int, int, int]:
    source_cols = SOURCE_COLS_BY_BOSS.get(boss_id, COLS)
    y0 = round(row * source.height / len(ROWS))
    y1 = round((row + 1) * source.height / len(ROWS))
    x0 = round(col * source.width / source_cols)
    x1 = round((col + 1) * source.width / source_cols)
    return x0, y0, x1, y1


def source_row_groups(
    source: Image.Image,
    boss_id: str,
    row: int,
) -> tuple[Image.Image, list[tuple[list[int], list[list[int]]]], int]:
    source_cols = SOURCE_COLS_BY_BOSS.get(boss_id, COLS)
    y0 = round(row * source.height / len(ROWS))
    y1 = round((row + 1) * source.height / len(ROWS))
    row_image = source.crop((0, y0, source.width, y1)).convert("RGBA")
    row_components = alpha_components(row_image)
    component_by_index: dict[int, int] = {}
    for component_id, component in enumerate(row_components):
        for index in component:
            component_by_index[index] = component_id

    def mapped_component(local: list[int], cell_width: int, x0: int) -> list[int]:
        return [
            (index // cell_width) * row_image.width + x0 + index % cell_width
            for index in local
        ]

    def expanded_component(mapped: list[int], x0: int, x1: int, main: bool) -> list[int]:
        votes: dict[int, int] = {}
        for index in mapped:
            component_id = component_by_index.get(index)
            if component_id is not None:
                votes[component_id] = votes.get(component_id, 0) + 1
        if not votes:
            return mapped
        candidate = row_components[max(votes, key=votes.get)]
        xs = [index % row_image.width for index in candidate]
        width = x1 - x0
        center = (min(xs) + max(xs) + 1) / 2
        max_width = width * (1.75 if main else 1.5)
        center_margin = width * 0.35 if main else 0
        if max(xs) + 1 - min(xs) > max_width:
            return mapped
        if center < x0 - center_margin or center > x1 + center_margin:
            return mapped
        return candidate

    groups: list[tuple[list[int], list[list[int]]]] = []
    used_main: set[tuple[tuple[int, ...], str]] = set()
    for col in range(COLS):
        x0 = round(col * source.width / source_cols)
        x1 = round((col + 1) * source.width / source_cols)
        cell = row_image.crop((x0, 0, x1, row_image.height))
        components = alpha_components(cell)
        if not components:
            raise ValueError(f"empty source cell {boss_id}:{ROWS[row]}:{col}")
        mapped_major = mapped_component(components[0], cell.width, x0)
        major = expanded_component(
            mapped_major,
            x0,
            x1,
            True,
        )
        expanded_descriptor = component_descriptor(row_image, major)
        expanded_identity = (
            tuple(expanded_descriptor["bbox"]),
            expanded_descriptor["maskSha256"],
        )
        if expanded_identity in used_main:
            major = mapped_major
            expanded_descriptor = component_descriptor(row_image, major)
            expanded_identity = (
                tuple(expanded_descriptor["bbox"]),
                expanded_descriptor["maskSha256"],
            )
        used_main.add(expanded_identity)
        detached = []
        major_descriptor = expanded_descriptor
        seen = {(tuple(major_descriptor["bbox"]), major_descriptor["maskSha256"])}
        for component in components[1:]:
            candidate = expanded_component(
                mapped_component(component, cell.width, x0),
                x0,
                x1,
                False,
            )
            descriptor = component_descriptor(row_image, candidate)
            fingerprint = (tuple(descriptor["bbox"]), descriptor["maskSha256"])
            if fingerprint not in seen:
                detached.append(candidate)
                seen.add(fingerprint)
        detached.sort(key=lambda component: (-len(component), component[0]))
        groups.append((major, detached))
    return row_image, groups, y0


def source_cells(
    source: Image.Image,
    boss_id: str,
    contract: dict[tuple[str, str, int], dict],
) -> list[tuple[Image.Image, dict]]:
    cells: list[tuple[Image.Image, dict]] = []
    for row in range(len(ROWS)):
        row_image, groups, row_y0 = source_row_groups(source, boss_id, row)
        for col in range(COLS):
            x0, y0, x1, y1 = source_cell_bounds(source, boss_id, row, col)
            entry = contract.get((boss_id, ROWS[row], col))
            major_component, detached_components = groups[col]
            major, evidence = extract_selected_components(
                row_image,
                major_component,
                detached_components,
                entry,
            )
            evidence["sourceBbox"][1] += row_y0
            evidence["sourceBbox"][3] += row_y0
            evidence.update({
                "row": row,
                "col": col,
                "sourceCell": [x0, y0, x1, y1],
                "sourceColumns": SOURCE_COLS_BY_BOSS.get(boss_id, COLS),
                "detachedContract": entry is not None,
            })
            cells.append((major, evidence))
    return cells


def normalize_cells(cells: list[tuple[Image.Image, dict]]) -> tuple[Image.Image, list[dict]]:
    max_width = max(image.width for image, _ in cells)
    max_height = max(image.height for image, _ in cells)
    scale = min(228 / max_width, 228 / max_height)
    sheet = Image.new("RGBA", (COLS * CELL, len(ROWS) * CELL), (0, 0, 0, 0))
    evidence_rows: list[dict] = []
    for index, (image, evidence) in enumerate(cells):
        row, col = divmod(index, COLS)
        target_size = (
            max(1, round(image.width * scale)),
            max(1, round(image.height * scale)),
        )
        normalized = remove_exact_chroma_residue(
            image.resize(target_size, Image.Resampling.LANCZOS)
        )
        if not alpha_components(normalized):
            raise ValueError(f"resize erased frame {row}:{col}")
        normalized_pixels = bytearray(normalized.tobytes())
        for offset in range(0, len(normalized_pixels), 4):
            if normalized_pixels[offset + 3] == 0:
                normalized_pixels[offset:offset + 3] = b"\x00\x00\x00"
        normalized = Image.frombytes("RGBA", normalized.size, bytes(normalized_pixels))
        x = col * CELL + (CELL - normalized.width) // 2
        y = row * CELL + CELL - 12 - normalized.height
        sheet.alpha_composite(normalized, (x, y))
        evidence_rows.append({
            **evidence,
            "targetBbox": [x - col * CELL, y - row * CELL, x - col * CELL + normalized.width, y - row * CELL + normalized.height],
        })
    sanitized = bytearray(sheet.tobytes())
    for offset in range(0, len(sanitized), 4):
        if sanitized[offset + 3] == 0:
            sanitized[offset:offset + 3] = b"\x00\x00\x00"
    return Image.frombytes("RGBA", sheet.size, bytes(sanitized)), evidence_rows


def inspect_sheet(image: Image.Image) -> dict:
    if image.size != (1536, 2048) or image.mode != "RGBA":
        raise ValueError(f"runtime contract mismatch: {image.mode} {image.size}")
    pixels = image.tobytes()
    hidden_rgb = 0
    strict_green = 0
    frames = []
    for offset in range(0, len(pixels), 4):
        r, g, b, a = pixels[offset:offset + 4]
        if a == 0 and (r or g or b):
            hidden_rgb += 1
        if a > 0 and r == 0 and g == 255 and b == 0:
            strict_green += 1
    for row in range(len(ROWS)):
        row_hashes = []
        for col in range(COLS):
            frame = image.crop((col * CELL, row * CELL, (col + 1) * CELL, (row + 1) * CELL))
            bounds = frame.getchannel("A").point(lambda value: 255 if value > ALPHA_THRESHOLD else 0).getbbox()
            if bounds is None:
                raise ValueError(f"empty runtime frame {row}:{col}")
            if bounds[0] == 0 or bounds[1] == 0 or bounds[2] == CELL or bounds[3] == CELL:
                raise ValueError(f"runtime frame touches edge {row}:{col}: {bounds}")
            components = alpha_components(frame)
            row_hashes.append(sha256_pixels(frame))
            frames.append({
                "row": row,
                "col": col,
                "bbox": list(bounds),
                "pixelSha256": row_hashes[-1],
                "components": [component_descriptor(frame, component) for component in components],
            })
        if len(set(row_hashes)) != COLS:
            raise ValueError(f"duplicate frame in row {row}")
    basic_a = sha256_pixels(image.crop((0, CELL, image.width, CELL * 2)))
    basic_b = sha256_pixels(image.crop((0, CELL * 2, image.width, CELL * 3)))
    if basic_a == basic_b:
        raise ValueError("basic_a and basic_b rows are duplicates")
    if hidden_rgb or strict_green:
        raise ValueError(f"pixel sanitation failed hiddenRgb={hidden_rgb} strictGreen={strict_green}")
    return {"frames": frames, "hiddenRgb": hidden_rgb, "strictGreen": strict_green}


def load_font(size: int) -> ImageFont.ImageFont:
    for candidate in (Path("C:/Windows/Fonts/consola.ttf"), Path("C:/Windows/Fonts/arial.ttf")):
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def checker(size: tuple[int, int]) -> Image.Image:
    image = Image.new("RGB", size, (22, 26, 28))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], 16):
        for x in range(0, size[0], 16):
            if (x // 16 + y // 16) % 2:
                draw.rectangle((x, y, x + 15, y + 15), fill=(30, 35, 38))
    return image


def write_review_board(boss_id: str, sheet: Image.Image, path: Path) -> None:
    board = Image.new("RGB", (1810, 2120), (10, 12, 14))
    draw = ImageDraw.Draw(board)
    font = load_font(22)
    draw.text((18, 15), boss_id, fill=(220, 226, 226), font=font)
    for row, motion_key in enumerate(ROWS):
        draw.text((18, 62 + row * CELL + 112), motion_key, fill=(200, 168, 96), font=font)
    bg = checker(sheet.size)
    bg.paste(sheet, (0, 0), sheet)
    board.paste(bg, (250, 62))
    path.parent.mkdir(parents=True, exist_ok=True)
    board.save(path, format="PNG", compress_level=9)


def write_contact(previews: list[tuple[str, Path]], path: Path) -> None:
    thumb_size = (408, 544)
    cols = 3
    rows = (len(previews) + cols - 1) // cols
    canvas = Image.new("RGB", (cols * 440, rows * 590), (8, 10, 12))
    draw = ImageDraw.Draw(canvas)
    font = load_font(16)
    for index, (boss_id, preview_path) in enumerate(previews):
        x = (index % cols) * 440 + 16
        y = (index // cols) * 590 + 12
        runtime = Image.open(preview_path).convert("RGB").crop((250, 62, 1786, 2110)).resize(thumb_size, Image.Resampling.LANCZOS)
        canvas.paste(runtime, (x, y + 28))
        draw.text((x, y), boss_id, fill=(210, 220, 220), font=font)
    path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(path, format="PNG", compress_level=9)


def write_source_contact(path: Path) -> None:
    thumb_size = (360, 480)
    cols = 3
    rows = (len(BOSS_IDS) + cols - 1) // cols
    canvas = Image.new("RGB", (cols * 392, rows * 526), (8, 10, 12))
    draw = ImageDraw.Draw(canvas)
    font = load_font(15)
    for index, boss_id in enumerate(BOSS_IDS):
        source = Image.open(SOURCE_ROOT / f"{boss_id}_chroma.png").convert("RGB")
        x = (index % cols) * 392 + 12
        y = (index // cols) * 526 + 10
        canvas.paste(source.resize(thumb_size, Image.Resampling.LANCZOS), (x, y + 24))
        draw.text((x, y), boss_id, fill=(210, 220, 220), font=font)
    path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(path, format="PNG", compress_level=9)


def component_report() -> dict:
    report = {"version": 1, "bosses": {}}
    for boss_id in BOSS_IDS:
        source = Image.open(SOURCE_ROOT / f"{boss_id}_alpha.png").convert("RGBA")
        records = []
        for row in range(len(ROWS)):
            y0 = round(row * source.height / len(ROWS))
            y1 = round((row + 1) * source.height / len(ROWS))
            for col in range(COLS):
                x0, y0, x1, y1 = source_cell_bounds(source, boss_id, row, col)
                cell = source.crop((x0, y0, x1, y1))
                components = alpha_components(cell)
                records.append({
                    "row": row,
                    "motionKey": ROWS[row],
                    "col": col,
                    "components": [component_descriptor(cell, component) for component in components],
                })
        report["bosses"][boss_id] = {
            "sourceSha256": sha256_file(SOURCE_ROOT / f"{boss_id}_alpha.png"),
            "frames": records,
        }
    return report


def build_outputs(destination_root: Path, review_root: Path) -> tuple[dict, list[tuple[str, Path]]]:
    contract_lookup, contract_document = load_component_contract()
    targets = {}
    previews = []
    for boss_id in BOSS_IDS:
        alpha_path = SOURCE_ROOT / f"{boss_id}_alpha.png"
        chroma_path = SOURCE_ROOT / f"{boss_id}_chroma.png"
        if not alpha_path.exists() or not chroma_path.exists():
            raise FileNotFoundError(f"missing canonical source for {boss_id}")
        source = Image.open(alpha_path).convert("RGBA")
        if contract_document["sources"].get(boss_id) != sha256_file(alpha_path):
            raise ValueError(f"{boss_id} source hash differs from detached component contract")
        try:
            sheet, assembly = normalize_cells(source_cells(source, boss_id, contract_lookup))
            quality = inspect_sheet(sheet)
        except ValueError as error:
            raise ValueError(f"{boss_id}: {error}") from error
        runtime_path = destination_root / f"{boss_id}_sheet.png"
        runtime_path.parent.mkdir(parents=True, exist_ok=True)
        sheet.save(runtime_path, format="PNG", compress_level=9)
        preview_path = review_root / f"{boss_id}_review.png"
        write_review_board(boss_id, sheet, preview_path)
        targets[boss_id] = {
            "path": f"/assets/images/combat/spritesheets/enemies/{boss_id}_sheet.png",
            "width": sheet.width,
            "height": sheet.height,
            "fileSha256": sha256_file(runtime_path),
            "pixelSha256": sha256_pixels(sheet),
            "sourceAlphaPath": f"/art_sources/combat/task10_bosses/{boss_id}_alpha.png",
            "sourceAlphaSha256": sha256_file(alpha_path),
            "sourceChromaPath": f"/art_sources/combat/task10_bosses/{boss_id}_chroma.png",
            "sourceChromaSha256": sha256_file(chroma_path),
            "assembly": assembly,
            "quality": quality,
        }
        previews.append((boss_id, preview_path))
    return targets, previews


def recipe_for(targets: dict, contact_path: Path, previews: list[tuple[str, Path]]) -> dict:
    script_path = Path(__file__).resolve()
    historical = []
    for boss_id in sorted(HISTORICAL_IDS):
        baseline = SOURCE_ROOT / f"{boss_id}_task6_after.png"
        historical.append({
            "bossId": boss_id,
            "path": f"/art_sources/combat/task10_bosses/{baseline.name}",
            "sha256": sha256_file(baseline),
        })
    return {
        "version": 1,
        "mode": "built-in image_gen chroma-key sources; no CLI/API fallback",
        "assemblyScript": "/tools/build_boss_motion_sheets.py",
        "assemblyScriptSha256": sha256_file(script_path),
        "detachedComponentContract": {
            "path": "/art_sources/combat/task10_bosses/detached_component_contract.json",
            "sha256": sha256_file(CONTRACT_PATH),
            "selectionPath": "/art_sources/combat/task10_bosses/detached_component_selection.json",
            "selectionSha256": sha256_file(SELECTION_PATH),
        },
        "rowContract": list(ROWS),
        "bossIds": list(BOSS_IDS),
        "historicalBaselines": historical,
        "targets": targets,
        "previews": [
            {
                "bossId": boss_id,
                "path": f"/art_sources/combat/task10_bosses/review_previews/{preview_path.name}",
                "sha256": sha256_file(preview_path),
            }
            for boss_id, preview_path in previews
        ],
        "contact": {
            "path": "/art_sources/combat/task10_bosses/boss_motion_contact_sheet.png",
            "sha256": sha256_file(contact_path),
        },
    }


def check_recipe() -> None:
    recipe = json.loads(RECIPE_PATH.read_text(encoding="utf-8"))
    if recipe.get("bossIds") != list(BOSS_IDS) or recipe.get("rowContract") != list(ROWS):
        raise ValueError("recipe roster/row contract mismatch")
    if recipe.get("assemblyScriptSha256") != sha256_file(Path(__file__).resolve()):
        raise ValueError("assembly script SHA-256 mismatch")
    contract_recipe = recipe.get("detachedComponentContract", {})
    if contract_recipe.get("sha256") != sha256_file(CONTRACT_PATH):
        raise ValueError("detached component contract SHA-256 mismatch")
    if contract_recipe.get("selectionSha256") != sha256_file(SELECTION_PATH):
        raise ValueError("detached component selection SHA-256 mismatch")
    with tempfile.TemporaryDirectory(prefix="boss-motion-check-") as temp:
        temp_root = Path(temp)
        targets, previews = build_outputs(temp_root / "runtime", temp_root / "review")
        contact = temp_root / "contact.png"
        write_contact(previews, contact)
        for boss_id in BOSS_IDS:
            expected = recipe["targets"][boss_id]
            actual = targets[boss_id]
            for field in ("fileSha256", "pixelSha256", "sourceAlphaSha256", "sourceChromaSha256"):
                if expected.get(field) != actual.get(field):
                    raise ValueError(f"{boss_id} {field} mismatch")
            runtime_path = RUNTIME_ROOT / f"{boss_id}_sheet.png"
            if not runtime_path.exists() or sha256_file(runtime_path) != expected["fileSha256"]:
                raise ValueError(f"{boss_id} runtime drift")
        if recipe["contact"]["sha256"] != sha256_file(contact):
            raise ValueError("contact sheet drift")
    print(f"{len(BOSS_IDS)} deterministic boss targets verified")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build semantic 6x8 boss motion sheets")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true")
    mode.add_argument("--check", action="store_true")
    mode.add_argument("--source-contact", action="store_true")
    mode.add_argument("--component-report", action="store_true")
    args = parser.parse_args()
    if args.source_contact:
        output = SOURCE_ROOT / "boss_source_contact_sheet.png"
        write_source_contact(output)
        print(output)
        return
    if args.component_report:
        print(json.dumps(component_report(), ensure_ascii=False, indent=2))
        return
    if args.check:
        check_recipe()
        return
    targets, previews = build_outputs(RUNTIME_ROOT, REVIEW_ROOT)
    contact = SOURCE_ROOT / "boss_motion_contact_sheet.png"
    write_contact(previews, contact)
    recipe = recipe_for(targets, contact, previews)
    RECIPE_PATH.write_text(json.dumps(recipe, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(targets)} semantic boss sheets")


if __name__ == "__main__":
    main()

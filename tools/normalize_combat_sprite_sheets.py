from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import posixpath
import subprocess
from dataclasses import dataclass
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SPRITE_ROOT = ROOT / "assets" / "images" / "combat" / "spritesheets"
MANIFEST_PATH = SPRITE_ROOT / "manifest.json"
ALPHA_THRESHOLD = 12
CHROMA_ALPHA_THRESHOLD = 200
CHROMA_ALPHA_MIN = 0
PADDING = 6
CHROMA_HUE_MIN = 78
CHROMA_HUE_MAX = 162
CHROMA_SATURATION_MIN = 0.72
CHROMA_VALUE_MIN = 150
BOUNDARY_GREEN_SATURATION_MIN = 0.35
BOUNDARY_GREEN_VALUE_MIN = 80
STRICT_BOUNDARY_SHEETS = {"boss_feral_dog_alpha", "boss_chef_nemesis"}
ISOLATED_CHROMA_COMPONENT_AREA = 12
CHROMA_COMPONENT_ALLOWLIST_PATH = Path(os.environ.get("COMBAT_CHROMA_ALLOWLIST_PATH", SPRITE_ROOT / "chroma_component_allowlist.json"))
ALLOWLIST_VERSION = 1
ALLOWLIST_REQUIRED_FIELDS = {
    "sheetKey", "path", "row", "col", "bbox", "pixelCount", "fingerprint", "reason",
}


@dataclass(frozen=True)
class Grid:
    cols: int
    rows: int
    cell_width: int
    cell_height: int

    @property
    def target_size(self) -> tuple[int, int]:
        return self.cols * self.cell_width, self.rows * self.cell_height


def display_sheets() -> list[Path]:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return sorted(ROOT / sheet["src"].lstrip("/") for sheet in manifest.values())


def _normalized_asset_path(value: str) -> str:
    if not isinstance(value, str) or not value.startswith("/") or "\\" in value:
        raise ValueError("allowlist: schema mismatch (path)")
    normalized = "/" + posixpath.normpath(value.lstrip("/"))
    if normalized != value or normalized == "/." or value.startswith("//"):
        raise ValueError("allowlist: schema mismatch (path)")
    return normalized


def manifest_sheet_entries() -> list[tuple[str, str, dict]]:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return [(key, _normalized_asset_path(entry["src"]), entry) for key, entry in manifest.items()]


def sheet_identity_for_path(path: Path) -> tuple[str, str, dict]:
    relative = _normalized_asset_path("/" + path.resolve().relative_to(ROOT.resolve()).as_posix())
    matches = [(key, source, entry) for key, source, entry in manifest_sheet_entries() if source == relative]
    if len(matches) != 1:
        raise ValueError(f"{relative} must map to exactly one manifest sheet")
    return matches[0]


def grid_for(path: Path, image: Image.Image | None = None) -> Grid:
    _, _, sheet = sheet_identity_for_path(path)
    source = image if image is not None else Image.open(path)
    width, height = source.size
    cols, rows = sheet["cols"], sheet["rows"]
    if width % cols or height % rows:
        raise ValueError(f"{path} size {source.size} is not divisible by {cols}x{rows}")
    return Grid(cols, rows, width // cols, height // rows)


def _hue_and_saturation(r: int, g: int, b: int) -> tuple[float, float, int]:
    maximum = max(r, g, b)
    minimum = min(r, g, b)
    if maximum == 0:
        return 0.0, 0.0, 0
    chroma = maximum - minimum
    saturation = chroma / maximum
    if chroma == 0:
        return 0.0, saturation, maximum
    if maximum == r:
        hue = 60 * (((g - b) / chroma) % 6)
    elif maximum == g:
        hue = 60 * (((b - r) / chroma) + 2)
    else:
        hue = 60 * (((r - g) / chroma) + 4)
    return hue, saturation, maximum


def is_green_screen_pixel(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a <= CHROMA_ALPHA_MIN:
        return False
    hue, saturation, value = _hue_and_saturation(r, g, b)
    return CHROMA_HUE_MIN <= hue <= CHROMA_HUE_MAX and saturation >= CHROMA_SATURATION_MIN and value >= CHROMA_VALUE_MIN


def _is_opaque_chroma(pixel: tuple[int, int, int, int]) -> bool:
    """Background flood-fill starts from opaque key colour; low-alpha spill is decontaminated."""
    return pixel[3] > CHROMA_ALPHA_THRESHOLD and is_green_screen_pixel(pixel)


def _edge_connected_chroma(image: Image.Image) -> set[int]:
    width, height = image.size
    pixels = image.load()
    connected: set[int] = set()
    stack = []
    for x in range(width):
        stack.extend(((x, 0), (x, height - 1)))
    for y in range(height):
        stack.extend(((0, y), (width - 1, y)))

    while stack:
        x, y = stack.pop()
        index = y * width + x
        if index in connected or not _is_opaque_chroma(pixels[x, y]):
            continue
        connected.add(index)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                stack.append((nx, ny))
    return connected


def _component_fingerprint(image: Image.Image, indices: list[int], bbox: tuple[int, int, int, int]) -> str:
    """Fingerprint an isolated component relative to its cell, including its source RGBA."""
    pixels = image.load()
    min_x, min_y, _, _ = bbox
    digest = hashlib.sha256()
    for index in sorted(indices):
        x, y = index % image.width, index // image.width
        digest.update(bytes((x - min_x, y - min_y, *pixels[x, y])))
    return digest.hexdigest()


def _isolated_chroma_components(image: Image.Image, excluded: set[int] | None = None) -> list[dict]:
    width, height = image.size
    pixels = image.load()
    excluded = excluded or set()
    seen: set[int] = set()
    components: list[dict] = []
    for y in range(height):
        for x in range(width):
            start = y * width + x
            if start in seen or start in excluded or not _is_opaque_chroma(pixels[x, y]):
                continue
            seen.add(start)
            component = []
            stack = [(x, y)]
            while stack:
                cx, cy = stack.pop()
                index = cy * width + cx
                component.append(index)
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if not (0 <= nx < width and 0 <= ny < height):
                        continue
                    neighbor = ny * width + nx
                    if neighbor in seen or neighbor in excluded or not _is_opaque_chroma(pixels[nx, ny]):
                        continue
                    seen.add(neighbor)
                    stack.append((nx, ny))
            if len(component) <= ISOLATED_CHROMA_COMPONENT_AREA:
                xs = [index % width for index in component]
                ys = [index // width for index in component]
                bbox = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
                components.append({
                    "indices": component,
                    "bbox": list(bbox),
                    "pixelCount": len(component),
                    "fingerprint": _component_fingerprint(image, component, bbox),
                })
    return components


def _component_spec_matches(component: dict, spec: dict) -> bool:
    return (
        component["bbox"] == spec["bbox"]
        and component["pixelCount"] == spec["pixelCount"]
        and component["fingerprint"] == spec["fingerprint"]
    )


def _allowlist_location(spec: dict) -> tuple[str, str, int, int]:
    return spec["sheetKey"], spec["path"], spec["row"], spec["col"]


def _allowlist_descriptor(spec: dict) -> tuple[tuple[int, ...], int, str]:
    return tuple(spec["bbox"]), spec["pixelCount"], spec["fingerprint"]


def _is_json_integer(value: object) -> bool:
    return isinstance(value, int) and not isinstance(value, bool)


def _validate_allowlist_schema(data: object) -> list[dict]:
    if (not isinstance(data, dict)
            or set(data) != {"version", "components"}
            or not _is_json_integer(data["version"])
            or data["version"] != ALLOWLIST_VERSION
            or not isinstance(data["components"], list)):
        raise ValueError("allowlist: schema mismatch (root)")
    components = data["components"]
    for spec in components:
        if not isinstance(spec, dict) or set(spec) != ALLOWLIST_REQUIRED_FIELDS:
            raise ValueError("allowlist: schema mismatch (component fields)")
        if not isinstance(spec["sheetKey"], str) or not spec["sheetKey"]:
            raise ValueError("allowlist: schema mismatch (sheetKey)")
        spec["path"] = _normalized_asset_path(spec["path"])
        if not _is_json_integer(spec["row"]) or not _is_json_integer(spec["col"]) or spec["row"] < 0 or spec["col"] < 0:
            raise ValueError("allowlist: schema mismatch (cell)")
        if not isinstance(spec["bbox"], list) or len(spec["bbox"]) != 4 or any(not _is_json_integer(value) or value < 0 for value in spec["bbox"]):
            raise ValueError("allowlist: schema mismatch (bbox)")
        if spec["bbox"][0] >= spec["bbox"][2] or spec["bbox"][1] >= spec["bbox"][3]:
            raise ValueError("allowlist: schema mismatch (bbox)")
        if not _is_json_integer(spec["pixelCount"]) or not 0 < spec["pixelCount"] <= ISOLATED_CHROMA_COMPONENT_AREA:
            raise ValueError("allowlist: schema mismatch (pixelCount)")
        if not isinstance(spec["fingerprint"], str) or len(spec["fingerprint"]) != 64 or any(char not in "0123456789abcdef" for char in spec["fingerprint"]):
            raise ValueError("allowlist: schema mismatch (fingerprint)")
        if not isinstance(spec["reason"], str) or not spec["reason"].strip():
            raise ValueError("allowlist: schema mismatch (reason)")
    return components


def component_allowlist() -> list[dict]:
    if not CHROMA_COMPONENT_ALLOWLIST_PATH.exists():
        raise ValueError("allowlist: missing")
    try:
        data = json.loads(CHROMA_COMPONENT_ALLOWLIST_PATH.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as error:
        raise ValueError("allowlist: malformed JSON") from error
    return _validate_allowlist_schema(data)


def component_specs_for(sheet_key: str, path: Path, row: int, col: int, allowlist: list[dict]) -> list[dict]:
    relative = _normalized_asset_path("/" + path.resolve().relative_to(ROOT.resolve()).as_posix())
    return [
        entry for entry in allowlist
        if _allowlist_location(entry) == (sheet_key, relative, row, col)
    ]


def allowlist_manifest_diagnostics(allowlist: list[dict]) -> list[dict]:
    manifest = manifest_sheet_entries()
    diagnostics: list[dict] = []
    seen: set[tuple] = set()
    for spec in allowlist:
        identity = (*_allowlist_location(spec), *_allowlist_descriptor(spec))
        location = ":".join(map(str, _allowlist_location(spec)))
        if identity in seen:
            diagnostics.append({"code": "duplicate", "location": location})
            continue
        seen.add(identity)
        matches = [(key, source, entry) for key, source, entry in manifest if (key, source) == (spec["sheetKey"], spec["path"])]
        if len(matches) != 1 or spec["row"] >= matches[0][2]["rows"] or spec["col"] >= matches[0][2]["cols"]:
            diagnostics.append({"code": "orphan", "location": location})
    return diagnostics


def validate_component_allowlist() -> list[dict]:
    allowlist = component_allowlist()
    diagnostics = allowlist_manifest_diagnostics(allowlist)
    if diagnostics:
        return diagnostics
    for spec in allowlist:
        sheet_key, _, entry = next(item for item in manifest_sheet_entries() if (item[0], item[1]) == (spec["sheetKey"], spec["path"]))
        image_path = ROOT / entry["src"].lstrip("/")
        image = Image.open(image_path).convert("RGBA")
        grid = grid_for(image_path, image)
        box = _frame_boxes(image, grid.cols, grid.rows)[spec["row"] * grid.cols + spec["col"]]
        components = _isolated_chroma_components(image.crop(box), _edge_connected_chroma(image.crop(box)))
        if any(_component_spec_matches(component, spec) for component in components):
            continue
        diagnostics.append({"code": "stale" if components else "unconsumed", "location": ":".join(map(str, _allowlist_location(spec)))})
    return diagnostics


def allowlist_diagnostics_or_error() -> list[dict]:
    try:
        return validate_component_allowlist()
    except ValueError as error:
        return [{"code": "invalid", "location": str(error)}]


def _partition_isolated_components(image: Image.Image, excluded: set[int], specs: list[dict]) -> tuple[list[dict], list[dict]]:
    """Return removable components and stale allowlist entries. Each entry may match once only."""
    remaining = _isolated_chroma_components(image, excluded)
    matched_specs: set[int] = set()
    removable: list[dict] = []
    for component in remaining:
        match = next((index for index, spec in enumerate(specs) if index not in matched_specs and _component_spec_matches(component, spec)), None)
        if match is None:
            removable.append(component)
        else:
            matched_specs.add(match)
    stale = [spec for index, spec in enumerate(specs) if index not in matched_specs]
    return removable, stale


def _has_edge_chroma_neighbor(image: Image.Image, x: int, y: int, edge_chroma: set[int], radius: int = 2) -> bool:
    for ny in range(max(0, y - radius), min(image.height, y + radius + 1)):
        for nx in range(max(0, x - radius), min(image.width, x + radius + 1)):
            if ny * image.width + nx in edge_chroma:
                return True
    return False


def _is_frame_edge(image: Image.Image, x: int, y: int) -> bool:
    return x == 0 or y == 0 or x == image.width - 1 or y == image.height - 1


def _is_boundary_green(image: Image.Image, x: int, y: int) -> bool:
    pixel = image.getpixel((x, y))
    if pixel[3] <= 0:
        return False
    hue, saturation, value = _hue_and_saturation(*pixel[:3])
    if not (CHROMA_HUE_MIN <= hue <= CHROMA_HUE_MAX
            and saturation >= BOUNDARY_GREEN_SATURATION_MIN
            and value >= BOUNDARY_GREEN_VALUE_MIN):
        return False
    transparent = False
    for ny in range(max(0, y - 2), min(image.height, y + 3)):
        for nx in range(max(0, x - 2), min(image.width, x + 3)):
            if nx == x and ny == y:
                continue
            neighbor = image.getpixel((nx, ny))
            if abs(nx - x) <= 1 and abs(ny - y) <= 1:
                transparent = transparent or neighbor[3] == 0
    return transparent


def neutralize_boundary_green(image: Image.Image) -> tuple[Image.Image, int]:
    cleaned = image.convert("RGBA").copy()
    boundary = [(x, y) for y in range(cleaned.height) for x in range(cleaned.width) if _is_boundary_green(cleaned, x, y)]
    for x, y in boundary:
        r, _, b, a = cleaned.getpixel((x, y))
        cleaned.putpixel((x, y), (r, max(r, b), b, a))
    return cleaned, len(boundary)


def neutralize_boundary_green_grid(image: Image.Image, cols: int, rows: int) -> tuple[Image.Image, int]:
    cleaned = Image.new("RGBA", image.size, (0, 0, 0, 0))
    changed = 0
    for box in _frame_boxes(image, cols, rows):
        frame, count = neutralize_boundary_green(image.crop(box))
        cleaned.alpha_composite(frame, box[:2])
        changed += count
    return cleaned, changed


def neutralize_strict_green_grid(image: Image.Image, cols: int, rows: int) -> tuple[Image.Image, int]:
    cleaned = image.convert("RGBA").copy()
    changed = 0
    pixels = cleaned.load()
    for box in _frame_boxes(cleaned, cols, rows):
        for y in range(box[1], box[3]):
            for x in range(box[0], box[2]):
                r, g, b, a = pixels[x, y]
                hue, saturation, value = _hue_and_saturation(r, g, b)
                if (a > 0 and CHROMA_HUE_MIN <= hue <= CHROMA_HUE_MAX
                        and saturation >= 0.25 and value >= 50):
                    pixels[x, y] = (r, max(r, b), b, a)
                    changed += 1
    return cleaned, changed


def analyze_chroma(image: Image.Image, allowed_components: list[dict] | None = None, strict_boundary: bool = False) -> dict[str, int]:
    """Return residual artifacts; ``removedComponents`` means components eligible for removal."""
    image = image.convert("RGBA")
    pixels = image.load()
    edge = _edge_connected_chroma(image)
    opaque_green = 0
    fringe_green = 0
    hidden_rgb = 0
    boundary_green = 0
    for y in range(image.height):
        for x in range(image.width):
            pixel = pixels[x, y]
            if strict_boundary and _is_boundary_green(image, x, y):
                boundary_green += 1
            if pixel[3] == 0:
                hidden_rgb += int(pixel[:3] != (0, 0, 0))
            elif y * image.width + x in edge:
                if pixel[3] > CHROMA_ALPHA_THRESHOLD:
                    opaque_green += 1
                else:
                    fringe_green += 1
            elif is_green_screen_pixel(pixel) and (
                _has_edge_chroma_neighbor(image, x, y, edge) or _is_frame_edge(image, x, y)
            ):
                fringe_green += 1
    components, stale = _partition_isolated_components(image, edge, allowed_components or [])
    return {
        "opaqueGreen": opaque_green,
        "fringeGreen": fringe_green,
        "hiddenRgb": hidden_rgb,
        "boundaryGreen": boundary_green,
        "removedComponents": len(components),
        "staleAllowlist": len(stale),
    }


def _decontaminate_fringe(image: Image.Image, removed: set[int]) -> None:
    width, height = image.size
    pixels = image.load()
    for y in range(height):
        for x in range(width):
            index = y * width + x
            pixel = pixels[x, y]
            if index in removed or not is_green_screen_pixel(pixel) or pixel[3] > CHROMA_ALPHA_THRESHOLD:
                continue
            near_removed = any(
                ny * width + nx in removed
                for ny in range(max(0, y - 2), min(height, y + 3))
                for nx in range(max(0, x - 2), min(width, x + 3))
            )
            if not near_removed and not _is_frame_edge(image, x, y):
                continue
            samples = []
            for radius in (1, 2, 3):
                for ny in range(max(0, y - radius), min(height, y + radius + 1)):
                    for nx in range(max(0, x - radius), min(width, x + radius + 1)):
                        neighbor_index = ny * width + nx
                        neighbor = pixels[nx, ny]
                        if neighbor_index not in removed and neighbor[3] > ALPHA_THRESHOLD and not is_green_screen_pixel(neighbor):
                            samples.append(neighbor[:3])
                if samples:
                    break
            if samples:
                rgb = tuple(round(sum(color[channel] for color in samples) / len(samples)) for channel in range(3))
            else:
                value = round((pixel[0] + pixel[2]) / 2)
                rgb = (value, value, value)
            pixels[x, y] = (*rgb, pixel[3])


def cleanup_chroma(image: Image.Image, allowed_components: list[dict] | None = None, strict_boundary: bool = False) -> tuple[Image.Image, dict[str, int]]:
    """Remove chroma-key background artifacts while preserving real low-saturation greens."""
    cleaned = image.convert("RGBA").copy()
    width, height = cleaned.size
    pixels = cleaned.load()
    background = _edge_connected_chroma(cleaned)
    isolated, stale = _partition_isolated_components(cleaned, background, allowed_components or [])
    if stale:
        raise ValueError(f"stale chroma component allowlist: {len(stale)} unmatched component(s)")
    removed = set(background)
    for component in isolated:
        removed.update(component["indices"])
    for index in removed:
        x, y = index % width, index // width
        pixels[x, y] = (0, 0, 0, 0)
    _decontaminate_fringe(cleaned, removed)
    if strict_boundary:
        cleaned, _ = neutralize_boundary_green(cleaned)
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0 and (r, g, b) != (0, 0, 0):
                pixels[x, y] = (0, 0, 0, 0)
    return cleaned, {"removedComponents": len(isolated), "staleAllowlist": 0}


def _frame_boxes(image: Image.Image, cols: int, rows: int) -> list[tuple[int, int, int, int]]:
    if image.width % cols or image.height % rows:
        raise ValueError(f"{image.size} is not divisible by {cols}x{rows}")
    frame_width, frame_height = image.width // cols, image.height // rows
    return [
        (col * frame_width, row * frame_height, (col + 1) * frame_width, (row + 1) * frame_height)
        for row in range(rows)
        for col in range(cols)
    ]


def analyze_chroma_grid(
    image: Image.Image,
    cols: int = 1,
    rows: int = 1,
    path: Path | None = None,
    strict_boundary_cells: set[tuple[int, int]] | frozenset[tuple[int, int]] | None = None,
) -> dict[str, int]:
    """Analyze each cell; an explicit cell set overrides the sheet-level strict policy."""
    totals = {"opaqueGreen": 0, "fringeGreen": 0, "hiddenRgb": 0, "boundaryGreen": 0, "removedComponents": 0, "staleAllowlist": 0}
    allowlist = component_allowlist() if path else []
    sheet_key = sheet_identity_for_path(path)[0] if path else ""
    for index, box in enumerate(_frame_boxes(image, cols, rows)):
        row, col = divmod(index, cols)
        result = analyze_chroma(
            image.crop(box),
            component_specs_for(sheet_key, path, row, col, allowlist) if path else [],
            strict_boundary=(
                (row, col) in strict_boundary_cells
                if strict_boundary_cells is not None
                else sheet_key in STRICT_BOUNDARY_SHEETS if path else False
            ),
        )
        for key, value in result.items():
            totals[key] += value
    return totals


def cleanup_chroma_grid(image: Image.Image, cols: int = 1, rows: int = 1, path: Path | None = None) -> tuple[Image.Image, dict[str, int]]:
    """Normalize every animation cell independently so internal grid edges are true boundaries."""
    cleaned = Image.new("RGBA", image.size, (0, 0, 0, 0))
    removed_components = 0
    allowlist = component_allowlist() if path else []
    sheet_key = sheet_identity_for_path(path)[0] if path else ""
    for index, box in enumerate(_frame_boxes(image, cols, rows)):
        row, col = divmod(index, cols)
        frame, result = cleanup_chroma(
            image.crop(box),
            component_specs_for(sheet_key, path, row, col, allowlist) if path else [],
            strict_boundary=sheet_key in STRICT_BOUNDARY_SHEETS if path else False,
        )
        cleaned.alpha_composite(frame, box[:2])
        removed_components += result["removedComponents"]
    return cleaned, {"removedComponents": removed_components, "staleAllowlist": 0}


def chroma_cleanup_integrity(before: Image.Image, after: Image.Image, cols: int, rows: int) -> dict[str, int]:
    """Prove cleanup kept dimensions and never reduced alpha on non-chroma foreground."""
    if before.size != after.size:
        raise ValueError(f"cleanup changed size from {before.size} to {after.size}")
    before = before.convert("RGBA")
    after = after.convert("RGBA")
    before_pixels, after_pixels = before.load(), after.load()
    alpha_before = alpha_after = unexpected_alpha_loss = 0
    for y in range(before.height):
        for x in range(before.width):
            original, cleaned = before_pixels[x, y], after_pixels[x, y]
            alpha_before += int(original[3] > 0)
            alpha_after += int(cleaned[3] > 0)
            if cleaned[3] < original[3] and not is_green_screen_pixel(original):
                unexpected_alpha_loss += 1
    # Validate every grid cell is still addressable after cleanup.
    _frame_boxes(after, cols, rows)
    return {
        "alphaCoverageBefore": alpha_before,
        "alphaCoverageAfter": alpha_after,
        "unexpectedAlphaLoss": unexpected_alpha_loss,
    }


def remove_chroma_key(image: Image.Image) -> Image.Image:
    return cleanup_chroma(image)[0]


def remove_edge_connected_green(image: Image.Image) -> Image.Image:
    return cleanup_chroma(image)[0]


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = image.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > ALPHA_THRESHOLD else 0)
    return mask.getbbox()


def component_boxes(image: Image.Image) -> list[dict]:
    width, height = image.size
    alpha = image.getchannel("A")
    pixels = alpha.load()
    visited = bytearray(width * height)
    boxes = []

    for start_y in range(height):
        for start_x in range(width):
            idx = start_y * width + start_x
            if visited[idx] or pixels[start_x, start_y] <= ALPHA_THRESHOLD:
                visited[idx] = 1
                continue

            stack = [(start_x, start_y)]
            visited[idx] = 1
            min_x = max_x = start_x
            min_y = max_y = start_y
            area = 0

            while stack:
                x, y = stack.pop()
                area += 1
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)

                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if nx < 0 or nx >= width or ny < 0 or ny >= height:
                        continue
                    nidx = ny * width + nx
                    if visited[nidx]:
                        continue
                    visited[nidx] = 1
                    if pixels[nx, ny] > ALPHA_THRESHOLD:
                        stack.append((nx, ny))

            boxes.append({
                "box": (min_x, min_y, max_x + 1, max_y + 1),
                "area": area,
                "width": max_x - min_x + 1,
                "height": max_y - min_y + 1,
            })

    return boxes


def remove_detached_slivers(cell: Image.Image, grid: Grid) -> tuple[Image.Image, int]:
    boxes = component_boxes(cell)
    if len(boxes) <= 1:
        return cell, 0

    main = max(boxes, key=lambda box: box["area"])
    cleaned = Image.new("RGBA", (grid.cell_width, grid.cell_height), (0, 0, 0, 0))
    removed = 0

    for component in boxes:
        is_main = component is main
        is_tiny_noise = component["area"] < max(10, main["area"] * 0.002)
        is_vertical_sliver = (
            component["width"] <= max(18, main["width"] * 0.28)
            and component["height"] >= max(60, component["width"] * 3)
            and component["area"] < main["area"] * 0.45
        )
        if not is_main and (is_tiny_noise or is_vertical_sliver):
            removed += 1
            continue

        box = component["box"]
        cleaned.alpha_composite(cell.crop(box), box[:2])

    return cleaned, removed


def fit_content(content: Image.Image, grid: Grid) -> Image.Image:
    bbox = alpha_bbox(content)
    if bbox is None:
        return Image.new("RGBA", (grid.cell_width, grid.cell_height), (0, 0, 0, 0))

    cropped = content.crop(bbox)
    content_w, content_h = cropped.size
    max_w = grid.cell_width - PADDING * 2
    max_h = grid.cell_height - PADDING * 2
    scale = min(1.0, max_w / content_w, max_h / content_h)

    if scale < 1.0:
        new_size = (
            max(1, round(content_w * scale)),
            max(1, round(content_h * scale)),
        )
        cropped = cropped.resize(new_size, Image.Resampling.LANCZOS)
        content_w, content_h = cropped.size

    out = Image.new("RGBA", (grid.cell_width, grid.cell_height), (0, 0, 0, 0))
    x = (grid.cell_width - content_w) // 2
    y = grid.cell_height - PADDING - content_h
    out.alpha_composite(cropped, (x, y))
    return out


def fit_frame(cell: Image.Image, grid: Grid) -> tuple[Image.Image, bool]:
    cell = remove_edge_connected_green(cell)
    cell = remove_chroma_key(cell)
    cell, removed = remove_detached_slivers(cell, grid)
    bbox = alpha_bbox(cell)
    if bbox is None:
        return Image.new("RGBA", (grid.cell_width, grid.cell_height), (0, 0, 0, 0)), False

    out = fit_content(cell, grid)
    return out, bool(removed) or bbox[0] <= 0 or bbox[1] <= 0 or bbox[2] >= grid.cell_width or bbox[3] >= grid.cell_height


def _labeled_component_map(image: Image.Image) -> tuple[list[int], list[dict]]:
    width, height = image.size
    alpha = image.getchannel("A")
    pixels = alpha.load()
    labels = [0] * (width * height)
    components = []
    next_id = 0

    for start_y in range(height):
        for start_x in range(width):
            idx = start_y * width + start_x
            if labels[idx] != 0 or pixels[start_x, start_y] <= ALPHA_THRESHOLD:
                continue

            next_id += 1
            stack = [(start_x, start_y)]
            labels[idx] = next_id
            min_x = max_x = start_x
            min_y = max_y = start_y
            area = 0

            while stack:
                x, y = stack.pop()
                area += 1
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)

                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if nx < 0 or nx >= width or ny < 0 or ny >= height:
                        continue
                    nidx = ny * width + nx
                    if labels[nidx] == 0 and pixels[nx, ny] > ALPHA_THRESHOLD:
                        labels[nidx] = next_id
                        stack.append((nx, ny))

            components.append({
                "id": next_id,
                "box": (min_x, min_y, max_x + 1, max_y + 1),
                "area": area,
            })

    return labels, components


def reslice_source_sheet(source: Image.Image, grid: Grid) -> Image.Image:
    # 생성 원본은 캐릭터가 256px 격자를 가로·세로 모두 침범한다 (발끝이 아래 행까지
    # 최대 48px 하강). 행 스트립 절단조차 발을 잘라내므로, 시트 전체에서 연결 성분을
    # 찾아 면적 상위 24개를 프레임 앵커로 삼고 중심 좌표로 격자 순서를 복원한다.
    # 나머지 조각(분리된 파츠·다중 개체·탄피 등)은 가장 가까운 앵커 프레임에 귀속시키고,
    # 라벨 맵으로 픽셀 소유권을 지켜 이웃 프레임 픽셀이 섞이지 않게 한다.
    sheet = remove_chroma_key(remove_edge_connected_green(source.copy()))
    labels, components = _labeled_component_map(sheet)

    def center(component):
        box = component["box"]
        return ((box[0] + box[2]) / 2, (box[1] + box[3]) / 2)

    # 본체를 y중심으로 명목 행에 배정한다 — 전역 정렬 후 6개씩 자르면
    # 행당 7개를 그려 넣은 원본에서 행 경계가 밀려 프레임이 뒤섞인다.
    row_bodies = [[] for _ in range(grid.rows)]
    for component in components:
        if component["area"] < 4000:
            continue
        row = min(grid.rows - 1, max(0, int(center(component)[1] // grid.cell_height)))
        row_bodies[row].append(component)
    if any(len(bodies) < grid.cols for bodies in row_bodies):
        return _reslice_source_rows(sheet, grid)

    # 행당 6개 초과분(원본이 그려 넣은 잉여 키프레임)은 면적 하위부터 버린다.
    anchors = []
    for bodies in row_bodies:
        kept = sorted(bodies, key=lambda component: component["area"], reverse=True)[:grid.cols]
        kept.sort(key=lambda component: center(component)[0])
        anchors.extend(kept)

    # 소품·탄피 등 작은 조각만 같은 행의 가까운 앵커에 귀속시킨다.
    # 잉여 본체를 프레임에 합성하면 두 몸이 한 셀에 축소되므로 붙이지 않는다.
    anchor_ids = {component["id"] for component in anchors}
    frame_members = {component["id"]: [component] for component in anchors}
    anchor_centers = [(component["id"], center(component)) for component in anchors]
    for component in components:
        if component["id"] in anchor_ids or component["area"] < 24 or component["area"] >= 4000:
            continue
        cx, cy = center(component)
        owner = min(anchor_centers, key=lambda item: (item[1][0] - cx) ** 2 + (item[1][1] - cy) ** 2)
        ox, oy = owner[1]
        if abs(ox - cx) <= 140 and abs(oy - cy) <= 160:
            frame_members[owner[0]].append(component)

    width = sheet.width
    src_pixels = sheet.load()
    normalized = Image.new("RGBA", source.size, (0, 0, 0, 0))
    for index, anchor in enumerate(anchors):
        member_ids = {component["id"] for component in frame_members[anchor["id"]]}
        canvas = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
        canvas_pixels = canvas.load()
        for component in frame_members[anchor["id"]]:
            x0, y0, x1, y1 = component["box"]
            for y in range(y0, y1):
                row_base = y * width
                for x in range(x0, x1):
                    if labels[row_base + x] in member_ids:
                        canvas_pixels[x, y] = src_pixels[x, y]
        frame = fit_content(canvas, grid)
        normalized.alpha_composite(frame, ((index % grid.cols) * grid.cell_width, (index // grid.cols) * grid.cell_height))

    return normalized


def _reslice_source_rows(source: Image.Image, grid: Grid) -> Image.Image:
    # 본체 24개가 정확히 분리되지 않는 시트(무리형 적 등)를 위한 행 스트립 폴백.
    expected_size = (grid.cell_width * grid.cols, grid.cell_height * grid.rows)
    if source.size != expected_size:
        raise ValueError(f"row-strip fallback needs {expected_size}, got {source.size}")
    normalized = Image.new("RGBA", source.size, (0, 0, 0, 0))

    for row in range(grid.rows):
        row_img = source.crop((0, row * grid.cell_height, grid.cols * grid.cell_width, (row + 1) * grid.cell_height))
        row_img = remove_edge_connected_green(row_img)
        row_img = remove_chroma_key(row_img)

        row_components = [component for component in component_boxes(row_img) if component["area"] >= 18]
        body_candidates = [
            component for component in row_components
            if component["height"] >= 80 and component["area"] >= 1000
        ]
        if len(body_candidates) >= grid.cols:
            mains = sorted(sorted(body_candidates, key=lambda component: component["area"], reverse=True)[:grid.cols], key=lambda component: (component["box"][0] + component["box"][2]) / 2)
        else:
            mains = []

        for col in range(grid.cols):
            if mains:
                main = mains[col]
                components = row_components
            else:
                target_center = col * grid.cell_width + grid.cell_width / 2
                components = row_components
                if not components:
                    continue
                main = max(
                    components,
                    key=lambda component: (
                        component["area"] / (1 + abs(((component["box"][0] + component["box"][2]) / 2) - target_center) / 120),
                        component["area"],
                    ),
                )
            main_center = (main["box"][0] + main["box"][2]) / 2
            keep = []
            for component in components:
                center = (component["box"][0] + component["box"][2]) / 2
                near_main = abs(center - main_center) <= max(118, main["width"] * 1.05)
                meaningful = component is main or component["area"] >= max(24, main["area"] * 0.006)
                if near_main and meaningful:
                    keep.append(component)

            frame_content = Image.new("RGBA", row_img.size, (0, 0, 0, 0))
            for component in keep:
                box = component["box"]
                frame_content.alpha_composite(row_img.crop(box), box[:2])
            frame = fit_content(frame_content, grid)
            normalized.alpha_composite(frame, (col * grid.cell_width, row * grid.cell_height))

    return normalized


def fit_source_to_grid(source: Image.Image, grid: Grid) -> Image.Image:
    target_width, target_height = grid.target_size
    if source.size == grid.target_size:
        return source.copy()

    scale = min(target_width / source.width, target_height / source.height)
    resized = source.resize(
        (max(1, round(source.width * scale)), max(1, round(source.height * scale))),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", grid.target_size, (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((target_width - resized.width) // 2, target_height - resized.height))
    return canvas


def normalize_source_for_grid(source: Image.Image, grid: Grid) -> Image.Image:
    prepared = fit_source_to_grid(source, grid)
    normalized = remove_chroma_key(reslice_source_sheet(prepared, grid))
    if normalized.size != grid.target_size:
        raise ValueError(f"normalized sheet is {normalized.size}, expected {grid.target_size}")
    return normalized


def reslice_sheet_from_src(path: Path, dry_run: bool) -> dict:
    # 고정 격자 절단은 격자선을 걸친 프레임을 두 셀로 쪼갠다 —
    # _src 원본에서 성분 탐지로 본체를 찾아 셀 중앙에 재배치해야 복구된다.
    src_path = path.with_name(path.name.replace("_sheet.png", "_sheet_src.png"))
    if not src_path.exists():
        return {
            "path": path.relative_to(ROOT).as_posix(),
            "source": None,
            "changedFrames": 0,
            "changed": False,
        }

    current = Image.open(path).convert("RGBA")
    grid = grid_for(path, current)
    source = Image.open(src_path).convert("RGBA")
    target = current.size
    if source.size != target:
        # 비규격 원본은 종횡비를 유지한 채 규격 안으로 맞춰 프레임 간 상대 크기를 보존한다
        scale = min(target[0] / source.width, target[1] / source.height)
        source = source.resize(
            (max(1, round(source.width * scale)), max(1, round(source.height * scale))),
            Image.Resampling.LANCZOS,
        )

    normalized = normalize_source_for_grid(source, grid)
    changed = current.size != normalized.size or current.tobytes() != normalized.tobytes()
    if changed and not dry_run:
        normalized.save(path)

    return {
        "path": path.relative_to(ROOT).as_posix(),
        "source": src_path.relative_to(ROOT).as_posix(),
        "changedFrames": grid.cols * grid.rows,
        "changed": changed,
    }


def normalize_sheet(path: Path, dry_run: bool, from_head: bool) -> dict:
    rel_path = path.relative_to(ROOT).as_posix()
    input_label = rel_path
    if from_head:
        try:
            blob = subprocess.check_output(["git", "show", f"HEAD:{rel_path}"], cwd=ROOT)
            sheet = Image.open(io.BytesIO(blob)).convert("RGBA")
            input_label = f"HEAD:{rel_path}"
        except (subprocess.CalledProcessError, FileNotFoundError):
            sheet = Image.open(path).convert("RGBA")
    else:
        sheet = Image.open(path).convert("RGBA")
    grid = grid_for(path, sheet)
    sheet_key, _, _ = sheet_identity_for_path(path)
    allowlist = component_allowlist()
    original = sheet.copy()
    normalized = Image.new("RGBA", original.size, (0, 0, 0, 0))
    changed_frames = 0
    for row in range(grid.rows):
        for col in range(grid.cols):
            box = (
                col * grid.cell_width,
                row * grid.cell_height,
                (col + 1) * grid.cell_width,
                (row + 1) * grid.cell_height,
            )
            frame, _ = cleanup_chroma(
                sheet.crop(box),
                component_specs_for(sheet_key, path, row, col, allowlist),
                strict_boundary=sheet_key in STRICT_BOUNDARY_SHEETS,
            )
            normalized.alpha_composite(frame, (col * grid.cell_width, row * grid.cell_height))
            if original.crop(box).tobytes() != frame.tobytes():
                changed_frames += 1

    changed = original.tobytes() != normalized.tobytes()
    if changed and not dry_run:
        normalized.save(path)

    return {
        "path": path.relative_to(ROOT).as_posix(),
        "source": input_label,
        "changedFrames": changed_frames,
        "changed": changed,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--from-head", action="store_true")
    parser.add_argument("--from-src", action="store_true",
                        help="_src 원본에서 성분 탐지로 재절단 (격자 걸침 프레임 복구)")
    parser.add_argument("--only", default=None,
                        help="파일명에 이 문자열이 포함된 시트만 처리")
    parser.add_argument("--check-chroma", nargs="+", metavar="SHEET",
                        help="PNG 파일의 잔여 크로마 아티팩트를 JSON으로 검사")
    parser.add_argument("--check-allowlist", action="store_true",
                        help="등록된 크로마 컴포넌트 허용 목록을 전역 검증")
    parser.add_argument(
        "--neutralize-boundary",
        nargs=3,
        action="append",
        metavar=("SHEET", "COLS", "ROWS"),
        help="Neutralize attached green spill per animation cell while preserving alpha",
    )
    args = parser.parse_args()

    if args.neutralize_boundary:
        reports = []
        for pathname, cols, rows in args.neutralize_boundary:
            path = Path(pathname)
            source = Image.open(path).convert("RGBA")
            cleaned, changed = neutralize_boundary_green_grid(source, int(cols), int(rows))
            if not args.dry_run and cleaned.tobytes() != source.tobytes():
                cleaned.save(path)
            reports.append({"path": path.as_posix(), "changedPixels": changed})
        print(json.dumps(reports, ensure_ascii=False))
        return

    if args.check_allowlist:
        diagnostics = allowlist_diagnostics_or_error()
        print(json.dumps({"diagnostics": diagnostics}, ensure_ascii=False))
        if diagnostics:
            raise SystemExit(1)
        return

    if args.check_chroma:
        diagnostics = allowlist_diagnostics_or_error()
        if diagnostics:
            raise SystemExit(json.dumps({"diagnostics": diagnostics}, ensure_ascii=False))
        reports = []
        for value in args.check_chroma:
            path = Path(value)
            image = Image.open(path).convert("RGBA")
            try:
                grid = grid_for(path.resolve(), image)
                stats = analyze_chroma_grid(image, grid.cols, grid.rows, path)
            except ValueError as error:
                if "must map to exactly one manifest sheet" not in str(error):
                    raise
                stats = analyze_chroma(image)
            reports.append({"path": path.as_posix(), **stats})
        print(json.dumps(reports, ensure_ascii=False))
        return

    if not args.from_src:
        diagnostics = allowlist_diagnostics_or_error()
        if diagnostics:
            raise SystemExit(json.dumps({"diagnostics": diagnostics}, ensure_ascii=False))

    targets = [path for path in display_sheets() if not args.only or args.only in path.name]
    if args.from_src:
        results = [reslice_sheet_from_src(path, args.dry_run) for path in targets]
    else:
        results = [normalize_sheet(path, args.dry_run, args.from_head) for path in targets]
    changed = [result for result in results if result["changed"]]
    print(f"sheets={len(results)} changed={len(changed)} dryRun={args.dry_run} fromHead={args.from_head}")
    for result in changed:
        print(f"{result['changedFrames']:02d} {result['path']}")


if __name__ == "__main__":
    main()

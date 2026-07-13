from __future__ import annotations

import argparse
import io
import subprocess
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SPRITE_ROOT = ROOT / "assets" / "images" / "combat" / "spritesheets"
CELL = 256
COLS = 6
ROWS = 4
ALPHA_THRESHOLD = 12
CHROMA_ALPHA_THRESHOLD = 200
PADDING = 6


def display_sheets() -> list[Path]:
    files = [
        *SPRITE_ROOT.glob("*_sheet.png"),
        *(SPRITE_ROOT / "enemies").glob("*_sheet.png"),
    ]
    return sorted(path for path in files if not path.name.endswith("_src.png"))


def remove_chroma_key(image: Image.Image) -> Image.Image:
    pixels = image.load()
    width, height = image.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a > CHROMA_ALPHA_THRESHOLD and g > 220 and r < 80 and b < 100:
                pixels[x, y] = (r, g, b, 0)
    return image


def is_green_screen_pixel(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > ALPHA_THRESHOLD and g > 90 and g > r + 45 and g > b + 45


def remove_edge_connected_green(image: Image.Image) -> Image.Image:
    width, height = image.size
    pixels = image.load()
    visited = bytearray(width * height)
    stack = []

    for x in range(width):
        stack.append((x, 0))
        stack.append((x, height - 1))
    for y in range(height):
        stack.append((0, y))
        stack.append((width - 1, y))

    while stack:
        x, y = stack.pop()
        idx = y * width + x
        if visited[idx]:
            continue
        visited[idx] = 1
        if not is_green_screen_pixel(pixels[x, y]):
            continue

        r, g, b, _ = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                stack.append((nx, ny))

    return image


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


def remove_detached_slivers(cell: Image.Image) -> tuple[Image.Image, int]:
    boxes = component_boxes(cell)
    if len(boxes) <= 1:
        return cell, 0

    main = max(boxes, key=lambda box: box["area"])
    cleaned = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
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


def fit_content(content: Image.Image) -> Image.Image:
    bbox = alpha_bbox(content)
    if bbox is None:
        return Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))

    cropped = content.crop(bbox)
    content_w, content_h = cropped.size
    max_w = CELL - PADDING * 2
    max_h = CELL - PADDING * 2
    scale = min(1.0, max_w / content_w, max_h / content_h)

    if scale < 1.0:
        new_size = (
            max(1, round(content_w * scale)),
            max(1, round(content_h * scale)),
        )
        cropped = cropped.resize(new_size, Image.Resampling.LANCZOS)
        content_w, content_h = cropped.size

    out = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    x = (CELL - content_w) // 2
    y = CELL - PADDING - content_h
    out.alpha_composite(cropped, (x, y))
    return out


def fit_frame(cell: Image.Image) -> tuple[Image.Image, bool]:
    cell = remove_edge_connected_green(cell)
    cell = remove_chroma_key(cell)
    cell, removed = remove_detached_slivers(cell)
    bbox = alpha_bbox(cell)
    if bbox is None:
        return Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0)), False

    out = fit_content(cell)
    return out, bool(removed) or bbox[0] <= 0 or bbox[1] <= 0 or bbox[2] >= CELL or bbox[3] >= CELL


def reslice_source_sheet(source: Image.Image) -> Image.Image:
    normalized = Image.new("RGBA", source.size, (0, 0, 0, 0))
    margin = 96

    for row in range(ROWS):
        row_img = source.crop((0, row * CELL, COLS * CELL, (row + 1) * CELL))
        row_img = remove_edge_connected_green(row_img)
        row_img = remove_chroma_key(row_img)

        row_components = [component for component in component_boxes(row_img) if component["area"] >= 18]
        body_candidates = [
            component for component in row_components
            if component["height"] >= 80 and component["area"] >= 1000
        ]
        if len(body_candidates) >= COLS:
            mains = sorted(sorted(body_candidates, key=lambda component: component["area"], reverse=True)[:COLS], key=lambda component: (component["box"][0] + component["box"][2]) / 2)
        else:
            mains = []

        for col in range(COLS):
            if mains:
                main = mains[col]
                components = row_components
            else:
                target_center = col * CELL + CELL / 2
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
            frame = fit_content(frame_content)
            normalized.alpha_composite(frame, (col * CELL, row * CELL))

    return normalized


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
    if sheet.size != (CELL * COLS, CELL * ROWS):
        raise ValueError(f"{path} is {sheet.size}, expected {(CELL * COLS, CELL * ROWS)}")

    sheet = remove_chroma_key(sheet)
    normalized = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
    changed_frames = 0
    for row in range(ROWS):
        for col in range(COLS):
            box = (col * CELL, row * CELL, (col + 1) * CELL, (row + 1) * CELL)
            frame, changed = fit_frame(sheet.crop(box))
            normalized.alpha_composite(frame, (col * CELL, row * CELL))
            if changed:
                changed_frames += 1

    normalized = remove_chroma_key(normalized)
    changed = sheet.tobytes() != normalized.tobytes()
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
    args = parser.parse_args()

    results = [normalize_sheet(path, args.dry_run, args.from_head) for path in display_sheets()]
    changed = [result for result in results if result["changed"]]
    print(f"sheets={len(results)} changed={len(changed)} dryRun={args.dry_run} fromHead={args.from_head}")
    for result in changed:
        print(f"{result['changedFrames']:02d} {result['path']}")


if __name__ == "__main__":
    main()

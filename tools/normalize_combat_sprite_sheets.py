from __future__ import annotations

import argparse
import io
import json
import subprocess
from dataclasses import dataclass
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SPRITE_ROOT = ROOT / "assets" / "images" / "combat" / "spritesheets"
MANIFEST_PATH = SPRITE_ROOT / "manifest.json"
ALPHA_THRESHOLD = 12
CHROMA_ALPHA_THRESHOLD = 200
PADDING = 6


@dataclass(frozen=True)
class Grid:
    cols: int
    rows: int
    cell_width: int
    cell_height: int


def display_sheets() -> list[Path]:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return sorted(ROOT / sheet["src"].lstrip("/") for sheet in manifest.values())


def grid_for(path: Path, image: Image.Image | None = None) -> Grid:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    relative = "/" + path.relative_to(ROOT).as_posix()
    sheet = next((entry for entry in manifest.values() if entry["src"] == relative), None)
    if sheet is None:
        raise ValueError(f"{relative} is not declared in {MANIFEST_PATH.relative_to(ROOT)}")
    source = image if image is not None else Image.open(path)
    width, height = source.size
    cols, rows = sheet["cols"], sheet["rows"]
    if width % cols or height % rows:
        raise ValueError(f"{path} size {source.size} is not divisible by {cols}x{rows}")
    return Grid(cols, rows, width // cols, height // rows)


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

    normalized = remove_chroma_key(reslice_source_sheet(source, grid))
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

    sheet = remove_chroma_key(sheet)
    normalized = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
    changed_frames = 0
    for row in range(grid.rows):
        for col in range(grid.cols):
            box = (
                col * grid.cell_width,
                row * grid.cell_height,
                (col + 1) * grid.cell_width,
                (row + 1) * grid.cell_height,
            )
            frame, changed = fit_frame(sheet.crop(box), grid)
            normalized.alpha_composite(frame, (col * grid.cell_width, row * grid.cell_height))
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
    parser.add_argument("--from-src", action="store_true",
                        help="_src 원본에서 성분 탐지로 재절단 (격자 걸침 프레임 복구)")
    parser.add_argument("--only", default=None,
                        help="파일명에 이 문자열이 포함된 시트만 처리")
    args = parser.parse_args()

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

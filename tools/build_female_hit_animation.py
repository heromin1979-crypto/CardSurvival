from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / "assets" / "images"

SHEET = IMG_DIR / "combat_generated_pose_female_hit_sheet_v1_alpha.png"
OUT_APNG = IMG_DIR / "combat_generated_pose_female_hit_anim_v1.png"
OUT_SPACED_SHEET = IMG_DIR / "combat_generated_pose_female_hit_frames_spaced_v1.png"
FRAME_TEMPLATE = "combat_generated_pose_female_hit_frame_{:02d}_v1.png"
DURATIONS_MS = [55, 70, 95, 95, 80, 105]
FRAME_OFFSETS_X = [0, -12, -24, -18, -8, 0]
CANVAS_EXTRA_X = 220
CANVAS_EXTRA_Y = 28
CONTACT_GUTTER = 92


def connected_components(alpha: np.ndarray) -> list[tuple[int, int, int, int, int]]:
    height, width = alpha.shape
    visited = np.zeros((height, width), dtype=bool)
    components = []

    for y in range(height):
        xs = np.where(alpha[y] & ~visited[y])[0]
        for start_x in xs:
            if visited[y, start_x] or not alpha[y, start_x]:
                continue
            stack = [(int(start_x), y)]
            visited[y, start_x] = True
            min_x = max_x = int(start_x)
            min_y = max_y = y
            count = 0

            while stack:
                x, yy = stack.pop()
                count += 1
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, yy)
                max_y = max(max_y, yy)

                for nx, ny in ((x + 1, yy), (x - 1, yy), (x, yy + 1), (x, yy - 1)):
                    if 0 <= nx < width and 0 <= ny < height and not visited[ny, nx] and alpha[ny, nx]:
                        visited[ny, nx] = True
                        stack.append((nx, ny))

            if count > 1000:
                components.append((min_x, min_y, max_x + 1, max_y + 1, count))

    return sorted(components, key=lambda box: box[0])


def padded_box(box: tuple[int, int, int, int, int], width: int, height: int, pad: int = 26) -> tuple[int, int, int, int]:
    x1, y1, x2, y2, _count = box
    return (
        max(x1 - pad, 0),
        max(y1 - pad, 0),
        min(x2 + pad, width),
        min(y2 + pad, height),
    )


def main() -> None:
    sheet = Image.open(SHEET).convert("RGBA")
    alpha = np.asarray(sheet)[..., 3] > 18
    components = connected_components(alpha)
    if len(components) != len(DURATIONS_MS):
        raise ValueError(f"Expected {len(DURATIONS_MS)} frames, found {len(components)} components")

    crops = []
    max_width = 0
    max_height = 0
    for component in components:
        crop = sheet.crop(padded_box(component, sheet.width, sheet.height))
        crops.append(crop)
        max_width = max(max_width, crop.width)
        max_height = max(max_height, crop.height)

    canvas_width = max_width + CANVAS_EXTRA_X
    canvas_height = max_height + CANVAS_EXTRA_Y
    frames = []

    for index, crop in enumerate(crops, start=1):
        x = round((canvas_width - crop.width) / 2 + FRAME_OFFSETS_X[index - 1])
        y = canvas_height - crop.height
        frame = Image.new("RGBA", (canvas_width, canvas_height), (0, 0, 0, 0))
        frame.alpha_composite(crop, (x, y))
        frame.save(IMG_DIR / FRAME_TEMPLATE.format(index))
        frames.append(frame)

    contact_sheet = Image.new(
        "RGBA",
        (canvas_width * len(frames) + CONTACT_GUTTER * (len(frames) - 1), canvas_height),
        (0, 0, 0, 0),
    )
    for index, frame in enumerate(frames):
        contact_sheet.alpha_composite(frame, (index * (canvas_width + CONTACT_GUTTER), 0))
    contact_sheet.save(OUT_SPACED_SHEET)

    frames[0].save(
        OUT_APNG,
        save_all=True,
        append_images=frames[1:],
        duration=DURATIONS_MS,
        loop=1,
        disposal=[2] * len(frames),
        blend=[0] * len(frames),
    )

    print(f"frames={len(frames)} canvas={canvas_width}x{canvas_height} duration={sum(DURATIONS_MS)}ms")
    print(OUT_APNG)
    print(OUT_SPACED_SHEET)


if __name__ == "__main__":
    main()

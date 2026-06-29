from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / "assets" / "images"

SHEET = IMG_DIR / "combat_generated_pose_knife_attack_female_sheet_v1_alpha.png"
OUT_WEBP = IMG_DIR / "combat_generated_pose_knife_attack_female_anim_v1.webp"
OUT_APNG = IMG_DIR / "combat_generated_pose_knife_attack_female_anim_v2.png"
OUT_SPACED_SHEET = IMG_DIR / "combat_generated_pose_knife_attack_female_frames_spaced_v1.png"
FRAME_TEMPLATE = "combat_generated_pose_knife_attack_female_frame_{:02d}_v1.png"
DURATIONS_MS = [70, 70, 55, 80, 75, 95]
FRAME_BOXES = [
    (0, 100, 330, 620),
    (330, 100, 710, 630),
    (690, 120, 1075, 630),
    (1050, 120, 1545, 630),
    (1435, 120, 1815, 630),
    (1800, 100, 2140, 630),
]
FRAME_OFFSETS_X = [0, -14, 16, 38, 22, 0]
CANVAS_EXTRA_X = 240
CANVAS_EXTRA_Y = 28
CONTACT_GUTTER = 92


def alpha_bounds(image: Image.Image, pad: int = 20) -> tuple[int, int, int, int]:
    alpha = np.asarray(image.convert("RGBA"))[..., 3] > 18
    ys, xs = np.where(alpha)
    if xs.size == 0:
        raise ValueError("Frame has no visible pixels")

    return (
        max(int(xs.min()) - pad, 0),
        max(int(ys.min()) - pad, 0),
        min(int(xs.max()) + pad + 1, image.width),
        min(int(ys.max()) + pad + 1, image.height),
    )


def clean_cell(cell: Image.Image, index: int) -> Image.Image:
    arr = np.array(cell)

    if index == 3:
        # Neighboring impact frame foot fragment intrudes into the lower-right.
        arr[330:, 330:, 3] = 0

    if index == 4:
        # The generated sheet lets frame 3's knife and frame 5's foot cross into
        # the impact cell. Keep the slash arc, but remove those neighboring bits.
        arr[:230, :75, 3] = 0
        region = arr[120:270, :115]
        rgb = region[..., :3].astype(np.int16)
        alpha = region[..., 3] > 18
        bright_metal = (
            alpha
            & (rgb[..., 0] > 90)
            & (rgb[..., 1] > 90)
            & (rgb[..., 2] > 80)
            & ((rgb.max(axis=2) - rgb.min(axis=2)) < 75)
        )
        region[..., 3] = np.where(bright_metal, 0, region[..., 3])
        arr[120:270, :115] = region
        arr[300:, 390:, 3] = 0

    if index == 5:
        # Neighboring impact-frame slash arc intrudes into the upper-left.
        arr[:230, :115, 3] = 0

    return Image.fromarray(arr, "RGBA")


def main() -> None:
    sheet = Image.open(SHEET).convert("RGBA")

    slices = []
    max_width = 0
    max_height = 0

    for index, box in enumerate(FRAME_BOXES, start=1):
        cell = clean_cell(sheet.crop(box), index)
        crop = cell.crop(alpha_bounds(cell))
        slices.append(crop)
        max_width = max(max_width, crop.width)
        max_height = max(max_height, crop.height)

    canvas_width = max_width + CANVAS_EXTRA_X
    canvas_height = max_height + CANVAS_EXTRA_Y
    frames = []

    for index, crop in enumerate(slices, start=1):
        x = round((canvas_width - crop.width) / 2 + FRAME_OFFSETS_X[index - 1])
        y = canvas_height - crop.height
        frame = Image.new("RGBA", (canvas_width, canvas_height), (0, 0, 0, 0))
        frame.alpha_composite(crop, (x, y))
        frame.save(IMG_DIR / FRAME_TEMPLATE.format(index))
        frames.append(frame)

    contact_sheet = Image.new(
        "RGBA",
        ((canvas_width * len(frames)) + (CONTACT_GUTTER * (len(frames) - 1)), canvas_height),
        (0, 0, 0, 0),
    )
    for index, frame in enumerate(frames):
        contact_sheet.alpha_composite(frame, (index * (canvas_width + CONTACT_GUTTER), 0))
    contact_sheet.save(OUT_SPACED_SHEET)

    frames[0].save(
        OUT_WEBP,
        save_all=True,
        append_images=frames[1:],
        duration=DURATIONS_MS,
        loop=1,
        lossless=True,
        quality=95,
        method=6,
        minimize_size=True,
    )
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
    print(OUT_WEBP)
    print(OUT_APNG)
    print(OUT_SPACED_SHEET)


if __name__ == "__main__":
    main()

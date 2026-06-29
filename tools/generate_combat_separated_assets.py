from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / "assets" / "images"


SPRITES = {
    "ally_rifle": {
        "src": "combat_sample_unit_ally_rifle.png",
        "pos": (74, 130),
        "shapes": [
            ("ellipse", (158, 34, 207, 82)),
            ("poly", [(116, 76), (174, 62), (224, 111), (210, 174), (158, 207), (103, 156), (99, 103)]),
            ("poly", [(61, 73), (134, 68), (136, 169), (77, 174), (43, 122)]),
            ("line", [(122, 102), (160, 130), (149, 158)], 25),
            ("line", [(172, 91), (214, 108), (256, 109)], 19),
            ("line", [(215, 105), (307, 104)], 10),
            ("line", [(139, 184), (104, 238), (66, 313)], 31),
            ("line", [(170, 191), (210, 260), (247, 306)], 29),
            ("ellipse", (42, 296, 101, 322)),
            ("ellipse", (220, 287, 282, 316)),
        ],
    },
    "ally_pistol": {
        "src": "combat_sample_unit_ally_pistol.png",
        "pos": (310, 135),
        "shapes": [
            ("ellipse", (92, 20, 137, 67)),
            ("poly", [(78, 58), (130, 47), (165, 94), (149, 153), (96, 178), (65, 123)]),
            ("line", [(101, 92), (145, 102), (194, 93)], 19),
            ("line", [(82, 96), (52, 130), (34, 157)], 19),
            ("line", [(101, 160), (82, 213), (61, 270)], 29),
            ("line", [(134, 161), (164, 214), (196, 266)], 27),
            ("ellipse", (38, 253, 88, 277)),
            ("ellipse", (174, 248, 232, 275)),
            ("line", [(171, 91), (228, 84)], 8),
        ],
    },
    "dog": {
        "src": "combat_sample_unit_dog.png",
        "pos": (528, 210),
        "shapes": [
            ("ellipse", (28, 56, 112, 123)),
            ("poly", [(88, 52), (139, 50), (154, 86), (128, 111), (96, 100)]),
            ("poly", [(112, 45), (124, 8), (133, 49)]),
            ("poly", [(132, 46), (145, 13), (150, 56)]),
            ("line", [(21, 76), (0, 52)], 12),
            ("line", [(46, 111), (35, 178)], 13),
            ("line", [(72, 114), (63, 183)], 12),
            ("line", [(102, 109), (105, 183)], 13),
            ("line", [(126, 104), (139, 178)], 12),
        ],
    },
    "zombie_bare": {
        "src": "combat_sample_unit_zombie_bare.png",
        "pos": (1280, 120),
        "shapes": [
            ("ellipse", (57, 39, 110, 92)),
            ("poly", [(48, 83), (111, 78), (153, 142), (136, 214), (82, 222), (43, 154)]),
            ("line", [(53, 129), (20, 176), (5, 208)], 21),
            ("line", [(136, 137), (177, 190), (185, 236)], 21),
            ("line", [(87, 213), (58, 278), (36, 323)], 27),
            ("line", [(119, 213), (145, 278), (177, 324)], 27),
            ("ellipse", (19, 307, 72, 333)),
            ("ellipse", (153, 307, 199, 333)),
        ],
    },
    "zombie_guard": {
        "src": "combat_sample_unit_zombie_guard.png",
        "pos": (965, 128),
        "shapes": [
            ("ellipse", (53, 24, 103, 76)),
            ("poly", [(45, 68), (106, 60), (143, 124), (125, 190), (71, 203), (36, 134)]),
            ("line", [(45, 113), (12, 156), (0, 194)], 20),
            ("line", [(125, 114), (155, 158), (166, 205)], 20),
            ("line", [(75, 191), (48, 250), (25, 303)], 27),
            ("line", [(109, 190), (126, 251), (151, 304)], 27),
            ("ellipse", (3, 291, 58, 314)),
            ("ellipse", (128, 290, 172, 314)),
        ],
    },
    "zombie_rage": {
        "src": "combat_sample_unit_zombie_rage.png",
        "pos": (1110, 128),
        "shapes": [
            ("ellipse", (62, 28, 112, 82)),
            ("poly", [(48, 75), (116, 65), (158, 130), (145, 206), (82, 217), (39, 147)]),
            ("line", [(50, 119), (16, 160), (0, 198)], 21),
            ("line", [(141, 120), (169, 164), (178, 210)], 22),
            ("line", [(87, 207), (67, 268), (40, 314)], 28),
            ("line", [(118, 205), (138, 268), (164, 314)], 28),
            ("ellipse", (18, 300, 72, 324)),
            ("ellipse", (143, 299, 185, 324)),
        ],
    },
}


def draw_mask(size, shapes, feather=2):
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    for shape in shapes:
        kind = shape[0]
        if kind == "ellipse":
            draw.ellipse(shape[1], fill=255)
        elif kind == "poly":
            draw.polygon(shape[1], fill=255)
        elif kind == "line":
            draw.line(shape[1], fill=255, width=shape[2], joint="curve")
    if feather:
        mask = mask.filter(ImageFilter.GaussianBlur(feather))
    return mask


def write_transparent_sprites():
    for key, spec in SPRITES.items():
        src = Image.open(IMG_DIR / spec["src"]).convert("RGBA")
        alpha = draw_mask(src.size, spec["shapes"], 2)
        out = src.copy()
        out.putalpha(alpha)
        out.save(IMG_DIR / f"combat_sprite_{key}.png")


def paste_patch(base, target_box, source_box, feather=18, brightness=1.0):
    source = base.crop(source_box).resize((target_box[2] - target_box[0], target_box[3] - target_box[1]))
    if brightness != 1.0:
        arr = np.asarray(source).astype(np.float32)
        source = Image.fromarray(np.clip(arr * brightness, 0, 255).astype(np.uint8), "RGB")
    source = source.filter(ImageFilter.GaussianBlur(1.0))
    alpha = Image.new("L", source.size, 255)
    alpha = alpha.filter(ImageFilter.GaussianBlur(feather))
    base.paste(source, target_box[:2], alpha)


def inpaint_empty_battlefield():
    base = Image.open(IMG_DIR / "combat_sample_battlefield_plate.png").convert("RGB")
    mask = Image.new("L", base.size, 0)
    draw = ImageDraw.Draw(mask)

    for spec in SPRITES.values():
        sprite = Image.open(IMG_DIR / spec["src"]).convert("RGBA")
        local_mask = draw_mask(sprite.size, spec["shapes"], 8)
        expanded = local_mask.filter(ImageFilter.MaxFilter(17)).filter(ImageFilter.GaussianBlur(3))
        mask.paste(expanded, spec["pos"], expanded)

    for box in [
        (1000, 26, 1098, 127),
        (1148, 27, 1248, 128),
        (1295, 27, 1404, 128),
    ]:
        draw.rounded_rectangle(box, radius=16, fill=255)

    draw.rectangle((0, 438, base.size[0], base.size[1]), fill=255)

    empty = base.copy()
    clone_jobs = [
        ((38, 118, 358, 455), (720, 118, 1040, 455), 20, 0.88),
        ((286, 126, 560, 455), (735, 126, 1009, 455), 18, 0.90),
        ((500, 190, 704, 455), (765, 190, 969, 455), 16, 0.92),
        ((932, 96, 1148, 455), (690, 96, 906, 455), 20, 0.86),
        ((1080, 96, 1305, 455), (705, 96, 930, 455), 22, 0.84),
        ((1246, 96, 1466, 455), (735, 96, 955, 455), 22, 0.82),
        ((992, 20, 1410, 136), (610, 20, 1028, 136), 20, 0.90),
        ((0, 438, base.size[0], base.size[1]), (0, 410, base.size[0], 427), 10, 0.78),
    ]
    for target_box, source_box, feather, brightness in clone_jobs:
        paste_patch(empty, target_box, source_box, feather, brightness)

    repaired = empty.filter(ImageFilter.GaussianBlur(3.2))
    blend_mask = mask.filter(ImageFilter.GaussianBlur(10))
    empty = Image.composite(repaired, empty, blend_mask)

    # A mild dark wash hides clone seams while keeping the Seoul subway mood.
    wash = Image.new("RGBA", empty.size, (0, 0, 0, 0))
    wash_draw = ImageDraw.Draw(wash)
    wash_draw.rectangle((0, 0, empty.size[0], empty.size[1]), fill=(0, 0, 0, 48))
    wash_draw.rectangle((0, int(empty.size[1] * 0.72), empty.size[0], empty.size[1]), fill=(0, 0, 0, 62))
    empty = Image.alpha_composite(empty.convert("RGBA"), wash).convert("RGB")
    empty.save(IMG_DIR / "combat_empty_battlefield.png")
    empty.save(IMG_DIR / "combat_empty_stage_plate.png")


def main():
    write_transparent_sprites()
    inpaint_empty_battlefield()
    for name in [
        "combat_empty_battlefield.png",
        "combat_empty_stage_plate.png",
        *[f"combat_sprite_{key}.png" for key in SPRITES],
    ]:
        image = Image.open(IMG_DIR / name)
        print(f"{name}: {image.size[0]}x{image.size[1]} {image.mode}")


if __name__ == "__main__":
    main()

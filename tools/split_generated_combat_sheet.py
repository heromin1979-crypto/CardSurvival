from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / "assets" / "images"


def connected_components(alpha):
    height, width = alpha.shape
    visited = np.zeros((height, width), dtype=bool)
    labels = np.zeros((height, width), dtype=np.int32)
    components = []
    label = 0

    for y in range(height):
        xs = np.where(alpha[y] & ~visited[y])[0]
        for start_x in xs:
            if visited[y, start_x] or not alpha[y, start_x]:
                continue
            stack = [(start_x, y)]
            visited[y, start_x] = True
            pixels = []
            min_x = max_x = start_x
            min_y = max_y = y
            count = 0

            while stack:
                x, yy = stack.pop()
                pixels.append((x, yy))
                count += 1
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, yy)
                max_y = max(max_y, yy)

                for nx, ny in ((x + 1, yy), (x - 1, yy), (x, yy + 1), (x, yy - 1)):
                    if 0 <= nx < width and 0 <= ny < height and not visited[ny, nx] and alpha[ny, nx]:
                        visited[ny, nx] = True
                        stack.append((nx, ny))

            if count > 1500:
                label += 1
                for x, yy in pixels:
                    labels[yy, x] = label
                components.append((min_x, min_y, max_x + 1, max_y + 1, count, label))

    return sorted(components, key=lambda box: box[0]), labels


def padded_box(box, alpha, pad=24):
    x1, y1, x2, y2, _count, _label = box
    return (
        max(x1 - pad, 0),
        max(y1 - pad, 0),
        min(x2 + pad, alpha.shape[1]),
        min(y2 + pad, alpha.shape[0]),
    )


def main():
    sheet = Image.open(IMG_DIR / "combat_generated_character_monster_sheet_v1_alpha.png").convert("RGBA")
    alpha = np.asarray(sheet)[..., 3] > 18
    height, width = alpha.shape

    labels = [
        "combat_generated_survivor_rifle_v1.png",
        "combat_generated_survivor_pistol_v1.png",
        "combat_generated_survival_dog_v1.png",
        "combat_generated_infected_common_v1.png",
        "combat_generated_infected_brute_v1.png",
        "combat_generated_infected_screamer_v1.png",
    ]
    components, labels_by_pixel = connected_components(alpha)
    print("components:", [(box[0], box[1], box[2], box[3], box[4]) for box in components])

    for name, component in zip(labels, components[: len(labels)]):
        box = padded_box(component, alpha)
        crop = sheet.crop(box)
        crop_arr = np.array(crop)
        x1, y1, x2, y2 = box
        component_mask = labels_by_pixel[y1:y2, x1:x2] == component[5]
        crop_arr[..., 3] = np.where(component_mask, crop_arr[..., 3], 0)
        crop = Image.fromarray(crop_arr, "RGBA")
        crop.save(IMG_DIR / name)
        print(f"{name}: {crop.size[0]}x{crop.size[1]}")


if __name__ == "__main__":
    main()

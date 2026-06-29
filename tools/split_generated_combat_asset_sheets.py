from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / "assets" / "images"


def connected_components(alpha: np.ndarray) -> tuple[list[tuple[int, int, int, int, int, int]], np.ndarray]:
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
            stack = [(int(start_x), y)]
            visited[y, start_x] = True
            pixels = []
            min_x = max_x = int(start_x)
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

    return components, labels


def save_component(sheet: Image.Image, labels_by_pixel: np.ndarray, component, out_name: str, pad: int = 24) -> None:
    x1, y1, x2, y2, _count, label = component
    x1 = max(x1 - pad, 0)
    y1 = max(y1 - pad, 0)
    x2 = min(x2 + pad, sheet.width)
    y2 = min(y2 + pad, sheet.height)

    crop = sheet.crop((x1, y1, x2, y2))
    crop_arr = np.array(crop)
    mask = labels_by_pixel[y1:y2, x1:x2] == label
    crop_arr[..., 3] = np.where(mask, crop_arr[..., 3], 0)
    Image.fromarray(crop_arr, "RGBA").save(IMG_DIR / out_name)


def save_trimmed_box(sheet: Image.Image, box: tuple[int, int, int, int], out_name: str, pad: int = 18) -> None:
    crop = sheet.crop(box)
    arr = np.array(crop)
    alpha = arr[..., 3] > 18
    ys, xs = np.where(alpha)
    if xs.size == 0:
        raise ValueError(f"No visible pixels in box for {out_name}")

    x1 = max(int(xs.min()) - pad, 0)
    y1 = max(int(ys.min()) - pad, 0)
    x2 = min(int(xs.max()) + pad + 1, crop.width)
    y2 = min(int(ys.max()) + pad + 1, crop.height)
    crop.crop((x1, y1, x2, y2)).save(IMG_DIR / out_name)


def split_components(sheet_name: str, output_names: list[str], sort_mode: str = "x") -> None:
    sheet = Image.open(IMG_DIR / sheet_name).convert("RGBA")
    alpha = np.asarray(sheet)[..., 3] > 18
    components, labels_by_pixel = connected_components(alpha)

    if sort_mode == "x":
        components = sorted(components, key=lambda box: box[0])
    elif sort_mode == "row_x":
        components = sorted(components, key=lambda box: (box[1] // 220, box[0]))
    else:
        raise ValueError(f"Unknown sort mode: {sort_mode}")

    if len(components) < len(output_names):
        raise ValueError(f"{sheet_name}: expected {len(output_names)} components, found {len(components)}")

    print(sheet_name, "components", len(components))
    for out_name, component in zip(output_names, components[: len(output_names)]):
        save_component(sheet, labels_by_pixel, component, out_name)
        print(" ", out_name)


def split_base_enemies() -> None:
    sheet = Image.open(IMG_DIR / "combat_generated_base_enemies_sheet_v1_alpha.png").convert("RGBA")
    entries = [
        ("combat_generated_enemy_zombie_patient_dormant_v1.png", (60, 40, 285, 455)),
        ("combat_generated_enemy_zombie_common_v1.png", (300, 45, 570, 455)),
        ("combat_generated_enemy_zombie_runner_v1.png", (545, 70, 840, 455)),
        ("combat_generated_enemy_zombie_brute_v1.png", (825, 30, 1195, 455)),
        ("combat_generated_enemy_raider_v1.png", (1170, 50, 1450, 455)),
        ("combat_generated_enemy_raider_elite_v1.png", (1420, 60, 1730, 455)),
        ("combat_generated_enemy_zombie_horde_v1.png", (40, 455, 395, 835)),
        ("combat_generated_enemy_rabid_dog_v1.png", (360, 455, 690, 835)),
        ("combat_generated_enemy_zombie_acid_v1.png", (690, 430, 925, 835)),
        ("combat_generated_enemy_zombie_bloater_v1.png", (920, 420, 1215, 835)),
        ("combat_generated_enemy_zombie_screamer_v1.png", (1215, 420, 1430, 835)),
        ("combat_generated_enemy_zombie_charger_v1.png", (1415, 500, 1740, 835)),
    ]
    print("combat_generated_base_enemies_sheet_v1_alpha.png manual boxes", len(entries))
    for out_name, box in entries:
        save_trimmed_box(sheet, box, out_name)
        print(" ", out_name)


def main() -> None:
    split_components(
        "combat_generated_weapon_pose_sheet_v1_alpha.png",
        [
            "combat_generated_pose_knife_v1.png",
            "combat_generated_pose_scalpel_v1.png",
            "combat_generated_pose_unarmed_v1.png",
            "combat_generated_pose_spanner_v1.png",
            "combat_generated_pose_bat_v1.png",
        ],
    )
    split_base_enemies()
    split_components(
        "combat_generated_boss_infected_sheet_v1_alpha.png",
        [
            "combat_generated_secret_boss_patient_zero_v1.png",
            "combat_generated_secret_boss_radiation_colossus_v1.png",
            "combat_generated_secret_boss_acid_queen_v1.png",
            "combat_generated_secret_boss_horde_mother_v1.png",
            "combat_generated_secret_boss_frozen_giant_v1.png",
            "combat_generated_secret_boss_fire_mutant_v1.png",
            "combat_generated_secret_boss_rainstorm_beast_v1.png",
            "combat_generated_secret_boss_acid_rain_monster_v1.png",
        ],
    )
    split_components(
        "combat_generated_boss_human_beast_machine_sheet_v1_alpha.png",
        [
            "combat_generated_secret_boss_raider_warlord_v1.png",
            "combat_generated_secret_boss_ghost_sniper_v1.png",
            "combat_generated_secret_boss_cult_leader_v1.png",
            "combat_generated_secret_boss_mutant_tiger_v1.png",
            "combat_generated_secret_boss_sewer_king_v1.png",
            "combat_generated_secret_boss_mutant_queen_bee_v1.png",
            "combat_generated_secret_boss_wild_dog_alpha_v1.png",
            "combat_generated_secret_boss_military_ai_drone_v1.png",
            "combat_generated_secret_boss_mad_chaebol_v1.png",
        ],
    )
    split_components(
        "combat_generated_special_event_enemies_sheet_v1_alpha.png",
        [
            "combat_generated_secret_experiment_x_v1.png",
            "combat_generated_secret_blizzard_wraith_v1.png",
            "combat_generated_secret_deserted_comrade_v1.png",
            "combat_generated_secret_infected_lee_jaehoon_v1.png",
            "combat_generated_secret_debt_collector_v1.png",
            "combat_generated_secret_mutant_chef_v1.png",
            "combat_generated_secret_infected_doctor_v1.png",
            "combat_generated_secret_mad_mechanic_v1.png",
            "combat_generated_secret_food_raider_v1.png",
        ],
    )
    split_components(
        "combat_generated_special_extra_enemies_sheet_v1_alpha.png",
        [
            "combat_generated_secret_black_market_broker_v1.png",
            "combat_generated_secret_food_warlord_v1.png",
            "combat_generated_secret_subway_phantom_v1.png",
            "combat_generated_secret_mutated_crocodile_variant_v1.png",
            "combat_generated_secret_acid_spitter_elite_v1.png",
            "combat_generated_secret_elite_bodyguard_raider_v1.png",
        ],
    )


if __name__ == "__main__":
    main()

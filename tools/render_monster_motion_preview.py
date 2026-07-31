from __future__ import annotations

import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output" / "combat"
PREVIEW_PATH = OUT_DIR / "monster_motion_preview_active_sheets.png"
AUDIT_PATH = OUT_DIR / "monster_motion_audit.json"
MANIFEST_PATH = ROOT / "assets" / "images" / "combat" / "spritesheets" / "manifest.json"

REMOVED_ENEMIES = {
    "food_raider",
    "black_market_dealer",
    "boss_summer_inferno",
    "boss_monsoon_leviathan",
    "boss_acid_rain_horror",
    "boss_train_conductor",
    "boss_military_ai",
    "boss_engineer_rival",
}


def load_manifest() -> dict[str, dict]:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def run_node_json(script: str):
    result = subprocess.run(
        ["node", "--input-type=module", "-e", script], cwd=ROOT, check=True,
        capture_output=True, text=True, encoding="utf-8",
    )
    return json.loads(result.stdout)


def get_active_enemies() -> list[dict]:
    return run_node_json("""
import('./js/data/GameData.js').then(m => {
  const enemies = m.default.enemies;
  const rows = Object.entries(enemies).map(([id, enemy]) => ({
    id, type: enemy.type ?? '', isBoss: Boolean(enemy.isBoss),
    aiPattern: enemy.aiPattern ?? '', skills: (enemy.specialSkills ?? []).map(skill => skill.id),
  }));
  console.log(JSON.stringify(rows));
});
""")


def get_enemy_sprite_keys() -> dict[str, str]:
    return run_node_json("""
import('./js/ui/combat/combatUiAssets.js').then(({ ENEMY_SPRITE_KEYS }) => {
  console.log(JSON.stringify(ENEMY_SPRITE_KEYS));
});
""")


def load_font(size: int) -> ImageFont.ImageFont:
    for candidate in (Path("C:/Windows/Fonts/consola.ttf"), Path("C:/Windows/Fonts/arial.ttf")):
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def row_labels(sheet: dict) -> dict[int, str]:
    labels: dict[int, list[str]] = {}
    for motion_key, motion in sheet["motions"].items():
        labels.setdefault(motion["row"], []).append(motion_key)
    return {row: " / ".join(keys) for row, keys in labels.items()}


def row_has_content(sheet: Image.Image, row: int, cell_height: int) -> bool:
    return sheet.crop((0, row * cell_height, sheet.width, (row + 1) * cell_height)).getchannel("A").getbbox() is not None


def make_checker(width: int, height: int) -> Image.Image:
    checker = Image.new("RGB", (width, height), (22, 26, 28))
    draw = ImageDraw.Draw(checker)
    for y in range(0, height, 16):
        for x in range(0, width, 16):
            if (x // 16 + y // 16) % 2:
                draw.rectangle((x, y, x + 15, y + 15), fill=(28, 34, 36))
    return checker


def render_preview(active_with_sheets: list[dict], manifest: dict[str, dict]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    font, small_font = load_font(20), load_font(14)
    label_w, row_h, sheet_w, pad = 330, 86, 768, 18

    def block_height(enemy: dict) -> int:
        return row_h * manifest[enemy["sheetKey"]]["rows"] + 54

    width = label_w + sheet_w + pad * 3
    height = pad * 2 + sum(block_height(enemy) for enemy in active_with_sheets)
    canvas = Image.new("RGB", (width, height), (10, 12, 14))
    draw = ImageDraw.Draw(canvas)
    y = pad
    for enemy in active_with_sheets:
        meta = manifest[enemy["sheetKey"]]
        sheet = Image.open(ROOT / meta["src"].lstrip("/")).convert("RGBA")
        cell_height = sheet.height // meta["rows"]
        labels = row_labels(meta)
        block_h = block_height(enemy)
        title = f"{enemy['id']}  [{enemy['type']}{' boss' if enemy['isBoss'] else ''}]"
        skills = ", ".join(enemy["skills"]) if enemy["skills"] else "-"
        draw.rectangle((pad, y, width - pad, y + block_h - 8), outline=(66, 85, 92), width=1)
        draw.text((pad + 10, y + 8), title, fill=(210, 230, 235), font=font)
        draw.text((pad + 10, y + 32), f"ai={enemy['aiPattern']} skills={skills}", fill=(145, 165, 170), font=small_font)
        for row, label in sorted(labels.items()):
            src = sheet.crop((0, row * cell_height, sheet.width, (row + 1) * cell_height))
            src = src.resize((sheet_w, row_h), Image.Resampling.LANCZOS)
            ry = y + 54 + row * row_h
            draw.text((pad + 10, ry + 28), label, fill=(185, 160, 105), font=small_font)
            checker = make_checker(sheet_w, row_h)
            checker.paste(src, (0, 0), src)
            canvas.paste(checker, (label_w + pad * 2, ry))
            draw.rectangle((label_w + pad * 2, ry, label_w + pad * 2 + sheet_w, ry + row_h), outline=(40, 52, 56), width=1)
        y += block_h
    canvas.save(PREVIEW_PATH)


def main() -> None:
    manifest = load_manifest()
    active = get_active_enemies()
    enemy_keys = get_enemy_sprite_keys()
    active_ids = {enemy["id"] for enemy in active}
    active_with_sheets, missing_unique_sheets, invalid_dimensions, empty_rows = [], [], [], []
    for enemy in active:
        sheet_key = enemy_keys.get(enemy["id"])
        meta = manifest.get(sheet_key) if sheet_key else None
        if not meta:
            missing_unique_sheets.append({**enemy, **({"sheetKey": sheet_key} if sheet_key else {})})
            continue
        sheet_path = ROOT / meta["src"].lstrip("/")
        if not sheet_path.exists():
            missing_unique_sheets.append({**enemy, "sheetKey": sheet_key})
            continue
        with Image.open(sheet_path) as image:
            width, height = image.size
            if width % meta["cols"] or height % meta["rows"] or width // meta["cols"] != height // meta["rows"]:
                invalid_dimensions.append({"id": enemy["id"], "sheetKey": sheet_key, "path": sheet_path.relative_to(ROOT).as_posix(), "size": image.size})
            rgba = image.convert("RGBA")
            cell_height = height // meta["rows"]
            for row, motion_label in row_labels(meta).items():
                if not row_has_content(rgba, row, cell_height):
                    empty_rows.append({"id": enemy["id"], "sheetKey": sheet_key, "row": row, "motions": motion_label})
        active_with_sheets.append({**enemy, "sheetKey": sheet_key})
    orphan_sheets = [
        {"enemyId": enemy_id, "sheetKey": sheet_key, "removedEnemy": enemy_id in REMOVED_ENEMIES}
        for enemy_id, sheet_key in enemy_keys.items() if enemy_id not in active_ids
    ]
    render_preview(active_with_sheets, manifest)
    audit = {
        "activeEnemyCount": len(active), "activeUniqueSheetCount": len(active_with_sheets),
        "missingUniqueSheetCount": len(missing_unique_sheets),
        "previewPath": PREVIEW_PATH.relative_to(ROOT).as_posix(),
        "rowContract": {key: row_labels(sheet) for key, sheet in manifest.items()},
        "missingUniqueSheets": missing_unique_sheets, "invalidDimensions": invalid_dimensions,
        "emptyRows": empty_rows, "orphanEnemySpriteMappings": orphan_sheets,
    }
    AUDIT_PATH.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(audit, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

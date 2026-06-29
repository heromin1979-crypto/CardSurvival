from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output" / "combat"
PREVIEW_PATH = OUT_DIR / "monster_motion_preview_active_sheets.png"
AUDIT_PATH = OUT_DIR / "monster_motion_audit.json"

ROW_LABELS = [
    "row0 idle / combat-ready",
    "row1 attack / special / advance",
    "row2 hit / debuff / knockback",
    "row3 death",
]

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


def get_active_enemies() -> list[dict]:
    script = """
import('./js/data/GameData.js').then(m => {
  const enemies = m.default.enemies;
  const rows = Object.entries(enemies).map(([id, enemy]) => ({
    id,
    type: enemy.type ?? '',
    isBoss: Boolean(enemy.isBoss),
    aiPattern: enemy.aiPattern ?? '',
    skills: (enemy.specialSkills ?? []).map(skill => skill.id),
  }));
  console.log(JSON.stringify(rows));
});
"""
    result = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return json.loads(result.stdout)


def parse_combat_ui_maps() -> tuple[dict[str, str], dict[str, Path]]:
    source = (ROOT / "js" / "ui" / "CombatUI.js").read_text(encoding="utf-8")

    sheet_block = re.search(
        r"const COMBAT_SPRITE_SHEETS = \{(?P<body>.*?)\};",
        source,
        re.S,
    ).group("body")
    key_block = re.search(
        r"const ENEMY_SPRITE_KEYS = \{(?P<body>.*?)\};",
        source,
        re.S,
    ).group("body")

    sheets = {}
    for key, src in re.findall(r"(\w+):\s*spriteSheet\('([^']+)'\)", sheet_block):
        sheets[key] = ROOT / src.lstrip("/")

    enemy_keys = {}
    for enemy_id, sheet_key in re.findall(r"(\w+):\s*'([^']+)'", key_block):
        enemy_keys[enemy_id] = sheet_key

    return enemy_keys, sheets


def load_font(size: int) -> ImageFont.ImageFont:
    candidates = [
        Path("C:/Windows/Fonts/consola.ttf"),
        Path("C:/Windows/Fonts/arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def alpha_bounds(img: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = img.getchannel("A")
    return alpha.getbbox()


def row_has_content(sheet: Image.Image, row: int) -> bool:
    row_img = sheet.crop((0, row * 256, 1536, (row + 1) * 256))
    return alpha_bounds(row_img) is not None


def render_preview(active_with_sheets: list[dict], sheets: dict[str, Path]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    font = load_font(20)
    small_font = load_font(14)
    label_w = 330
    row_h = 86
    sheet_w = 768
    block_h = row_h * 4 + 36
    pad = 18
    width = label_w + sheet_w + pad * 3
    height = pad * 2 + block_h * len(active_with_sheets)

    canvas = Image.new("RGB", (width, height), (10, 12, 14))
    draw = ImageDraw.Draw(canvas)

    y = pad
    for enemy in active_with_sheets:
      sheet = Image.open(sheets[enemy["sheetKey"]]).convert("RGBA")
      title = f"{enemy['id']}  [{enemy['type']}{' boss' if enemy['isBoss'] else ''}]"
      skills = ", ".join(enemy["skills"]) if enemy["skills"] else "-"

      draw.rectangle((pad, y, width - pad, y + block_h - 8), outline=(66, 85, 92), width=1)
      draw.text((pad + 10, y + 8), title, fill=(210, 230, 235), font=font)
      draw.text((pad + 10, y + 32), f"ai={enemy['aiPattern']} skills={skills}", fill=(145, 165, 170), font=small_font)

      for row, row_label in enumerate(ROW_LABELS):
          src = sheet.crop((0, row * 256, 1536, (row + 1) * 256))
          src = src.resize((sheet_w, row_h), Image.Resampling.LANCZOS)
          ry = y + 54 + row * row_h
          draw.text((pad + 10, ry + 28), row_label, fill=(185, 160, 105), font=small_font)
          checker = Image.new("RGB", (sheet_w, row_h), (22, 26, 28))
          for cy in range(0, row_h, 16):
              for cx in range(0, sheet_w, 16):
                  if (cx // 16 + cy // 16) % 2:
                      draw_cell = ImageDraw.Draw(checker)
                      draw_cell.rectangle((cx, cy, cx + 15, cy + 15), fill=(28, 34, 36))
          checker.paste(src, (0, 0), src)
          canvas.paste(checker, (label_w + pad * 2, ry))
          draw.rectangle((label_w + pad * 2, ry, label_w + pad * 2 + sheet_w, ry + row_h), outline=(40, 52, 56), width=1)

      y += block_h

    canvas.save(PREVIEW_PATH)


def main() -> None:
    active = get_active_enemies()
    enemy_keys, sheets = parse_combat_ui_maps()

    active_ids = {enemy["id"] for enemy in active}
    active_with_sheets = []
    missing_unique_sheets = []
    invalid_dimensions = []
    empty_rows = []

    for enemy in active:
        sheet_key = enemy_keys.get(enemy["id"])
        if not sheet_key:
            missing_unique_sheets.append(enemy)
            continue

        sheet_path = sheets.get(sheet_key)
        if not sheet_path or not sheet_path.exists():
            missing_unique_sheets.append({**enemy, "sheetKey": sheet_key})
            continue

        with Image.open(sheet_path) as img:
            if img.size != (1536, 1024):
                invalid_dimensions.append({
                    "id": enemy["id"],
                    "sheetKey": sheet_key,
                    "path": str(sheet_path.relative_to(ROOT)).replace("\\", "/"),
                    "size": img.size,
                })
            img_rgba = img.convert("RGBA")
            for row in range(4):
                if not row_has_content(img_rgba, row):
                    empty_rows.append({"id": enemy["id"], "sheetKey": sheet_key, "row": row})

        active_with_sheets.append({**enemy, "sheetKey": sheet_key})

    orphan_sheets = []
    for enemy_id, sheet_key in enemy_keys.items():
        if enemy_id not in active_ids:
            orphan_sheets.append({
                "enemyId": enemy_id,
                "sheetKey": sheet_key,
                "removedEnemy": enemy_id in REMOVED_ENEMIES,
            })

    render_preview(active_with_sheets, sheets)

    audit = {
        "activeEnemyCount": len(active),
        "activeUniqueSheetCount": len(active_with_sheets),
        "missingUniqueSheetCount": len(missing_unique_sheets),
        "previewPath": str(PREVIEW_PATH.relative_to(ROOT)).replace("\\", "/"),
        "rowContract": ROW_LABELS,
        "missingUniqueSheets": missing_unique_sheets,
        "invalidDimensions": invalid_dimensions,
        "emptyRows": empty_rows,
        "orphanEnemySpriteMappings": orphan_sheets,
    }
    AUDIT_PATH.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(audit, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

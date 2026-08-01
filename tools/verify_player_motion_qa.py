"""Verify Task 8 player QA JSON and generate its Markdown companion."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
EXPECTED = ("doctor_f", "soldier_m", "firefighter_m", "homeless_m", "chef_m", "engineer_m")
MOTIONS = ("idle", "melee", "ranged", "support", "guard", "move", "hit", "death")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audit-json", default="docs/analysis/PLAYER_MOTION_QA.json")
    parser.add_argument("--markdown", default="docs/analysis/PLAYER_MOTION_QA.md")
    parser.add_argument("--write-markdown", action="store_true")
    args = parser.parse_args()
    audit_path = ROOT / args.audit_json
    audit = json.loads(audit_path.read_text(encoding="utf-8"))
    if tuple(entry["sheetKey"] for entry in audit["characters"]) != EXPECTED:
        raise SystemExit("player QA roster mismatch")
    if tuple(audit["motions"]) != MOTIONS or audit["openReworkCount"] != 0:
        raise SystemExit("player QA motion/rework contract mismatch")
    for entry in audit["characters"]:
        path = ROOT / entry["path"].lstrip("/")
        image = Image.open(path)
        if image.mode != "RGBA" or image.size != (1536, 2048):
            raise SystemExit(f"invalid runtime sheet: {entry['sheetKey']}")
        if hashlib.sha256(path.read_bytes()).hexdigest() != entry["sha256"]:
            raise SystemExit(f"sheet hash drift: {entry['sheetKey']}")
        residue = sum(
            1 for red, green, blue, alpha in image.get_flattened_data()
            if alpha > 12 and green > 150 and green > red * 1.55
            and green > blue * 1.55 and green - max(red, blue) > 55
        )
        if residue > 200:
            raise SystemExit(f"green chroma residue: {entry['sheetKey']} ({residue})")
        if any(row["verdict"] != "PASS" for row in entry["rows"]):
            raise SystemExit(f"row QA failed: {entry['sheetKey']}")
    lines = [
        "# Player Combat Motion QA",
        "",
        "Generated from `PLAYER_MOTION_QA.json`; do not edit by hand.",
        "",
        "| Sheet | Rows | Identity | Full body | Clipping |",
        "|---|---:|---|---|---|",
    ]
    for entry in audit["characters"]:
        qa = entry["manualQa"]
        lines.append(f"| `{entry['sheetKey']}` | 8/8 | {qa['identity']} | {qa['fullBody']} | {qa['clipping']} |")
    lines.extend(["", f"Open rework: **{audit['openReworkCount']}**", ""])
    markdown = "\n".join(lines)
    markdown_path = ROOT / args.markdown
    if args.write_markdown:
        markdown_path.write_text(markdown, encoding="utf-8")
    elif not markdown_path.is_file() or markdown_path.read_text(encoding="utf-8") != markdown:
        raise SystemExit("player QA Markdown drift")
    print("verified 6 player motion QA records")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

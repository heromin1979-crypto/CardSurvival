"""Verify automatic metrics against independent, manually authored Task 8 observations."""
from __future__ import annotations

import argparse
import importlib.util
import json
import re
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
EXPECTED = ("doctor_f", "soldier_m", "firefighter_m", "homeless_m", "chef_m", "engineer_m")
MOTIONS = ("idle", "melee", "ranged", "support", "guard", "move", "hit", "death")
NOTE_FIELDS = ("pose", "weapon", "anchor", "clipping", "chroma")
ZERO_CHROMA = {
    "opaqueGreen": 0,
    "fringeGreen": 0,
    "hiddenRgb": 0,
    "boundaryGreen": 0,
    "removedComponents": 0,
    "staleAllowlist": 0,
}
SKILL_MOTIONS = {
    "doctor_precise_cut": "melee", "doctor_triage": "support", "doctor_diagnose": "support",
    "soldier_burst_fire": "ranged", "soldier_suppressive_fire": "ranged", "soldier_tactical_shift": "move",
    "firefighter_axe_swing": "melee", "firefighter_rescue_guard": "guard", "firefighter_force_advance": "move",
    "homeless_dirty_fighting": "melee", "homeless_slip_away": "move", "homeless_scavenge_weapon": "support",
    "chef_knife_flurry": "melee", "chef_field_ration": "support", "chef_hot_pan": "melee",
    "engineer_wrench_strike": "melee", "engineer_improvised_cover": "guard", "engineer_shock_trap": "support",
}
RENDERER_PATH = ROOT / "tools/render_player_motion_preview.py"
NORMALIZER_PATH = ROOT / "tools/normalize_combat_sprite_sheets.py"
MANIFEST_PATH = ROOT / "assets/images/combat/spritesheets/manifest.json"
SKILLS_PATH = ROOT / "js/data/combatSkills.js"


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def verify_skill_motions() -> None:
    source = SKILLS_PATH.read_text(encoding="utf-8")
    match = re.search(r"export const SKILL_MOTION_KEYS = Object\.freeze\(\{(.*?)\n\}\);", source, re.S)
    if not match:
        raise ValueError("skill motion registry not found")
    actual = dict(re.findall(r"^\s*([a-z0-9_]+):\s*'([a-z0-9_]+)'", match.group(1), re.M))
    for skill_id, motion in SKILL_MOTIONS.items():
        if actual.get(skill_id) != motion:
            raise ValueError(f"skill motion mismatch: {skill_id}")


def verify_manifest(manifest: dict, key: str) -> None:
    entry = manifest.get(key)
    if not isinstance(entry, dict) or entry.get("cols") != 6 or entry.get("rows") != 8:
        raise ValueError(f"manifest grid mismatch: {key}")
    if tuple(entry.get("motions", {})) != MOTIONS:
        raise ValueError(f"manifest row order mismatch: {key}")
    if tuple(motion.get("row") for motion in entry["motions"].values()) != tuple(range(8)):
        raise ValueError(f"manifest row index mismatch: {key}")
    if entry.get("aliases", {}).get("downed") != "death":
        raise ValueError(f"manifest downed alias mismatch: {key}")


def verify_manual_entry(entry: dict, metrics: dict) -> None:
    if set(entry) != {"sheetKey", "imageSha256", "status", "rework", "rows"}:
        raise ValueError(f"manual entry schema mismatch: {entry.get('sheetKey')}")
    key = entry["sheetKey"]
    if entry["imageSha256"] != metrics["fileSha256"]:
        raise ValueError(f"manual image hash drift: {key}")
    if entry["status"] != "PASS" or entry["rework"] is not None:
        raise ValueError(f"manual sheet remains open: {key}")
    rows = entry["rows"]
    if not isinstance(rows, list) or len(rows) != len(MOTIONS):
        raise ValueError(f"manual row count mismatch: {key}")
    for index, row in enumerate(rows):
        if set(row) != {"row", "motion", *NOTE_FIELDS, "status", "rework"}:
            raise ValueError(f"manual row schema mismatch: {key}/{index}")
        if row["row"] != index or row["motion"] != MOTIONS[index]:
            raise ValueError(f"manual row order mismatch: {key}/{index}")
        if row["status"] != "PASS" or row["rework"] is not None:
            raise ValueError(f"manual row remains open: {key}/{row['motion']}")
        if any(not isinstance(row[field], str) or not row[field].strip() for field in NOTE_FIELDS):
            raise ValueError(f"manual observation missing: {key}/{row['motion']}")


def markdown(metrics: dict, observations: dict) -> str:
    metric_by_key = {entry["sheetKey"]: entry for entry in metrics["characters"]}
    lines = [
        "# Player Combat Motion QA", "",
        "Generated from automatic PNG metrics plus independently authored row observations.", "",
        "| Sheet | Motion | Status | Pose / weapon observation | Chroma metrics |", "|---|---|---|---|---|",
    ]
    for character in observations["characters"]:
        chroma = metric_by_key[character["sheetKey"]]["chromaMetrics"]
        chroma_text = ", ".join(f"{key}={value}" for key, value in chroma.items())
        for row in character["rows"]:
            lines.append(
                f"| `{character['sheetKey']}` | `{row['motion']}` | {row['status']} | "
                f"{row['pose']} / {row['weapon']} | {chroma_text} |"
            )
    lines.extend(["", "Open rework: **0**", ""])
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--metrics-json", default="docs/analysis/PLAYER_MOTION_QA.json")
    parser.add_argument("--observations", default="docs/analysis/PLAYER_MOTION_MANUAL_OBSERVATIONS.json")
    parser.add_argument("--markdown", default="docs/analysis/PLAYER_MOTION_QA.md")
    parser.add_argument("--write-markdown", action="store_true")
    args = parser.parse_args()
    metrics = json.loads((ROOT / args.metrics_json).read_text(encoding="utf-8"))
    observations = json.loads((ROOT / args.observations).read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    renderer = load_module("player_motion_renderer", RENDERER_PATH)
    normalizer = load_module("player_motion_normalizer", NORMALIZER_PATH)
    if metrics.get("version") != 2 or tuple(metrics.get("motions", ())) != MOTIONS:
        raise SystemExit("automatic player QA schema mismatch")
    if observations.get("version") != 2 or tuple(observations.get("motions", ())) != MOTIONS:
        raise SystemExit("manual player QA schema mismatch")
    if tuple(entry.get("sheetKey") for entry in metrics.get("characters", ())) != EXPECTED:
        raise SystemExit("automatic player QA roster mismatch")
    if tuple(entry.get("sheetKey") for entry in observations.get("characters", ())) != EXPECTED:
        raise SystemExit("manual player QA roster mismatch")
    try:
        verify_skill_motions()
        for metric, manual in zip(metrics["characters"], observations["characters"], strict=True):
            key = metric["sheetKey"]
            verify_manifest(manifest, key)
            path = ROOT / metric["path"].lstrip("/")
            image = Image.open(path).convert("RGBA")
            actual = renderer.image_metrics(key, path, image, normalizer)
            if metric != actual:
                raise ValueError(f"automatic image metrics drift: {key}")
            if metric["chromaMetrics"] != ZERO_CHROMA:
                raise ValueError(f"strict chroma residue: {key} {metric['chromaMetrics']}")
            if any(row["distinctFrameCount"] < 2 or any(value <= 0 for value in row["alphaCoverage"])
                   for row in metric["rows"]):
                raise ValueError(f"invalid automatic row metrics: {key}")
            verify_manual_entry(manual, metric)
    except (KeyError, TypeError, ValueError) as error:
        raise SystemExit(str(error)) from error
    output = markdown(metrics, observations)
    markdown_path = ROOT / args.markdown
    if args.write_markdown:
        markdown_path.write_text(output, encoding="utf-8")
    elif not markdown_path.is_file() or markdown_path.read_text(encoding="utf-8") != output:
        raise SystemExit("player QA Markdown drift")
    print("verified 6 player motion QA records with 48 manual row observations")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

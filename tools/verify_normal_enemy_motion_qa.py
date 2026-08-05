"""Cross-check reviewed normal-enemy motion rows against production data and PNGs."""
from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "assets/images/combat/spritesheets/manifest.json"
RECIPE_PATH = ROOT / "art_sources/combat/task7_normal/assembly_recipe.json"
QA_PATH = ROOT / "docs/analysis/NORMAL_ENEMY_MOTION_QA.json"
QA_MARKDOWN_PATH = ROOT / "docs/analysis/NORMAL_ENEMY_MOTION_QA.md"
ASSEMBLY_PATH = ROOT / "tools/build_normal_enemy_motion_sheets.py"


def _assembly():
    spec = importlib.util.spec_from_file_location("normal_enemy_qa_assembly", ASSEMBLY_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {ASSEMBLY_PATH}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def render_markdown(qa: dict) -> str:
    lines = [
        "# 일반 몬스터 전투 모션 QA",
        "",
        "검수 일자: 2026-08-01",
        f"프리뷰: `{qa['reviewedPreview']}`",
        "격자 규격: 모든 시트 6열, 셀당 256×256px",
        "",
        "이 문서는 `NORMAL_ENEMY_MOTION_QA.json`의 수동 PNG 관찰과 production manifest 계약을 조합해 생성한다.",
        "`python tools/verify_normal_enemy_motion_qa.py --check`는 검수 PNG hash, 51개 행의 motion/locomotion, 빈 프레임과 chroma 잔여를 대조한다.",
        "",
        "## 확장 시트 9종 전 행 검수",
        "",
    ]
    for sheet_key, sheet in qa["sheets"].items():
        lines.extend([
            f"### `{sheet_key}` — {len(sheet['rows'])}행",
            "",
            f"검수 PNG SHA-256: `{sheet['reviewedPixelSha256']}`",
            "",
            "| 행 | 모션 | 자세 진행(수동 PNG 관찰) | 접지·클리핑(수동 PNG 관찰) | 투명·chroma | 이동 계약 |",
            "|---:|---|---|---|---|---|",
        ])
        for row in sheet["rows"]:
            movement = "대상 방향 접근" if row["locomotion"] == "approach" else "제자리"
            lines.append(
                f"| {row['row']} | `{row['motion']}` | {row['pose']} | {row['anchor']} "
                f"| 자동 검사 통과 | `{row['locomotion']}`; {movement} |"
            )
        lines.append("")
    lines.extend([
        "## 기존 4행 시트 3종 회귀",
        "",
        "`zombie_common`, `zombie_horde`, `rabid_dog`는 기존 4행 계약(`idle`, `basic_attack`, `hit`, `death`)을 유지한다.",
        "세 시트 모두 `basic_attack`은 production manifest에서 `approach`, 나머지 행은 `stationary`다.",
        "",
        "## 자동 대조 범위",
        "",
        "- 확장 시트 9개와 검수 행 51개를 누락 없이 확인한다.",
        "- 각 행의 motion key와 `stationary`/`approach` 값을 실제 manifest와 비교한다.",
        "- 검수 당시 PNG SHA-256을 현재 runtime PNG 및 deterministic assembly recipe와 비교한다.",
        "- 모든 행의 6프레임 foreground coverage가 0보다 큰지 확인한다.",
        "- 각 시트의 투명 배경과 chroma 잔여를 production normalizer로 검사한다.",
        "",
    ])
    return "\n".join(lines)


def verify() -> tuple[dict, dict]:
    assembly = _assembly()
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    recipe = json.loads(RECIPE_PATH.read_text(encoding="utf-8"))
    qa = json.loads(QA_PATH.read_text(encoding="utf-8"))
    if qa.get("version") != 1:
        raise ValueError("normal enemy motion QA version mismatch")
    if set(qa.get("sheets", {})) != set(recipe.get("targets", {})):
        raise ValueError("reviewed sheet inventory does not match the assembly recipe")

    normalizer = assembly._normalizer()
    verified_rows = 0
    for sheet_key, reviewed in qa["sheets"].items():
        sheet = manifest.get(sheet_key)
        target = recipe["targets"][sheet_key]
        if sheet is None:
            raise ValueError(f"missing manifest sheet: {sheet_key}")
        if reviewed.get("reviewedPixelSha256") != target.get("pixelSha256"):
            raise ValueError(f"reviewed PNG hash is stale: {sheet_key}")

        target_path = assembly.resolve_repo_path(target["path"])
        with Image.open(target_path) as source:
            image = source.convert("RGBA")
        if assembly.pixel_sha256(image) != reviewed["reviewedPixelSha256"]:
            raise ValueError(f"runtime PNG changed after visual review: {sheet_key}")
        if any(normalizer.analyze_chroma_grid(image, sheet["cols"], sheet["rows"], target_path).values()):
            raise ValueError(f"reviewed PNG has chroma artifacts: {sheet_key}")

        motions_by_row = {
            definition["row"]: (motion, definition["locomotion"])
            for motion, definition in sheet["motions"].items()
        }
        rows = reviewed.get("rows", [])
        if len(rows) != sheet["rows"] or {entry.get("row") for entry in rows} != set(range(sheet["rows"])):
            raise ValueError(f"reviewed rows do not cover the manifest grid: {sheet_key}")
        coverage = target.get("foregroundCoverage", [])
        if len(coverage) != sheet["rows"]:
            raise ValueError(f"foreground coverage rows are stale: {sheet_key}")
        for entry in rows:
            row = entry["row"]
            expected_motion, expected_locomotion = motions_by_row[row]
            if entry.get("motion") != expected_motion or entry.get("locomotion") != expected_locomotion:
                raise ValueError(f"manifest/QA row contract mismatch: {sheet_key}:{row}")
            if not entry.get("pose") or not entry.get("anchor"):
                raise ValueError(f"missing manual visual observation: {sheet_key}:{row}")
            if len(coverage[row]) != sheet["cols"] or any(value <= 0 for value in coverage[row]):
                raise ValueError(f"blank reviewed frame: {sheet_key}:{row}")
            verified_rows += 1

    return {"verifiedSheets": len(qa["sheets"]), "verifiedRows": verified_rows}, qa


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    if args.check == args.write:
        parser.error("choose exactly one of --check or --write")
    result, qa = verify()
    markdown = render_markdown(qa)
    if args.write:
        QA_MARKDOWN_PATH.write_text(markdown, encoding="utf-8")
    elif not QA_MARKDOWN_PATH.exists() or QA_MARKDOWN_PATH.read_text(encoding="utf-8") != markdown:
        raise SystemExit("normal enemy motion QA markdown is stale; run with --write")
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

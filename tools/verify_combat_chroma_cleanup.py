"""Verify immutable Task 6 cleanup evidence and the current 23-sheet descendants."""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import io
import json
import sys
import zipfile
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from provenance_hash import PROVENANCE_HASH_SCHEME, provenance_sha256


ROOT = Path(__file__).resolve().parents[1]
ZERO_CHROMA = {
    "opaqueGreen": 0,
    "fringeGreen": 0,
    "hiddenRgb": 0,
    "boundaryGreen": 0,
    "removedComponents": 0,
    "staleAllowlist": 0,
}


def file_sha256(path: Path) -> str:
    return provenance_sha256(path)


def bytes_sha256(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def frame_metrics(before: Image.Image, after: Image.Image, is_chroma) -> dict:
    """Retained public integrity helper used by cleanup fixture tests."""
    if before.size != after.size:
        raise ValueError(f"frame dimensions changed from {before.size} to {after.size}")
    alpha_before = alpha_after = unexpected_loss = changed_pixels = 0
    for source, result in zip(
        before.convert("RGBA").get_flattened_data(),
        after.convert("RGBA").get_flattened_data(),
        strict=True,
    ):
        alpha_before += int(source[3] > 0)
        alpha_after += int(result[3] > 0)
        unexpected_loss += int(result[3] < source[3] and not is_chroma(source))
        changed_pixels += int(source != result)
    return {
        "alphaCoverageBefore": alpha_before,
        "alphaCoverageAfter": alpha_after,
        "unexpectedAlphaLoss": unexpected_loss,
        "changedPixels": changed_pixels,
    }


def resolve_repo_path(root: Path, value: str) -> Path:
    if not isinstance(value, str) or not value.startswith("/") or value.startswith("//") or "\\" in value:
        raise ValueError(f"invalid repository path: {value!r}")
    path = (root / value.lstrip("/")).resolve()
    try:
        path.relative_to(root.resolve())
    except ValueError as error:
        raise ValueError(f"repository path escapes root: {value}") from error
    return path


def load_normalizer(root: Path):
    path = root / "tools/normalize_combat_sprite_sheets.py"
    spec = importlib.util.spec_from_file_location("task6_chroma_normalizer", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def _mask_from_zip(archive: zipfile.ZipFile, entry: str, expected_sha256: str) -> Image.Image:
    data = archive.read(entry)
    if bytes_sha256(data) != expected_sha256:
        raise ValueError(f"Task 6 alpha evidence drift: {entry}")
    return Image.open(io.BytesIO(data)).convert("L")


def build_report(root: Path) -> dict:
    root = root.resolve()
    evidence_path = root / "art_sources/combat/task6_chroma/evidence_manifest.json"
    evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
    if (evidence.get("version") != 2 or evidence.get("hashScheme") != PROVENANCE_HASH_SCHEME
            or evidence.get("sheetCount") != 23
            or len(evidence.get("sheets", [])) != 23):
        raise ValueError("Task 6 evidence contract mismatch")
    archive_path = resolve_repo_path(root, evidence["archive"])
    if file_sha256(archive_path) != evidence["archiveSha256"]:
        raise ValueError("Task 6 alpha evidence archive drift")
    normalizer = load_normalizer(root)
    sheets = []
    with zipfile.ZipFile(archive_path) as archive:
        for source in evidence["sheets"]:
            current_path = resolve_repo_path(root, source["path"])
            current_bytes = current_path.read_bytes()
            if bytes_sha256(current_bytes) != source["currentSha256"]:
                raise ValueError(f"current Task 6 descendant drift: {source['sheetKey']}")
            current = Image.open(io.BytesIO(current_bytes)).convert("RGBA")
            before_mask = _mask_from_zip(
                archive, source["beforeMaskEntry"], source["beforeMaskSha256"],
            )
            after_alpha = _mask_from_zip(
                archive, source["afterAlphaEntry"], source["afterAlphaSha256"],
            )
            expected_size = (source["width"], source["height"])
            if before_mask.size != expected_size or after_alpha.size != expected_size:
                raise ValueError(f"Task 6 mask dimensions drift: {source['sheetKey']}")
            historical_loss = sum(
                result < baseline
                for baseline, result in zip(
                    before_mask.get_flattened_data(), after_alpha.get_flattened_data(), strict=True,
                )
            )
            direct = source["currentPolicy"] == "direct"
            if direct:
                if (current.size != expected_size or source.get("supersededBy") is not None
                        or source.get("supersededSource") is not None):
                    raise ValueError(f"Task 6 direct descendant contract mismatch: {source['sheetKey']}")
                current_alpha = current.getchannel("A")
                current_loss = sum(
                    result < baseline
                    for baseline, result in zip(
                        before_mask.get_flattened_data(), current_alpha.get_flattened_data(), strict=True,
                    )
                )
                if source["currentSha256"] != source["task6AfterSha256"]:
                    raise ValueError(f"Task 6 direct descendant hash mismatch: {source['sheetKey']}")
            elif source["currentPolicy"] == "superseded" and source.get("supersededBy"):
                current_loss = None
                superseded_source = resolve_repo_path(root, source["supersededSource"])
                if file_sha256(superseded_source) != source["task6AfterSha256"]:
                    raise ValueError(f"Task 6 superseded source lineage drift: {source['sheetKey']}")
            else:
                raise ValueError(f"Task 6 current policy mismatch: {source['sheetKey']}")
            cols = source["cols"]
            cell_width = current.width // cols
            if current.width % cols or cell_width <= 0 or current.height % cell_width:
                raise ValueError(f"current Task 6 descendant grid mismatch: {source['sheetKey']}")
            current_rows = current.height // cell_width
            chroma = normalizer.analyze_chroma_grid(current, cols, current_rows, current_path)
            if chroma != ZERO_CHROMA:
                raise ValueError(f"current Task 6 descendant chroma residue: {source['sheetKey']} {chroma}")
            sheets.append({
                "sheetKey": source["sheetKey"],
                "path": source["path"],
                "width": source["width"],
                "height": source["height"],
                "cols": source["cols"],
                "rows": source["rows"],
                "beforeSha256": source["beforeSha256"],
                "task6AfterSha256": source["task6AfterSha256"],
                "currentSha256": source["currentSha256"],
                "changedPixels": source["changedPixels"],
                "historicalUnexpectedAlphaLoss": historical_loss,
                "currentUnexpectedAlphaLoss": current_loss,
                "currentPolicy": source["currentPolicy"],
                "supersededBy": source.get("supersededBy"),
                "supersededSource": source.get("supersededSource"),
                "currentChromaArtifacts": chroma,
            })
    historical_loss = sum(sheet["historicalUnexpectedAlphaLoss"] for sheet in sheets)
    direct_loss = sum(sheet["currentUnexpectedAlphaLoss"] or 0 for sheet in sheets)
    if historical_loss or direct_loss:
        raise ValueError(
            f"non-chroma alpha loss: historical={historical_loss}, currentDirect={direct_loss}"
        )
    return {
        "reportVersion": 2,
        "hashScheme": PROVENANCE_HASH_SCHEME,
        "scope": evidence["scope"],
        "evidenceManifest": "/art_sources/combat/task6_chroma/evidence_manifest.json",
        "evidenceManifestSha256": file_sha256(evidence_path),
        "evidenceArchiveSha256": evidence["archiveSha256"],
        "sheetCount": len(sheets),
        "changedSheetCount": evidence["changedSheetCount"],
        "changedPixels": evidence["changedPixels"],
        "historicalUnexpectedAlphaLoss": historical_loss,
        "currentDirectUnexpectedAlphaLoss": direct_loss,
        "currentPinnedSheets": len(sheets),
        "directDescendants": sum(sheet["currentPolicy"] == "direct" for sheet in sheets),
        "supersededDescendants": sum(sheet["currentPolicy"] == "superseded" for sheet in sheets),
        "chromaArtifacts": dict(ZERO_CHROMA),
        "sheets": sheets,
    }


def report_bytes(report: dict) -> bytes:
    return (json.dumps(report, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if not args.check:
        parser.error("Task 6 evidence is immutable; choose --check")
    root = args.root.resolve()
    report_path = root / "docs/analysis/COMBAT_CHROMA_TASK6_CLEANUP_REPORT.json"
    try:
        report = build_report(root)
    except (OSError, ValueError, KeyError, TypeError, json.JSONDecodeError, zipfile.BadZipFile) as error:
        raise SystemExit(str(error)) from error
    try:
        committed_report = json.loads(report_path.read_text(encoding="utf-8-sig"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as error:
        raise SystemExit("Task 6 chroma cleanup report is missing or malformed") from error
    if committed_report != report:
        raise SystemExit("Task 6 chroma cleanup report differs from immutable evidence")
    print(json.dumps({
        "checked": report_path.relative_to(root).as_posix(),
        "sheetCount": report["sheetCount"],
        "changedSheetCount": report["changedSheetCount"],
        "historicalUnexpectedAlphaLoss": report["historicalUnexpectedAlphaLoss"],
        "currentPinnedSheets": report["currentPinnedSheets"],
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

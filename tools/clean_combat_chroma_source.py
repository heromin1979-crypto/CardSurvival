import argparse
import json
from pathlib import Path

from PIL import Image

from normalize_combat_sprite_sheets import (
    analyze_chroma,
    analyze_chroma_grid,
    cleanup_chroma_grid,
    neutralize_boundary_green_grid,
    sheet_identity_for_path,
)


def is_runtime_sheet(path: Path) -> bool:
    try:
        sheet_identity_for_path(path)
    except ValueError:
        return False
    return True


def strict_art_source_metrics(image: Image.Image, cols: int, rows: int) -> dict[str, int]:
    if image.width % cols or image.height % rows:
        raise ValueError(f"{image.size} is not divisible by {cols}x{rows}")
    totals = {
        "opaqueGreen": 0,
        "fringeGreen": 0,
        "hiddenRgb": 0,
        "boundaryGreen": 0,
        "removedComponents": 0,
        "staleAllowlist": 0,
    }
    frame_width, frame_height = image.width // cols, image.height // rows
    for row in range(rows):
        for col in range(cols):
            frame = image.crop((
                col * frame_width,
                row * frame_height,
                (col + 1) * frame_width,
                (row + 1) * frame_height,
            ))
            for key, value in analyze_chroma(frame, strict_boundary=True).items():
                totals[key] += value
    return totals


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--cols", type=int, required=True)
    parser.add_argument("--rows", type=int, required=True)
    args = parser.parse_args()
    source = Image.open(args.input).convert("RGBA")
    if is_runtime_sheet(args.input):
        cleaned, _ = cleanup_chroma_grid(source, cols=args.cols, rows=args.rows, path=args.input)
        metrics = analyze_chroma_grid(cleaned, cols=args.cols, rows=args.rows, path=args.input)
    else:
        cleaned, _ = cleanup_chroma_grid(source, cols=args.cols, rows=args.rows)
        if strict_art_source_metrics(cleaned, cols=args.cols, rows=args.rows)["boundaryGreen"]:
            cleaned, _ = neutralize_boundary_green_grid(cleaned, cols=args.cols, rows=args.rows)
        metrics = strict_art_source_metrics(cleaned, cols=args.cols, rows=args.rows)
    if any(metrics.values()):
        raise SystemExit(f"strict chroma residue: {metrics}")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    cleaned.save(args.output)
    print(json.dumps(metrics, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

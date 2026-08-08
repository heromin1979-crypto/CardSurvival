import argparse
import json
from pathlib import Path

from PIL import Image

from normalize_combat_sprite_sheets import analyze_chroma_grid, cleanup_chroma_grid


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--cols", type=int, required=True)
    parser.add_argument("--rows", type=int, required=True)
    args = parser.parse_args()
    source = Image.open(args.input).convert("RGBA")
    cleaned, _ = cleanup_chroma_grid(source, cols=args.cols, rows=args.rows, path=args.input)
    metrics = analyze_chroma_grid(cleaned, cols=args.cols, rows=args.rows, path=args.output)
    if any(metrics.values()):
        raise SystemExit(f"strict chroma residue: {metrics}")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    cleaned.save(args.output)
    print(json.dumps(metrics, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

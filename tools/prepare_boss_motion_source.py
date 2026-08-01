from __future__ import annotations

import argparse
import shutil
from pathlib import Path

from PIL import Image

from normalize_combat_sprite_sheets import cleanup_chroma


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "art_sources" / "combat" / "task10_bosses"


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare a built-in imagegen boss source")
    parser.add_argument("boss_id")
    parser.add_argument("generated_image", type=Path)
    args = parser.parse_args()

    chroma = SOURCE_ROOT / f"{args.boss_id}_chroma.png"
    alpha = SOURCE_ROOT / f"{args.boss_id}_alpha.png"
    if not args.generated_image.exists():
        raise FileNotFoundError(args.generated_image)
    if chroma.exists():
        archive = SOURCE_ROOT / f"{args.boss_id}_rejected_panel_clipping_chroma.png"
        if not archive.exists():
            shutil.copyfile(chroma, archive)
    shutil.copyfile(args.generated_image, chroma)
    cleaned, _ = cleanup_chroma(Image.open(chroma).convert("RGBA"))
    cleaned.save(alpha, format="PNG", compress_level=9)
    print(f"prepared {args.boss_id}: {cleaned.size[0]}x{cleaned.size[1]}")


if __name__ == "__main__":
    main()

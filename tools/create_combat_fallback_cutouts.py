from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "assets" / "images" / "combat"


def build_cutout(src_name: str, out_name: str, tint: tuple[int, int, int]) -> None:
    src = ROOT / "assets" / "images" / src_name
    out = OUTPUT_DIR / out_name
    image = Image.open(src).convert("RGBA")
    pixels = image.load()
    width, height = image.size

    for y in range(height):
      for x in range(width):
        r, g, b, a = pixels[x, y]
        brightness = (r + g + b) / 3
        if brightness > 226 and max(r, g, b) - min(r, g, b) < 38:
            pixels[x, y] = (r, g, b, 0)
            continue

        alpha = a
        if brightness > 190:
            alpha = int(max(0, min(255, 255 - (brightness - 190) * 3.2)))

        shade = max(0.24, min(1.0, (255 - brightness) / 190))
        pixels[x, y] = (
            int(tint[0] * shade),
            int(tint[1] * shade),
            int(tint[2] * shade),
            alpha,
        )

    bbox = image.getbbox()
    if bbox:
        image = image.crop(bbox)

    canvas = Image.new("RGBA", (720, 720), (0, 0, 0, 0))
    image.thumbnail((690, 690), Image.Resampling.LANCZOS)
    x = (canvas.width - image.width) // 2
    y = canvas.height - image.height - 10
    canvas.alpha_composite(image, (x, y))
    canvas.save(out)
    print(f"wrote {out.relative_to(ROOT)}")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    build_cutout("player_M.jpg", "player_M_cutout.png", (118, 104, 86))
    build_cutout("player_F.jpg", "player_F_cutout.png", (126, 108, 92))


if __name__ == "__main__":
    main()

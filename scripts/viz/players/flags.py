from pathlib import Path
from urllib.request import urlretrieve

from PIL import Image, ImageDraw

HERE = Path(__file__).parent
FLAG_DIR = HERE / "flags"
CIRCLE_DIR = HERE / "flags_circular"
SIZE = 200
BORDER = "#366c94"

def flag(iso2: str) -> Path:
    FLAG_DIR.mkdir(exist_ok=True)
    path = FLAG_DIR / f"{iso2.lower()}.png"
    if not path.exists():
        urlretrieve(f"https://flagcdn.com/w320/{iso2.lower()}.png", path)
    return path

def circular_flag(iso2: str) -> Path:
    CIRCLE_DIR.mkdir(exist_ok=True)
    out = CIRCLE_DIR / f"{iso2.lower()}.png"
    if out.exists():
        return out

    img = Image.open(flag(iso2)).convert("RGBA")
    side = min(img.width, img.height)
    left = (img.width - side) // 2
    top = (img.height - side) // 2
    img = img.crop((left, top, left + side, top + side)).resize((SIZE, SIZE), Image.LANCZOS)

    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, SIZE, SIZE), fill=255)
    img.putalpha(mask)

    width = max(2, SIZE // 25)
    inset = width / 2
    ImageDraw.Draw(img).ellipse((inset, inset, SIZE - 1 - inset, SIZE - 1 - inset), outline=BORDER, width=width)

    img.save(out)
    return out

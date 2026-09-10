#!/usr/bin/env python3
"""Generate Keva app icon and splash screen assets."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONT_PATH = ROOT / "assets/fonts-download/Syne.ttf"
ICON_PATH = ROOT / "assets/icon.png"
SPLASH_PATH = ROOT / "assets/splash.png"

BG = "#080810"
WHITE = "#FFFFFF"
PURPLE = "#7c6af7"


def load_syne(size: int) -> ImageFont.FreeTypeFont:
    font = ImageFont.truetype(str(FONT_PATH), size)
    try:
        font.set_variation_by_axes([700])
    except Exception:
        pass
    return font


def draw_lightning(draw: ImageDraw.ImageDraw, cx: float, cy: float, scale: float, color: str) -> None:
    points = [
        (cx, cy - scale),
        (cx - scale * 0.18, cy - scale * 0.08),
        (cx + scale * 0.12, cy - scale * 0.02),
        (cx - scale * 0.28, cy + scale * 0.58),
        (cx + scale * 0.08, cy + scale * 0.12),
        (cx - scale * 0.14, cy + scale),
        (cx + scale * 0.2, cy + scale * 0.04),
        (cx - scale * 0.06, cy - scale * 0.34),
        (cx + scale * 0.24, cy - scale * 0.56),
    ]
    draw.polygon(points, fill=color)


def text_size(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont) -> tuple[int, int]:
    box = draw.textbbox((0, 0), text, font=font)
    return box[2] - box[0], box[3] - box[1]


def generate_icon() -> None:
    size = 1024
    image = Image.new("RGBA", (size, size), BG)
    draw = ImageDraw.Draw(image)

    font = load_syne(560)
    letter = "K"
    text_w, text_h = text_size(draw, letter, font)
    x = (size - text_w) // 2 - 36
    y = (size - text_h) // 2 - 24
    draw.text((x, y), letter, font=font, fill=WHITE)

    bolt_cx = x + text_w - 24
    bolt_cy = y + 70
    draw_lightning(draw, bolt_cx, bolt_cy, 92, PURPLE)

    ICON_PATH.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(ICON_PATH, format="PNG", optimize=True)
    print(f"Wrote {ICON_PATH}")


def generate_splash() -> None:
    width, height = 1284, 2778
    image = Image.new("RGBA", (width, height), BG)
    draw = ImageDraw.Draw(image)

    title_font = load_syne(132)
    tag_font = load_syne(34)

    title = "Keva"
    tagline = "BUILD WHAT LASTS."

    title_w, title_h = text_size(draw, title, title_font)
    tag_w, tag_h = text_size(draw, tagline, tag_font)

    block_h = title_h + 36 + tag_h
    title_x = (width - title_w) // 2
    title_y = (height - block_h) // 2
    tag_x = (width - tag_w) // 2
    tag_y = title_y + title_h + 36

    draw.text((title_x, title_y), title, font=title_font, fill=WHITE)
    draw.text((tag_x, tag_y), tagline, font=tag_font, fill=PURPLE)

    SPLASH_PATH.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(SPLASH_PATH, format="PNG", optimize=True)
    print(f"Wrote {SPLASH_PATH}")


if __name__ == "__main__":
    generate_icon()
    generate_splash()
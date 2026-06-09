from pathlib import Path
import os
import sys

sys.path.insert(0, os.environ.get("VIDEO_DEPS_PATH", r"C:\tmp\lucylp-video-deps"))

import imageio.v2 as imageio
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "videos" / "lucylp-music-press-issue-1-tiktok-promo.mp4"
WIDTH = 1080
HEIGHT = 1920
FPS = 24
SECONDS = 15

ASSETS = [
    ROOT / "music-press" / "images" / "issue-1-cover.jpg",
    ROOT / "music-press" / "issue-1" / "page-009.png",
    ROOT / "music-press" / "issue-1" / "page-014.png",
    ROOT / "music-press" / "issue-1" / "page-016.png",
    ROOT / "music-press" / "issue-1" / "page-019.png",
]


def font(size, bold=False):
    names = [
        "C:/Windows/Fonts/georgiab.ttf" if bold else "C:/Windows/Fonts/georgia.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]

    for name in names:
        if Path(name).exists():
            return ImageFont.truetype(name, size)

    return ImageFont.load_default(size=size)


TITLE_FONT = font(78, bold=True)
SUBTITLE_FONT = font(42)
SMALL_FONT = font(31, bold=True)


def fit_image(image, box_width, box_height):
    image = image.convert("RGB")
    scale = min(box_width / image.width, box_height / image.height)
    size = (int(image.width * scale), int(image.height * scale))
    return image.resize(size, Image.Resampling.LANCZOS)


def make_background(image):
    background = image.convert("RGB")
    scale = max(WIDTH / background.width, HEIGHT / background.height)
    size = (int(background.width * scale), int(background.height * scale))
    background = background.resize(size, Image.Resampling.LANCZOS)
    left = (background.width - WIDTH) // 2
    top = (background.height - HEIGHT) // 2
    background = background.crop((left, top, left + WIDTH, top + HEIGHT))
    background = background.filter(ImageFilter.GaussianBlur(30)).convert("RGBA")
    warm = Image.new("RGBA", (WIDTH, HEIGHT), (75, 42, 18, 76))
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 126))
    return Image.alpha_composite(Image.alpha_composite(background, warm), overlay)


def draw_center(draw, text, y, selected_font, fill):
    bbox = draw.textbbox((0, 0), text, font=selected_font)
    x = (WIDTH - (bbox[2] - bbox[0])) // 2
    draw.text((x, y), text, font=selected_font, fill=fill)


def add_branding(frame, slide_index):
    draw = ImageDraw.Draw(frame)
    gold = (216, 176, 87, 255)
    cream = (248, 238, 218, 255)
    muted = (212, 202, 184, 255)

    draw.rounded_rectangle(
        (74, 68, WIDTH - 74, 176),
        radius=28,
        fill=(5, 5, 5, 178),
        outline=(216, 176, 87, 120),
        width=2,
    )
    draw.text((112, 92), "LucyLP", font=TITLE_FONT, fill=gold)
    draw.text((112, 194), "MUSIC PRESS ISSUE NO.1", font=SMALL_FONT, fill=cream)

    slide_text = [
        ("Free digital magazine", "for vinyl collectors"),
        ("Rare records. Global stories.", ""),
        ("Japanese pressings and collector culture.", ""),
        ("Beatles, Zeppelin, vinyl history.", ""),
        ("Read now at LucyLP.com", ""),
    ][slide_index]

    draw_center(draw, slide_text[0], 1538 if not slide_text[1] else 1530, SUBTITLE_FONT, cream)
    if slide_text[1]:
        draw_center(draw, slide_text[1], 1588, SUBTITLE_FONT, muted)

    draw.rounded_rectangle((250, 1686, WIDTH - 250, 1758), radius=36, fill=(216, 176, 87, 235))
    draw_center(draw, "lucylp.com/music-press", 1700, SMALL_FONT, (6, 5, 4, 255))
    return frame


def frame_for(image, slide_index, progress):
    frame = make_background(image)
    fitted = fit_image(image, 790, 1040).convert("RGBA")
    zoom = 1 + 0.035 * progress
    fitted = fitted.resize((int(fitted.width * zoom), int(fitted.height * zoom)), Image.Resampling.LANCZOS)
    x = (WIDTH - fitted.width) // 2
    y = 386 + int(18 * np.sin(progress * np.pi))

    shadow = Image.new("RGBA", fitted.size, (0, 0, 0, 170)).filter(ImageFilter.GaussianBlur(20))
    frame.alpha_composite(shadow, (x + 20, y + 24))
    frame.alpha_composite(fitted, (x, y))

    vignette = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(vignette)
    draw.rectangle((0, 0, WIDTH, 260), fill=(0, 0, 0, 118))
    draw.rectangle((0, 1440, WIDTH, HEIGHT), fill=(0, 0, 0, 128))
    frame = Image.alpha_composite(frame, vignette)

    return add_branding(frame, slide_index).convert("RGB")


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    images = [Image.open(path) for path in ASSETS]
    frames_per_slide = FPS * SECONDS // len(images)

    with imageio.get_writer(
        OUTPUT,
        fps=FPS,
        codec="libx264",
        quality=8,
        macro_block_size=1,
        ffmpeg_params=["-pix_fmt", "yuv420p", "-movflags", "+faststart"],
    ) as writer:
        for slide_index, image in enumerate(images):
            for frame_number in range(frames_per_slide):
                progress = frame_number / max(1, frames_per_slide - 1)
                writer.append_data(np.asarray(frame_for(image, slide_index, progress)))

    print(OUTPUT)


if __name__ == "__main__":
    main()

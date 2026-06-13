from pathlib import Path
import argparse
import json
import os
import sys

sys.path.insert(0, os.environ.get("VIDEO_DEPS_PATH", r"C:\tmp\lucylp-video-deps"))

import imageio.v2 as imageio
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ISSUES_FILE = ROOT / "data" / "magazine-issues.json"
WIDTH = 1080
HEIGHT = 1920
FPS = 24


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
SUBTITLE_FONT = font(46, bold=True)
SMALL_FONT = font(31, bold=True)


def site_path(path):
    return ROOT / path.lstrip("/").replace("/", os.sep)


def load_issue(issue_number):
    with ISSUES_FILE.open("r", encoding="utf-8") as file:
        issues = json.load(file)

    for issue in issues:
        if int(issue["issueNumber"]) == issue_number:
            return issue

    raise ValueError(f"Issue No.{issue_number} not found in {ISSUES_FILE}")


def output_path(issue_number, duration, pages):
    if issue_number == 1 and duration == 15 and pages == [9, 14, 16, 19]:
        return ROOT / "videos" / "lucylp-music-press-issue-1-tiktok-promo.mp4"

    page_slug = "-".join(str(page) for page in pages)
    return ROOT / "videos" / f"lucylp-music-press-issue-{issue_number}-tiktok-promo-{duration}s-p{page_slug}.mp4"


def page_path(issue_number, page_number):
    return ROOT / "music-press" / f"issue-{issue_number}" / f"page-{page_number:03d}.png"


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


def add_branding(frame, issue_number, slide_index):
    draw = ImageDraw.Draw(frame)
    gold = (216, 176, 87, 255)
    cream = (248, 238, 218, 255)

    draw.rounded_rectangle(
        (74, 68, WIDTH - 74, 176),
        radius=28,
        fill=(5, 5, 5, 178),
        outline=(216, 176, 87, 120),
        width=2,
    )
    draw.text((112, 92), "LucyLP", font=TITLE_FONT, fill=gold)
    draw.text((112, 194), f"MUSIC PRESS ISSUE NO.{issue_number}", font=SMALL_FONT, fill=cream)

    slide_messages = [
        "Read Free",
        "Rare records. Global stories.",
        "Collector culture worldwide.",
        "Vinyl history and pressings.",
        "Read Free at LucyLP.com",
    ]
    slide_text = slide_messages[slide_index % len(slide_messages)]

    draw_center(draw, slide_text, 1538, SUBTITLE_FONT, cream)
    draw.rounded_rectangle((286, 1686, WIDTH - 286, 1758), radius=36, fill=(216, 176, 87, 235))
    draw_center(draw, "LucyLP.com", 1700, SMALL_FONT, (6, 5, 4, 255))
    return frame


def frame_for(image, issue_number, slide_index, progress, background=None):
    frame = background.copy() if background is not None else make_background(image)
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

    return add_branding(frame, issue_number, slide_index).convert("RGB")


def generate(issue_number, pages, duration):
    issue = load_issue(issue_number)
    assets = [site_path(issue["coverImage"])] + [page_path(issue_number, page) for page in pages]
    missing = [path for path in assets if not path.exists()]

    if missing:
        raise FileNotFoundError("Missing video source files: " + ", ".join(str(path) for path in missing))

    output = output_path(issue_number, duration, pages)
    output.parent.mkdir(parents=True, exist_ok=True)
    images = [Image.open(path) for path in assets]
    backgrounds = [make_background(image) for image in images]
    frames_per_slide = FPS * duration // len(images)

    with imageio.get_writer(
        output,
        fps=FPS,
        codec="libx264",
        quality=8,
        macro_block_size=1,
        ffmpeg_params=["-pix_fmt", "yuv420p", "-movflags", "+faststart"],
    ) as writer:
        for slide_index, image in enumerate(images):
            for frame_number in range(frames_per_slide):
                progress = frame_number / max(1, frames_per_slide - 1)
                writer.append_data(np.asarray(frame_for(image, issue_number, slide_index, progress, backgrounds[slide_index])))

    return output


def main():
    parser = argparse.ArgumentParser(description="Generate a LucyLP vertical TikTok promo MP4.")
    parser.add_argument("--issue", type=int, default=1, help="Magazine issue number from data/magazine-issues.json.")
    parser.add_argument("--duration", type=int, choices=[15, 30, 60], default=15, help="Video duration in seconds.")
    parser.add_argument("--pages", type=int, nargs="+", default=[9, 14, 16, 19], help="One or more page numbers to include.")
    args = parser.parse_args()
    print(generate(args.issue, args.pages, args.duration))


if __name__ == "__main__":
    main()

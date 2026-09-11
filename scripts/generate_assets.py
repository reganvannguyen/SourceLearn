#!/usr/bin/env python3
"""
Compile interactive screenshots into a polished, 16:9 widescreen demo GIF/WebP with zero distortion.
"""
import os
import shutil
from PIL import Image, ImageDraw, ImageFont

ASSETS_DIR = "/home/regan-nguyen/Desktop/projects/SourceLearn/docs/assets"

def add_header_banner(image_path: str, caption: str, step_label: str) -> Image.Image:
    img = Image.open(image_path).convert("RGB")
    width, height = img.size
    
    # Overlay canvas
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    # Sleek dark header bar at the top
    bar_height = 50
    draw.rectangle([(0, 0), (width, bar_height)], fill=(15, 23, 42, 245)) # Slate 900
    draw.rectangle([(0, bar_height - 2), (width, bar_height)], fill=(116, 193, 201, 255)) # Teal accent line
    
    try:
        font_tag = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 15)
        font_text = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 15)
    except Exception:
        font_tag = font_text = ImageFont.load_default()
        
    # Draw step badge
    draw.rounded_rectangle([(18, 9), (124, 39)], radius=4, fill=(116, 193, 201, 255))
    draw.text((26, 15), step_label, fill=(15, 23, 42, 255), font=font_tag)
    
    # Draw caption
    draw.text((138, 15), caption, fill=(248, 250, 252, 255), font=font_text)
    
    composed = Image.alpha_composite(img.convert("RGBA"), overlay)
    return composed.convert("RGB")

def main():
    steps = [
        {
            "file": os.path.join(ASSETS_DIR, "step1_dashboard.png"),
            "step": "STEP 01",
            "caption": "Multi-Notebook Dashboard • Canadian Hilroy Exercise Booklet Design",
            "duration": 2800
        },
        {
            "file": os.path.join(ASSETS_DIR, "step2_create_modal.png"),
            "step": "STEP 02",
            "caption": "Create Notebook • Custom Title ('Distributed Systems'), Color Palette & Icon",
            "duration": 2800
        },
        {
            "file": os.path.join(ASSETS_DIR, "step3_os_notebook.png"),
            "step": "STEP 03",
            "caption": "Ingest Lecture PDFs • 3 Operating System Course Slide Decks Indexed",
            "duration": 2800
        },
        {
            "file": os.path.join(ASSETS_DIR, "step4_ask_question.png"),
            "step": "STEP 04",
            "caption": "Ask Multi-Source Question • 'What is a kernel, and how do monolithic & microkernels differ?'",
            "duration": 3000
        },
        {
            "file": os.path.join(ASSETS_DIR, "step5_grounded_answer.png"),
            "step": "STEP 05",
            "caption": "Grounded AI Synthesis • Factual Answers with Verifiable Inline [p. 11, p. 12] Citations",
            "duration": 3500
        },
        {
            "file": os.path.join(ASSETS_DIR, "step6_split_screen.png"),
            "step": "STEP 06",
            "caption": "Interactive Split-Screen • Click Citation to Jump to Page & Highlight Source Passage",
            "duration": 3800
        }
    ]

    processed_frames = []
    # Exact 16:9 resolution: 1024 x 576 (1024 / 576 = 1.7777778 = 16/9)
    TARGET_WIDTH = 1024
    TARGET_HEIGHT = 576

    for s in steps:
        if not os.path.exists(s["file"]):
            print(f"Warning: {s['file']} not found!")
            continue
        banner_frame = add_header_banner(s["file"], s["caption"], s["step"])
        # Downscale proportionally maintaining exact 16:9
        resized = banner_frame.resize((TARGET_WIDTH, TARGET_HEIGHT), Image.Resampling.LANCZOS)
        processed_frames.append(resized)

    # Save static showcase PNGs at original 1280x720 (16:9)
    if os.path.exists(steps[0]["file"]):
        shutil.copy(steps[0]["file"], os.path.join(ASSETS_DIR, "dashboard.png"))
    if os.path.exists(steps[1]["file"]):
        shutil.copy(steps[1]["file"], os.path.join(ASSETS_DIR, "create-modal.png"))
    if os.path.exists(steps[4]["file"]):
        shutil.copy(steps[4]["file"], os.path.join(ASSETS_DIR, "study-chat.png"))
    if os.path.exists(steps[5]["file"]):
        shutil.copy(steps[5]["file"], os.path.join(ASSETS_DIR, "split-screen.png"))

    durations = [s["duration"] for s in steps]

    gif_out = os.path.join(ASSETS_DIR, "demo.gif")
    webp_out = os.path.join(ASSETS_DIR, "demo.webp")

    print(f"Compiling animated 16:9 GIF to {gif_out} ({len(processed_frames)} frames @ {TARGET_WIDTH}x{TARGET_HEIGHT})...")
    processed_frames[0].save(
        gif_out,
        save_all=True,
        append_images=processed_frames[1:],
        duration=durations,
        loop=0,
        optimize=True
    )

    print(f"Compiling animated 16:9 WebP to {webp_out}...")
    processed_frames[0].save(
        webp_out,
        save_all=True,
        append_images=processed_frames[1:],
        duration=durations,
        loop=0
    )

    # Clean up intermediate step images
    for s in steps:
        if os.path.exists(s["file"]):
            os.remove(s["file"])

    gif_size_kb = os.path.getsize(gif_out) / 1024
    webp_size_kb = os.path.getsize(webp_out) / 1024
    print(f"Done! 16:9 GIF size: {gif_size_kb:.1f} KB, WebP size: {webp_size_kb:.1f} KB")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Generate presentation screenshots and animated demo GIF for SourceLearn documentation.
"""
import subprocess
import os
from PIL import Image, ImageDraw, ImageFont

ASSETS_DIR = "/home/regan-nguyen/Desktop/projects/SourceLearn/docs/assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

def capture_screenshot(url: str, output_path: str, wait_ms: int = 2500):
    cmd = [
        "google-chrome",
        "--headless=new",
        "--disable-gpu",
        f"--virtual-time-budget={wait_ms}",
        "--window-size=1280,800",
        f"--screenshot={output_path}",
        url
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Captured: {output_path}")

def create_banner_slide(title: str, subtitle: str, badge_text: str = "SOURCELEARN", width=1280, height=800):
    img = Image.new("RGB", (width, height), color=(15, 23, 42)) # Slate 900
    draw = ImageDraw.Draw(img)
    
    # Draw accent gradient / glow bars
    draw.rectangle([(0, 0), (width, 8)], fill=(116, 193, 201)) # Teal accent
    draw.rectangle([(0, height - 8), (width, height)], fill=(170, 59, 255)) # Purple accent
    
    # Decorative background circles/shapes
    draw.ellipse([(-100, -100), (300, 300)], fill=(30, 41, 59))
    draw.ellipse([(width - 250, height - 250), (width + 150, height + 150)], fill=(30, 41, 59))
    
    try:
        font_badge = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
        font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 46)
        font_sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
        font_footer = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
    except Exception:
        font_badge = font_title = font_sub = font_footer = ImageFont.load_default()

    # Pill badge
    badge_w = 200
    badge_h = 36
    badge_x = (width - badge_w) // 2
    badge_y = 200
    draw.rounded_rectangle([(badge_x, badge_y), (badge_x + badge_w, badge_y + badge_h)], radius=18, fill=(30, 41, 59), outline=(116, 193, 201), width=2)
    draw.text((badge_x + 28, badge_y + 8), badge_text, fill=(116, 193, 201), font=font_badge)

    # Title & Subtitle
    draw.text((width // 2, 300), title, fill=(248, 250, 252), font=font_title, anchor="mm")
    draw.text((width // 2, 380), subtitle, fill=(148, 163, 184), font=font_sub, anchor="mm")
    
    # Feature chips
    chips = [
        "FastAPI & PostgreSQL",
        "pgvector Cosine Search",
        "Google Gemini 2.5 Flash",
        "React 19 & TypeScript",
        "Split-Screen PDF Viewer"
    ]
    start_x = (width - (len(chips) * 200)) // 2
    for i, chip in enumerate(chips):
        cx = start_x + i * 200
        draw.rounded_rectangle([(cx, 460), (cx + 185, 500)], radius=6, fill=(30, 41, 59), outline=(51, 65, 85))
        draw.text((cx + 92, 480), chip, fill=(226, 232, 240), font=font_footer, anchor="mm")

    draw.text((width // 2, 620), "Grounded Study Assistant • Verifiable Citations • Zero Hallucinations", fill=(116, 193, 201), font=font_footer, anchor="mm")
    
    return img

def add_header_banner_to_screen(image_path: str, caption: str, step_num: str):
    img = Image.open(image_path).convert("RGB")
    width, height = img.size
    
    # Create top overlay bar
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    # Draw dark translucent banner at top
    draw.rectangle([(0, 0), (width, 56)], fill=(15, 23, 42, 240))
    draw.rectangle([(0, 54), (width, 56)], fill=(116, 193, 201, 255))
    
    try:
        font_step = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
        font_text = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    except Exception:
        font_step = font_text = ImageFont.load_default()
        
    # Draw step tag
    draw.rounded_rectangle([(24, 12), (110, 42)], radius=4, fill=(116, 193, 201, 255))
    draw.text((36, 18), step_num, fill=(15, 23, 42, 255), font=font_step)
    draw.text((124, 18), caption, fill=(248, 250, 252, 255), font=font_text)
    
    composed = Image.alpha_composite(img.convert("RGBA"), overlay)
    return composed.convert("RGB")

def main():
    dashboard_raw = os.path.join(ASSETS_DIR, "dashboard_raw.png")
    study_raw = os.path.join(ASSETS_DIR, "study_raw.png")
    
    print("Capturing dashboard screenshot...")
    capture_screenshot("http://localhost:3000/", dashboard_raw, wait_ms=1500)
    
    print("Capturing study workspace screenshot...")
    capture_screenshot("http://localhost:3000/notebooks/1", study_raw, wait_ms=3000)

    # Save standalone hi-res captures
    dashboard_img = Image.open(dashboard_raw)
    study_img = Image.open(study_raw)
    dashboard_img.save(os.path.join(ASSETS_DIR, "dashboard.png"))
    study_img.save(os.path.join(ASSETS_DIR, "study-chat.png"))
    
    # Create frames for demo animation
    slide1 = create_banner_slide(
        title="SourceLearn",
        subtitle="Grounded AI Study Assistant & Intelligent Notebook Platform"
    )
    
    slide2 = add_header_banner_to_screen(
        dashboard_raw,
        caption="Multi-Notebook Dashboard • Color-Coded Hilroy Exercise Booklets",
        step_num="STEP 01"
    )
    
    slide3 = add_header_banner_to_screen(
        study_raw,
        caption="Conversational Study Space • Grounded Q&A with Interactive Citations",
        step_num="STEP 02"
    )

    slide4 = create_banner_slide(
        title="Production RAG Pipeline",
        subtitle="pgvector Search + Gemini 2.5 Flash + In-Document Source Highlighting",
        badge_text="ARCHITECTED FOR ACCURACY"
    )
    
    frames = [slide1, slide2, slide3, slide4]
    
    # Resize frames to 960x600 for optimal GIF web performance & sharp display
    resized_frames = [f.resize((960, 600), Image.Resampling.LANCZOS) for f in frames]
    
    gif_path = os.path.join(ASSETS_DIR, "demo.gif")
    webp_path = os.path.join(ASSETS_DIR, "demo.webp")
    
    print(f"Generating animated GIF at {gif_path}...")
    resized_frames[0].save(
        gif_path,
        save_all=True,
        append_images=resized_frames[1:],
        duration=[2500, 3000, 3500, 2500],
        loop=0,
        optimize=True
    )
    
    print(f"Generating animated WebP at {webp_path}...")
    resized_frames[0].save(
        webp_path,
        save_all=True,
        append_images=resized_frames[1:],
        duration=[2500, 3000, 3500, 2500],
        loop=0
    )
    
    # Clean up temp raw files
    if os.path.exists(dashboard_raw): os.remove(dashboard_raw)
    if os.path.exists(study_raw): os.remove(study_raw)
    
    print("All assets successfully generated!")

if __name__ == "__main__":
    main()

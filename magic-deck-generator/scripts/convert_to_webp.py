#!/usr/bin/env python3
"""Convert all background images to WebP format without changing resolution."""

import os
import sys
import json

try:
    from PIL import Image
except ImportError:
    print("Installing Pillow...")
    os.system(f"{sys.executable} -m pip install Pillow")
    from PIL import Image

BG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'backgrounds')
QUALITY = 80  # WebP quality (80 = good balance of quality/size)

def main():
    if not os.path.isdir(BG_DIR):
        print(f"Directory not found: {BG_DIR}")
        return

    files = [f for f in os.listdir(BG_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    files.sort()

    if not files:
        print("No images found to convert.")
        return

    print(f"Converting {len(files)} images to WebP (quality={QUALITY})...\n")

    total_before = 0
    total_after = 0
    webp_files = []

    for f in files:
        src = os.path.join(BG_DIR, f)
        name_no_ext = os.path.splitext(f)[0]
        dst = os.path.join(BG_DIR, name_no_ext + '.webp')

        size_before = os.path.getsize(src)
        total_before += size_before

        try:
            img = Image.open(src)
            w, h = img.size
            img.save(dst, 'WEBP', quality=QUALITY, method=4)

            size_after = os.path.getsize(dst)
            total_after += size_after
            ratio = (1 - size_after / size_before) * 100

            print(f"  {f} ({w}x{h}) {size_before/1024:.0f}KB -> {name_no_ext}.webp {size_after/1024:.0f}KB (-{ratio:.0f}%)")
            webp_files.append(name_no_ext + '.webp')

            # Remove original
            os.remove(src)
        except Exception as e:
            print(f"  ERROR {f}: {e}")

    # Also handle duplicate file
    print(f"\nTotal: {total_before/1024/1024:.1f} MB -> {total_after/1024/1024:.1f} MB (-{(1-total_after/total_before)*100:.0f}%)")

    # Generate manifest
    all_webp = sorted([f for f in os.listdir(BG_DIR) if f.lower().endswith('.webp')])
    manifest_path = os.path.join(BG_DIR, 'manifest.json')
    with open(manifest_path, 'w') as mf:
        json.dump(all_webp, mf, indent=2)
    print(f"\nManifest: {len(all_webp)} images written to manifest.json")

if __name__ == '__main__':
    main()

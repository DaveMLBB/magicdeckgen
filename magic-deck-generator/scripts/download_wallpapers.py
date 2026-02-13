#!/usr/bin/env python3
"""
Download MTG wallpapers for use as app backgrounds.

Two modes:
  1. Auto mode (default): Downloads from Scryfall API (max 745x1040)
  2. Manual mode: After you download wallpapers manually from Alpha Coders 
     or other sources into public/backgrounds/, run with --manifest to 
     generate the manifest.json file.

Usage:
  python3 scripts/download_wallpapers.py           # Auto download from Scryfall
  python3 scripts/download_wallpapers.py --manifest # Generate manifest from existing files

For best quality (2K+), download manually from:
  - https://alphacoders.com/magic-the-gathering-wallpapers
  - https://www.wallpaperflare.com/search?wallpaper=magic:+the+gathering
  
Save files as .jpg or .png in public/backgrounds/, then run --manifest.
"""

import os
import sys
import time
import json
import urllib.request
import ssl

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'backgrounds')
NUM_IMAGES = 15

ctx = ssl.create_default_context()

def fetch_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'MagicDeckGen/1.0', 'Accept': 'application/json'})
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        return json.loads(resp.read().decode())

def download_image(url, filepath):
    req = urllib.request.Request(url, headers={'User-Agent': 'MagicDeckGen/1.0'})
    with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
        data = resp.read()
    with open(filepath, 'wb') as f:
        f.write(data)
    return len(data)

def generate_manifest():
    """Generate manifest.json from all image files in the backgrounds folder."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    extensions = ('.jpg', '.jpeg', '.png', '.webp')
    files = sorted([f for f in os.listdir(OUTPUT_DIR) if f.lower().endswith(extensions)])
    manifest_path = os.path.join(OUTPUT_DIR, 'manifest.json')
    with open(manifest_path, 'w') as f:
        json.dump(files, f, indent=2)
    print(f"Manifest: {manifest_path} ({len(files)} images)")
    for fn in files:
        size = os.path.getsize(os.path.join(OUTPUT_DIR, fn)) / 1024
        print(f"  - {fn} ({size:.0f} KB)")
    return files

def auto_download():
    """Download random MTG art from Scryfall."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Downloading {NUM_IMAGES} MTG wallpapers from Scryfall...")
    print(f"Output: {os.path.abspath(OUTPUT_DIR)}\n")
    
    downloaded = 0
    for attempt in range(NUM_IMAGES * 3):
        if downloaded >= NUM_IMAGES:
            break
        try:
            data = fetch_json('https://api.scryfall.com/cards/random?q=has%3Aart+-is%3Adigital+lang%3Aen')
            uris = data.get('image_uris') or (data.get('card_faces', [{}])[0].get('image_uris'))
            if not uris:
                continue
            
            name = data.get('name', 'unknown')
            url = uris.get('png') or uris.get('large') or uris.get('normal')
            if not url:
                continue
            
            safe = "".join(c if c.isalnum() or c in ' -_' else '' for c in name)
            safe = safe.strip().replace(' ', '_').lower()[:40]
            ext = '.png' if '.png' in url else '.jpg'
            filename = f"bg_{downloaded+1:02d}_{safe}{ext}"
            
            size = download_image(url, os.path.join(OUTPUT_DIR, filename))
            downloaded += 1
            print(f"  [{downloaded}/{NUM_IMAGES}] {name} -> {filename} ({size/1024:.0f} KB)")
            time.sleep(0.15)
        except Exception as e:
            print(f"  Error: {e}")
            time.sleep(0.5)
    
    print(f"\nDownloaded {downloaded} images.")
    generate_manifest()

def main():
    if '--manifest' in sys.argv:
        generate_manifest()
    else:
        auto_download()

if __name__ == '__main__':
    main()

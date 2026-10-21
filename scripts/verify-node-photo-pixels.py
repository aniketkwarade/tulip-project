"""Decode original and shipped images; metadata alone is not a resolution check."""
import hashlib, json
from pathlib import Path
from PIL import Image, ImageOps

root=Path(__file__).resolve().parent.parent
photos=json.loads((root/'src/node-photos.json').read_text())['photos']
assets={p['asset']:p for p in photos.values()}
for asset,p in assets.items():
    file=root/'public'/asset.lstrip('/')
    # asset begins node-photos/, so the source root is public.
    with Image.open(file) as raw:
        im=ImageOps.exif_transpose(raw);im.load()
        assert im.size==(2400,1350),(asset,im.size)
        assert hashlib.sha256(file.read_bytes()).hexdigest()==p['assetSha256']
    original=root/'artifacts/inspector-photographs-2026-09-28/originals'/file.name
    if original.exists():
        with Image.open(original) as raw:
            im=ImageOps.exif_transpose(raw);im.load()
            assert im.size==(p['sourceWidth'],p['sourceHeight'])
            assert im.width>=2400 and im.height>=1350
            assert hashlib.sha256(original.read_bytes()).hexdigest()==p['sourceSha256']
    else: raise AssertionError(f'Original missing for pixel verification: {original}')
print(f'Decoded {len(assets)} originals and {len(assets)} published JPEGs; all satisfy the minimum without upscaling.')

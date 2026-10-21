"""Install explicitly reviewed photo selections, never automatic search results.

python scripts/import-node-photo-selections.py reviewed-selections.json
Each row: nodeIds, id, imageUrl, sourceUrl, credit, license, licenseUrl, caption,
alt, reviewed=true, optional focalPoint=[0.5,0.5]. Requires Pillow and curl.
Source originals and decoded dimensions are retained in the audit directory.
"""
import hashlib, json, re, subprocess, sys, tempfile, urllib.parse
from pathlib import Path
from PIL import Image, ImageOps

ROOT=Path(__file__).resolve().parent.parent
AUDIT=ROOT/'artifacts/inspector-photographs-2026-09-28'
ASSETS=ROOT/'public/node-photos'
catalogue=json.loads(subprocess.check_output(['node','--input-type=module','-e','import {PUBLISHED_NODES} from "./src/data.js"; console.log(JSON.stringify(PUBLISHED_NODES.map(n=>n.id)))'],cwd=ROOT))
registry_path=ROOT/'src/node-photos.json'
registry=json.loads(registry_path.read_text())
if len(sys.argv)!=2: raise SystemExit('Usage: python scripts/import-node-photo-selections.py reviewed-selections.json')
rows=json.loads(Path(sys.argv[1]).read_text())
replacing_ids={node_id for row in rows for node_id in row.get('nodeIds',[])}
ASSETS.mkdir(parents=True,exist_ok=True);(AUDIT/'originals').mkdir(parents=True,exist_ok=True)
old_assets={p['asset'] for p in registry['photos'].values()}
asset_ids=set();node_ids=set()
# Validate every row before downloads, and every pixel before replacing assets.
with tempfile.TemporaryDirectory(prefix='photo-import-',dir=AUDIT) as staging:
    staging=Path(staging);pending=[]
    for r in rows:
        if r.get('reviewed') is not True: raise ValueError(f'Unreviewed selection: {r.get("id")}')
        if r.get('matchType') not in ['Direct photograph','Context photograph']: raise ValueError('Choose a reviewed direct or context photograph')
        if not re.fullmatch('[a-z0-9-]+',r['id']): raise ValueError('Invalid asset ID')
        if r['id'] in asset_ids: raise ValueError('Duplicate asset ID; group shared nodeIds in one selection')
        asset_ids.add(r['id'])
        for key in ['credit','license','caption','alt','sourceUrl','licenseUrl','imageUrl']:
            if not r.get(key): raise ValueError(f'Missing {key}')
        for key in ['sourceUrl','licenseUrl','imageUrl'] + (['creditUrl'] if r.get('creditUrl') else []):
            url=urllib.parse.urlparse(r[key])
            if url.scheme!='https' or not url.netloc: raise ValueError('Source URLs must use HTTPS')
        hybrit_editorial = (
            r['license'] == 'HYBRIT editorial permission'
            and r['licenseUrl'] == 'https://www.hybritdevelopment.se/en/contact/media-bank/'
            and r['sourceUrl'] == 'https://www.hybritdevelopment.se/en/media/hybrit-pilot-plant-direct-reduction-lulea-2/'
            and r['imageUrl'] == 'https://www.hybritdevelopment.se/wp-content/uploads/2023/08/pilotanlaggning-20-06-02.jpg'
            and r['nodeIds'] == ['green_steel']
            and 'HYBRIT' in r['caption']
        )
        if not (hybrit_editorial or re.fullmatch(r'CC BY(?:-SA)?(?: \d(?:\.\d)?(?: [A-Za-z]+)?)?',r['license']) or re.fullmatch(r'CC0(?: 1\.0)?',r['license']) or r['license'] in {'Public domain','Unsplash License','Pexels License'}):
            raise ValueError('Unsupported reuse terms; select an openly reusable photograph')
        if len(r['nodeIds'])!=1 or any(n not in catalogue for n in r['nodeIds']):
            raise ValueError('Each reviewed photograph must belong to exactly one published node')
        if node_ids.intersection(r['nodeIds']): raise ValueError('A node may have only one selection per import')
        node_ids.update(r['nodeIds'])
        if r.get('nodeOverrides'): raise ValueError('Shared-photo node overrides are no longer permitted')
        for other_id, other in registry['photos'].items():
            if other_id not in replacing_ids and other['sourceImageUrl'].split('?')[0]==r['imageUrl'].split('?')[0]:
                raise ValueError(f'Original photograph already assigned to {other_id}')
    for r in rows:
        original=staging/f'{r["id"]}-original.jpg'
        cached=AUDIT/'originals'/f'{r["id"]}.jpg'
        existing=next((p for p in registry['photos'].values() if p['asset']==f'/node-photos/{r["id"]}.jpg'),None)
        if r.get('sourceFile'): original.write_bytes(Path(r['sourceFile']).read_bytes())
        elif cached.exists() and existing and existing['sourceImageUrl']==r['imageUrl'] and hashlib.sha256(cached.read_bytes()).hexdigest()==existing['sourceSha256']:
            original.write_bytes(cached.read_bytes())
        else:
            subprocess.run(['curl','-fLsS','--max-time','90',r['imageUrl'],'-o',str(original)],check=True)
        with Image.open(original) as raw:
            image=ImageOps.exif_transpose(raw);image.load();width,height=image.size
            if min(width,height)<1200 or width<2400 or height<1350:
                raise ValueError(f'{r["id"]}: original {width}x{height} cannot supply a 2400x1350 crop')
            scale=min(width/2400,height/1350)
            if 2400*scale>width+1e-7 or 1350*scale>height+1e-7 or scale<1: raise ValueError('Upscaling prohibited')
            crop_box=r.get('cropBox')
            if crop_box is not None:
                if len(crop_box)!=4 or any(not isinstance(v,int) for v in crop_box):
                    raise ValueError('Crop box must contain four integer source-pixel coordinates')
                left,top,right,bottom=crop_box
                if not (0<=left<right<=width and 0<=top<bottom<=height and right-left>=2400 and bottom-top>=1350):
                    raise ValueError('Crop box must stay inside the source and allow a full-resolution output')
                image=image.crop(tuple(crop_box))
            focal=r.get('focalPoint',[.5,.5])
            if len(focal)!=2 or any(not 0<=v<=1 for v in focal): raise ValueError('Invalid crop focal point')
            cropped=ImageOps.fit(image.convert('RGB'),(2400,1350),method=Image.Resampling.LANCZOS,centering=tuple(focal))
            target=staging/f'{r["id"]}.jpg'
            cropped.save(target,quality=86,optimize=True,progressive=True)
        with Image.open(target) as published:
            published.load()
            if published.size!=(2400,1350): raise ValueError('Incorrect published dimensions')
        photo=dict(asset=f'/node-photos/{r["id"]}.jpg',width=2400,height=1350,alt=r['alt'],caption=r['caption'],credit=r['credit'],sourceUrl=r['sourceUrl'],license=r['license'],licenseUrl=r['licenseUrl'],
                   matchType=r['matchType'],sourceImageUrl=r['imageUrl'],sourceWidth=width,sourceHeight=height,
                   sourceSha256=hashlib.sha256(original.read_bytes()).hexdigest(),assetSha256=hashlib.sha256(target.read_bytes()).hexdigest())
        if r.get('creditUrl'): photo['creditUrl'] = r['creditUrl']
        for other_id, other in registry['photos'].items():
            if other_id not in replacing_ids and (other['sourceSha256']==photo['sourceSha256'] or other['assetSha256']==photo['assetSha256']):
                raise ValueError(f'Photograph pixels already assigned to {other_id}')
        for n in r['nodeIds']: registry['photos'][n]=photo
        pending.append((r['id'],original,target))
    # Check the full final registry, including assignments outside this batch.
    # A reviewed batch may swap photographs, but each original and crop belongs
    # to exactly one published node.
    by_asset={};by_source_hash={};by_asset_hash={}
    for node_id,photo in registry['photos'].items():
        for value,seen,label in [(photo['asset'],by_asset,'Asset'),(photo['sourceSha256'],by_source_hash,'Original'),(photo['assetSha256'],by_asset_hash,'Published crop')]:
            if value in seen: raise ValueError(f'{label} photograph already assigned to {seen[value]} and {node_id}')
            seen[value]=node_id
    for asset_id,original,target in pending:
        original.replace(AUDIT/'originals'/f'{asset_id}.jpg')
        target.replace(ASSETS/f'{asset_id}.jpg')
    staged_registry=staging/'registry.json'
    staged_registry.write_text(json.dumps(registry,indent=2)+'\n')
    staged_registry.replace(registry_path)
    for unused in old_assets-set(by_asset):
        (ROOT/'public'/unused.lstrip('/')).unlink(missing_ok=True)
print(f'{len(rows)} reviewed photographs installed; {len(registry["photos"])} nodes covered.')

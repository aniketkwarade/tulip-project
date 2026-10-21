"""Fetch documentary photo candidates from Commons; never auto-publish a result.

Usage: python research-node-photos.py topics.json output-directory
Requires Pillow. Downloads originals, records publisher metadata, decodes images,
and makes a numbered contact sheet for human subject/crop review.
"""
import concurrent.futures, html, json, re, subprocess, sys, urllib.parse, time
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

topics = json.loads(Path(sys.argv[1]).read_text())
out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
def fetch(url):
    time.sleep(3)
    return subprocess.check_output(['curl', '-fLsS', '--retry', '1', '--retry-delay', '60', '--max-time', '50', url], stderr=subprocess.DEVNULL)
def text(value): return html.unescape(re.sub('<[^>]+>', '', value or '')).strip()
def search(topic):
    cache = out / (topic['id'] + '.json')
    if cache.exists(): return json.loads(cache.read_text())
    query = dict(action='query', format='json', generator='search', gsrsearch=topic['query'], gsrnamespace=6, gsrlimit=8, prop='imageinfo', iiprop='url|size|extmetadata')
    try:
        payload = json.loads(fetch('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(query)))
        candidates=[]
        for p in sorted(payload.get('query',{}).get('pages',{}).values(), key=lambda p:p.get('index',99)):
            i=p.get('imageinfo',[{}])[0]; m=i.get('extmetadata',{})
            license=text(m.get('LicenseShortName',{}).get('value'))
            if not p['title'].lower().endswith(('.jpg','.jpeg')): continue
            if not (license.startswith(('CC BY','CC0')) or license=='Public domain'): continue
            if min(i.get('width',0),i.get('height',0))<1200 or i.get('width',0)<2400 or i.get('height',0)<1350: continue
            if re.search(r'diagram|illustration|map of|distribution map|satellite|rendering|ai.generated',p['title'],re.I): continue
            candidates.append(dict(title=p['title'], url=i['url'].split('?')[0], sourceUrl=i['descriptionurl'], sourceWidth=i['width'],sourceHeight=i['height'],credit=text(m.get('Artist',{}).get('value')),license=license,licenseUrl=m.get('LicenseUrl',{}).get('value') or 'https://creativecommons.org/publicdomain/mark/1.0/',description=text(m.get('ImageDescription',{}).get('value')), date=text(m.get('DateTimeOriginal',{}).get('value'))))
        result=dict(topic=topic,candidates=candidates[:3]);cache.write_text(json.dumps(result,indent=2)); return result
    except Exception as e:
        print(topic['id'],str(e),flush=True);return dict(topic=topic,candidates=[])

with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
    results=list(pool.map(search,topics))
index=[]
def download(item):
    topic,j,c=item; path=out/f'{topic["id"]}-{j}.jpg'
    try:
        if not path.exists(): path.write_bytes(fetch(c['url']))
        with Image.open(path) as original:
            im=ImageOps.exif_transpose(original);im.load();w,h=im.size
            if w<2400 or h<1350 or min(w,h)<1200: raise ValueError('undersized after orientation')
            c.update(sourceWidth=w,sourceHeight=h,sourceFile=str(path))
            thumb=ImageOps.fit(im.convert('RGB'),(360,203))
        return dict(topic=topic,index=j,photo=c),thumb
    except Exception as e: print(topic['id'],j,str(e),flush=True);return None
jobs=[(r['topic'],j,c) for r in results for j,c in enumerate(r['candidates'])]
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
    downloaded=[r for r in pool.map(download,jobs) if r]
for batch in range(0,len(downloaded),24):
    group=downloaded[batch:batch+24]; canvas=Image.new('RGB',(1440,6*245),'#ffffff');draw=ImageDraw.Draw(canvas)
    for k,(record,thumb) in enumerate(group):
        x=(k%4)*360;y=(k//4)*245;canvas.paste(thumb,(x,y));draw.text((x+5,y+207),f'{record["topic"]["id"]} [{record["index"]}]',fill='black')
        draw.text((x+5,y+224),record['photo']['title'][5:][:45],fill='black')
        index.append(record)
    canvas.save(out/f'contact-{batch//24+1}.jpg')
(out/'candidates.json').write_text(json.dumps(index,indent=2))
print(f'{len(topics)} subjects, {len(downloaded)} decoded candidates. Contact sheets ready.',flush=True)

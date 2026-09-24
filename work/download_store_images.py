from pathlib import Path
import json,urllib.request
apps=json.loads(Path('work/play-store-images.json').read_text(encoding='utf-8'))
for app,name in zip(apps,['onsic','spatial-mine','selpick']):
 url=app['og:image'];r=urllib.request.urlopen(url,timeout=20)
 data=r.read();mime=r.headers.get('Content-Type','')
 ext='png' if 'png' in mime else 'webp' if 'webp' in mime else 'jpg'
 target=Path('assets/thumbnails')/(name+'.'+ext);target.write_bytes(data)
 app['local']=target.as_posix();print(name,mime,len(data))
Path('work/play-store-images.json').write_text(json.dumps(apps,ensure_ascii=False,indent=2),encoding='utf-8')

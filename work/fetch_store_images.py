from html.parser import HTMLParser
from pathlib import Path
import urllib.request,json
class Meta(HTMLParser):
 def handle_starttag(self,tag,attrs):
  d=dict(attrs)
  if tag=='meta' and d.get('property','') in ['og:image','og:title']: self.values[d['property']]=d.get('content')
apps=[]
for app in ['com.onsic.app','spatialmine.app','com.selpick.app']:
 u='https://play.google.com/store/apps/details?id='+app+'&hl=ko'
 s=urllib.request.urlopen(u,timeout=20).read().decode()
 p=Meta();p.values={};p.feed(s);apps.append({'id':app,**p.values});print(app,p.values)
Path('work/play-store-images.json').write_text(json.dumps(apps,ensure_ascii=False,indent=2),encoding='utf-8')

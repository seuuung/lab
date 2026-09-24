from pathlib import Path
import re,json,html
apps=json.loads(Path('work/play-store-images.json').read_text(encoding='utf-8'))
appmap={x['id']:x for x in apps}
games={'shadow_puzzle':'shadow-puzzle','slime_jump':'slime-jump','Magnetic_Orbit':'magnetic-orbit','maze_escape':'maze-runner','3D_%20minesweeper':'minesweeper','hacking':'hacker-ctf','sign_up_for_hell':'sign-up','choi_circle':'choi-circle','robot':'robot'}
p=Path('index.html');s=p.read_text(encoding='utf-8')
provenance=[]
def replace_card(m):
 card=m.group(0);title=re.search(r'<h3>(.*?)</h3>',card).group(1);href=html.unescape(re.search(r'href="([^"]+)"',card).group(1))
 if 'data-category="app"' in card:
  app=next(x for k,x in appmap.items() if 'id='+k+'&' in href)
  source=app['og:image'];fallback=app['local']
  img=f'<img class="project-thumbnail app-thumbnail" src="{source}" data-fallback="{fallback}" width="512" height="512" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">'
  provenance.append({'name':title,'page':href,'image':source,'fallback':fallback,'source':'Google Play og:image'})
  card=card.replace('class="project-art art-', 'class="project-art app-art art-')
 else:
  slug=games[href.split('/')[1]];source='assets/thumbnails/'+slug+'.jpg'
  img=f'<img class="project-thumbnail game-thumbnail" src="{source}" width="1000" height="660" alt="" loading="lazy" decoding="async">'
  provenance.append({'name':title,'page':href,'image':source,'source':'Local game screenshot'})
 card=re.sub(r'<div class="art-scene">.*?(?=\s*<span class="card-open">)', '<div class="art-scene">'+img+'</div>\n              ',card,flags=re.S)
 return card
s=re.sub(r'<article\b.*?</article>',replace_card,s,flags=re.S)
p.write_text(s,encoding='utf-8')
Path('assets/thumbnails/sources.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('home.css');s=p.read_text(encoding='utf-8');a=s.index('/* Each project');b=s.index('.about {',a)
s=s[:a]+'''/* Real game captures and official Play Store icons. */
.project-art { background: #111827; }
.art-scene { transform: none; }
.project-thumbnail { display: block; width: 100%; height: 100%; object-fit: contain; }
.app-art { background: #e7e7e1; }
.app-art .art-scene { display: grid; place-items: center; }
.app-thumbnail { width: clamp(112px, 45%, 180px); height: auto; aspect-ratio: 1; filter: drop-shadow(0 8px 14px #24272114); }
.thumbnail-failed .project-thumbnail { visibility: hidden; }
''' +s[b:]
# The removed mockup artwork no longer needs its responsive rules or animations.
s=re.sub(r'\.(?:block-sculpture|slime-sun|slime-character)\s*\{[^}]*\}', '',s)
s=re.sub(r'@keyframes (?:slime-bob|blink)\s*\{.*?\}\s*\}', '',s)
s=s[:s.index('.art-selpick {')] if '.art-selpick {' in s else s
p.write_text(s.rstrip()+'\n',encoding='utf-8')
p=Path('home.js');s=p.read_text(encoding='utf-8')
pos=s.index("  document.querySelectorAll('.project-card').forEach")
s=s[:pos]+'''  // Use the same official image locally if Google's image CDN is unavailable.
  document.querySelectorAll('.project-thumbnail').forEach(image => {
    image.addEventListener('error', () => {
      if (image.dataset.fallback) {
        const fallback = image.dataset.fallback;
        delete image.dataset.fallback;
        image.src = fallback;
      } else {
        image.closest('.project-art').classList.add('thumbnail-failed');
      }
    });
    if (image.complete && image.naturalWidth === 0) image.dispatchEvent(new Event('error'));
  });

'''+s[pos:]
s=s.replace("    const scene = card.querySelector('.art-scene');\n",'')
a=s.index("    card.addEventListener('pointermove'");b=s.index("\n  });",a)
s=s[:a]+s[b:]
p.write_text(s,encoding='utf-8')

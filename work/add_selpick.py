from pathlib import Path
import re
p=Path('index.html');s=p.read_text(encoding='utf-8')
s=s.replace('data-category="lab"','data-category="game"').replace('<span class="project-type">실험</span>','<span class="project-type">게임</span>').replace('<span class="project-type">웹 게임</span>','<span class="project-type">게임</span>')
s=s.replace('>웹 게임 <span id="count-game">06','>게임 <span id="count-game">09').replace('>모바일 앱 <span id="count-app">02','>앱 <span id="count-app">03').replace('id="count-all">11','id="count-all">12')
s=re.sub(r'        <button[^>]*data-filter="lab".*?</button>\n','',s)
s=s.replace('총 11개의 실험','총 12개').replace('실험 목록 바로가기','프로젝트 바로가기').replace('아직 등록된 실험이 없습니다.','등록된 프로젝트가 없습니다.')
arrow='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" stroke-width="1.5"/></svg>'
card='''        <article class="project-item" data-category="app" data-number="12">
          <a class="project-card" data-name="SelPick" href="https://play.google.com/store/apps/details?id=com.selpick.app&amp;pcampaignid=web_share" target="_blank" rel="noopener noreferrer">
            <div class="project-art art-selpick" aria-hidden="true">
              <div class="art-scene"><div class="photo-stack"><div class="photo-print photo-back"></div><div class="photo-print photo-front"><div class="photo-landscape"><i class="photo-sun"></i></div><span class="photo-selected">✓</span></div></div></div>
              <span class="card-open">앱 살펴보기 ARROW</span>
            </div>
            <div class="project-info"><div class="project-title"><h3>SelPick</h3>ARROW</div>
              <span class="project-type">Android</span>
            </div>
          </a>
        </article>
'''.replace('ARROW',arrow)
# Place it with the other apps without changing existing project order.
pos=s.index('        <article class="project-item" data-category="game" data-number="06">')
s=s[:pos]+card+s[pos:]
p.write_text(s,encoding='utf-8')
p=Path('home.js');s=p.read_text(encoding='utf-8').replace('{ all: 0, game: 0, app: 0, lab: 0 }','{ all: 0, game: 0, app: 0 }').replace('`총 ${visible}개의 실험`','`총 ${visible}개`')
s=s.replace("const category = location.hash.slice(1);", "// Preserve saved links to the former experiment category.\n    const hash = location.hash.slice(1);\n    const category = hash === 'lab' ? 'game' : hash;")
p.write_text(s,encoding='utf-8')
p=Path('home.css');s=p.read_text(encoding='utf-8')
s+='''
.art-selpick { background: #bfccc6; color: #314a43; }
.photo-stack { position: absolute; width: 160px; height: 190px; left: 50%; top: 50%; transform: translate(-50%, -50%); }
.photo-print { position: absolute; width: 140px; height: 164px; padding: 10px 10px 28px; background: #f5f3e9; box-shadow: 5px 10px 18px #314a4326; }
.photo-back { top: 6px; left: -13px; transform: rotate(-14deg); background: #e5e8d8; }
.photo-front { top: 10px; left: 13px; transform: rotate(8deg); }
.photo-landscape { position: relative; width: 100%; height: 100%; background: #c4d7d7; overflow: hidden; }
.photo-landscape:before, .photo-landscape:after { content: ''; position: absolute; width: 150px; height: 125px; bottom: -70px; left: -30px; border-radius: 45%; background: #8ca28b; transform: rotate(-24deg); }
.photo-landscape:after { bottom: -87px; left: 18px; background: #58776a; transform: rotate(28deg); }
.photo-sun { position: absolute; width: 25px; height: 25px; top: 19px; right: 18px; border-radius: 50%; background: #f0dfb5; }
.photo-selected { position: absolute; width: 28px; height: 28px; right: -9px; bottom: 13px; border-radius: 50%; background: #466951; color: #fff; display: grid; place-items: center; font-size: 15px; }
'''
p.write_text(s,encoding='utf-8')

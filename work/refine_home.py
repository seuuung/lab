from pathlib import Path
import re
p=Path('index.html');s=p.read_text(encoding='utf-8')
s=s.replace('<title>승민의 실험실 — 호기심을 가지고 놀다</title>','<title>승민의 실험실</title>')
s=re.sub(r'(<meta name="description" content=")[^"]*',r'\1승민이 만든 게임과 앱.',s)
s=s.replace('실험 모음 <sup>11</sup>','프로젝트').replace('엉뚱한 실험','실험')
s=re.sub(r'      <div class="hero-topline">.*?</div>\n','',s)
s=re.sub(r'<div class="hero-copy"><h1.*?</div>\n        </div>', '<div class="hero-copy"><h1 id="hero-title">승민의<br>실험실.</h1>\n        </div>',s,flags=re.S) if False else s
start=s.index('        <div class="hero-copy">');end=s.index('        <div class="sculpture-stage">',start)
s=s[:start]+'        <div class="hero-copy"><h1 id="hero-title">승민의 실험실</h1></div>\n'+s[end:]
s=re.sub(r'          <div class="sculpture-index".*?</div>\n','',s)
s=re.sub(r'      <div class="hero-bottom">.*?</div>\n','',s)
s=re.sub(r'      <div class="section-heading">.*?</div>\n', '      <div class="section-heading"><h2 id="projects-title">프로젝트</h2></div>\n',s)
s=re.sub(r'              <div class="art-topline">.*?</div>\n','',s)
s=re.sub(r'<div class="art-caption">.*?</div>','',s)
s=re.sub(r'<span class="(?:jump-caption|orbit-label|mine-label|spatial-label|circle-score)">.*?</span>','',s)
# Keep only names and category metadata below the artwork.
s=re.sub(r'              <p>.*?</p>(<span class="project-type">)',r'              \1',s)
s=s.replace('<span> · </span>브라우저에서 바로 플레이','').replace('모바일 앱<span> · </span>안드로이드','Android')
s=s.replace('당신의 하루를 담다.','').replace('<span></span>','')
s=s.replace('나를 위한 작은 기록','식단 기록').replace('확실한가요?','').replace('<small></small>','')
names={'그림자 퍼즐':'Shadow Puzzle','슬라임 점프':'Neon Slime Jump','궤도 생존':'Magnetic Orbit','미로 탈출':'Maze Runner','입체 지뢰찾기':'3D 지뢰찾기','스페이셜 마인':'Spatial Mine','해커 시뮬레이터':'Linux Hacker CTF'}
for old,new in names.items(): s=s.replace('<h3>'+old+'</h3>','<h3>'+new+'</h3>')
s=re.sub(r'      <div class="collection-end">.*?</div>\n','',s)
start=s.index('      <div class="about-top">');end=s.index('    </section>',start)
s=s[:start]+'''      <h2 id="about-title">승민</h2>
      <a class="about-link" href="https://github.com/seuuung" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
'''+s[end:]
start=s.index('  <footer class="site-footer">');end=s.index('</footer>',start)+len('</footer>')
s=s[:start]+'''  <footer class="site-footer"><span>© <span id="year">2026</span> 승민</span><a class="back-top" href="#">맨 위로 ↑</a></footer>'''+s[end:]
p.write_text(s,encoding='utf-8')
p=Path('home.js');s=p.read_text(encoding='utf-8-sig');s=re.sub(r"  document.querySelector\('\.hero-bottom a'\).*?\n  \}\);\n",'',s,flags=re.S);p.write_text(s,encoding='utf-8')
# Delete styles for markup removed in this edit, including their responsive variants.
p=Path('home.css');css=p.read_text(encoding='utf-8-sig')
retired=['hero-topline','status-dot','title-star','hero-description','short-line','hero-cta','cta-circle','sculpture-index','hero-bottom','tiny-cross','hero-page','section-description','eyebrow','label-mark','art-topline','art-caption','jump-caption','orbit-label','mine-label','spatial-label','circle-score','collection-end','about-top','about-index','about-emblem','about-copy','about-content','footer-top','footer-bottom']
def trim_rules(text):
 result='';pos=0
 while pos<len(text):
  opening=text.find('{',pos)
  if opening<0:return result+text[pos:]
  depth=1;end=opening+1
  while depth:
   if text[end]=='{':depth+=1
   if text[end]=='}':depth-=1
   end+=1
  prefix=text[pos:opening];body=text[opening+1:end-1]
  if '@media' in prefix: result+=prefix+'{'+trim_rules(body)+'}'
  elif prefix.lstrip().startswith('@keyframes'):result+=text[pos:end]
  else:
   selectors=prefix.split(',')
   kept=[x for x in selectors if not any(re.search(r'\.'+re.escape(c)+r'(?![\w-])',x) for c in retired)]
   if kept:result+=','.join(kept)+'{'+body+'}'
  pos=end
 return result
css=trim_rules(css)
# Compact proportions rather than a full-screen promotional hero.
css=css.replace('min-height: 540px','min-height: 250px').replace('height: 540px','height: 250px')
css=css.replace('padding: 55px 0 65px','padding: 40px 0')
css=css.replace('font-size: clamp(52px, 6.8vw, 112px)','font-size: clamp(32px, 4vw, 56px)').replace('letter-spacing: -.085em','letter-spacing: -.055em')
css=css.replace('background: #e7e9e0; padding: 90px var(--gutter) 50px','background: var(--paper); padding: 20px var(--gutter) 48px')
css=css.replace('font-size: clamp(32px, 3.2vw, 52px)','font-size: 20px').replace('margin-bottom: 44px','margin-bottom: 20px')
css=css.replace('border-radius: 3px 3px 38px 3px','border-radius: 0')
css=re.sub(r'\.about \{[^}]*\}', '.about { margin: 0 var(--gutter); padding: 26px 0; border-top: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; gap: 24px; }',css,count=1)
css=re.sub(r'\.about h2 \{[^}]*\}', '.about h2 { font-size: 17px; font-weight: 500; margin: 0; }',css,count=1)
css=re.sub(r'\.about-link \{[^}]*\}', '.about-link { font-size: 14px; min-height: 44px; display: inline-flex; align-items: center; }',css,count=1)
css=re.sub(r'\.site-footer \{[^}]*\}', '.site-footer { margin: 0 var(--gutter); padding: 16px 0 24px; border-top: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; color: var(--muted); font-size: 12px; }',css,count=1)
# Normalize surviving responsive hero/footer rules to the same compact composition.
css=css.replace('min-height: 680px','min-height: 300px').replace('height: 640px','height: 300px').replace('padding-top: 70px','padding-top: 40px')
css=css.replace('min-height: 480px','min-height: 240px').replace('height: 470px','height: 240px').replace('h1 { font-size: 6.9vw; }','h1 { font-size: 40px; }')
css=css.replace('padding-top: 64px','padding-top: 20px').replace('padding-top: 45px','padding-top: 20px')
css=css.replace('.hero-content { grid-template-columns: 1fr; }','.hero-content { grid-template-columns: 1fr 135px; min-height: 190px; }')
css=css.replace('.hero-copy h1 { font-size: clamp(47px, 12vw, 70px); letter-spacing: -.075em; }','.hero-copy h1 { font-size: 27px; letter-spacing: -.06em; }')
css=css.replace('.hero-copy h1 { font-size: 46px; }','.hero-copy h1 { font-size: 24px; }')
css=css.replace('height: 340px; width: 100%; margin: -10px 0 0','height: 180px; width: 100%; margin: 0')
css=css.replace('.section-heading h2 { font-size: 31px; }','.section-heading h2 { font-size: 20px; }').replace('.section-heading h2 { font-size: 27px; }','.section-heading h2 { font-size: 20px; }')
# Remove old mobile overrides of compact about/footer layout.
css=re.sub(r'\.about \{ padding[^}]*\}', '',css)
css=re.sub(r'\.about h2 \{ font-size: 25px;[^}]*\}', '',css)
css=css.replace('.site-footer { padding-top: 25px; }','')
css+='''
/* Keep the sculpture as a small interactive detail, not a landing-page billboard. */
.sculpture-stage { max-width: 320px; justify-self: end; width: 100%; margin-right: 0; }
.sculpture-halo { width: 220px; background: none; }
.sculpture-halo:after { display: none; }
.sculpture-note { top: auto; bottom: 0; right: auto; left: 0; width: auto; height: 44px; border: 0; border-radius: 0; background: none; transform: none; flex-direction: row; font-size: 10px; }
.sculpture-note i { font-size: 15px; }
.sculpture-shadow { bottom: 40px; height: 12px; }
.sculpture-fallback { width: 140px; height: 140px; }
.sculpture-fallback i { border-width: 18px; }
.motion-toggle { bottom: 0; right: 0; }
@media (max-width: 600px) {
  .hero-copy { padding: 28px 0; }
  .sculpture-stage { margin-left: 0; }
  .sculpture-note { display: none; }
  .sculpture-halo { max-width: 100%; width: 120px; }
  .sculpture-fallback { width: 90px; height: 90px; }
  .sculpture-fallback i { border-width: 12px; }
}
'''
p.write_text(css,encoding='utf-8')

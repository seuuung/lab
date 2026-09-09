from pathlib import Path
import json,html,re
old=Path('index.html').read_text(encoding='utf-8')
projects=json.loads(Path('work/original-projects.json').read_text(encoding='utf-8'))
# Keep established analytics and mobile browser handoff behavior.
scripts=re.findall(r'<script(?:\s[^>]*)?>[\s\S]*?</script>',old)
kept='\n'.join(s for s in scripts if 'home.js' not in s)
star='<svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 0v40M0 20h40M6 6l28 28M6 34L34 6" stroke="currentColor" stroke-width="8"/></svg>'
arrow='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" stroke="currentColor" stroke-width="1.5"/></svg>'
order=[6,2,3,4,7,0,1,5,8,9,10]
names=['온식','스페이셜 마인','슬라임 점프','궤도 생존','미로 탈출','해커 시뮬레이터','그림자 퍼즐','입체 지뢰찾기','지옥의 회원가입','최원형','로봇 인증']
descriptions=['하루의 식단을 사진으로 모으고, 나만의 기록으로.','손안의 작은 입체 공간, 숨겨진 지뢰를 찾아보세요.','한 번의 터치로, 한 칸 더 높이. 어디까지 올라갈까요?','당기는 힘과 벗어나는 힘 사이, 나만의 궤도를 찾아서.','길을 잃어도 괜찮아요. 다음 미로는 또 다르니까.','가상 터미널 속 단서를 좇아 보안 퍼즐을 풀어보세요.','흩어진 조각을 돌려, 숨어 있던 그림자를 발견하세요.','한 면 너머까지 생각해야 하는, 한 차원 다른 지뢰찾기.','가입 버튼 하나 누르기가 이렇게 어려울 일이야?','삐뚤어도 한 번 더. 손끝으로 완벽한 원에 도전하세요.','열 번의 기상천외한 질문. 당신은 정말 사람이 맞나요?']
labels={'app':'모바일 앱','game':'웹 게임','lab':'엉뚱한 실험'}
arts={
6: '<div class="light-beam"></div><div class="shadow-floor"></div><div class="block-sculpture">'+''.join(f'<i class="block block-{i}"><b></b><em></em></i>' for i in range(1,6))+'</div><div class="art-caption">빛을 따라<br>발견하는 또 다른 모양.</div>',
2: '<div class="slime-sun"></div><div class="jump-track"><i></i><i></i><i></i></div><div class="slime-character"><div class="slime-highlight"></div><i class="eye eye-left"></i><i class="eye eye-right"></i><b class="mouth"></b><span class="cheek cheek-left"></span><span class="cheek cheek-right"></span></div><div class="slime-shadow"></div><span class="jump-caption">조금 더, 높이.</span>',
3:'<div class="orbit-system"><i class="orbit-path"></i><i class="orbit-path orbit-path-two"></i><i class="planet"></i><i class="moon"></i><i class="orbit-point"></i></div><span class="orbit-label">인력과 관성 사이</span>',
4:'<div class="maze-board">'+''.join(f'<i class="cell cell-{i}"></i>' for i in range(49))+'<b class="maze-ball"></b></div>',
7:'<div class="mine-cube"><div class="mine-face">'+''.join(f'<i>{["","1","","2","","","","3",""][i]}</i>' for i in range(9))+'</div></div><span class="mine-label">시선을 한 번 더 돌려보세요.</span>',
0:'<div class="phone"><div class="phone-camera"></div><div class="phone-heading">오늘의 온식 <span>＋</span></div><div class="plate"><i></i><b></b><em></em></div><div class="phone-details">잘 먹은 하루<span>나를 위한 작은 기록</span></div></div><div class="app-word">온식<span>당신의 하루를 담다.</span></div>',
1:'<div class="spatial-shape"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="spatial-label">작은 공간, 깊은 생각.</span>',
5:'<div class="terminal-window"><div class="window-dots"><i></i><i></i><i></i><span>가상 터미널</span></div><p><span>실험실에 접속 중...</span><br>보안 퍼즐을 시작합니다.<br><b>접근이 허용되었습니다.</b><br>〉<i class="terminal-caret"></i></p></div>',
8:'<div class="signup-window"><div>환영하지 않습니다. <span>×</span></div><p>비밀번호를 입력하세요.</p><div class="fake-password">••••••••••</div><span class="error-copy">조금 더 불가능한 비밀번호가 필요합니다.</span><b>가입하기 ↗</b></div>',
9:'<svg class="drawn-circle" viewBox="0 0 260 260"><circle cx="130" cy="130" r="83" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 6" opacity=".25"/><path d="M132 46C189 41 226 83 217 140S177 218 123 213 41 174 44 119 76 44 132 46" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg><span class="circle-score">거의 완벽한, 당신의 원.</span>',
10:'<div class="robot-window"><div class="robot-check">✓</div><span>로봇이 아닙니다.<small>확실한가요?</small></span><div class="robot-symbol">'+star+'</div></div><div class="robot-grid">'+''.join('<i></i>' for _ in range(9))+'</div>'
}
slugs=['food','spatial','slime','orbit','maze','terminal','shadow','mine','hell','circle','robot']
cards=[]
for index,source in enumerate(order):
 p=projects[source]; num=f'{source+1:02}'; slug=slugs[source]
 extra=' target="_blank" rel="noopener noreferrer"' if p['category']=='app' else ''
 action='앱 살펴보기' if p['category']=='app' else '직접 해보기'
 cards.append(f'''        <article class="project-item" data-category="{p['category']}" data-number="{num}">
          <a class="project-card" data-name="{html.escape(p['title'],quote=True)}" href="{html.escape(p['href'],quote=True)}"{extra}>
            <div class="project-art art-{slug}" aria-hidden="true">
              <div class="art-topline"><span>실험 {num}</span><span>{'손끝으로 시작되는 세계' if index<2 else labels[p['category']]}</span></div>
              <div class="art-scene">{arts[source]}</div>
              <span class="card-open">{action} {arrow}</span>
            </div>
            <div class="project-info"><div class="project-title"><h3>{names[source]}</h3>{arrow}</div>
              <p>{descriptions[source]}</p><span class="project-type">{labels[p['category']]}<span> · </span>{'안드로이드' if p['category']=='app' else '브라우저에서 바로 플레이'}</span>
            </div>
          </a>
        </article>''')
markup='''<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#f1f0ea">
  <title>승민의 실험실 — 호기심을 가지고 놀다</title>
  <meta name="description" content="작은 호기심에서 시작된 11개의 실험. 승민이 만든 웹 게임, 모바일 앱, 엉뚱한 인터랙티브 실험을 직접 플레이해 보세요.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="home.css">
  <script defer src="home.js"></script>
  <script defer src="sculpture.js"></script>
  KEPT
</head>
<body>
  <a class="skip-link" href="#projects">실험 목록 바로가기</a>
  <div class="reading-progress" aria-hidden="true"></div>
  <header class="site-header">
    <a class="brand" href="./" aria-label="승민의 실험실 홈"><span class="brand-symbol">STAR</span>승민의 실험실<span class="brand-period">.</span></a>
    <nav aria-label="메인 메뉴"><a href="#projects">실험 모음 <sup>11</sup></a><a href="#about">만든 사람</a></nav>
    <div class="header-tools"><button id="sfx-toggle-btn" class="sound-toggle" type="button" aria-label="소리 켜기" aria-pressed="false"><span class="sound-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span id="sfx-label">소리 끔</span></button></div>
  </header>
  <main>
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-topline"><span><i class="status-dot"></i>작은 생각이 자라는 곳</span><span>승민의 개인 작업 아카이브</span></div>
      <div class="hero-content">
        <div class="hero-copy"><h1 id="hero-title"><span>호기심을</span><span>가지고 <em>놀다.</em><i class="title-star" aria-hidden="true">STAR</i></span></h1>
          <div class="hero-description"><span class="short-line" aria-hidden="true"></span><p>만들고, 부수고, 다시 만들고.<br>작은 상상이 손끝의 경험이 되는 실험실.</p></div>
          <a class="hero-cta" href="#projects"><span>실험 둘러보기</span><span class="cta-circle" aria-hidden="true">↘</span></a>
        </div>
        <div class="sculpture-stage">
          <div class="sculpture-halo" aria-hidden="true"></div>
          <div class="sculpture-fallback" aria-hidden="true"><i></i><i></i><i></i></div>
          <canvas id="sculpture" tabindex="0" role="img" aria-label="회전하는 금속 매듭. 드래그하거나 방향키로 회전할 수 있습니다."></canvas>
          <div class="sculpture-shadow" aria-hidden="true"></div>
          <span class="sculpture-note"><i aria-hidden="true">↔</i> 드래그해서 돌려보세요</span>
          <div class="sculpture-index" aria-hidden="true"><span>형태 연구 — 001</span><span>끝없이 이어지는 호기심</span></div>
          <button id="motion-toggle" class="motion-toggle" type="button" aria-label="모션 멈추기" aria-pressed="false">모션 멈추기 <span aria-hidden="true">Ⅱ</span></button>
        </div>
      </div>
      <div class="hero-bottom"><span><i class="tiny-cross" aria-hidden="true">＋</i> 정해진 답 없이, 재미있는 방향으로.</span><a href="game/shadow_puzzle/index.html">먼저 해볼까요? <b>그림자 퍼즐</b> ARROW</a><span class="hero-page">01 — 11</span></div>
    </section>
    <section id="projects" class="projects" aria-labelledby="projects-title">
      <div class="section-heading"><div><p class="eyebrow"><span class="label-mark"></span>호기심의 결과물</p><h2 id="projects-title">고르는 순간,<br><span>실험은 시작됩니다.</span></h2></div><p class="section-description">조금 진지한 앱부터 꽤 엉뚱한 게임까지.<br>마음이 가는 실험을 하나 열어보세요.</p></div>
      <div class="filter-bar"><div class="filters" aria-label="프로젝트 카테고리">
        <button type="button" class="tab-btn active" data-filter="all" aria-pressed="true">전체 <span id="count-all">11</span></button>
        <button type="button" class="tab-btn" data-filter="game" aria-pressed="false">웹 게임 <span id="count-game">06</span></button>
        <button type="button" class="tab-btn" data-filter="app" aria-pressed="false">모바일 앱 <span id="count-app">02</span></button>
        <button type="button" class="tab-btn" data-filter="lab" aria-pressed="false">엉뚱한 실험 <span id="count-lab">03</span></button>
      </div><span id="result-count" role="status" aria-live="polite">총 11개의 실험</span></div>
      <div class="project-grid">
CARDS
      </div>
      <p id="empty-state" hidden>아직 등록된 실험이 없습니다.</p>
      <div class="collection-end"><span>여기까지, 지금의 호기심.</span><span>다음 실험도 이곳에 쌓입니다. STAR</span></div>
    </section>
    <section id="about" class="about" aria-labelledby="about-title">
      <div class="about-top"><p class="eyebrow"><span class="label-mark"></span>실험실을 만든 사람</p><span class="about-index">계속 만드는 중</span></div>
      <div class="about-content"><div class="about-emblem" aria-hidden="true">STAR<span>만들고<br>또 만들고.</span></div><div class="about-copy"><h2 id="about-title">안녕하세요, 승민입니다.<br><span>재미있는 쪽으로 만듭니다.</span></h2><p>‘이런 것도 되려나?’ 하는 생각을 그냥 지나치지 못합니다.<br>직접 만들고 만져보며 알게 된 것들을 이곳에 모으고 있어요.</p><a class="about-link" href="https://github.com/seuuung" target="_blank" rel="noopener noreferrer">깃허브에서 더 보기 ARROW</a></div></div>
    </section>
  </main>
  <footer class="site-footer"><div class="footer-top"><a class="brand" href="./"><span class="brand-symbol">STAR</span>승민의 실험실.</a><a class="back-top" href="#">맨 위로 ARROW</a></div><div class="footer-bottom"><span>© <span id="year">2026</span> 승민. 호기심으로 만들었습니다.</span><span>작은 실험은 계속됩니다.</span></div></footer>
</body>
</html>
'''
markup=markup.replace('KEPT',kept).replace('CARDS','\n'.join(cards)).replace('STAR',star).replace('ARROW',arrow)
Path('index.html').write_text(markup,encoding='utf-8')
print('Korean homepage composed: 11 original projects')

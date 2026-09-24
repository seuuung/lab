from pathlib import Path
p=Path('tests/home_interactions.test.js');s=p.read_text(encoding='utf-8-sig')
a=s.index("test('all visible interface copy is Korean'");b=s.index("\ntest(",a+5)
s=s[:a]+'''test('project names retain their source language instead of forced Korean translations', () => {
  const names = Object.fromEntries([...html.matchAll(/<a class="project-card"[^>]*href="([^"]+)"[\\s\\S]*?<h3>([^<]+)<\\/h3>/g)].map(m => [m[1], m[2]]));
  assert.equal(names['game/Magnetic_Orbit/index.html'], 'Magnetic Orbit');
  assert.equal(names['game/hacking/index.html'], 'Linux Hacker CTF');
  assert.equal(names['game/shadow_puzzle/index.html'], 'Shadow Puzzle');
  assert.equal(names['game/slime_jump/index.html'], 'Neon Slime Jump');
  assert.equal(names['game/maze_escape/index.html'], 'Maze Runner');
  assert.equal(names['game/3D_%20minesweeper/index.html'], '3D 지뢰찾기');
  assert.equal(names['game/choi_circle/index.html'], '최원형');
  assert.ok(Object.values(names).includes('Spatial Mine'));
});

test('decorative slogans and redundant project instructions are removed', () => {
  assert.doesNotMatch(html, /호기심을 가지고 놀다|호기심의 결과물|손끝으로 시작되는 세계|브라우저에서 바로 플레이|정해진 답 없이|계속 만드는 중/);
  assert.doesNotMatch(html, /class="(?:hero-bottom|collection-end|sculpture-index|art-topline)"/);
  assert.match(html, /id="projects-title">프로젝트<\\/h2>/);
});
''' + s[b:]
s=s.replace("const grid = new Element(), featured = new Element(), github = new Element();", "const grid = new Element(), github = new Element();")
s=s.replace("{ '.project-grid': grid, '.hero-bottom a': featured }", "{ '.project-grid': grid }")
s=s.replace('media, events, github, featured','media, events, github')
s=s.replace('analytics retains original project identities and destinations after Korean renaming','analytics retains established project identities and destinations independently of display names')
p.write_text(s,encoding='utf-8')
p=Path('tests/tier1_feature_test.js');s=p.read_text(encoding='utf-8')
s=s.replace('/깃허브에서 더 보기/.test(indexHtml)', '/href="https:\\/\\/github.com\\/seuuung"/.test(indexHtml)').replace('한국어 소개 영역에서 개발자 작업으로 연결','소개 영역에서 개발자 작업으로 연결')
s=s.replace('const hasProfileAvatarOrIcon = /class="about-emblem"/.test(indexHtml);', 'const hasProfileAvatarOrIcon = /<h2 id="about-title">승민<\\/h2>/.test(indexHtml);')
s=s.replace('프로필 아바타 또는 아이콘 시각 요소 존재','간결한 소개 영역에 제작자 이름 표시')
p.write_text(s,encoding='utf-8')

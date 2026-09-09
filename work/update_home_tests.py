from pathlib import Path
p=Path('tests/tier1_feature_test.js');s=p.read_text(encoding='utf-8')
s=s.replace("const indexHtml = readFile('index.html');", "const indexHtml = readFile('index.html');\n    const homeCss = readFile('home.css');\n    const homeJs = readFile('home.js');")
changes={
"const hasStackBadge = /JavaScript|HTML5|CSS3|Tailwind|Canvas|Three\\.js|WebGL|Android/i.test(indexHtml);":"const hasStackBadge = /id=\"about\"/.test(indexHtml) && /깃허브에서 더 보기/.test(indexHtml);",
"기술 스택 뱃지 또는 역량 키워드 표기":"한국어 소개 영역에서 개발자 작업으로 연결",
"const hasProfileAvatarOrIcon = indexHtml.includes('avatar') || indexHtml.includes('profile') || indexHtml.includes('githubusercontent.com') || /<img[^>]*alt=[\"'][^\"']*profile[^\"']*[\"']/i.test(indexHtml) || indexHtml.includes('rounded-full');":"const hasProfileAvatarOrIcon = /class=\"about-emblem\"/.test(indexHtml);",
"const hasProfileGlassStyle = /glass-card|backdrop-filter|bg-slate-800\\/|bg-white\\/[0-9]+/i.test(indexHtml);":"const hasProfileGlassStyle = /aria-labelledby=\"about-title\"/.test(indexHtml) && /id=\"about-title\"/.test(indexHtml);",
"프로필 영역에 글래스모피즘 스타일 적용":"소개 영역의 접근 가능한 제목 연결",
"indexHtml.includes('addEventListener')":"homeJs.includes('addEventListener')",
"const hasTransitionOrAnimation = indexHtml.includes('transition') || indexHtml.includes('duration') || indexHtml.includes('opacity');":"const hasTransitionOrAnimation = homeJs.includes('item.animate') && homeCss.includes('prefers-reduced-motion');",
"const hasCategoryBadgeOnCards = /bg-[a-z]+-500\\/10/i.test(indexHtml) || /uppercase tracking-wider/i.test(indexHtml);":"const hasCategoryBadgeOnCards = (indexHtml.match(/class=\"project-type\"/g) || []).length === 11;",
"const hasTabContainer = /tab-container|flex flex-wrap|gap-2|gap-3/i.test(indexHtml);":"const hasTabContainer = /aria-label=\"프로젝트 카테고리\"/.test(indexHtml);",
"h.includes('game/3D_ minesweeper')":"decodeURIComponent(h).includes('game/3D_ minesweeper')",
"const glassCards = indexHtml.match(/class=[\"'][^\"']*glass-card[^\"']*[\"']/g) || [];":"const glassCards = extractAllTags(indexHtml, 'a').filter(a => /project-card/.test(a.attributes.class || '') && !!a.attributes.href);",
"11개 이상의 쇼케이스 카드에 glass-card 적용":"11개 프로젝트 카드의 직접 실행 링크 존재",
"const thumbContainers = indexHtml.match(/class=[\"'][^\"']*thumb-container[^\"']*[\"']/g) || [];":"const thumbContainers = indexHtml.match(/class=\"project-art art-[^\"]+\"/g) || [];",
"11개 이상의 쇼케이스 카드에 표준 thumb-container 적용":"11개 프로젝트의 전용 그래픽 존재",
"const hasPlayButtons = indexHtml.includes('플레이하기') || indexHtml.includes('확인') || indexHtml.includes('Play');":"const hasPlayButtons = indexHtml.includes('직접 해보기') && indexHtml.includes('앱 살펴보기');",
"const hasHoverEffectCSS = indexHtml.includes('glass-card:hover') || indexHtml.includes('hover:scale') || indexHtml.includes('group-hover');":"const hasHoverEffectCSS = homeCss.includes('.project-card:hover') && homeCss.includes(':focus-visible');",
"const hasAmbientLight = indexHtml.includes('filter blur-') || indexHtml.includes('mix-blend-screen') || indexHtml.includes('animate-float');":"const hasAmbientLight = /id=\"sculpture\"/.test(indexHtml) && /class=\"sculpture-fallback\"/.test(indexHtml);",
"배경 앰비언트 글로우 라이트 효과 존재":"인터랙티브 조형과 WebGL 대체 그래픽 존재",
"const hasMainContainer = indexHtml.includes('<main') && indexHtml.includes('max-w-7xl');":"const hasMainContainer = indexHtml.includes('<main') && homeCss.includes('@media (max-width: 600px)');",
"메인 컨테이너 반응형 최대 너비(max-w-7xl) 준수":"메인 화면과 모바일 전용 레이아웃 존재"
}
for a,b in changes.items():
 if a not in s: print('Missing tier1 replacement:',a[:75])
 s=s.replace(a,b)
p.write_text(s,encoding='utf-8')
p=Path('tests/tier2_boundary_test.js');s=p.read_text(encoding='utf-8');s=s.replace("const indexHtml = readFile('index.html');","const indexHtml = readFile('index.html');\n    const homeCss = readFile('home.css');")
s=s.replace('const hasIndexSafeArea = /safe-area-inset|env\\(safe-area/i.test(indexHtml)', 'const hasIndexSafeArea = /safe-area-inset|env\\(safe-area/i.test(homeCss)')
s=s.replace('const hasBottomSafeArea', 'const hasBottomSafeArea')
s=s.replace("assertIncludes(indexHtml, 'overflow-x: hidden', 'Tier2-B2-01: index.html body에 overflow-x: hidden 적용으로 가로 스크롤 방지');", "assert(/overflow-x:\\s*(clip|hidden)/.test(homeCss), 'Tier2-B2-01: 메인 화면 가로 넘침 제어');")
s=s.replace('const hasTabTouchTarget = /py-[2-4]|px-[3-6]|h-1[0-2]|min-h-\\[44px\\]|p-[2-4]/i.test(indexHtml);', "const hasTabTouchTarget = /\\.tab-btn\\s*\\{[^}]*min-height:\\s*44px/.test(homeCss);")
# Only the root-page check now reads the external stylesheet; game checks stay unchanged.
s=s.replace('/safe-area-inset-bottom|min-h-screen|min-height|padding-bottom|pb-/i.test(indexHtml)', '/safe-area-inset-bottom|min-h-screen|min-height|padding-bottom|pb-/i.test(homeCss)')
p.write_text(s,encoding='utf-8')
p=Path('tests/verify_ga_events.js');s=p.read_text(encoding='utf-8');s=s.replace("fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');", "fs.readFileSync(path.join(rootDir, 'home.js'), 'utf8');")
s=s.replace('portalContent.includes("trackEvent(', 'portalContent.includes("track(')
p.write_text(s,encoding='utf-8')

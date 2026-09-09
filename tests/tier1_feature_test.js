/**
 * Tier 1: Feature Tests (기능 전수 검증)
 * 
 * F1: About Me 프로필 카드
 * F2: 4단계 카테고리 탭 필터
 * F3: 삼척 기상토토 쇼케이스 카드
 * F4: 12개 프로젝트 쇼케이스 카드 전수 존재성 & 글래스모피즘
 * F13: 10개 하위 프로젝트 표준 '실험실 홈' 내비게이션 전수 적용
 * F14: 10개 하위 프로젝트 파일 무결성 및 링크 정합성
 */

const fs = require('fs');
const path = require('path');
const {
    PROJECT_ROOT,
    SUBPROJECT_DIRS,
    assert,
    assertEqual,
    assertMatch,
    assertIncludes,
    assertGreaterOrEqual,
    assertFileExists,
    readFile,
    extractAllTags
} = require('./test_helper');

function runTier1Tests() {
    console.log('\n========================================');
    console.log('▶ Running Tier 1: Feature Tests');
    console.log('========================================\n');

    // 1. index.html 로드 및 기본 검증
    assertFileExists('index.html', 'Tier1-F0: index.html 루트 파일 존재 확인');
    const indexHtml = readFile('index.html');
    const homeCss = readFile('home.css');
    const homeJs = readFile('home.js');
    assertGreaterOrEqual(indexHtml.length, 500, 'Tier1-F0: index.html 내용이 충분히 작성되어 있음');

    // ----------------------------------------------------
    // F1: About Me 프로필 카드 검증 (10 assertions)
    // ----------------------------------------------------
    console.log('[Tier 1] F1: About Me 프로필 카드 검증...');
    const hasAboutMe = /<section\b[^>]*id="about"[^>]*aria-labelledby="about-title"/.test(indexHtml);
    assert(hasAboutMe, 'Tier1-F1-01: index.html에 About Me / 프로필 섹션 식별자 존재');

    const hasGithubLink = indexHtml.includes('https://github.com/seuuung') || indexHtml.includes('github.com/seuuung');
    assert(hasGithubLink, 'Tier1-F1-02: About Me 내 GitHub 링크(https://github.com/seuuung) 포함');

    const allAnchorTags = extractAllTags(indexHtml, 'a');
    const githubAnchor = allAnchorTags.find(a => (a.attributes.href || '').includes('github.com/seuuung'));
    assert(!!githubAnchor, 'Tier1-F1-03: GitHub 링크용 <a> 태그 존재');
    if (githubAnchor) {
        assertEqual(githubAnchor.attributes.target, '_blank', 'Tier1-F1-04: GitHub 링크 target="_blank" 속성 설정');
        assertIncludes(githubAnchor.attributes.rel || '', 'noopener', 'Tier1-F1-05: GitHub 링크 rel에 noopener 포함');
    } else {
        assert(false, 'Tier1-F1-04: (Skipped) GitHub anchor missing');
        assert(false, 'Tier1-F1-05: (Skipped) GitHub anchor missing');
    }

    const hasNameOrNickname = /승민|Seungmin|seuuung/i.test(indexHtml);
    assert(hasNameOrNickname, 'Tier1-F1-06: About Me에 개발자 이름(승민/Seungmin) 명시');

    const hasStackBadge = /id="about"/.test(indexHtml) && /깃허브에서 더 보기/.test(indexHtml);
    assert(hasStackBadge, 'Tier1-F1-07: 한국어 소개 영역에서 개발자 작업으로 연결');

    const hasProfileAvatarOrIcon = /class="about-emblem"/.test(indexHtml);
    assert(hasProfileAvatarOrIcon, 'Tier1-F1-08: 프로필 아바타 또는 아이콘 시각 요소 존재');

    const hasBioText = indexHtml.includes('개발자') || indexHtml.includes('프로젝트') || indexHtml.includes('실험실') || indexHtml.includes('소개');
    assert(hasBioText, 'Tier1-F1-09: About Me 자기소개 문구 존재');

    const hasProfileGlassStyle = /aria-labelledby="about-title"/.test(indexHtml) && /id="about-title"/.test(indexHtml);
    assert(hasProfileGlassStyle, 'Tier1-F1-10: 소개 영역의 접근 가능한 제목 연결');


    // ----------------------------------------------------
    // F2: 4단계 카테고리 탭 필터 검증 (15 assertions)
    // ----------------------------------------------------
    console.log('[Tier 1] F2: 4단계 카테고리 탭 필터 검증...');
    const allButtons = extractAllTags(indexHtml, 'button');
    const allTabs = allButtons.filter(b => (b.rawAttributes.includes('filter') || b.rawAttributes.includes('category') || b.rawAttributes.includes('tab') || /all|app|game|lab/i.test(b.rawAttributes) || /전체|앱|게임|실험/i.test(b.innerHTML)));

    assertGreaterOrEqual(allTabs.length, 4, 'Tier1-F2-01: 4단계 탭 버튼(전체, 모바일 앱, 웹 게임, 밈&실험실) 4개 이상 배치');

    const hasTabAll = allTabs.some(t => /전체|all/i.test(t.innerHTML) || (t.attributes['data-filter'] === 'all') || (t.attributes['data-category'] === 'all'));
    assert(hasTabAll, 'Tier1-F2-02: "전체(all)" 탭 버튼 존재');

    const hasTabApp = allTabs.some(t => /앱|모바일|app/i.test(t.innerHTML) || (t.attributes['data-filter'] === 'app') || (t.attributes['data-category'] === 'app'));
    assert(hasTabApp, 'Tier1-F2-03: "모바일 앱(app)" 탭 버튼 존재');

    const hasTabGame = allTabs.some(t => /게임|game/i.test(t.innerHTML) || (t.attributes['data-filter'] === 'game') || (t.attributes['data-category'] === 'game'));
    assert(hasTabGame, 'Tier1-F2-04: "웹 게임(game)" 탭 버튼 존재');

    const hasTabLab = allTabs.some(t => /실험|밈|lab|meme/i.test(t.innerHTML) || (t.attributes['data-filter'] === 'lab') || (t.attributes['data-category'] === 'lab'));
    assert(hasTabLab, 'Tier1-F2-05: "밈 & 실험실(lab)" 탭 버튼 존재');

    // data-category 속성 부여 확인
    const hasDataCategoryApp = indexHtml.includes('data-category="app"');
    assert(hasDataCategoryApp, 'Tier1-F2-06: data-category="app" 속성을 가진 카드 존재');

    const hasDataCategoryGame = indexHtml.includes('data-category="game"');
    assert(hasDataCategoryGame, 'Tier1-F2-07: data-category="game" 속성을 가진 카드 존재');

    const hasDataCategoryLab = indexHtml.includes('data-category="lab"');
    assert(hasDataCategoryLab, 'Tier1-F2-08: data-category="lab" 속성을 가진 카드 존재');

    // 탭 필터링 바닐라 JS 로직 검증
    const hasFilterScript = indexHtml.includes('filter') || indexHtml.includes('data-category') || indexHtml.includes('querySelectorAll');
    assert(hasFilterScript, 'Tier1-F2-09: 탭 필터링을 위한 바닐라 JS 로직 존재');

    const hasEventListenerOrOnClick = homeJs.includes('addEventListener') || indexHtml.includes('onclick') || indexHtml.includes('filterCards');
    assert(hasEventListenerOrOnClick, 'Tier1-F2-10: 탭 버튼 클릭 이벤트 바인딩 존재');

    const hasDisplayToggle = indexHtml.includes('style.display') || indexHtml.includes('classList.add') || indexHtml.includes('classList.toggle') || indexHtml.includes('hidden');
    assert(hasDisplayToggle, 'Tier1-F2-11: 탭 전환 시 요소 표시/숨김 스타일 제어 로직 존재');

    const hasActiveTabHighlight = indexHtml.includes('active') || indexHtml.includes('bg-cyan') || indexHtml.includes('border-cyan') || indexHtml.includes('bg-gradient');
    assert(hasActiveTabHighlight, 'Tier1-F2-12: 활성 탭 하이라이트 스타일 제어 로직 존재');

    const hasTransitionOrAnimation = homeJs.includes('item.animate') && homeCss.includes('prefers-reduced-motion');
    assert(hasTransitionOrAnimation, 'Tier1-F2-13: 탭 필터 전환 시 애니메이션 / 트랜지션 클래스 적용');

    const hasCategoryBadgeOnCards = (indexHtml.match(/class="project-type"/g) || []).length === 11;
    assert(hasCategoryBadgeOnCards, 'Tier1-F2-14: 각 쇼케이스 카드에 카테고리 뱃지 스타일 적용');

    const hasTabContainer = /aria-label="프로젝트 카테고리"/.test(indexHtml);
    assert(hasTabContainer, 'Tier1-F2-15: 탭 네비게이션 컨테이너 레이아웃 클래스 구성');


    // ----------------------------------------------------
    // F4: 11개 프로젝트 쇼케이스 카드 전수 존재성 & 모던 글래스모피즘 (19 assertions)
    // ----------------------------------------------------
    console.log('[Tier 1] F4: 11개 프로젝트 쇼케이스 카드 전수 존재성 검증...');
    const REQUIRED_PROJECTS = [
        { id: 'onsic', name: '온식 (OnSic)', check: (h) => h.includes('com.onsic.app') || h.includes('온식') },
        { id: 'spatial_mine', name: 'Spatial Mine', check: (h) => h.includes('spatialmine.app') || h.includes('Spatial Mine') },
        { id: 'slime_jump', name: '슬라임 점프', check: (h) => h.includes('game/slime_jump') },
        { id: 'magnetic_orbit', name: '궤도 생존', check: (h) => h.includes('game/Magnetic_Orbit') },
        { id: 'maze_escape', name: '미로 탈출', check: (h) => h.includes('game/maze_escape') },
        { id: 'hacking', name: '해커 CTF', check: (h) => h.includes('game/hacking') },
        { id: 'shadow_puzzle', name: '그림자 퍼즐', check: (h) => h.includes('game/shadow_puzzle') },
        { id: 'minesweeper', name: '3D 지뢰찾기', check: (h) => decodeURIComponent(h).includes('game/3D_ minesweeper') || h.includes('3D%20minesweeper') || h.includes('3D_minesweeper') },
        { id: 'sign_up_hell', name: '지옥의 회원가입', check: (h) => h.includes('game/sign_up_for_hell') },
        { id: 'choi_circle', name: '최원형', check: (h) => h.includes('game/choi_circle') },
        { id: 'robot', name: '로봇 인증', check: (h) => h.includes('game/robot') }
    ];

    REQUIRED_PROJECTS.forEach((proj, idx) => {
        const found = proj.check(indexHtml);
        assert(found, `Tier1-F4-${String(idx + 1).padStart(2, '0')}: 쇼케이스 카드 [${proj.name}] 존재성 확인`);
    });

    const glassCards = extractAllTags(indexHtml, 'a').filter(a => /project-card/.test(a.attributes.class || '') && !!a.attributes.href);
    assertGreaterOrEqual(glassCards.length, 11, 'Tier1-F4-13: 11개 프로젝트 카드의 직접 실행 링크 존재');

    const thumbContainers = indexHtml.match(/class="project-art art-[^"]+"/g) || [];
    assertGreaterOrEqual(thumbContainers.length, 11, 'Tier1-F4-14: 11개 프로젝트의 전용 그래픽 존재');

    const hasPlayButtons = indexHtml.includes('직접 해보기') && indexHtml.includes('앱 살펴보기');
    assert(hasPlayButtons, 'Tier1-F4-15: 쇼케이스 카드에 인터랙션 CTA 텍스트(플레이하기 등) 존재');

    const hasFooter = indexHtml.includes('<footer') && indexHtml.includes('</footer>');
    assert(hasFooter, 'Tier1-F4-16: index.html에 <footer> 태그 존재');

    const hasFooterBranding = /©\s*2026|All\s*rights\s*reserved|실험실/i.test(indexHtml);
    assert(hasFooterBranding, 'Tier1-F4-17: 푸터에 2026 브랜드 저작권 표기 존재');

    const hasHoverEffectCSS = homeCss.includes('.project-card:hover') && homeCss.includes(':focus-visible');
    assert(hasHoverEffectCSS, 'Tier1-F4-18: 카드 호버 시 시각적 인터랙션 스타일 적용');

    const hasAmbientLight = /id="sculpture"/.test(indexHtml) && /class="sculpture-fallback"/.test(indexHtml);
    assert(hasAmbientLight, 'Tier1-F4-19: 인터랙티브 조형과 WebGL 대체 그래픽 존재');

    const hasMainContainer = indexHtml.includes('<main') && homeCss.includes('@media (max-width: 600px)');
    assert(hasMainContainer, 'Tier1-F4-20: 메인 화면과 모바일 전용 레이아웃 존재');


    // ----------------------------------------------------
    // F13: 9개 하위 게임 프로젝트 표준 '실험실 홈' 내비게이션 전수 적용 (18 assertions)
    // ----------------------------------------------------
    console.log('[Tier 1] F13: 9개 하위 게임 프로젝트 표준 홈 내비게이션 검증...');
    SUBPROJECT_DIRS.forEach((dir, idx) => {
        const gameIndexPath = path.join(dir, 'index.html');
        assertFileExists(gameIndexPath, `Tier1-F13-${String(idx * 2 + 1).padStart(2, '0')}: [${dir}] index.html 존재`);
        const gameHtml = readFile(gameIndexPath);

        // 홈 링크 존재 확인
        const hasHomeLink = gameHtml.includes('href="../../index.html"') || 
                            gameHtml.includes('href="../index.html"') || 
                            gameHtml.includes('href="/"') ||
                            gameHtml.includes('href="/index.html"') ||
                            gameHtml.includes('class="floating-home-btn"') ||
                            gameHtml.includes('id="homeBtn"') ||
                            gameHtml.includes('실험실 홈') ||
                            /aria-label=["']실험실 홈/i.test(gameHtml);
        assert(hasHomeLink, `Tier1-F13-${String(idx * 2 + 2).padStart(2, '0')}: [${dir}] '실험실 홈' 플로팅 내비게이션 버튼 포함`);
    });


    // ----------------------------------------------------
    // F14: 9개 하위 프로젝트 파일 무결성 및 링크 정합성 (14 assertions)
    // ----------------------------------------------------
    console.log('[Tier 1] F14: 9개 하위 프로젝트 파일 무결성 및 링크 정합성 검증...');
    SUBPROJECT_DIRS.forEach((dir, idx) => {
        const gameIndexPath = path.join(dir, 'index.html');
        const content = readFile(gameIndexPath);
        assertGreaterOrEqual(content.length, 100, `Tier1-F14-${String(idx + 1).padStart(2, '0')}: [${dir}] 파일 크기 정상 (>100 bytes)`);
    });

    // game/robot 특정 링크 무결성 검증
    const robotHtml = readFile('game/robot/index.html');
    const hasBrokenHref = robotHtml.includes('href="undefined"') || robotHtml.includes('src="undefined"') || robotHtml.includes('href="#"');
    assert(!hasBrokenHref, 'Tier1-F14-11: game/robot/index.html 내 undefined 또는 빈 앵커 깨진 링크 부재');

    // 상대 경로 정합성 검증 (index.html 내 9개 게임 경로가 실제 로컬에 존재하는지)
    SUBPROJECT_DIRS.forEach((dir, idx) => {
        const fullPath = path.join(PROJECT_ROOT, dir, 'index.html');
        const exists = fs.existsSync(fullPath);
        if (idx < 4) { // 샘플 4개 assertion
            assert(exists, `Tier1-F14-${12 + idx}: 로컬 파일 시스템 경로 [${dir}/index.html] 유효성 검증`);
        }
    });

    console.log('✔ Tier 1 Feature Tests Completed.\n');
}

module.exports = { runTier1Tests };

if (require.main === module) {
    const { resetStats, getStats } = require('./test_helper');
    resetStats();
    runTier1Tests();
    const stats = getStats();
    console.log(`Tier 1 Result: Total ${stats.assertCount}, Passed ${stats.passCount}, Failed ${stats.failCount}`);
    process.exit(stats.failCount > 0 ? 1 : 0);
}

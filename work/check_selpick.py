from pathlib import Path
import re
p=Path('tests/home_interactions.test.js');s=p.read_text(encoding='utf-8')
s=s.replace('11 projects remain','12 projects remain').replace('assert.equal(articles.length, 11)','assert.equal(articles.length, 12)').replace('{ all: 11, game: 6, app: 2, lab: 3 }','{ all: 12, game: 9, app: 3 }').replace('`총 ${visible.length}개의 실험`','`총 ${visible.length}개`').replace('length, 11)','length, 12)')
s=s.replace("assert.equal(env.items.filter(item => !item.hidden).length, 2);", "assert.equal(env.items.filter(item => !item.hidden).length, 3);")
a=s.index("env.context.location.hash = '#lab'");b=s.index("env.context.location.hash = '';",a)
s=s[:a]+s[a:b].replace('length, 3)','length, 9)')+s[b:]
s=s.replace("  const env = makeHome();\n  for (const button of env.buttons)","  const env = makeHome();\n  assert.deepEqual(env.buttons.map(button => button.dataset.filter), ['all', 'game', 'app']);\n  for (const button of env.buttons)")
s+='''

test('SelPick appears only in all and app filters, with the supplied Play Store destination', () => {
  const env = makeHome();
  const index = env.cards.findIndex(card => card.dataset.name === 'SelPick');
  assert.ok(index >= 0);
  const card = env.cards[index];
  assert.equal(card.attrs.href, 'https://play.google.com/store/apps/details?id=com.selpick.app&pcampaignid=web_share');
  for (const category of ['app', 'game', 'all']) {
    env.buttons.find(button => button.dataset.filter === category).fire('click');
    assert.equal(env.items[index].hidden, category === 'game');
  }
  card.fire('click');
  assert.equal(env.events.at(-1)[2].category, 'app');
});
'''
p.write_text(s,encoding='utf-8')
p=Path('tests/tier1_feature_test.js');s=p.read_text(encoding='utf-8')
s=re.sub(r'const allTabs = .*?;',"const allTabs = allButtons.filter(b => b.attributes['data-filter']);",s)
s=s.replace("assertGreaterOrEqual(allTabs.length, 4, 'Tier1-F2-01: 4단계 탭 버튼(전체, 모바일 앱, 웹 게임, 밈&실험실) 4개 이상 배치');","assertEqual(allTabs.length, 3, 'Tier1-F2-01: 전체, 게임, 앱의 3개 탭만 배치');")
s=s.replace("assert(hasTabLab, 'Tier1-F2-05: \"밈 & 실험실(lab)\" 탭 버튼 존재');", "assert(!hasTabLab, 'Tier1-F2-05: 별도 실험 탭 제거');")
s=s.replace("assert(hasDataCategoryLab, 'Tier1-F2-08: data-category=\"lab\" 속성을 가진 카드 존재');", "assert(!hasDataCategoryLab, 'Tier1-F2-08: 이전 실험 카드가 게임 분류로 통합');")
s=s.replace('length === 11','length === 12')
s=s.replace("{ id: 'onsic',", "{ id: 'selpick', name: 'SelPick', check: (h) => h.includes('id=com.selpick.app&amp;pcampaignid=web_share') && h.includes('<h3>SelPick</h3>') },\n        { id: 'onsic',")
s=s.replace("assertGreaterOrEqual(glassCards.length, 11, 'Tier1-F4-13: 11개 프로젝트 카드의 직접 실행 링크 존재');", "assertEqual(glassCards.length, 12, 'Tier1-F4-13: 12개 프로젝트 카드의 직접 실행 링크 존재');")
s=s.replace("assertGreaterOrEqual(thumbContainers.length, 11, 'Tier1-F4-14: 11개 프로젝트의 전용 그래픽 존재');", "assertEqual(thumbContainers.length, 12, 'Tier1-F4-14: 12개 프로젝트의 전용 그래픽 존재');")
p.write_text(s,encoding='utf-8')
p=Path('tests/tier3_pairwise_test.js');s=p.read_text(encoding='utf-8')
a=s.index('    const sampleCards = [');b=s.index('    // 필터링 시뮬레이션 함수',a)
s=s[:a]+'''    const sampleCards = [...indexHtml.matchAll(/<article class="project-item" data-category="([^"]+)"[\\s\\S]*?<h3>([^<]+)<\\/h3>/g)]
        .map(match => ({ category: match[1], name: match[2] }));

'''+s[b:]
s=s.replace("assert(allResults.some(c => c.category === 'lab'), 'Tier3-M1-04: \"all\" 탭에 lab 카테고리 포함');", "assert(allResults.some(c => c.name === 'SelPick'), 'Tier3-M1-04: 전체 목록에 SelPick 포함');")
s=s.replace("appResults.length, 2", "appResults.length, 3").replace('2개 모바일 앱','3개 앱').replace('gameResults.length, 6','gameResults.length, 9').replace('6개 웹 게임','9개 게임')
a=s.index("    const labResults = simulateFilter('lab');");b=s.index('    // 1-5.',a)
s=s[:a]+'''    assert(!sampleCards.some(c => c.category === 'lab'), 'Tier3-M1-09: 독립 실험 분류 제거');
    assert(['지옥의 회원가입', '최원형', '로봇 인증'].every(name => gameResults.some(c => c.name === name)), 'Tier3-M1-10: 기존 실험 3개가 게임 목록에 유지');

'''+s[b:]
s=s.replace('currentCards.length, 2','currentCards.length, 3').replace("탭 전이 lab -> all", "탭 전이 app -> all")
p.write_text(s,encoding='utf-8')
p=Path('tests/tier4_realworld_test.js');s=p.read_text(encoding='utf-8');s=re.sub(r'const hasTabs = .*?;', '''const hasTabs = ['all', 'app', 'game'].every(category => indexHtml.includes('data-filter="' + category + '"')) && !indexHtml.includes('data-filter="lab"');''',s)
s=s.replace('4개 카테고리 탭','3개 카테고리 탭');p.write_text(s,encoding='utf-8')

'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const start = app.indexOf('  let docsReturnFocus=null;');
const end = app.indexOf('  function init() {', start);
assert.ok(start > 0 && end > start, '문서 동작 함수가 있어야 합니다.');
const elements = {};
function element(id, hidden = false) {
  const classes = new Set(hidden ? ['hidden'] : []);
  return elements[id] = {
    id, isConnected: true, attrs: {}, value: '', textContent: '', hidden: false, scrollTop: 10,
    classList: { contains: name => classes.has(name), toggle(name, on) { if (on) classes.add(name); else classes.delete(name); } },
    setAttribute(name, value) { this.attrs[name] = value; },
    focus() { document.activeElement = this; }
  };
}
const launcher = element('docs-toggle');
const drawer = element('docs-drawer', true);
const header = element('header-docs');
const search = element('docs-search');
const empty = element('docs-empty', true);
element('docs-scroll');
const sections = [{ id: 'ref-control', textContent: '반복과 조건문', hidden: false }, { id: 'ref-builtins', textContent: '범위와 합계', hidden: false }];
const links = Object.fromEntries(sections.map(section => [section.id, { hidden: false }]));
const document = {
  body: element('body'),
  activeElement: launcher,
  querySelectorAll(selector) { return selector === '.reference-section' ? sections : []; },
  querySelector(selector) { return links[selector.match(/#(ref-[^"\]]+)/)?.[1]]; }
};
const context = { document, $: selector => elements[selector.slice(1)] };
vm.runInNewContext(app.slice(start, end) + '\nthis.docs={toggleDocs,searchDocs};', context);
context.docs.toggleDocs(true, launcher);
assert.equal(drawer.classList.contains('hidden'), false);
assert.equal(launcher.classList.contains('hidden'), true);
assert.equal(header.attrs['aria-expanded'], 'true');
assert.equal(document.body.classList.contains('docs-open'), true);
assert.equal(document.activeElement, drawer);
search.value = '범위';
context.docs.searchDocs();
assert.deepEqual(sections.map(section => section.hidden), [true, false]);
assert.equal(links['ref-control'].hidden, true);
assert.equal(empty.classList.contains('hidden'), true);
search.value = '없는 문법';
context.docs.searchDocs();
assert.equal(empty.classList.contains('hidden'), false);
context.docs.toggleDocs(false);
assert.equal(drawer.classList.contains('hidden'), true);
assert.equal(header.attrs['aria-expanded'], 'false');
assert.equal(document.body.classList.contains('docs-open'), false);
assert.equal(document.activeElement, launcher);
console.log('플로팅 문서 접기·펼치기와 검색 동작 통과');

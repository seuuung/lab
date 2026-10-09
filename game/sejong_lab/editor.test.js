'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const start = app.indexOf('  function renderEditor() {');
const end = app.indexOf('  function updateCursor() {', start);
assert.ok(start > 0 && end > start);

const source = { value: '', scrollTop: 0, scrollLeft: 0, scrollHeight: 300, clientHeight: 300 };
const highlight = { innerHTML: '', scrollTop: 0, scrollLeft: 0 };
const gutter = { textContent: '', scrollTop: 0 };
const count = { textContent: '' };
const context = { source, highlight, gutter, renderCodeLine: line => line, updateCursor() {}, $: () => count };
vm.runInNewContext(app.slice(start, end) + '\nthis.renderEditor=renderEditor;', context);

source.value = Array.from({ length: 80 }, (_, i) => `출력(${i})`).join('\n');
source.scrollHeight = 2200;
source.scrollTop = 1800;
context.renderEditor();
assert.equal(count.textContent, '80줄');
assert.equal(gutter.textContent.split('\n').length, 80);

source.value = '출력(1)';
source.scrollHeight = 300;
context.renderEditor();
assert.equal(count.textContent, '1줄');
assert.equal(gutter.textContent, '1');
assert.equal(highlight.innerHTML, '출력(1)');
assert.equal(source.scrollTop, 0);
assert.equal(gutter.scrollTop, 0);

source.value = '출력(1)\n';
context.renderEditor();
assert.equal(count.textContent, '2줄');
assert.equal(gutter.textContent, '1\n2');
assert.ok(highlight.innerHTML.endsWith('\u200b'));
console.log('편집기 줄 번호·강조 표시·스크롤 축소 동작 통과');

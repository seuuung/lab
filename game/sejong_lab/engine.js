/* 한글 실행기: 어휘 분석 -> AST -> 격리된 Worker 해석 */
(() => {
  'use strict';
  class SejongError extends Error {
    constructor(line, kind, message) { super(message); this.name = 'SejongError'; this.line = line || 0; this.kind = kind; }
  }
  const fail = (line, kind, message) => { throw new SejongError(line, kind, message); };
  const ID = '[가-힣ㄱ-ㅎㅏ-ㅣA-Za-z_][가-힣ㄱ-ㅎㅏ-ㅣA-Za-z_0-9]*';
  const IDENT = new RegExp('^' + ID + '$', 'u');
  const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const MAX_COLLECTION = 5000;
  const MAX_STEPS = 60000;

  function stripComment(text) {
    let quote = '', escaped = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (escaped) { escaped = false; continue; }
      if (quote) { if (c === '\\') escaped = true; else if (c === quote) quote = ''; continue; }
      if (c === '"' || c === "'") quote = c;
      else if (c === '#') return text.slice(0, i);
    }
    return text;
  }

  function tokenize(source, line) {
    const out = [];
    let i = 0;
    while (i < source.length) {
      const c = source[i];
      if (/\s/u.test(c)) { i++; continue; }
      if (c === '"' || c === "'") {
        const quote = c; i++;
        let value = '', closed = false;
        while (i < source.length) {
          const ch = source[i++];
          if (ch === quote) { closed = true; break; }
          if (ch === '\\') {
            if (i >= source.length) fail(line, '구문 오류', '문자열 끝의 역슬래시가 올바르지 않습니다.');
            const next = source[i++];
            value += ({ n: '\n', t: '\t', r: '\r' })[next] ?? next;
          } else value += ch;
        }
        if (!closed) fail(line, '구문 오류', '문자열을 닫는 따옴표가 없습니다.');
        out.push({ type: 'literal', value }); continue;
      }
      if (/[0-9]/.test(c)) {
        let raw = '';
        while (/[0-9]/.test(source[i] || '')) raw += source[i++];
        if (source[i] === '.' && /[0-9]/.test(source[i + 1] || '')) {
          raw += source[i++]; while (/[0-9]/.test(source[i] || '')) raw += source[i++];
        }
        out.push({ type: 'literal', value: Number(raw) }); continue;
      }
      if (/[가-힣ㄱ-ㅎㅏ-ㅣA-Za-z_]/u.test(c)) {
        let word = '';
        while (/[가-힣ㄱ-ㅎㅏ-ㅣA-Za-z_0-9]/u.test(source[i] || '')) word += source[i++];
        out.push({ type: 'word', value: word }); continue;
      }
      const two = source.slice(i, i + 2);
      if (['==', '!=', '<=', '>=', '//'].includes(two)) { out.push({ type: 'op', value: two }); i += 2; continue; }
      if ('+-*/%()[]{},:<>'.includes(c)) { out.push({ type: 'op', value: c }); i++; continue; }
      fail(line, '구문 오류', `알 수 없는 기호 '${c}'가 있습니다.`);
    }
    out.push({ type: 'end', value: '<끝>' });
    return out;
  }

  function parseExpr(source, line) {
    const tokens = tokenize(source, line);
    let at = 0;
    const peek = () => tokens[at];
    const has = value => peek().value === value;
    const next = () => tokens[at++];
    const expect = value => { if (!has(value)) fail(line, '구문 오류', `'${value}'가 필요합니다. 현재: '${peek().value}'`); at++; };
    const binary = (lower, ops) => () => {
      let node = lower();
      while (ops.includes(peek().value)) { const op = next().value; node = { type: 'binary', op, left: node, right: lower() }; }
      return node;
    };
    function primary() {
      const token = next();
      if (token.type === 'literal') return { type: 'literal', value: token.value };
      if (token.type === 'word') {
        if (token.value === '참') return { type: 'literal', value: true };
        if (token.value === '거짓') return { type: 'literal', value: false };
        if (token.value === '없음') return { type: 'literal', value: null };
        if (['그리고', '또는', '아니다'].includes(token.value)) fail(line, '구문 오류', `'${token.value}'의 위치가 올바르지 않습니다.`);
        return { type: 'identifier', name: token.value };
      }
      if (token.value === '(') { const expr = or(); expect(')'); return expr; }
      if (token.value === '[') {
        const items = [];
        while (!has(']')) { items.push(or()); if (!has(',')) break; next(); if (has(']')) break; }
        expect(']'); return { type: 'list', items };
      }
      if (token.value === '{') {
        const entries = [];
        while (!has('}')) { const key = or(); expect(':'); entries.push([key, or()]); if (!has(',')) break; next(); if (has('}')) break; }
        expect('}'); return { type: 'dict', entries };
      }
      fail(line, '구문 오류', `'${token.value}' 근처에 값이 필요합니다.`);
    }
    function postfix() {
      let node = primary();
      while (true) {
        if (has('(')) {
          next(); const args = [];
          while (!has(')')) { args.push(or()); if (!has(',')) break; next(); if (has(')')) break; }
          expect(')'); node = { type: 'call', callee: node, args };
        } else if (has('[')) {
          next();
          let start = null, end = null;
          if (!has(':') && !has(']')) start = or();
          if (has(':')) { next(); if (!has(']')) end = or(); node = { type: 'slice', target: node, start, end }; }
          else { if (!start) fail(line, '구문 오류', '인덱스 값이 필요합니다.'); node = { type: 'index', target: node, index: start }; }
          expect(']');
        } else break;
      }
      return node;
    }
    function unary() {
      if (['-', '+', '아니다'].includes(peek().value)) { const op = next().value; return { type: 'unary', op, expr: unary() }; }
      return postfix();
    }
    const mul = binary(unary, ['*', '/', '//', '%']);
    const add = binary(mul, ['+', '-']);
    const cmp = binary(add, ['==', '!=', '<', '>', '<=', '>=']);
    const and = binary(cmp, ['그리고']);
    const or = binary(and, ['또는']);
    const expr = or();
    if (peek().type !== 'end') fail(line, '구문 오류', `'${peek().value}' 앞뒤의 표현식을 확인해 주세요.`);
    return expr;
  }

  function logicalLines(source) {
    const physical = source.replace(/\r\n?/g, '\n').split('\n');
    const result = [];
    let pending = '', begin = 0, indent = 0, depth = 0, quote = '', escaped = false;
    for (let index = 0; index < physical.length; index++) {
      const raw = physical[index];
      if (!pending && !raw.trim()) continue;
      if (!pending) { begin = index + 1; indent = [...(raw.match(/^[ \t]*/) || [''])[0]].reduce((n, c) => n + (c === '\t' ? 4 : 1), 0); }
      const clean = stripComment(raw).trim();
      if (!clean && !pending) continue;
      pending += (pending ? ' ' : '') + clean;
      for (const c of clean) {
        if (escaped) { escaped = false; continue; }
        if (quote) { if (c === '\\') escaped = true; else if (c === quote) quote = ''; continue; }
        if (c === '"' || c === "'") quote = c;
        else if ('([{'.includes(c)) depth++;
        else if (')]}'.includes(c)) depth--;
        if (depth < 0) fail(index + 1, '구문 오류', '닫는 괄호가 너무 많습니다.');
      }
      if (depth === 0) { if (pending) result.push({ text: pending, indent, line: begin }); pending = ''; }
    }
    if (pending || quote || depth) fail(begin, '구문 오류', '괄호나 따옴표를 닫아 주세요.');
    return result;
  }

  function assignment(text) {
    let depth = 0, quote = '', escaped = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (escaped) { escaped = false; continue; }
      if (quote) { if (c === '\\') escaped = true; else if (c === quote) quote = ''; continue; }
      if (c === '"' || c === "'") { quote = c; continue; }
      if ('([{'.includes(c)) depth++;
      if (')]}'.includes(c)) depth--;
      if (depth || c !== '=' || text[i - 1] === '=' || text[i - 1] === '!' || text[i - 1] === '<' || text[i - 1] === '>' || text[i + 1] === '=') continue;
      const op = '+-*/%'.includes(text[i - 1]) ? text.slice(i - 1, i + 1) : '=';
      const left = text.slice(0, op === '=' ? i : i - 1).trim(), right = text.slice(i + 1).trim();
      return { left, right, op };
    }
    return null;
  }

  function parseProgram(source) {
    if (source.length > 100000) fail(0, '제한 오류', '코드는 100,000자 이하로 작성해 주세요.');
    const lines = logicalLines(source);
    let pos = 0;
    const look = () => lines[pos];
    function body(parent) {
      if (!look() || look().indent <= parent.indent) fail(parent.line, '구문 오류', '다음 줄에 들여쓴 명령이 필요합니다.');
      return block(look().indent);
    }
    function block(indent) {
      const nodes = [];
      while (look() && look().indent >= indent) {
        const row = look(), text = row.text; pos++;
        if (row.indent !== indent) fail(row.line, '구문 오류', '들여쓰기 깊이가 올바르지 않습니다.');
        let match;
        if ((match = /^만약\s+(.+):$/u.exec(text))) {
          const node = { type: 'if', branches: [{ test: parseExpr(match[1], row.line), body: body(row) }], other: null, line: row.line };
          while (look() && look().indent === indent && /^아니고\s+만약\s+(.+):$/u.test(look().text)) {
            const current = look(); pos++; node.branches.push({ test: parseExpr(/^아니고\s+만약\s+(.+):$/u.exec(current.text)[1], current.line), body: body(current) });
          }
          if (look() && look().indent === indent && look().text === '아니면:') { const current = look(); pos++; node.other = body(current); }
          nodes.push(node); continue;
        }
        if (/^(아니고\s+만약|아니면)/u.test(text)) fail(row.line, '구문 오류', '앞에 연결되는 만약 조건문이 없습니다.');
        if ((match = /^반복\s+(.+?)번:$/u.exec(text))) { nodes.push({ type: 'repeat', count: parseExpr(match[1], row.line), body: body(row), line: row.line }); continue; }
        if ((match = new RegExp('^반복\\s+(' + ID + ')\\s+각각\\s+(.+?)(?:에서)?:$', 'u').exec(text))) {
          nodes.push({ type: 'foreach', name: match[1], iterable: parseExpr(match[2], row.line), body: body(row), line: row.line }); continue;
        }
        if ((match = /^(?:반복\s+(.+?)인동안|반복\s+(.+?)\s+동안|동안\s+(.+)):\s*$/u.exec(text))) {
          nodes.push({ type: 'while', test: parseExpr(match[1] || match[2] || match[3], row.line), body: body(row), line: row.line }); continue;
        }
        if ((match = new RegExp('^함수\\s+(' + ID + ')\\s*\\((.*?)\\):$', 'u').exec(text))) {
          const params = match[2].trim() ? match[2].split(',').map(s => s.trim()) : [];
          if (params.some(name => !IDENT.test(name)) || new Set(params).size !== params.length) fail(row.line, '구문 오류', '함수 매개변수가 잘못되었거나 중복되었습니다.');
          nodes.push({ type: 'function', name: match[1], params, body: body(row), line: row.line }); continue;
        }
        if ((match = /^돌려주기(?:\s+(.+))?$/u.exec(text))) { nodes.push({ type: 'return', expr: match[1] ? parseExpr(match[1], row.line) : null, line: row.line }); continue; }
        if (['반복끝내기', '그만', '다음반복', '계속'].includes(text)) { nodes.push({ type: ['그만', '반복끝내기'].includes(text) ? 'break' : 'continue', line: row.line }); continue; }
        const set = assignment(text);
        if (set) {
          if (!set.left || !set.right) fail(row.line, '구문 오류', '대입문 양쪽에 값이 필요합니다.');
          const target = parseExpr(set.left, row.line);
          if (!['identifier', 'index'].includes(target.type)) fail(row.line, '구문 오류', '변수 또는 목록·사전 요소에만 값을 대입할 수 있습니다.');
          nodes.push({ type: 'assign', target, op: set.op, expr: parseExpr(set.right, row.line), line: row.line }); continue;
        }
        if (text.endsWith(':')) fail(row.line, '구문 오류', '명령문의 형식을 확인해 주세요.');
        const expr = parseExpr(text, row.line);
        if (expr.type !== 'call') fail(row.line, '구문 오류', '단독 표현식은 실행할 수 없습니다. 출력() 또는 변수 대입을 사용하세요.');
        nodes.push({ type: 'expr', expr, line: row.line });
      }
      return nodes;
    }
    if (lines.length && lines[0].indent) fail(lines[0].line, '구문 오류', '첫 명령은 들여쓰기 없이 시작해야 합니다.');
    return lines.length ? block(0) : [];
  }

  class Env {
    constructor(parent = null) { this.parent = parent; this.values = Object.create(null); }
    get(name, line) {
      if (hasOwn(this.values, name)) return this.values[name];
      if (this.parent) return this.parent.get(name, line);
      fail(line, '이름 오류', `'${name}'이라는 변수나 함수를 찾지 못했습니다. 먼저 선언했는지 확인하세요.`);
    }
    define(name, value) { this.values[name] = value; }
    assign(name, value) {
      if (hasOwn(this.values, name)) this.values[name] = value;
      else if (this.parent && this.parent.contains(name)) this.parent.assign(name, value);
      else this.values[name] = value;
    }
    contains(name) { return hasOwn(this.values, name) || !!this.parent?.contains(name); }
  }

  function repr(value, seen = new Set()) {
    if (value === null) return '없음';
    if (value === true) return '참';
    if (value === false) return '거짓';
    if (value?.type === 'sejongFn') return `<함수 ${value.name}>`;
    if (typeof value !== 'object') return String(value);
    if (seen.has(value)) return '<순환 참조>';
    seen.add(value);
    const result = Array.isArray(value) ? `[${value.map(v => repr(v, seen)).join(', ')}]` : `{${Object.keys(value).map(k => `"${k}": ${repr(value[k], seen)}`).join(', ')}}`;
    seen.delete(value);
    return result;
  }
  const truthy = value => !!value && (!Array.isArray(value) || !!value.length) && (typeof value !== 'object' || value === null || Array.isArray(value) || !!Object.keys(value).length);
  const numeric = (value, line) => { if (typeof value !== 'number' || !Number.isFinite(value)) fail(line, '자료형 오류', '숫자가 필요한 곳에 다른 값이 들어왔습니다.'); return value; };
  const keyOf = (value, line) => { if (typeof value !== 'string' && typeof value !== 'number') fail(line, '자료형 오류', '사전 키는 문자열 또는 숫자여야 합니다.'); return String(value); };
  function indexed(target, key, line) {
    if (Array.isArray(target) || typeof target === 'string') {
      if (!Number.isInteger(key) || key < 0 || key >= target.length) fail(line, '인덱스 오류', `인덱스 ${repr(key)}가 범위를 벗어났습니다.`);
      return target[key];
    }
    if (target && typeof target === 'object' && target.type !== 'sejongFn') {
      const name = keyOf(key, line);
      if (!hasOwn(target, name)) fail(line, '키 오류', `사전에 '${name}' 키가 없습니다.`);
      return target[name];
    }
    fail(line, '자료형 오류', '목록, 문자열 또는 사전에서만 요소를 읽을 수 있습니다.');
  }
  function checkSize(value, line) {
    if ((Array.isArray(value) && value.length > MAX_COLLECTION) || (value && typeof value === 'object' && value.type !== 'sejongFn' && Object.keys(value).length > MAX_COLLECTION)) fail(line, '제한 오류', '목록 또는 사전은 5,000개 요소까지만 사용할 수 있습니다.');
    return value;
  }

  function createExecution(source, emit) {
    const ast = parseProgram(source), global = new Env();
    let steps = 0, outputs = 0, depth = 0, graphics = 0, frameFunction = null;
    const guard = line => { if (++steps > MAX_STEPS) fail(line, '제한 오류', '실행 단계 제한(60,000회)을 넘었습니다. 반복문을 확인하세요.'); };
    const requireCount = (args, count, name, line) => { if (args.length !== count) fail(line, '인자 오류', `${name}()에는 값 ${count}개가 필요합니다.`); };
    const graphic = (name, args, line) => {
      if (++graphics > 500) fail(line, '제한 오류', '한 프레임의 그래픽 명령은 500개까지 가능합니다.');
      emit({ type: 'graphic', command: name, args }); return null;
    };
    const boundedNumber = (value, line, min, max) => {
      const n = numeric(value, line);
      if (n < min || n > max) fail(line, '범위 오류', `${min}부터 ${max} 사이 숫자가 필요합니다.`);
      return n;
    };
    const builtins = {
      출력(args, line) {
        if (++outputs > 250) fail(line, '제한 오류', '콘솔 출력은 250줄까지 가능합니다.');
        const text = args.map(x => repr(x)).join(' ');
        if (text.length > 2000) fail(line, '제한 오류', '한 줄 출력은 2,000자까지 가능합니다.');
        emit({ type: 'output', text }); return null;
      },
      길이(args, line) { requireCount(args, 1, '길이', line); const v = args[0]; if (typeof v !== 'string' && !Array.isArray(v) && (!v || typeof v !== 'object' || v.type === 'sejongFn')) fail(line, '자료형 오류', '길이()에는 문자열, 목록 또는 사전이 필요합니다.'); return Array.isArray(v) || typeof v === 'string' ? v.length : Object.keys(v).length; },
      글자열(args, line) { requireCount(args, 1, '글자열', line); return repr(args[0]); },
      문자열(args, line) { return builtins.글자열(args, line); },
      숫자(args, line) { requireCount(args, 1, '숫자', line); const n = Number(args[0]); if (!Number.isFinite(n)) fail(line, '자료형 오류', '숫자로 바꿀 수 없는 값입니다.'); return n; },
      실수(args, line) { return builtins.숫자(args, line); },
      정수(args, line) { return Math.trunc(builtins.숫자(args, line)); },
      절댓값(args, line) { requireCount(args, 1, '절댓값', line); return Math.abs(numeric(args[0], line)); },
      범위(args, line) {
        if (args.length < 1 || args.length > 3) fail(line, '인자 오류', '범위()에는 시작, 끝, 간격을 최대 3개까지 넣습니다.');
        const start = args.length === 1 ? 0 : numeric(args[0], line), end = numeric(args.length === 1 ? args[0] : args[1], line), step = args.length === 3 ? numeric(args[2], line) : 1;
        if (![start, end, step].every(Number.isInteger)) fail(line, '자료형 오류', '범위()에는 정수를 넣어 주세요.');
        if (step === 0) fail(line, '범위 오류', '범위()의 간격은 0일 수 없습니다.');
        const result = [];
        for (let n = start; step > 0 ? n < end : n > end; n += step) { result.push(n); if (result.length > MAX_COLLECTION) fail(line, '제한 오류', '범위()는 5,000개 이하의 값만 만들 수 있습니다.'); }
        return result;
      },
      합계(args, line) { requireCount(args, 1, '합계', line); if (!Array.isArray(args[0])) fail(line, '자료형 오류', '합계()에는 목록이 필요합니다.'); return args[0].reduce((sum, v) => sum + numeric(v, line), 0); },
      최댓값(args, line) { const items = args.length === 1 && Array.isArray(args[0]) ? args[0] : args; if (!items.length) fail(line, '인자 오류', '최댓값()에는 값이 필요합니다.'); return Math.max(...items.map(v => numeric(v, line))); },
      최솟값(args, line) { const items = args.length === 1 && Array.isArray(args[0]) ? args[0] : args; if (!items.length) fail(line, '인자 오류', '최솟값()에는 값이 필요합니다.'); return Math.min(...items.map(v => numeric(v, line))); },
      정렬(args, line) { requireCount(args, 1, '정렬', line); if (!Array.isArray(args[0])) fail(line, '자료형 오류', '정렬()에는 목록이 필요합니다.'); const copy = [...args[0]]; if (!copy.every(v => typeof v === typeof copy[0] && ['string', 'number'].includes(typeof v))) fail(line, '자료형 오류', '정렬()은 같은 자료형의 숫자 또는 문자열 목록만 지원합니다.'); return copy.sort((a, b) => typeof a === 'number' ? a - b : a.localeCompare(b, 'ko')); },
      추가(args, line) { requireCount(args, 2, '추가', line); if (!Array.isArray(args[0])) fail(line, '자료형 오류', '추가()의 첫 값은 목록이어야 합니다.'); if (args[0].length >= MAX_COLLECTION) fail(line, '제한 오류', '목록은 5,000개까지만 저장할 수 있습니다.'); args[0].push(args[1]); return null; },
      삭제(args, line) { requireCount(args, 2, '삭제', line); const [target, key] = args; if (Array.isArray(target)) { if (!Number.isInteger(key) || key < 0 || key >= target.length) fail(line, '인덱스 오류', '삭제할 인덱스가 범위를 벗어났습니다.'); return target.splice(key, 1)[0]; } if (target && typeof target === 'object' && target.type !== 'sejongFn') { const name = keyOf(key, line); const value = indexed(target, name, line); delete target[name]; return value; } fail(line, '자료형 오류', '삭제()에는 목록 또는 사전이 필요합니다.'); },
      무작위(args, line) { if (!args.length) return Math.random(); if (args.length !== 2) fail(line, '인자 오류', '무작위()에는 인자를 생략하거나 최소·최대 정수 2개를 넣습니다.'); const [a, b] = args.map(v => numeric(v, line)); if (!Number.isInteger(a) || !Number.isInteger(b) || a > b) fail(line, '범위 오류', '무작위()의 최소·최대 정수를 확인하세요.'); return a + Math.floor(Math.random() * (b - a + 1)); },
      입력(args, line) { if (args.length > 1) fail(line, '인자 오류', '입력()에는 안내 문구를 하나만 넣을 수 있습니다.'); return { __requestInput: repr(args[0] ?? '') }; },
      화면만들기(args, line) { requireCount(args, 2, '화면만들기', line); return graphic('화면만들기', [boundedNumber(args[0], line, 1, 1600), boundedNumber(args[1], line, 1, 1200)], line); },
      배경색(args, line) { requireCount(args, 1, '배경색', line); return graphic('배경색', [String(args[0])], line); },
      색상설정(args, line) { requireCount(args, 1, '색상설정', line); return graphic('색상설정', [String(args[0])], line); },
      화면지우기(args, line) { requireCount(args, 0, '화면지우기', line); return graphic('화면지우기', [], line); },
      원그리기(args, line) { requireCount(args, 3, '원그리기', line); return graphic('원그리기', args.map(v => boundedNumber(v, line, -5000, 5000)), line); },
      사각형그리기(args, line) { requireCount(args, 4, '사각형그리기', line); return graphic('사각형그리기', args.map(v => boundedNumber(v, line, -5000, 5000)), line); },
      선그리기(args, line) { requireCount(args, 4, '선그리기', line); return graphic('선그리기', args.map(v => boundedNumber(v, line, -5000, 5000)), line); },
      글자그리기(args, line) { requireCount(args, 3, '글자그리기', line); return graphic('글자그리기', [repr(args[0]), boundedNumber(args[1], line, -5000, 5000), boundedNumber(args[2], line, -5000, 5000)], line); },
      매프레임(args, line) { requireCount(args, 1, '매프레임', line); if (!args[0] || args[0].type !== 'sejongFn' || args[0].params.length) fail(line, '자료형 오류', '매프레임()에는 매개변수가 없는 함수를 넣어 주세요.'); frameFunction = args[0]; return null; }
    };
    function binary(op, a, b, line) {
      switch (op) {
        case '+': return typeof a === 'string' || typeof b === 'string' ? repr(a) + repr(b) : numeric(a, line) + numeric(b, line);
        case '-': return numeric(a, line) - numeric(b, line);
        case '*': return numeric(a, line) * numeric(b, line);
        case '/': case '//': case '%': {
          const x = numeric(a, line), y = numeric(b, line);
          if (y === 0) fail(line, '0 나누기 오류', '0으로 나눌 수 없습니다.');
          return op === '/' ? x / y : op === '//' ? Math.floor(x / y) : x % y;
        }
        case '==': return JSON.stringify(a) === JSON.stringify(b);
        case '!=': return JSON.stringify(a) !== JSON.stringify(b);
        case '<': case '>': case '<=': case '>=': {
          if (typeof a !== typeof b || !['number', 'string'].includes(typeof a)) fail(line, '자료형 오류', '비교하는 두 값은 같은 숫자 또는 문자열이어야 합니다.');
          return op === '<' ? a < b : op === '>' ? a > b : op === '<=' ? a <= b : a >= b;
        }
      }
      fail(line, '구문 오류', `지원하지 않는 연산자 '${op}'입니다.`);
    }
    function* evalNode(node, env, line) {
      guard(line);
      switch (node.type) {
        case 'literal': return node.value;
        case 'identifier': return env.get(node.name, line);
        case 'list': {
          if (node.items.length > MAX_COLLECTION) fail(line, '제한 오류', '목록은 5,000개까지만 만들 수 있습니다.');
          const list = []; for (const item of node.items) list.push(yield* evalNode(item, env, line)); return list;
        }
        case 'dict': {
          if (node.entries.length > MAX_COLLECTION) fail(line, '제한 오류', '사전은 5,000개까지만 만들 수 있습니다.');
          const dict = Object.create(null);
          for (const [key, value] of node.entries) dict[keyOf(yield* evalNode(key, env, line), line)] = yield* evalNode(value, env, line);
          return dict;
        }
        case 'index': return indexed(yield* evalNode(node.target, env, line), yield* evalNode(node.index, env, line), line);
        case 'slice': {
          const target = yield* evalNode(node.target, env, line);
          if (!Array.isArray(target) && typeof target !== 'string') fail(line, '자료형 오류', '슬라이싱에는 목록이나 문자열이 필요합니다.');
          const start = node.start ? yield* evalNode(node.start, env, line) : 0;
          const end = node.end ? yield* evalNode(node.end, env, line) : target.length;
          if (!Number.isInteger(start) || !Number.isInteger(end)) fail(line, '인덱스 오류', '슬라이스 범위는 정수여야 합니다.');
          return target.slice(start, end);
        }
        case 'unary': { const v = yield* evalNode(node.expr, env, line); return node.op === '아니다' ? !truthy(v) : node.op === '-' ? -numeric(v, line) : numeric(v, line); }
        case 'binary': {
          const left = yield* evalNode(node.left, env, line);
          if (node.op === '그리고') return truthy(left) && truthy(yield* evalNode(node.right, env, line));
          if (node.op === '또는') return truthy(left) || truthy(yield* evalNode(node.right, env, line));
          return binary(node.op, left, yield* evalNode(node.right, env, line), line);
        }
        case 'call': {
          if (node.callee.type !== 'identifier') fail(line, '구문 오류', '함수 이름 뒤에 괄호를 사용해 주세요.');
          const name = node.callee.name, args = [];
          for (const arg of node.args) args.push(yield* evalNode(arg, env, line));
          if (hasOwn(builtins, name)) {
            const result = builtins[name](args, line);
            return result?.__requestInput !== undefined ? yield { type: 'input', prompt: result.__requestInput } : result;
          }
          if (!env.contains(name)) fail(line, '함수 오류', `'${name}' 함수를 찾을 수 없습니다. 이름과 선언 위치를 확인하세요.`);
          const fn = env.get(name, line);
          if (!fn || fn.type !== 'sejongFn') fail(line, '함수 오류', `'${name}'은 실행 가능한 함수가 아닙니다.`);
          return yield* callFunction(fn, args, line);
        }
      }
      fail(line, '구문 오류', '해석할 수 없는 표현식입니다.');
    }
    function* callFunction(fn, args, line) {
      if (args.length !== fn.params.length) fail(line, '인자 오류', `'${fn.name}' 함수에는 값 ${fn.params.length}개가 필요합니다.`);
      if (++depth > 40) fail(line, '제한 오류', '함수를 너무 깊게 호출했습니다(최대 40단계).');
      try {
        const local = new Env(fn.env);
        fn.params.forEach((name, i) => local.define(name, args[i]));
        const result = yield* runBlock(fn.body, local, { inFunction: true, loops: 0 });
        return result?.kind === 'return' ? result.value : null;
      } finally { depth--; }
    }
    function* runBlock(nodes, env, context) {
      for (const node of nodes) {
        guard(node.line);
        switch (node.type) {
          case 'assign': {
            const value = yield* evalNode(node.expr, env, node.line);
            if (node.target.type === 'identifier') {
              const next = node.op === '=' ? value : binary(node.op.slice(0, -1), env.get(node.target.name, node.line), value, node.line);
              env.assign(node.target.name, checkSize(next, node.line));
            } else {
              const target = yield* evalNode(node.target.target, env, node.line);
              const key = yield* evalNode(node.target.index, env, node.line);
              if (Array.isArray(target)) { indexed(target, key, node.line); target[key] = node.op === '=' ? value : binary(node.op.slice(0, -1), target[key], value, node.line); }
              else if (target && typeof target === 'object' && target.type !== 'sejongFn') {
                const name = keyOf(key, node.line);
                if (name === '__proto__' || name === 'constructor') fail(node.line, '키 오류', '이 키는 사용할 수 없습니다.');
                if (!hasOwn(target, name) && Object.keys(target).length >= MAX_COLLECTION) fail(node.line, '제한 오류', '사전은 5,000개까지만 저장할 수 있습니다.');
                target[name] = node.op === '=' ? value : binary(node.op.slice(0, -1), indexed(target, name, node.line), value, node.line);
              } else fail(node.line, '자료형 오류', '요소 수정에는 목록 또는 사전이 필요합니다.');
            }
            break;
          }
          case 'expr': yield* evalNode(node.expr, env, node.line); break;
          case 'function': env.define(node.name, { type: 'sejongFn', name: node.name, params: node.params, body: node.body, env }); break;
          case 'if': {
            let taken = false;
            for (const branch of node.branches) if (truthy(yield* evalNode(branch.test, env, node.line))) { const flow = yield* runBlock(branch.body, env, context); if (flow) return flow; taken = true; break; }
            if (!taken && node.other) { const flow = yield* runBlock(node.other, env, context); if (flow) return flow; }
            break;
          }
          case 'repeat': {
            const count = yield* evalNode(node.count, env, node.line);
            if (!Number.isInteger(count) || count < 0 || count > MAX_STEPS) fail(node.line, '범위 오류', '반복 횟수는 0부터 60,000 사이의 정수여야 합니다.');
            for (let i = 0; i < count; i++) { guard(node.line); const flow = yield* runBlock(node.body, env, { ...context, loops: context.loops + 1 }); if (flow?.kind === 'break') break; if (flow?.kind === 'return') return flow; }
            break;
          }
          case 'foreach': {
            const iterable = yield* evalNode(node.iterable, env, node.line);
            if (!Array.isArray(iterable) && typeof iterable !== 'string') fail(node.line, '자료형 오류', '각각 반복에는 목록 또는 문자열이 필요합니다.');
            for (const value of iterable) { guard(node.line); env.assign(node.name, value); const flow = yield* runBlock(node.body, env, { ...context, loops: context.loops + 1 }); if (flow?.kind === 'break') break; if (flow?.kind === 'return') return flow; }
            break;
          }
          case 'while': {
            while (truthy(yield* evalNode(node.test, env, node.line))) { guard(node.line); const flow = yield* runBlock(node.body, env, { ...context, loops: context.loops + 1 }); if (flow?.kind === 'break') break; if (flow?.kind === 'return') return flow; }
            break;
          }
          case 'return': if (!context.inFunction) fail(node.line, '구문 오류', '돌려주기는 함수 안에서만 사용할 수 있습니다.'); return { kind: 'return', value: node.expr ? yield* evalNode(node.expr, env, node.line) : null };
          case 'break': case 'continue': if (!context.loops) fail(node.line, '구문 오류', '그만과 계속은 반복문 안에서만 사용합니다.'); return { kind: node.type };
        }
      }
      return null;
    }
    return {
      program: runBlock(ast, global, { inFunction: false, loops: 0 }),
      get stats() { return { steps, outputs }; },
      get frameFunction() { return frameFunction; },
      frame() { steps = 0; graphics = 0; return callFunction(frameFunction, [], 0); }
    };
  }

  function toPython(source) {
    const ast = parseProgram(source);
    const unsupported = new Set(['화면만들기', '배경색', '색상설정', '원그리기', '사각형그리기', '선그리기', '글자그리기', '화면지우기', '매프레임']);
    const names = { 출력: 'print', 입력: 'input', 길이: 'len', 글자열: 'str', 문자열: 'str', 숫자: 'float', 실수: 'float', 정수: 'int', 절댓값: 'abs', 범위: 'range', 합계: 'sum', 최댓값: 'max', 최솟값: 'min', 정렬: 'sorted' };
    const operators = { 그리고: 'and', 또는: 'or', 아니다: 'not' };
    const priority = { 또는: 1, 그리고: 2, '==': 3, '!=': 3, '<': 3, '>': 3, '<=': 3, '>=': 3, '+': 4, '-': 4, '*': 5, '/': 5, '//': 5, '%': 5 };
    const warnings = new Set(); let usesRandom = false;
    function expr(node, parent = 0) {
      let text, rank = 9;
      switch (node.type) {
        case 'literal': text = node.value === null ? 'None' : node.value === true ? 'True' : node.value === false ? 'False' : typeof node.value === 'string' ? JSON.stringify(node.value) : String(node.value); break;
        case 'identifier': text = node.name; break;
        case 'list': text = `[${node.items.map(item => expr(item)).join(', ')}]`; break;
        case 'dict': text = `{${node.entries.map(([key, value]) => `${expr(key)}: ${expr(value)}`).join(', ')}}`; break;
        case 'index': text = `${expr(node.target, 8)}[${expr(node.index)}]`; break;
        case 'slice': text = `${expr(node.target, 8)}[${node.start ? expr(node.start) : ''}:${node.end ? expr(node.end) : ''}]`; break;
        case 'call': {
          if (node.callee.type !== 'identifier') throw new SejongError(0, '변환 오류', '이 형태의 함수 호출은 Python으로 변환할 수 없습니다.');
          const name = node.callee.name;
          if (unsupported.has(name)) warnings.add(`${name}()은 브라우저 전용 기능이라 Python 비교 코드에서 실행되지 않습니다.`);
          if (name === '무작위') { usesRandom = true; text = node.args.length ? `random.randint(${node.args.map(arg => expr(arg)).join(', ')})` : 'random.random()'; break; }
          if (name === '추가' || name === '삭제') { text = `${expr(node.args[0], 8)}.${name === '추가' ? 'append' : 'pop'}(${node.args.slice(1).map(arg => expr(arg)).join(', ')})`; break; }
          if (unsupported.has(name)) { text = 'None'; break; }
          text = `${names[name] || name}(${node.args.map(arg => expr(arg)).join(', ')})`; break;
        }
        case 'unary': rank = 6; text = `${operators[node.op] || node.op}${node.op === '아니다' ? ' ' : ''}${expr(node.expr, rank)}`; break;
        case 'binary': rank = priority[node.op]; text = `${expr(node.left, rank)} ${operators[node.op] || node.op} ${expr(node.right, rank + 1)}`; if (node.op === '그리고' || node.op === '또는') { text = `bool(${text})`; rank = 9; } if (node.op === '+' && (node.left.type === 'literal' && typeof node.left.value === 'string' || node.right.type === 'literal' && typeof node.right.value === 'string')) warnings.add('한글 코드의 문자열 + 자동 변환은 Python에서 str()이 필요할 수 있습니다.'); break;
        default: throw Error('알 수 없는 AST');
      }
      return rank < parent ? `(${text})` : text;
    }
    function block(nodes, level, locals = new Set()) {
      if (!nodes.length) return ['    '.repeat(level) + 'pass'];
      const result = [];
      const pad = '    '.repeat(level);
      for (const node of nodes) {
        switch (node.type) {
          case 'assign': {
            const target = expr(node.target), value = expr(node.expr);
            result.push(pad + `${target} ${node.op} ${value}`); break;
          }
          case 'expr': {
            const name = node.expr.callee.type === 'identifier' ? node.expr.callee.name : '';
            const converted = expr(node.expr);
            result.push(pad + (unsupported.has(name) ? `# 한글 전용: ${name}()` : converted)); break;
          }
          case 'function': {
            const assigned = new Set();
            function scan(statements) { for (const item of statements) { if (item.type === 'assign' && item.target.type === 'identifier') assigned.add(item.target.name); if (item.type === 'if') { item.branches.forEach(branch => scan(branch.body)); if (item.other) scan(item.other); } if (['repeat', 'while', 'foreach'].includes(item.type)) scan(item.body); } }
            scan(node.body);
            const globalNames = [...assigned].filter(name => !node.params.includes(name) && locals.has(name));
            result.push(pad + `def ${node.name}(${node.params.join(', ')}):`);
            if (globalNames.length) result.push(pad + '    global ' + globalNames.join(', '));
            result.push(...block(node.body, level + 1, new Set([...locals, ...node.params, ...assigned]))); break;
          }
          case 'if': node.branches.forEach((branch, index) => { result.push(pad + `${index ? 'elif' : 'if'} ${expr(branch.test)}:`); result.push(...block(branch.body, level + 1, locals)); }); if (node.other) { result.push(pad + 'else:'); result.push(...block(node.other, level + 1, locals)); } break;
          case 'repeat': result.push(pad + `for _반복_${node.line} in range(${expr(node.count)}):`); result.push(...block(node.body, level + 1, locals)); break;
          case 'foreach': result.push(pad + `for ${node.name} in ${expr(node.iterable)}:`); result.push(...block(node.body, level + 1, locals)); break;
          case 'while': result.push(pad + `while ${expr(node.test)}:`); result.push(...block(node.body, level + 1, locals)); break;
          case 'return': result.push(pad + `return${node.expr ? ' ' + expr(node.expr) : ''}`); break;
          case 'break': result.push(pad + 'break'); break;
          case 'continue': result.push(pad + 'continue'); break;
        }
      }
      if (level > 0 && result.every(line => line.trim().startsWith('#'))) result.push(pad + 'pass');
      return result;
    }
    const globals = new Set(ast.filter(node => node.type === 'assign' && node.target.type === 'identifier').map(node => node.target.name));
    const lines = block(ast, 0, globals);
    const python = (usesRandom ? ['import random', '', ...lines] : lines).join('\n');
    return { code: python, warnings: [...warnings] };
  }

  let running = false, inputResolve = null, frameResolve = null;
  const emit = message => self.postMessage(message);
  const input = prompt => new Promise(resolve => { inputResolve = resolve; emit({ type: 'input-request', prompt: String(prompt).slice(0, 200) }); });
  const frame = () => new Promise(resolve => { frameResolve = resolve; emit({ type: 'frame-ready' }); });
  async function drive(iterator) {
    let response;
    while (true) {
      const result = iterator.next(response);
      if (result.done) return result.value;
      if (result.value?.type === 'input') response = await input(result.value.prompt);
      else fail(0, '실행 오류', '알 수 없는 대기 요청이 발생했습니다.');
    }
  }
  const onMessage = async event => {
    const data = event.data || {};
    if (data.type === 'input-response' && inputResolve) { const resume = inputResolve; inputResolve = null; resume(String(data.value ?? '').slice(0, 2000)); return; }
    if (data.type === 'frame' && frameResolve) { const resume = frameResolve; frameResolve = null; resume(); return; }
    if (data.type === 'python') {
      try { emit({ type: 'python', ...toPython(String(data.source || '')) }); }
      catch (error) { emit({ type: 'python-error', line: error.line || 0, message: error.message }); }
      return;
    }
    if (data.type !== 'run' || typeof data.source !== 'string') return;
    if (running) return;
    running = true;
    const started = Date.now();
    try {
      const execution = createExecution(data.source, emit);
      await drive(execution.program);
      if (execution.frameFunction) {
        emit({ type: 'animation-start' });
        while (true) { await frame(); await drive(execution.frame()); }
      }
      emit({ type: 'done', duration: Date.now() - started, ...execution.stats });
    } catch (error) {
      emit({ type: 'error', line: error.line || 0, kind: error.kind || '실행 오류', message: error instanceof SejongError ? error.message : '예기치 않은 실행 오류가 발생했습니다.' });
    } finally { running = false; }
  };
  if (typeof self !== 'undefined') self.onmessage = onMessage;
  if (typeof module !== 'undefined' && module.exports) module.exports = { parseExpr, parseProgram, toPython, createExecution, SejongError };
})();

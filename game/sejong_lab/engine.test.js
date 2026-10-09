'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8');
const engine = require('./engine.js');
const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const examples = vm.runInNewContext(app.slice(app.indexOf('  const examples = ') + 2, app.indexOf('\n  ];') + 5).replace('const examples =', 'globalThis.examples =') + '\nexamples', {});

async function run(source, answers = [], frames = 0) {
  const messages = [];
  const self = { postMessage(message) { messages.push(message); } };
  vm.runInNewContext(code, { self, Date, Math, Promise, String, Number, Object, Array, JSON, Set, Error, RegExp });
  const task = self.onmessage({ data: { type: 'run', source } });
  for (let i = 0; i < 12; i++) {
    await Promise.resolve();
    const input = messages.find(message => message.type === 'input-request' && !message.handled);
    if (input) { input.handled = true; await self.onmessage({ data: { type: 'input-response', value: answers.shift() ?? '' } }); }
    const ready = messages.find(message => message.type === 'frame-ready' && !message.handled);
    if (ready && frames--) { ready.handled = true; await self.onmessage({ data: { type: 'frame' } }); }
    if (messages.some(message => ['done', 'error'].includes(message.type))) break;
  }
  if (frames < 0) return messages;
  await task;
  return messages;
}

async function main() {
  const outputs = messages => messages.filter(message => message.type === 'output').map(message => message.text);
  const old = await run('이름 = "세종"\n반복 2번:\n    출력("안녕, " + 이름)\n반복 글자 각각 ["가", "나"]에서:\n    출력(글자)');
  assert.deepEqual(outputs(old), ['안녕, 세종', '안녕, 세종', '가', '나']);
  assert.equal(old.at(-1).type, 'done');

  const structures = await run('학생 = {\n    "이름": "세종",\n    "점수": [90, 85, 100]\n}\n학생["점수"][0] = 95\n추가(학생["점수"], 80)\n삭제(학생["점수"], 1)\n출력(학생["점수"][0])\n출력(합계(학생["점수"]))\n출력(길이(학생))');
  assert.deepEqual(outputs(structures), ['95', '275', '2']);

  const recursion = await run('함수 계승(수):\n    만약 수 <= 1:\n        돌려주기 1\n    돌려주기 수 * 계승(수 - 1)\n출력(계승(5))\n반복 수 각각 범위(1, 4):\n    출력(수)');
  assert.deepEqual(outputs(recursion), ['120', '1', '2', '3']);

  const input = await run('이름 = 입력("이름?")\n출력("안녕 " + 이름)', ['훈민']);
  assert.equal(input.find(message => message.type === 'input-request').prompt, '이름?');
  assert.deepEqual(outputs(input), ['안녕 훈민']);

  const graphics = await run('화면만들기(100, 80)\n색상설정("하늘색")\n원그리기(20, 30, 10)');
  assert.deepEqual(graphics.filter(message => message.type === 'graphic').map(message => message.command), ['화면만들기', '색상설정', '원그리기']);

  const errors = [
    ['출력(없는값)', '이름 오류'], ['출력(1 / 0)', '0 나누기 오류'], ['출력([1][4])', '인덱스 오류'],
    ['동안 참:\n    계속', '제한 오류'], ['출력({"x": 1}["y"])', '키 오류'],
    ['출력((1)', '구문 오류'], ['출력("가" - 1)', '자료형 오류'],
    ['함수 반복호출():\n    돌려주기 반복호출()\n출력(반복호출())', '제한 오류'],
    ['출력(범위(6000))', '제한 오류'],
    ['반복 251번:\n    출력("줄")', '제한 오류'],
    ['없는함수()', '함수 오류'], ['출력(범위(1.5))', '자료형 오류']
  ];
  for (const [source, kind] of errors) assert.equal((await run(source)).at(-1).kind, kind);

  const python = engine.toPython('반복 숫자 각각 범위(1, 6):\n    출력(숫자 * 숫자)');
  assert.equal(python.code, 'for 숫자 in range(1, 6):\n    print(숫자 * 숫자)');
  assert.match(engine.toPython('화면만들기(100, 100)').warnings.join(' '), /브라우저 전용/);
  assert.equal(engine.toPython('위치 = 0\n함수 이동():\n    위치 += 2').code, '위치 = 0\ndef 이동():\n    global 위치\n    위치 += 2');
  assert.equal(engine.toPython('출력(무작위(1, 3))').code, 'import random\n\nprint(random.randint(1, 3))');
  assert.equal(engine.toPython('추가(목록, 3)\n삭제(목록, 0)').code, '목록.append(3)\n목록.pop(0)');
  const nested = await run('합 = 0\n반복 수 각각 범위(1, 5):\n    만약 수 % 2 == 0:\n        반복 2번:\n            합 += 수\n출력(합)\n출력(1 + 2 * 3)');
  assert.deepEqual(outputs(nested), ['12', '7']);
  const legacy = await run('수 = 0\n반복 수 < 5인동안:\n    수 += 1\n    만약 수 == 2:\n        다음반복\n    만약 수 == 4:\n        반복끝내기\n    출력(수)');
  assert.deepEqual(outputs(legacy), ['1', '3']);
  const local = await run('값 = 1\n함수 계산(인자):\n    새값 = 인자 * 2\n    값 += 새값\n    돌려주기 새값\n출력(계산(3))\n출력(값)');
  assert.deepEqual(outputs(local), ['6', '7']);
  for (const example of examples) {
    const result = await run(example.code, ['7']);
    assert.notEqual(result.at(-1).type, 'error', `${example.id}: ${result.at(-1).message}`);
    if (example.id === 'animation') {
      assert.ok(result.some(message => message.type === 'animation-start'));
      assert.ok(result.some(message => message.type === 'frame-ready'));
    } else assert.equal(result.at(-1).type, 'done', example.id);
  }
  console.log(`세종어 엔진: 이전 문법, 자료구조, 입력, 그래픽, Python, 제한 및 예제 ${examples.length}개 통과`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });

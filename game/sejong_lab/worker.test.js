'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Worker } = require('node:worker_threads');
const engine = fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8');
const bridge = `const { parentPort } = require('node:worker_threads');
globalThis.self = { postMessage: message => parentPort.postMessage(message) };
parentPort.on('message', data => self.onmessage({ data }));\n`;
function runner() {
  const worker = new Worker(bridge + engine, { eval: true });
  const messages = [];
  worker.on('message', message => messages.push(message));
  async function until(type, predicate = () => true) {
    const started = Date.now();
    while (!messages.some(message => message.type === type && predicate(message))) {
      assert.ok(Date.now() - started < 2000, `${type} 메시지 시간 초과: ${JSON.stringify(messages)}`);
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    return messages.find(message => message.type === type && predicate(message));
  }
  return { worker, messages, until };
}
async function main() {
  const input = runner();
  input.worker.postMessage({ type: 'run', source: '이름 = 입력("이름?")\n출력(이름)' });
  assert.equal((await input.until('input-request')).prompt, '이름?');
  assert.equal(await input.worker.terminate(), 1);
  assert.equal(input.messages.some(message => message.type === 'done'), false);

  const restarted = runner();
  restarted.worker.postMessage({ type: 'run', source: '출력("재시작 완료")' });
  await restarted.until('done');
  assert.equal(restarted.messages.find(message => message.type === 'output').text, '재시작 완료');
  await restarted.worker.terminate();

  const animation = runner();
  animation.worker.postMessage({ type: 'run', source: '화면만들기(100, 100)\n함수 그림():\n    원그리기(20, 20, 5)\n매프레임(그림)' });
  await animation.until('animation-start');
  await animation.until('frame-ready');
  animation.worker.postMessage({ type: 'frame' });
  assert.equal((await animation.until('graphic', message => message.command === '원그리기')).command, '원그리기');
  assert.equal(await animation.worker.terminate(), 1);
  console.log('Worker 입력 대기 중단, 재시작 및 애니메이션 중단 통과');
}
main().catch(error => { console.error(error); process.exitCode = 1; });

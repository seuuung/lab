'use strict';

(() => {
    const rules = window.SignalRules;
    const canvas = document.getElementById('board');
    const shell = document.getElementById('board-shell');
    const ctx = canvas.getContext('2d');
    const overlay = document.getElementById('overlay');
    const overlayKicker = document.getElementById('overlay-kicker');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayText = document.getElementById('overlay-text');
    const overlayDetail = document.getElementById('overlay-detail');
    const overlayButton = document.getElementById('overlay-button');
    const pauseButton = document.getElementById('pause-button');
    const switchButtons = [...document.querySelectorAll('.switch-button')];
    const scoreValue = document.getElementById('score-value');
    const progressValue = document.getElementById('progress-value');
    const successValue = document.getElementById('success-value');
    const healthValue = document.getElementById('health-value');
    const bestValue = document.getElementById('best-value');
    const waveValue = document.getElementById('wave-value');
    const queueItems = document.getElementById('queue-items');
    const announcement = document.getElementById('announcement');
    const SAVE_KEY = 'signal-room-best-v1';
    const TOTAL = 24;
    const TARGET = 20;

    let phase = 'ready';
    let switches = { A: 0, B: 0, C: 0 };
    let sequence = [];
    let packets = [];
    let effects = [];
    let spawned = 0;
    let processed = 0;
    let delivered = 0;
    let mistakes = 0;
    let combo = 0;
    let score = 0;
    let cooldown = 0;
    let elapsed = 0;
    let width = 0;
    let height = 0;
    let lastFrame = performance.now();
    let best = 0;

    try { best = Number(localStorage.getItem(SAVE_KEY)) || 0; } catch (_) { /* Storage is optional. */ }

    function layout() {
        if (width < 620 && width < height * 1.25) {
            return {
                source: { x: width * .5, y: height * .11 },
                A: { x: width * .5, y: height * .35 },
                B: { x: width * .25, y: height * .59 },
                C: { x: width * .75, y: height * .59 },
                coral: { x: width * .12, y: height * .82 },
                cyan: { x: width * .37, y: height * .82 },
                amber: { x: width * .63, y: height * .82 },
                violet: { x: width * .88, y: height * .82 }
            };
        }
        return {
            source: { x: width * .08, y: height * .5 },
            A: { x: width * .3, y: height * .5 },
            B: { x: width * .55, y: height * .28 },
            C: { x: width * .55, y: height * .72 },
            coral: { x: width * .89, y: height * .14 },
            cyan: { x: width * .89, y: height * .36 },
            amber: { x: width * .89, y: height * .64 },
            violet: { x: width * .89, y: height * .82 }
        };
    }

    function resize() {
        const rect = shell.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw();
    }

    function setOverlay(kicker, title, text, detail, button) {
        overlayKicker.textContent = kicker;
        overlayTitle.textContent = title;
        overlayText.textContent = text;
        overlayDetail.textContent = detail;
        overlayButton.firstChild.textContent = button + ' ';
        overlay.hidden = false;
    }

    function updateControls() {
        const labels = {
            A: switches.A ? 'C 경로' : 'B 경로',
            B: switches.B ? '◆ 시안' : '● 코랄',
            C: switches.C ? '▲ 바이올렛' : '■ 앰버'
        };
        for (const button of switchButtons) {
            const id = button.dataset.switch;
            button.disabled = phase !== 'running';
            button.querySelector('small').textContent = labels[id];
            button.querySelector('.switch-arrow').textContent = switches[id] ? '↘' : '↗';
            button.setAttribute('aria-label', `${id} 분기기: 현재 ${labels[id]}. 눌러 전환`);
        }
        pauseButton.disabled = phase === 'ready' || phase === 'won' || phase === 'lost';
        pauseButton.textContent = phase === 'paused' ? '계속하기' : '일시정지';
        if (phase !== 'paused') {
            const hint = document.createElement('span');
            hint.className = 'shortcut';
            hint.textContent = 'Space';
            pauseButton.append(hint);
        }
    }

    function updateHud() {
        scoreValue.textContent = String(score).padStart(4, '0');
        progressValue.textContent = `${processed} / ${TOTAL}`;
        successValue.textContent = `${delivered} / ${TARGET}`;
        healthValue.textContent = '● '.repeat(5 - mistakes).trim() + ' ○'.repeat(mistakes);
        healthValue.setAttribute('aria-label', `남은 오류 ${5 - mistakes}회`);
        bestValue.textContent = String(best).padStart(4, '0');
        waveValue.textContent = `WAVE ${String(rules.waveFor(Math.min(spawned, TOTAL - 1))).padStart(2, '0')} / 04`;
        queueItems.replaceChildren();
        for (const color of sequence.slice(spawned, spawned + 3)) {
            const chip = document.createElement('span');
            chip.className = 'queue-chip';
            chip.style.setProperty('--chip', color.hex);
            const symbol = document.createElement('b');
            symbol.textContent = color.symbol;
            chip.append(symbol, ` ${color.name}`);
            queueItems.append(chip);
        }
        if (!queueItems.childElementCount) {
            const empty = document.createElement('span');
            empty.className = 'queue-empty';
            empty.textContent = sequence.length ? '모두 출발함' : '시작 대기 중';
            queueItems.append(empty);
        }
    }

    function startGame() {
        document.querySelector('.app-shell').classList.add('playing');
        window.scrollTo(0, 0);
        sequence = rules.createSequence();
        switches = { A: 0, B: 0, C: 0 };
        packets = [];
        effects = [];
        spawned = processed = delivered = mistakes = combo = score = 0;
        cooldown = .9;
        elapsed = 0;
        phase = 'running';
        overlay.hidden = true;
        lastFrame = performance.now();
        announcement.textContent = '게임 시작. 첫 신호가 곧 들어옵니다.';
        updateControls();
        updateHud();
    }

    function pauseGame() {
        if (phase !== 'running') return;
        phase = 'paused';
        setOverlay('SIGNAL HOLD', '잠시 정지', '현재 신호와 분기기 상태가 그대로 유지됩니다.', '준비되면 이어서 전송하세요.', '계속하기');
        updateControls();
    }

    function resumeGame() {
        if (phase !== 'paused') return;
        phase = 'running';
        overlay.hidden = true;
        lastFrame = performance.now();
        updateControls();
    }

    function endGame(won) {
        phase = won ? 'won' : 'lost';
        if (score > best) {
            best = score;
            try { localStorage.setItem(SAVE_KEY, String(best)); } catch (_) { /* Private mode may block storage. */ }
        }
        updateHud();
        updateControls();
        const detail = `정확히 보낸 신호 ${delivered}개 · 점수 ${score}점 · 최고 ${best}점`;
        if (won) setOverlay('MISSION COMPLETE', '전송 성공!', '분기실의 흐름을 안정화했습니다. 더 높은 콤보에 도전해 보세요.', detail, '다시 플레이');
        else setOverlay('SIGNAL LOST', '전송 실패', '허용 오류를 모두 사용했습니다. 다음 신호를 미리 보고 분기기를 전환해 보세요.', detail, '다시 도전');
        announcement.textContent = won ? '미션 성공' : '미션 실패';
    }

    function toggleSwitch(id) {
        if (phase !== 'running') return;
        switches[id] = switches[id] ? 0 : 1;
        updateControls();
        announcement.textContent = `${id} 분기기 ${switches[id] ? '두 번째' : '첫 번째'} 경로 선택`;
    }

    function spawnPacket() {
        const color = sequence[spawned];
        const wave = rules.waveFor(spawned);
        packets.push({ color, from: 'source', to: 'A', progress: 0, wave, done: false });
        spawned++;
        updateHud();
    }

    function finishPacket(packet, exit) {
        packet.done = true;
        processed++;
        const correct = rules.isCorrectExit(packet.color, exit);
        if (correct) {
            delivered++;
            combo++;
            const points = 100 + Math.min(combo - 1, 5) * 20;
            score += points;
            effects.push({ node: exit, text: `+${points}`, color: '#d7fff0', age: 0 });
            announcement.textContent = `${packet.color.name} 신호 전송 성공. ${delivered}개 성공`;
        } else {
            mistakes++;
            combo = 0;
            effects.push({ node: exit, text: '오류', color: '#ff8c81', age: 0 });
            announcement.textContent = `${packet.color.name} 신호가 잘못된 출구로 갔습니다. 남은 오류 ${5 - mistakes}회`;
        }
        updateHud();
        if (mistakes >= 5) endGame(false);
        else if (processed === TOTAL) endGame(delivered >= TARGET);
    }

    function step(dt) {
        elapsed += dt;
        cooldown -= dt;
        if (spawned < TOTAL && cooldown <= 0) {
            spawnPacket();
            cooldown += rules.intervalFor(rules.waveFor(spawned - 1));
        }

        for (const packet of packets) {
            if (phase !== 'running') break;
            packet.progress += dt / rules.travelTimeFor(packet.wave);
            if (packet.progress < 1) continue;
            packet.from = packet.to;
            packet.progress = 0;
            if (rules.exits.includes(packet.from)) finishPacket(packet, packet.from);
            else packet.to = rules.nextNode(packet.from, switches);
        }
        packets = packets.filter(packet => !packet.done);
        effects = effects.filter(effect => (effect.age += dt) < 1);
    }

    function drawLine(from, to, selected, points) {
        const a = points[from], b = points[to];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineWidth = selected ? 7 : 3;
        ctx.strokeStyle = selected ? '#56e0d2' : '#36545d';
        ctx.shadowColor = selected ? '#56e0d2' : 'transparent';
        ctx.shadowBlur = selected ? 16 : 0;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineWidth = 1;
        ctx.strokeStyle = selected ? '#d7fff3' : '#66818a';
        ctx.stroke();
    }

    function drawShape(x, y, color, size) {
        ctx.beginPath();
        if (color.id === 'cyan') {
            ctx.moveTo(x, y - size); ctx.lineTo(x + size, y); ctx.lineTo(x, y + size); ctx.lineTo(x - size, y); ctx.closePath();
        } else if (color.id === 'amber') {
            ctx.rect(x - size * .76, y - size * .76, size * 1.52, size * 1.52);
        } else if (color.id === 'violet') {
            ctx.moveTo(x, y - size); ctx.lineTo(x + size, y + size * .8); ctx.lineTo(x - size, y + size * .8); ctx.closePath();
        } else {
            ctx.arc(x, y, size * .85, 0, Math.PI * 2);
        }
        ctx.fillStyle = color.hex;
        ctx.fill();
    }

    function draw() {
        if (!width || !height) return;
        ctx.clearRect(0, 0, width, height);
        const points = layout();
        ctx.fillStyle = '#0a2029';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#72cfcc0b';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
        for (let y = 0; y < height; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

        const edges = [['source', 'A'], ['A', 'B'], ['A', 'C'], ['B', 'coral'], ['B', 'cyan'], ['C', 'amber'], ['C', 'violet']];
        for (const [from, to] of edges) drawLine(from, to, from === 'source' || rules.nextNode(from, switches) === to, points);

        const compact = width < 620 && width < height * 1.25;
        const tight = height < 210;
        const nodeRadius = compact || tight ? 22 : 28;
        const source = points.source;
        ctx.beginPath(); ctx.arc(source.x, source.y, compact || tight ? 17 : 22, 0, Math.PI * 2);
        ctx.fillStyle = '#d9fff3'; ctx.shadowColor = '#71efdf'; ctx.shadowBlur = 20; ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#0a2e35'; ctx.font = `900 ${compact ? 13 : 15}px 'Segoe UI', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('IN', source.x, source.y);

        for (const id of ['A', 'B', 'C']) {
            const point = points[id];
            ctx.beginPath(); ctx.arc(point.x, point.y, nodeRadius + 7, 0, Math.PI * 2);
            ctx.fillStyle = '#56e0d21e'; ctx.fill();
            ctx.beginPath(); ctx.arc(point.x, point.y, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#163c46'; ctx.strokeStyle = '#77e9da'; ctx.lineWidth = 2.5; ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#eafff9'; ctx.font = `800 ${compact ? 16 : 20}px 'Segoe UI', sans-serif`; ctx.fillText(id, point.x, point.y);
            ctx.fillStyle = '#a4d2ca'; ctx.font = `700 ${compact ? 10 : 12}px 'Segoe UI', sans-serif`;
            ctx.fillText('↻', point.x + nodeRadius - 2, point.y - nodeRadius + 1);
        }

        for (const color of rules.colors) {
            const point = points[color.exit];
            const size = compact || tight ? 15 : 21;
            ctx.beginPath(); ctx.arc(point.x, point.y, size + 10, 0, Math.PI * 2);
            ctx.fillStyle = color.hex + '24'; ctx.fill();
            ctx.shadowColor = color.hex; ctx.shadowBlur = 14;
            drawShape(point.x, point.y, color, size);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#d9e9e7'; ctx.font = `700 ${compact ? 10 : 12}px 'Segoe UI', sans-serif`;
            if (!compact && height < 260) {
                ctx.textAlign = 'right';
                ctx.fillText(color.name, point.x - size - 15, point.y);
                ctx.textAlign = 'center';
            } else {
                const labelY = point.y + size + (compact ? 16 : 22);
                ctx.fillText(color.name, point.x, labelY > height - 10 ? point.y - size - 15 : labelY);
            }
        }

        for (const packet of packets) {
            const a = points[packet.from], b = points[packet.to];
            const x = a.x + (b.x - a.x) * packet.progress;
            const y = a.y + (b.y - a.y) * packet.progress;
            ctx.beginPath(); ctx.arc(x, y, compact || tight ? 14 : 17, 0, Math.PI * 2);
            ctx.fillStyle = '#06151e'; ctx.strokeStyle = packet.color.hex; ctx.lineWidth = 3;
            ctx.shadowColor = packet.color.hex; ctx.shadowBlur = 18; ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
            drawShape(x, y, packet.color, compact || tight ? 7 : 9);
        }

        for (const effect of effects) {
            const point = points[effect.node];
            ctx.globalAlpha = 1 - effect.age;
            ctx.fillStyle = effect.color; ctx.font = '800 16px Segoe UI, sans-serif';
            ctx.fillText(effect.text, point.x, point.y - 38 - effect.age * 30);
            ctx.globalAlpha = 1;
        }
    }

    function frame(now) {
        const dt = Math.min(.05, Math.max(0, (now - lastFrame) / 1000));
        lastFrame = now;
        if (phase === 'running') step(dt);
        draw();
        requestAnimationFrame(frame);
    }

    canvas.addEventListener('pointerdown', event => {
        if (phase !== 'running') return;
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const points = layout();
        const radius = width < 620 || height < 210 ? 37 : 44;
        for (const id of ['A', 'B', 'C']) {
            if (Math.hypot(x - points[id].x, y - points[id].y) <= radius) {
                toggleSwitch(id);
                break;
            }
        }
    });
    switchButtons.forEach(button => button.addEventListener('click', () => toggleSwitch(button.dataset.switch)));
    overlayButton.addEventListener('click', () => phase === 'paused' ? resumeGame() : startGame());
    pauseButton.addEventListener('click', () => phase === 'paused' ? resumeGame() : pauseGame());
    document.addEventListener('keydown', event => {
        if (event.code === 'Space') {
            if (event.target?.closest?.('button, a')) return;
            if (phase === 'running' || phase === 'paused') { event.preventDefault(); phase === 'running' ? pauseGame() : resumeGame(); }
            return;
        }
        const id = { Digit1: 'A', Digit2: 'B', Digit3: 'C', Numpad1: 'A', Numpad2: 'B', Numpad3: 'C' }[event.code];
        if (id && phase === 'running') { event.preventDefault(); toggleSwitch(id); }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
    window.addEventListener('blur', pauseGame);
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(shell);

    updateControls();
    updateHud();
    resize();
    requestAnimationFrame(frame);
})();

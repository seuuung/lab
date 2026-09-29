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
    const soundButton = document.getElementById('sound-button');
    const helpButton = document.getElementById('help-button');
    const switchButtons = [...document.querySelectorAll('.switch-button')];
    const scoreValue = document.getElementById('score-value');
    const progressValue = document.getElementById('progress-value');
    const successValue = document.getElementById('success-value');
    const comboValue = document.getElementById('combo-value');
    const healthValue = document.getElementById('health-value');
    const bestValue = document.getElementById('best-value');
    const waveValue = document.getElementById('wave-value');
    const queueItems = document.getElementById('queue-items');
    const announcement = document.getElementById('announcement');
    const waveToast = document.getElementById('wave-toast');
    const SAVE_KEY = 'signal-room-best-v1';
    const SOUND_KEY = 'little-loop-bus-sound-v1';
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
    let bestCombo = 0;
    let score = 0;
    let cooldown = 0;
    let elapsed = 0;
    let width = 0;
    let height = 0;
    let lastFrame = performance.now();
    let best = 0;
    let soundOn = false;
    let audioContext;
    let toastTime = 0;

    try { best = Number(localStorage.getItem(SAVE_KEY)) || 0; } catch (_) { /* Storage is optional. */ }
    try { soundOn = localStorage.getItem(SOUND_KEY) === 'on'; } catch (_) { /* Storage is optional. */ }

    function updateSoundButton() {
        soundButton.setAttribute('aria-pressed', String(soundOn));
        soundButton.setAttribute('aria-label', soundOn ? '효과음 끄기' : '효과음 켜기');
        soundButton.firstChild.textContent = soundOn ? '🔊 ' : '🔇 ';
        soundButton.querySelector('.sound-label').textContent = soundOn ? '소리 켬' : '소리 끔';
    }

    function playTone(frequencies) {
        if (!soundOn) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        try {
            audioContext ||= new AudioContext();
            if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
            frequencies.forEach((frequency, index) => {
                const oscillator = audioContext.createOscillator();
                const gain = audioContext.createGain();
                const start = audioContext.currentTime + index * .075;
                oscillator.type = 'sine';
                oscillator.frequency.value = frequency;
                gain.gain.setValueAtTime(.0001, start);
                gain.gain.exponentialRampToValueAtTime(.07, start + .012);
                gain.gain.exponentialRampToValueAtTime(.0001, start + .16);
                oscillator.connect(gain);
                gain.connect(audioContext.destination);
                oscillator.start(start);
                oscillator.stop(start + .17);
            });
        } catch (_) { soundOn = false; updateSoundButton(); }
    }

    function showToast(text) {
        waveToast.textContent = text;
        waveToast.hidden = false;
        toastTime = 2.5;
    }

    function layout() {
        if (width < 500 && height >= 260) {
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
            A: switches.A ? 'C 방향' : 'B 방향',
            B: switches.B ? '◆ 바다 정류장' : '● 딸기 정류장',
            C: switches.C ? '▲ 꽃길 정류장' : '■ 햇살 정류장'
        };
        for (const button of switchButtons) {
            const id = button.dataset.switch;
            button.disabled = phase !== 'running';
            button.querySelector('small').textContent = labels[id];
            button.querySelector('.switch-arrow').textContent = switches[id] ? '↘' : '↗';
            button.setAttribute('aria-label', `${id} 갈림길: 현재 ${labels[id]}. 눌러 전환`);
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
        comboValue.textContent = String(combo);
        comboValue.parentElement?.classList.toggle('combo-active', combo >= 3);
        healthValue.textContent = '● '.repeat(5 - mistakes).trim() + ' ○'.repeat(mistakes);
        healthValue.setAttribute('aria-label', `남은 실수 ${5 - mistakes}회`);
        bestValue.textContent = String(best).padStart(4, '0');
        waveValue.textContent = `운행 ${String(rules.waveFor(Math.min(spawned, TOTAL - 1))).padStart(2, '0')} / 04`;
        queueItems.replaceChildren();
        for (const [index, color] of sequence.slice(spawned, spawned + 3).entries()) {
            const chip = document.createElement('span');
            chip.className = 'queue-chip';
            chip.style.setProperty('--chip', color.hex);
            chip.setAttribute('role', 'img');
            chip.setAttribute('aria-label', `${index + 1}번째 버스: ${color.name}, ${color.symbol} 표식`);
            const bus = document.createElement('span');
            bus.className = 'queue-bus';
            bus.setAttribute('aria-hidden', 'true');
            const windshield = document.createElement('span');
            windshield.className = 'queue-windshield';
            const roof = document.createElement('span');
            roof.className = 'queue-roof';
            roof.textContent = color.symbol;
            bus.append(windshield, roof);
            const destination = document.createElement('span');
            destination.className = 'queue-destination';
            destination.textContent = color.name.replace(' 정류장', '');
            chip.append(bus, destination);
            queueItems.append(chip);
        }
        if (!queueItems.childElementCount) {
            const empty = document.createElement('span');
            empty.className = 'queue-empty';
            empty.textContent = sequence.length ? '모두 출발함' : '차고지 대기 중';
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
        spawned = processed = delivered = mistakes = combo = bestCombo = score = 0;
        cooldown = .9;
        elapsed = 0;
        toastTime = 0;
        waveToast.hidden = true;
        phase = 'running';
        overlay.hidden = true;
        lastFrame = performance.now();
        announcement.textContent = '버스 운행 시작. 첫 버스가 곧 출발합니다.';
        updateControls();
        updateHud();
    }

    function pauseGame() {
        if (phase !== 'running') return;
        phase = 'paused';
        setOverlay('BUS STOP', '잠시 쉬어 가요', '버스와 갈림길 상태가 그대로 유지됩니다.', '준비되면 다시 운행하세요.', '계속하기');
        updateControls();
    }

    function showHelp() {
        if (phase === 'running') phase = 'paused';
        if (phase === 'paused') {
            setOverlay('HOW TO PLAY', '버스길 안내', '버스의 색과 지붕 표식을 보고 같은 정류장으로 보내세요.', 'A는 위·아래 길, B·C는 정류장을 고릅니다. 버스가 갈림길에 닿기 전에 터치하거나 1·2·3을 누르세요.', '계속하기');
            updateControls();
        } else if (phase === 'ready') {
            setOverlay('HOW TO PLAY', '버스길 안내', '버스의 색과 지붕 표식을 보고 같은 정류장으로 보내세요.', 'A는 위·아래 길, B·C는 정류장을 고릅니다. 버스가 갈림길에 닿기 전에 터치하거나 1·2·3을 누르세요.', '버스 출발');
        }
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
        const stars = delivered >= 24 ? '★★★' : delivered >= 22 ? '★★☆' : delivered >= TARGET ? '★☆☆' : '☆☆☆';
        const detail = `${stars} · 도착 ${delivered}대 · 최고 연속 ${bestCombo}대 · 점수 ${score}점 · 최고 ${best}점`;
        playTone(won ? [523, 659, 784, 1047] : [330, 262]);
        if (won) setOverlay('NICE DRIVE', '운행 성공!', '마을 버스가 정류장을 잘 찾아갔어요. 더 높은 점수에 도전해 보세요.', detail, '다시 운행');
        else setOverlay('TRY AGAIN', '운행 종료', '갈림길을 지나기 전에 다음 버스의 색과 표식을 확인해 보세요.', detail, '다시 도전');
        announcement.textContent = won ? '미션 성공' : '미션 실패';
    }

    function toggleSwitch(id) {
        if (phase !== 'running') return;
        switches[id] = switches[id] ? 0 : 1;
        updateControls();
        playTone([switches[id] ? 440 : 350]);
        announcement.textContent = `${id} 갈림길 ${switches[id] ? '두 번째' : '첫 번째'} 방향 선택`;
    }

    function spawnPacket() {
        const color = sequence[spawned];
        const wave = rules.waveFor(spawned);
        packets.push({ color, from: 'source', to: 'A', progress: 0, wave, done: false });
        spawned++;
        if ([7, 13, 19].includes(spawned)) {
            showToast({ 2: '햇살 정류장 등장!', 3: '꽃길 정류장 등장!', 4: '마지막 운행!' }[wave]);
            playTone([587, 740]);
        }
        updateHud();
    }

    function finishPacket(packet, exit) {
        packet.done = true;
        processed++;
        const correct = rules.isCorrectExit(packet.color, exit);
        if (correct) {
            delivered++;
            combo++;
            bestCombo = Math.max(bestCombo, combo);
            const points = 100 + Math.min(combo - 1, 5) * 20;
            score += points;
            effects.push({ node: exit, text: `+${points}`, color: '#2d7759', age: 0 });
            announcement.textContent = `${packet.color.name} 버스 도착 성공. ${delivered}대 성공`;
            playTone(combo > 1 ? [660, 880] : [660]);
        } else {
            mistakes++;
            combo = 0;
            effects.push({ node: exit, text: '앗!', color: '#d65e4d', age: 0 });
            announcement.textContent = `${packet.color.name} 버스가 다른 정류장으로 갔습니다. 남은 실수 ${5 - mistakes}회`;
            playTone([240, 180]);
        }
        updateHud();
        if (mistakes >= 5) endGame(false);
        else if (processed === TOTAL) endGame(delivered >= TARGET);
    }

    function step(dt) {
        elapsed += dt;
        if (toastTime > 0 && (toastTime -= dt) <= 0) waveToast.hidden = true;
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
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineWidth = selected ? 15 : 11;
        ctx.strokeStyle = selected ? '#dca368' : '#a9be9c';
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineWidth = selected ? 11 : 8;
        ctx.strokeStyle = selected ? '#fff1cb' : '#f7efd9';
        ctx.stroke();
        if (selected) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.setLineDash([5, 10]);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#c88f5d99';
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    function drawScenery() {
        const scale = Math.max(.6, Math.min(width, height) / 390);
        for (const [px, py] of [[.04, .12], [.23, .13], [.4, .88], [.7, .1], [.97, .52], [.98, .94]]) {
            const x = width * px, y = height * py;
            ctx.fillStyle = '#5b946b55';
            ctx.beginPath(); ctx.ellipse(x + 3 * scale, y + 7 * scale, 13 * scale, 5 * scale, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#bd8561';
            ctx.fillRect(x - 2 * scale, y, 4 * scale, 10 * scale);
            for (const [dx, dy, radius] of [[-6, -3, 8], [5, -5, 9], [0, -10, 9]]) {
                ctx.beginPath(); ctx.arc(x + dx * scale, y + dy * scale, radius * scale, 0, Math.PI * 2);
                ctx.fillStyle = '#75b678'; ctx.fill();
            }
        }
        for (const [px, py] of [[.14, .91], [.36, .13], [.6, .88], [.82, .52]]) {
            const x = width * px, y = height * py;
            ctx.fillStyle = '#faf5cf';
            ctx.beginPath(); ctx.arc(x, y, 9 * scale, 0, Math.PI * 2); ctx.fill();
            for (let i = 0; i < 5; i++) {
                const angle = i * Math.PI * 2 / 5;
                ctx.beginPath(); ctx.arc(x + Math.cos(angle) * 4 * scale, y + Math.sin(angle) * 4 * scale, 2.8 * scale, 0, Math.PI * 2);
                ctx.fillStyle = '#f7a790'; ctx.fill();
            }
            ctx.beginPath(); ctx.arc(x, y, 2.5 * scale, 0, Math.PI * 2);
            ctx.fillStyle = '#eac66a'; ctx.fill();
        }
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

    function roundedBox(x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    function drawBus(x, y, color, heading, compact) {
        // A top-down bus has its windshield at +X, so rotating it always points the front along the road.
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(heading);
        ctx.scale(compact ? .8 : 1, compact ? .8 : 1);

        ctx.shadowColor = '#385b4666';
        ctx.shadowBlur = 7;
        ctx.fillStyle = '#344a42';
        for (const wheelX of [-15, 8]) {
            ctx.fillRect(wheelX, -15, 9, 5);
            ctx.fillRect(wheelX, 10, 9, 5);
        }
        roundedBox(-24, -12, 48, 24, 7);
        ctx.fill();
        ctx.shadowBlur = 0;
        roundedBox(-22, -10, 44, 20, 6);
        ctx.fillStyle = color.hex;
        ctx.fill();

        ctx.fillStyle = '#ffe7b2';
        ctx.fillRect(20, -8, 3, 4);
        ctx.fillRect(20, 4, 3, 4);
        ctx.fillStyle = '#b64942';
        ctx.fillRect(-23, -8, 3, 4);
        ctx.fillRect(-23, 4, 3, 4);
        roundedBox(12, -8, 8, 16, 3);
        ctx.fillStyle = '#a9dfe3';
        ctx.fill();
        ctx.fillStyle = '#e5faf7';
        ctx.fillRect(16, -6, 2, 9);

        roundedBox(-15, -8, 24, 16, 4);
        ctx.fillStyle = '#fff9e8';
        ctx.fill();
        ctx.strokeStyle = '#35564a66';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#345447';
        ctx.font = "900 15px 'Segoe UI', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(color.symbol, -3, 0);
        ctx.restore();
    }

    function draw() {
        if (!width || !height) return;
        ctx.clearRect(0, 0, width, height);
        const points = layout();
        ctx.fillStyle = '#dceec5';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#acd49b65';
        for (const [px, py, radius] of [[.12, .18, .11], [.42, .89, .13], [.77, .1, .09], [.93, .72, .12]]) {
            ctx.beginPath(); ctx.arc(width * px, height * py, Math.min(width, height) * radius, 0, Math.PI * 2); ctx.fill();
        }
        drawScenery();

        const edges = [['source', 'A'], ['A', 'B'], ['A', 'C'], ['B', 'coral'], ['B', 'cyan'], ['C', 'amber'], ['C', 'violet']];
        for (const [from, to] of edges) drawLine(from, to, from === 'source' || rules.nextNode(from, switches) === to, points);

        const compact = width < 500 && height >= 260;
        const tight = height < 210;
        const nodeRadius = compact || tight ? 22 : 28;
        const source = points.source;
        ctx.beginPath(); ctx.arc(source.x, source.y, compact || tight ? 17 : 22, 0, Math.PI * 2);
        ctx.fillStyle = '#fffaf0'; ctx.shadowColor = '#739d5d88'; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#345b49'; ctx.font = `900 ${compact ? 13 : 15}px 'Segoe UI', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('출발', source.x, source.y);

        for (const id of ['A', 'B', 'C']) {
            const point = points[id];
            ctx.beginPath(); ctx.arc(point.x, point.y, nodeRadius + 7, 0, Math.PI * 2);
            ctx.fillStyle = '#e6976e55'; ctx.fill();
            ctx.beginPath(); ctx.arc(point.x, point.y, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#fff9e9'; ctx.strokeStyle = '#d47e52'; ctx.lineWidth = 2.5; ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#345b49'; ctx.font = `800 ${compact ? 16 : 20}px 'Segoe UI', sans-serif`; ctx.fillText(id, point.x, point.y);
            ctx.fillStyle = '#c77650'; ctx.font = `700 ${compact ? 10 : 12}px 'Segoe UI', sans-serif`;
            ctx.fillText('↻', point.x + nodeRadius - 2, point.y - nodeRadius + 1);
        }

        for (const color of rules.colors) {
            const point = points[color.exit];
            const size = compact || tight ? 15 : 21;
            ctx.beginPath(); ctx.arc(point.x, point.y, size + 10, 0, Math.PI * 2);
            ctx.fillStyle = color.hex + '24'; ctx.fill();
            ctx.shadowColor = color.hex; ctx.shadowBlur = 7;
            drawShape(point.x, point.y, color, size);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#365746'; ctx.font = `800 ${compact ? 10 : 12}px 'Segoe UI', sans-serif`;
            const stopLabel = color.name.replace(' 정류장', '');
            if (!compact && height < 260) {
                ctx.textAlign = 'right';
                ctx.fillText(stopLabel, point.x - size - 15, point.y);
                ctx.textAlign = 'center';
            } else {
                const labelY = point.y + size + (compact ? 16 : 22);
                ctx.fillText(stopLabel, point.x, labelY > height - 10 ? point.y - size - 15 : labelY);
            }
        }

        for (const packet of packets) {
            const a = points[packet.from], b = points[packet.to];
            const x = a.x + (b.x - a.x) * packet.progress;
            const y = a.y + (b.y - a.y) * packet.progress;
            drawBus(x, y, packet.color, Math.atan2(b.y - a.y, b.x - a.x), compact || tight);
        }

        for (const effect of effects) {
            const point = points[effect.node];
            ctx.globalAlpha = 1 - effect.age;
            ctx.beginPath(); ctx.arc(point.x, point.y, 22 + effect.age * 24, 0, Math.PI * 2);
            ctx.strokeStyle = effect.color; ctx.lineWidth = 3 * (1 - effect.age); ctx.stroke();
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
    helpButton.addEventListener('click', showHelp);
    soundButton.addEventListener('click', () => {
        soundOn = !soundOn;
        try { localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); } catch (_) { /* Storage is optional. */ }
        updateSoundButton();
        if (soundOn) playTone([659, 880]);
    });
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

    updateSoundButton();
    updateControls();
    updateHud();
    resize();
    requestAnimationFrame(frame);
})();

        // 모바일 환경 감지
        let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
            ('ontouchstart' in window && window.innerWidth <= 1024) ||
            (navigator.maxTouchPoints > 0 && window.innerWidth <= 1024);

        const MODE_SIZES = { explore: 25, chase: 21 };
        let MAZE_SIZE = MODE_SIZES.explore;
        const CELL_SIZE = 10;
        const WALL_HEIGHT = 12;
        const PLAYER_HEIGHT = 5;
        const PLAYER_SPEED = 30.0;
        const PLAYER_SIZE = 2;
        const MONSTER_SPEED = 17;
        const CHASE_GRACE = 10;
        const chaseRules = window.MazeChaseRules;

        let camera, scene, renderer, controls;
        let mazeGroup; // [추가] 리셋을 쉽게 하기 위해 미로 구성요소들을 담을 그룹
        let maze = [], walls = [], markers = [];
        let exitMesh, monster;
        let monsterCell = null, monsterNext = null, chaseDelay = 0;
        let mode = 'explore';

        let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
        let joyDelta = { x: 0, y: 0 };
        let resetMobileInput = () => { joyDelta = { x: 0, y: 0 }; };

        let prevTime = performance.now();

        let gameStarted = false, gameEnded = false;
        let startTime = null, timerInterval = null;

        const raycaster = new THREE.Raycaster();
        const centerVector = new THREE.Vector2(0, 0);

        let markGeo, markMat;

        init();
        animate();

        // 페이지 새로고침(reload) 에러를 방지하기 위한 소프트 리셋 함수
        function resetGame() {
            // 1. 기존 그룹(미로, 마커 등)에서 모든 오브젝트 제거 및 메모리 해제
            const geometries = new Set();
            const materials = new Set();
            for (let i = mazeGroup.children.length - 1; i >= 0; i--) {
                const child = mazeGroup.children[i];
                mazeGroup.remove(child);
                child.traverse(node => {
                    if (node.geometry && node.geometry !== markGeo) geometries.add(node.geometry);
                    if (Array.isArray(node.material)) {
                        node.material.forEach(material => { if (material !== markMat) materials.add(material); });
                    } else if (node.material && node.material !== markMat) materials.add(node.material);
                });
            }
            geometries.forEach(geometry => geometry.dispose());
            materials.forEach(material => {
                if (material.map) material.map.dispose();
                material.dispose();
            });

            // 2. 변수 및 배열 초기화
            walls = [];
            markers = [];
            exitMesh = null;
            monster = null;
            monsterCell = monsterNext = null;
            chaseDelay = 0;

            // 3. 상태 및 타이머 초기화
            gameEnded = false;
            gameStarted = false;
            startTime = null;
            clearInterval(timerInterval);
            document.getElementById('timer-display').innerText = '00:00';

            moveForward = false; moveBackward = false; moveLeft = false; moveRight = false;
            resetMobileInput();
            prevTime = performance.now();

            // 4. UI 초기화
            document.getElementById('win-screen').style.display = 'none';
            document.getElementById('win-screen').classList.remove('caught');
            document.getElementById('blocker').style.display = 'flex';
            document.getElementById('crosshair').style.display = 'none';
            document.getElementById('mobile-ui').style.display = 'none';
            document.getElementById('start-button').firstChild.textContent = mode === 'chase' ? '추격 시작 ' : '탐험 시작 ';
            document.querySelectorAll('.mode-option').forEach(button => { button.disabled = false; });
            updateObjective();

            // 5. 미로 재생성 및 화면 재구성
            generateMaze();
            build3DMaze();
        }

        // Canvas textures keep the maze art self-contained and crisp without image downloads.
        function createWallTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 512;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#20363d';
            ctx.fillRect(0, 0, 512, 512);
            for (let row = 0; row < 4; row++) {
                const y = row * 128;
                ctx.fillStyle = row % 2 ? '#273f45' : '#2b454b';
                ctx.fillRect(12, y + 9, 488, 110);
                ctx.strokeStyle = '#5b8581';
                ctx.lineWidth = 3;
                ctx.strokeRect(16, y + 13, 480, 102);
                ctx.fillStyle = '#132b33';
                ctx.fillRect(32, y + 27, 448, 75);
                ctx.fillStyle = '#4a756f';
                ctx.fillRect(42, y + 38, 428, 2);
                ctx.fillRect(42, y + 91, 428, 2);
                ctx.fillStyle = '#b99a64';
                ctx.fillRect(46, y + 48, 5, 35);
                ctx.fillRect(461, y + 48, 5, 35);
            }
            ctx.fillStyle = '#8de4d2';
            ctx.fillRect(0, 0, 512, 7);
            ctx.fillRect(0, 505, 512, 7);
            ctx.strokeStyle = '#8de4d255';
            ctx.lineWidth = 2;
            ctx.strokeRect(2, 2, 508, 508);

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
            return texture;
        }

        function createFloorTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#263e41';
            ctx.fillRect(0, 0, 256, 256);
            ctx.strokeStyle = '#708f80';
            ctx.lineWidth = 6;
            ctx.strokeRect(9, 9, 238, 238);
            ctx.strokeStyle = '#3e6561';
            ctx.lineWidth = 2;
            ctx.strokeRect(23, 23, 210, 210);
            ctx.fillStyle = '#a88958';
            for (const [x, y] of [[35, 35], [221, 35], [35, 221], [221, 221]]) {
                ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
            }
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(MAZE_SIZE, MAZE_SIZE);
            return texture;
        }

        // 2. 거대한 X 모양 텍스처 생성 함수
        function createXMarkerTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 256; canvas.height = 256;
            const ctx = canvas.getContext('2d');

            ctx.clearRect(0, 0, 256, 256);

            ctx.strokeStyle = '#ffc174';
            ctx.lineWidth = 28;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffc174';

            ctx.beginPath();
            ctx.moveTo(40, 40); ctx.lineTo(216, 216);
            ctx.moveTo(216, 40); ctx.lineTo(40, 216);
            ctx.stroke();

            return new THREE.CanvasTexture(canvas);
        }

        function init() {
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0x172a32);
            scene.fog = new THREE.Fog(0x172a32, CELL_SIZE * 3, CELL_SIZE * 12);

            // 초기 미로 구성요소들을 관리할 그룹 씬에 추가
            mazeGroup = new THREE.Group();
            scene.add(mazeGroup);

            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            document.body.appendChild(renderer.domElement);

            const blocker = document.getElementById('blocker');
            const startButton = document.getElementById('start-button');
            const crosshair = document.getElementById('crosshair');
            document.querySelectorAll('.mode-option').forEach(button => {
                button.addEventListener('click', () => selectMode(button.dataset.mode));
            });
            selectMode('explore');

            markGeo = new THREE.PlaneGeometry(4, 4);
            markMat = new THREE.MeshBasicMaterial({
                map: createXMarkerTexture(),
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false
            });

            if (isMobile) {
                document.getElementById('desktop-desc').style.display = 'none';
                document.getElementById('mobile-desc').style.display = 'block';
                setupMobileControls();

                startButton.addEventListener('click', startGameMobile);
            } else {
                controls = new THREE.PointerLockControls(camera, document.body);
                scene.add(controls.getObject());

                startButton.addEventListener('click', () => controls.lock());
                controls.addEventListener('lock', () => {
                    beginRound();
                    blocker.style.display = 'none';
                    crosshair.style.display = 'block';
                });
                controls.addEventListener('unlock', () => {
                    if (!gameEnded) {
                        gameStarted = false;
                        blocker.style.display = 'flex';
                        crosshair.style.display = 'none';
                        startButton.firstChild.textContent = '계속하기 ';
                    }
                });

                document.addEventListener('keydown', onKeyDown);
                document.addEventListener('keyup', onKeyUp);
                document.addEventListener('mousedown', (e) => {
                    if (controls.isLocked && e.button === 0) handleMarkerAction();
                });
            }

            const ambientLight = new THREE.AmbientLight(0xd6f3e7, 0.85);
            scene.add(ambientLight);

            const flashLight = new THREE.PointLight(0xffdfa3, 1.35, CELL_SIZE * 7);
            camera.add(flashLight);

            const floorGeo = new THREE.PlaneGeometry(MAZE_SIZE * CELL_SIZE, MAZE_SIZE * CELL_SIZE);
            const floorMat = new THREE.MeshStandardMaterial({ map: createFloorTexture(), roughness: 0.95 });
            const floor = new THREE.Mesh(floorGeo, floorMat);
            floor.rotation.x = -Math.PI / 2;
            floor.position.set((MAZE_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2, 0, (MAZE_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2);
            scene.add(floor);

            const ceiling = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ color: 0x182b31, roughness: 1 }));
            ceiling.rotation.x = Math.PI / 2;
            ceiling.position.set((MAZE_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2, WALL_HEIGHT, (MAZE_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2);
            scene.add(ceiling);

            generateMaze();
            build3DMaze();

            window.addEventListener('resize', onWindowResize);
        }

        function handleMarkerAction() {
            raycaster.setFromCamera(centerVector, camera);

            const markerIntersects = raycaster.intersectObjects(markers);
            if (markerIntersects.length > 0 && markerIntersects[0].distance < 15) {
                const hitMarker = markerIntersects[0].object;
                mazeGroup.remove(hitMarker); // scene 대신 mazeGroup에서 제거
                markers = markers.filter(m => m !== hitMarker);
                return;
            }

            const wallIntersects = raycaster.intersectObjects(walls);
            if (wallIntersects.length > 0 && wallIntersects[0].distance < 15) {
                const hit = wallIntersects[0];

                const mark = new THREE.Mesh(markGeo, markMat);
                mark.position.copy(hit.point);
                mark.position.addScaledVector(hit.face.normal, 0.02);
                mark.lookAt(hit.point.clone().add(hit.face.normal));

                mazeGroup.add(mark); // scene 대신 mazeGroup에 추가
                markers.push(mark);
            }
        }

        function selectMode(nextMode) {
            if (startTime || (nextMode !== 'explore' && nextMode !== 'chase')) return;
            mode = nextMode;
            const sizeChanged = MAZE_SIZE !== MODE_SIZES[mode];
            MAZE_SIZE = MODE_SIZES[mode];
            document.querySelectorAll('.mode-option').forEach(button => {
                const selected = button.dataset.mode === mode;
                button.classList.toggle('selected', selected);
                button.setAttribute('aria-pressed', String(selected));
            });
            document.getElementById('start-button').firstChild.textContent = mode === 'chase' ? '추격 시작 ' : '탐험 시작 ';
            updateObjective();
            if (sizeChanged && maze.length) resetGame();
        }

        function updateObjective() {
            const hud = document.getElementById('hud');
            let message = '출구 문을 찾으세요';
            let danger = false;
            if (mode === 'chase' && gameStarted && !gameEnded) {
                if (chaseDelay > 0) message = `괴물 등장까지 ${Math.ceil(chaseDelay)}초`;
                else if (monster) {
                    const distance = Math.hypot(camera.position.x - monster.position.x, camera.position.z - monster.position.z);
                    danger = distance < CELL_SIZE * 2.4;
                    message = danger ? '괴물이 가까이 있어요!' : '괴물을 피해 출구를 찾으세요';
                }
            } else if (mode === 'chase') message = '괴물을 피해 출구를 찾으세요';
            const label = document.getElementById('objective-text');
            if (label.textContent !== message) label.textContent = message;
            hud.classList.toggle('danger', danger);
            hud.classList.toggle('chase-mode', mode === 'chase');
        }

        function beginRound() {
            gameStarted = true;
            prevTime = performance.now();
            if (!startTime) {
                chaseDelay = mode === 'chase' ? CHASE_GRACE : 0;
                document.querySelectorAll('.mode-option').forEach(button => { button.disabled = true; });
                startTimer();
            }
            updateObjective();
        }

        // --- 모바일 대응 ---
        function startGameMobile(e) {
            e.preventDefault();
            if (gameStarted || gameEnded) return;
            resetMobileInput();
            prevTime = performance.now();
            beginRound();
            document.getElementById('blocker').style.display = 'none';
            document.getElementById('crosshair').style.display = 'block';
            document.getElementById('mobile-ui').style.display = 'block';
        }

        function setupMobileControls() {
            const joyZone = document.getElementById('joystick-zone');
            const lookZone = document.getElementById('look-zone');
            const joyBase = document.getElementById('joystick-base');
            const joyThumb = document.getElementById('joystick-thumb');
            const actionBtn = document.getElementById('action-btn');
            let joyPointerId = null, lookPointerId = null;
            let lastLook = { x: 0, y: 0 };

            function updateJoystick(clientX, clientY) {
                const rect = joyBase.getBoundingClientRect();
                const dx = clientX - (rect.left + rect.width / 2);
                const dy = clientY - (rect.top + rect.height / 2);
                const distance = Math.hypot(dx, dy);
                const limit = 44;
                const limited = Math.min(distance, limit);
                const scale = distance ? limited / distance : 0;
                joyThumb.style.transform = 'translate(calc(-50% + ' + (dx * scale) + 'px), calc(-50% + ' + (dy * scale) + 'px))';
                const strength = Math.max(0, (limited - 5) / (limit - 5));
                joyDelta = distance ? { x: dx / distance * strength, y: dy / distance * strength } : { x: 0, y: 0 };
            }

            function stopJoystick(e) {
                if (e && e.pointerId !== joyPointerId) return;
                joyPointerId = null;
                joyDelta = { x: 0, y: 0 };
                joyThumb.style.transform = 'translate(-50%, -50%)';
            }

            function stopLooking(e) {
                if (e && e.pointerId !== lookPointerId) return;
                lookPointerId = null;
            }

            resetMobileInput = () => { stopJoystick(); stopLooking(); };

            actionBtn.addEventListener('pointerdown', (e) => {
                if (!gameStarted || gameEnded || (e.pointerType === 'mouse' && e.button !== 0)) return;
                e.preventDefault();
                e.stopPropagation();
                handleMarkerAction();
            });
            actionBtn.addEventListener('click', (e) => {
                if (e.detail === 0 && gameStarted && !gameEnded) handleMarkerAction();
            });

            joyZone.addEventListener('pointerdown', (e) => {
                if (!gameStarted || gameEnded || joyPointerId !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
                e.preventDefault();
                joyPointerId = e.pointerId;
                if (joyZone.setPointerCapture) joyZone.setPointerCapture(e.pointerId);
                updateJoystick(e.clientX, e.clientY);
            });
            joyZone.addEventListener('pointermove', (e) => {
                if (e.pointerId === joyPointerId) updateJoystick(e.clientX, e.clientY);
            });
            joyZone.addEventListener('pointerup', stopJoystick);
            joyZone.addEventListener('pointercancel', stopJoystick);
            joyZone.addEventListener('lostpointercapture', stopJoystick);

            lookZone.addEventListener('pointerdown', (e) => {
                if (!gameStarted || gameEnded || lookPointerId !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
                e.preventDefault();
                lookPointerId = e.pointerId;
                lastLook = { x: e.clientX, y: e.clientY };
                if (lookZone.setPointerCapture) lookZone.setPointerCapture(e.pointerId);
            });
            lookZone.addEventListener('pointermove', (e) => {
                if (e.pointerId !== lookPointerId) return;
                const deltaX = e.clientX - lastLook.x;
                const deltaY = e.clientY - lastLook.y;
                lastLook = { x: e.clientX, y: e.clientY };
                const euler = new THREE.Euler(0, 0, 0, 'YXZ');
                euler.setFromQuaternion(camera.quaternion);
                euler.y -= deltaX * 0.008;
                euler.x -= deltaY * 0.008;
                euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
                camera.quaternion.setFromEuler(euler);
            });
            lookZone.addEventListener('pointerup', stopLooking);
            lookZone.addEventListener('pointercancel', stopLooking);
            lookZone.addEventListener('lostpointercapture', stopLooking);
            window.addEventListener('blur', resetMobileInput);
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) resetMobileInput();
            });
        }

        function startTimer() {
            if (!startTime) {
                startTime = Date.now();
                timerInterval = setInterval(() => {
                    const elapsed = Math.floor((Date.now() - startTime) / 1000);
                    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
                    const s = String(elapsed % 60).padStart(2, '0');
                    document.getElementById('timer-display').innerText = `${m}:${s}`;
                }, 1000);
            }
        }

        function onKeyDown(e) {
            switch (e.code) {
                case 'ArrowUp': case 'KeyW': moveForward = true; break;
                case 'ArrowLeft': case 'KeyA': moveLeft = true; break;
                case 'ArrowDown': case 'KeyS': moveBackward = true; break;
                case 'ArrowRight': case 'KeyD': moveRight = true; break;
            }
        }

        function onKeyUp(e) {
            switch (e.code) {
                case 'ArrowUp': case 'KeyW': moveForward = false; break;
                case 'ArrowLeft': case 'KeyA': moveLeft = false; break;
                case 'ArrowDown': case 'KeyS': moveBackward = false; break;
                case 'ArrowRight': case 'KeyD': moveRight = false; break;
            }
        }

        // --- 맵 생성 및 3D 빌드 ---
        function generateMaze() {
            const maxRoute = mode === 'chase' ? 70 : 90;
            let bestMaze = null, bestDistance = Infinity;
            for (let attempt = 0; attempt < 8; attempt++) {
                maze = Array.from({ length: MAZE_SIZE }, () => Array(MAZE_SIZE).fill(1));
                function carve(x, z) {
                    maze[z][x] = 0;
                    const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]];
                    for (let index = dirs.length - 1; index > 0; index--) {
                        const swap = Math.floor(Math.random() * (index + 1));
                        [dirs[index], dirs[swap]] = [dirs[swap], dirs[index]];
                    }
                    for (const [dx, dz] of dirs) {
                        const nx = x + dx, nz = z + dz;
                        if (nx > 0 && nx < MAZE_SIZE - 1 && nz > 0 && nz < MAZE_SIZE - 1 && maze[nz][nx] === 1) {
                            maze[z + dz / 2][x + dx / 2] = 0;
                            carve(nx, nz);
                        }
                    }
                }
                carve(1, 1);

                const LOOP_CHANCE = 0.08;
                for (let z = 1; z < MAZE_SIZE - 1; z++) {
                    for (let x = 1; x < MAZE_SIZE - 1; x++) {
                        if (maze[z][x] === 1) {
                            if (maze[z][x - 1] === 0 && maze[z][x + 1] === 0 && maze[z - 1][x] === 1 && maze[z + 1][x] === 1) {
                                if (Math.random() < LOOP_CHANCE) maze[z][x] = 0;
                            } else if (maze[z - 1][x] === 0 && maze[z + 1][x] === 0 && maze[z][x - 1] === 1 && maze[z][x + 1] === 1) {
                                if (Math.random() < LOOP_CHANCE) maze[z][x] = 0;
                            }
                        }
                    }
                }
                maze[1][1] = 0; maze[1][2] = 0; maze[2][1] = 0;
                maze[MAZE_SIZE - 2][MAZE_SIZE - 2] = 2;
                maze[MAZE_SIZE - 2][MAZE_SIZE - 3] = 0;
                maze[MAZE_SIZE - 3][MAZE_SIZE - 2] = 0;

                const distance = chaseRules.distances(maze, { x: 1, z: 1 })[MAZE_SIZE - 2][MAZE_SIZE - 2];
                if (distance < bestDistance) { bestMaze = maze; bestDistance = distance; }
                if (distance <= maxRoute) return;
            }
            maze = bestMaze;
        }

        function createExitDoor() {
            const door = new THREE.Group();
            const frameMat = new THREE.MeshStandardMaterial({ color: 0xc7ac79, roughness: 0.65 });
            const panelMat = new THREE.MeshStandardMaterial({ color: 0x31625c, roughness: 0.8 });
            const detailMat = new THREE.MeshStandardMaterial({ color: 0xe3c886, roughness: 0.4, metalness: 0.25 });
            function part(width, height, depth, x, y, z, material) {
                const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
                mesh.position.set(x, y, z);
                door.add(mesh);
            }
            part(6.3, 7.8, .5, 0, 4.15, 0, panelMat);
            part(.75, 9, .95, -3.55, 4.5, 0, frameMat);
            part(.75, 9, .95, 3.55, 4.5, 0, frameMat);
            part(8, .8, 1.15, 0, 9.15, 0, frameMat);
            part(.09, 6.6, .58, 0, 4.1, 0, detailMat);
            part(.4, .4, .2, 1.65, 4.2, .4, detailMat);
            part(.4, .4, .2, -1.65, 4.2, -.4, detailMat);

            const canvas = document.createElement('canvas');
            canvas.width = 512; canvas.height = 160;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#e7d6a8';
            ctx.fillRect(8, 8, 496, 144);
            ctx.strokeStyle = '#304c47';
            ctx.lineWidth = 8;
            ctx.strokeRect(13, 13, 486, 134);
            ctx.fillStyle = '#25443e';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 70px sans-serif';
            ctx.fillText('출구  EXIT', 256, 82);
            const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
            sign.position.set(0, 10.55, .15);
            sign.scale.set(7.5, 2.35, 1);
            door.add(sign);
            // Both possible approaches see the door at an angle; the sign faces the player.
            door.rotation.y = -Math.PI / 4;
            return door;
        }

        function createMonster() {
            const creature = new THREE.Group();
            const skin = new THREE.MeshStandardMaterial({ color: 0x392e3e, roughness: 0.9 });
            const shadow = new THREE.MeshStandardMaterial({ color: 0x211e2b, roughness: 1 });
            const eyes = new THREE.MeshBasicMaterial({ color: 0xff8b6c });
            function sphere(radius, x, y, z, material, sx = 1, sy = 1, sz = 1) {
                const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 10), material);
                mesh.position.set(x, y, z);
                mesh.scale.set(sx, sy, sz);
                creature.add(mesh);
            }
            sphere(1.5, 0, 3, 0, skin, 1, 1.3, .8);
            sphere(1.35, 0, 5.4, .25, shadow, 1, .9, .9);
            sphere(.22, -.48, 5.55, 1.3, eyes);
            sphere(.22, .48, 5.55, 1.3, eyes);
            sphere(.5, -1.15, 6.45, .05, skin, .7, 1.4, .7);
            sphere(.5, 1.15, 6.45, .05, skin, .7, 1.4, .7);
            sphere(.55, -1.55, 2.8, .15, shadow, .65, 1.7, .7);
            sphere(.55, 1.55, 2.8, .15, shadow, .65, 1.7, .7);
            sphere(.6, -.7, .8, 0, shadow, .7, 1.4, .8);
            sphere(.6, .7, .8, 0, shadow, .7, 1.4, .8);
            return creature;
        }

        function playerCell() {
            return { x: Math.round(camera.position.x / CELL_SIZE), z: Math.round(camera.position.z / CELL_SIZE) };
        }

        function spawnMonster() {
            const cell = chaseRules.spawnCell(maze, playerCell());
            if (!cell) return;
            monsterCell = cell;
            monsterNext = null;
            monster = createMonster();
            monster.position.set(cell.x * CELL_SIZE, 0, cell.z * CELL_SIZE);
            mazeGroup.add(monster);
        }

        function updateMonster(delta) {
            if (mode !== 'chase') return;
            if (chaseDelay > 0) {
                chaseDelay = Math.max(0, chaseDelay - delta);
                if (chaseDelay === 0) spawnMonster();
                updateObjective();
                return;
            }
            if (!monster) return;
            const targetCell = playerCell();
            let remaining = MONSTER_SPEED * delta;
            while (remaining > 0) {
                if (!monsterNext) monsterNext = chaseRules.nextStep(maze, monsterCell, targetCell);
                if (!monsterNext && (monsterCell.x !== targetCell.x || monsterCell.z !== targetCell.z)) break;
                const targetX = monsterNext ? monsterNext.x * CELL_SIZE : camera.position.x;
                const targetZ = monsterNext ? monsterNext.z * CELL_SIZE : camera.position.z;
                const dx = targetX - monster.position.x, dz = targetZ - monster.position.z;
                const distance = Math.hypot(dx, dz);
                if (distance < .001) {
                    if (monsterNext) { monsterCell = monsterNext; monsterNext = null; continue; }
                    break;
                }
                const travel = Math.min(remaining, distance);
                monster.position.x += dx / distance * travel;
                monster.position.z += dz / distance * travel;
                remaining -= travel;
                if (travel >= distance - .001 && monsterNext) { monsterCell = monsterNext; monsterNext = null; }
            }
            monster.lookAt(camera.position.x, 0, camera.position.z);
            updateObjective();
            const sameCell = Math.round(monster.position.x / CELL_SIZE) === targetCell.x && Math.round(monster.position.z / CELL_SIZE) === targetCell.z;
            if (sameCell && Math.hypot(camera.position.x - monster.position.x, camera.position.z - monster.position.z) < 3.2) finishRound(false);
        }

        function finishRound(escaped) {
            if (gameEnded) return;
            gameEnded = true;
            clearInterval(timerInterval);
            document.getElementById('final-time').innerText = document.getElementById('timer-display').innerText;
            document.getElementById('result-kicker').textContent = escaped ? 'THE LOST LABYRINTH · COMPLETE' : 'THE LOST LABYRINTH · CAUGHT';
            document.getElementById('result-title').textContent = escaped ? '탈출 성공!' : '괴물에게 잡혔어요';
            document.getElementById('result-description').textContent = escaped ? '길을 찾아 미로를 빠져나왔습니다.' : '다음에는 흔적을 남기며 다른 길을 찾아보세요.';
            document.getElementById('win-screen').classList.toggle('caught', !escaped);
            if (!isMobile) controls.unlock();
            document.getElementById('mobile-ui').style.display = 'none';
            resetMobileInput();
            document.getElementById('crosshair').style.display = 'none';
            document.getElementById('blocker').style.display = 'none';
            document.getElementById('win-screen').style.display = 'flex';
        }

        function build3DMaze() {
            const wallGeo = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE);
            const wallMat = new THREE.MeshStandardMaterial({
                map: createWallTexture(),
                roughness: 0.9,
                metalness: 0.1
            });

            for (let z = 0; z < MAZE_SIZE; z++) {
                for (let x = 0; x < MAZE_SIZE; x++) {
                    if (maze[z][x] === 1) {
                        const wall = new THREE.Mesh(wallGeo, wallMat);
                        wall.position.set(x * CELL_SIZE, WALL_HEIGHT / 2, z * CELL_SIZE);
                        mazeGroup.add(wall); // scene 대신 mazeGroup에 추가
                        walls.push(wall);
                    } else if (maze[z][x] === 2) {
                        exitMesh = createExitDoor();
                        exitMesh.position.set(x * CELL_SIZE, 0, z * CELL_SIZE);
                        mazeGroup.add(exitMesh);
                    }
                }
            }

            // 시야 위치 및 회전 초기화
            camera.position.set(1 * CELL_SIZE, PLAYER_HEIGHT, 1 * CELL_SIZE);
            camera.rotation.set(0, -Math.PI / 2, 0);
        }

        function checkCollision(pos, dx, dz) {
            let nextX = pos.x + dx, nextZ = pos.z + dz;
            const getGrid = (val) => Math.round(val / CELL_SIZE);

            let gridX = getGrid(nextX + (dx > 0 ? PLAYER_SIZE : -PLAYER_SIZE));
            let gridZ = getGrid(pos.z);
            if (gridZ >= 0 && gridZ < MAZE_SIZE && gridX >= 0 && gridX < MAZE_SIZE && maze[gridZ][gridX] === 1) dx = 0;

            gridX = getGrid(pos.x);
            gridZ = getGrid(nextZ + (dz > 0 ? PLAYER_SIZE : -PLAYER_SIZE));
            if (gridZ >= 0 && gridZ < MAZE_SIZE && gridX >= 0 && gridX < MAZE_SIZE && maze[gridZ][gridX] === 1) dz = 0;

            return { dx, dz };
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }

        function animate() {
            requestAnimationFrame(animate);
            if (gameEnded || !gameStarted) {
                if (gameStarted) renderer.render(scene, camera);
                return;
            }

            const time = performance.now();
            const delta = Math.min((time - prevTime) / 1000, 0.1);
            prevTime = time;

            let inputX = 0, inputZ = 0;
            if (isMobile) {
                inputX = joyDelta.x;
                inputZ = joyDelta.y;
            } else {
                if (moveForward) inputZ -= 1;
                if (moveBackward) inputZ += 1;
                if (moveLeft) inputX -= 1;
                if (moveRight) inputX += 1;
            }

            const localMove = new THREE.Vector3(inputX, 0, inputZ);
            if (localMove.lengthSq() > 1) localMove.normalize();

            const euler = new THREE.Euler(0, 0, 0, 'YXZ');
            euler.setFromQuaternion(camera.quaternion);
            euler.x = 0;
            euler.z = 0;

            localMove.applyEuler(euler);

            if (inputX !== 0 || inputZ !== 0) {
                let dx = localMove.x * PLAYER_SPEED * delta;
                let dz = localMove.z * PLAYER_SPEED * delta;

                const allowedMove = checkCollision(camera.position, dx, dz);
                camera.position.x += allowedMove.dx;
                camera.position.z += allowedMove.dz;
            }
            camera.position.y = PLAYER_HEIGHT;

            if (exitMesh) {
                const exitDistance = Math.hypot(camera.position.x - exitMesh.position.x, camera.position.z - exitMesh.position.z);
                if (exitDistance < CELL_SIZE * .4) {
                    finishRound(true);
                }
            }

            if (!gameEnded) updateMonster(delta);

            renderer.render(scene, camera);
        }

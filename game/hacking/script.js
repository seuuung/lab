let gameState = 'BOOT_MENU';
let currentUser = 'guest';
let currentPath = ['home', 'guest'];
let history = [];
let historyIndex = -1;
let awaitingPasswordFor = null;
let hintLevel = 0;

let scenarioId;
let scenarioData = {};
let fileSystem = {};
const scenarioNames = {
    1: '숨겨진 파일', 2: '권한과 비밀번호', 3: '이중 인코딩',
    4: '해시와 단어 사전', 5: 'API와 JWT', 6: 'SUID 취약점'
};
const scenarioSteps = {
    1: [
        { id: 'briefing', label: '임무 확인', tip: '홈 폴더의 안내 파일부터 읽어 목표를 확인하세요.', command: 'cat readme.txt' },
        { id: 'hidden', label: '숨김 파일 찾기', tip: '파일명 앞의 점(.)은 일반 목록에서 보이지 않습니다.', command: 'ls -la' },
        { id: 'password', label: '비밀번호 단서 읽기', tip: '찾아낸 .secret_note의 내용을 읽으세요.', command: 'cat .secret_note' },
        { id: 'admin', label: '관리자 계정으로 전환', tip: 'su를 실행한 뒤 찾은 암호를 입력하세요. $PASS도 사용할 수 있습니다.', command: 'su admin' },
        { id: 'unlock', label: '시스템 복구', tip: '관리자 권한으로 잠금 해제 프로그램을 실행하세요.', command: '/sbin/sys_unlock' }
    ],
    2: [
        { id: 'briefing', label: '임무 확인', tip: '안내 파일에서 조사할 위치를 확인하세요.', command: 'cat readme.txt' },
        { id: 'directory', label: '/etc 조사', tip: '설정 파일이 모인 디렉터리의 목록을 살펴보세요.', command: 'ls /etc' },
        { id: 'password', label: '관리자 설정 읽기', tip: 'admin_config.txt에 임시 암호가 적혀 있습니다.', command: 'cat /etc/admin_config.txt' },
        { id: 'admin', label: '관리자 계정으로 전환', tip: 'su를 실행한 뒤 찾은 암호를 입력하세요. $PASS도 사용할 수 있습니다.', command: 'su admin' },
        { id: 'unlock', label: '시스템 복구', tip: '관리자 권한으로 잠금 해제 프로그램을 실행하세요.', command: '/sbin/sys_unlock' }
    ],
    3: [
        { id: 'briefing', label: '임무 확인', tip: '안내 파일에서 백업 단서를 확인하세요.', command: 'cat readme.txt' },
        { id: 'directory', label: '백업 폴더 조사', tip: '/var/backups의 파일 목록을 살펴보세요.', command: 'ls /var/backups' },
        { id: 'encrypted', label: '암호문 확인', tip: 'admin_pass.crypt의 내용을 읽으세요.', command: 'cat /var/backups/admin_pass.crypt' },
        { id: 'base64', label: 'Base64 해독', tip: '파이프(|)로 파일 내용을 base64 디코더에 넘기세요.', command: 'cat /var/backups/admin_pass.crypt | base64 -d' },
        { id: 'password', label: 'ROT13 해독', tip: '아직 글자가 뒤바뀌었다면 ROT13을 한 번 더 적용하세요.', command: "cat /var/backups/admin_pass.crypt | base64 -d | tr 'A-Za-z' 'N-ZA-Mn-za-m'" },
        { id: 'admin', label: '관리자 계정으로 전환', tip: '해독한 암호로 로그인하세요. $PASS도 사용할 수 있습니다.', command: 'su admin' },
        { id: 'unlock', label: '시스템 복구', tip: '잠금 해제 프로그램을 실행하세요.', command: '/sbin/sys_unlock' }
    ],
    4: [
        { id: 'briefing', label: '임무 확인', tip: '안내 파일에서 해시 파일의 위치를 확인하세요.', command: 'cat readme.txt' },
        { id: 'hashfile', label: '해시 파일 찾기', tip: '임시 디렉터리에 유출된 파일이 있습니다.', command: 'ls /tmp' },
        { id: 'envfile', label: '솔트 설정 찾기', tip: '숨긴 .env 파일을 검색하세요.', command: 'find / -name *.env*' },
        { id: 'salt', label: '솔트 값 읽기', tip: '/opt/.env에 HASH_SALT가 기록되어 있습니다.', command: 'cat /opt/.env' },
        { id: 'password', label: '단어 사전 대조', tip: '읽은 솔트와 단어 사전으로 해시를 대조하세요. $SALT를 사용할 수 있습니다.', command: 'crack --salt $SALT --wordlist /usr/share/wordlists/rockyou.txt /tmp/shadow.bak' },
        { id: 'admin', label: '관리자 계정으로 전환', tip: '찾은 암호로 로그인하세요. $PASS도 사용할 수 있습니다.', command: 'su admin' },
        { id: 'unlock', label: '시스템 복구', tip: '잠금 해제 프로그램을 실행하세요.', command: '/sbin/sys_unlock' }
    ],
    5: [
        { id: 'briefing', label: '임무 확인', tip: '안내 파일에서 API 침투 목표를 확인하세요.', command: 'cat readme.txt' },
        { id: 'port', label: '서버 포트 찾기', tip: '열린 로컬 포트를 확인하세요.', command: 'netstat -tuln' },
        { id: 'secret', label: '서명 키 찾기', tip: 'API 설정 파일의 jwt_secret을 읽으세요.', command: 'cat /opt/api/config.js' },
        { id: 'token', label: '관리자 토큰 만들기', tip: '찾은 키로 admin 역할의 토큰을 만드세요. $SECRET을 사용할 수 있습니다.', command: 'jwt-forge --role=admin --secret=$SECRET' },
        { id: 'unlock', label: 'API로 잠금 해제', tip: '생성 토큰과 확인한 포트로 /unlock에 요청하세요. $TOKEN과 $PORT를 사용할 수 있습니다.', command: 'curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:$PORT/unlock' }
    ],
    6: [
        { id: 'briefing', label: '임무 확인', tip: '안내 파일에서 권한 상승 목표를 확인하세요.', command: 'cat readme.txt' },
        { id: 'binary', label: 'SUID 파일 찾기', tip: '/usr/bin 목록에서 권한에 s가 있는 파일을 찾으세요.', command: 'ls -la /usr/bin' },
        { id: 'probe', label: '프로그램 시험', tip: '찾은 파일에 짧은 입력을 주고 동작을 확인하세요.', command: '/usr/bin/vuln_prog test' },
        { id: 'root', label: '긴 입력으로 권한 상승', tip: '40자를 넘는 입력으로 취약점을 재현하세요.', command: '/usr/bin/vuln_prog AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' },
        { id: 'unlock', label: '시스템 복구', tip: 'root 권한으로 잠금 해제 프로그램을 실행하세요.', command: '/sbin/sys_unlock' }
    ]
};

function trainingHash(password, salt) {
    // 가상 해시지만 실제 단어 사전의 각 후보와 비교한다.
    let hash = 2166136261;
    for (const char of `${salt}:${password}`) {
        hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}

function makeToken(role, secret) {
    const header = btoa(JSON.stringify({ alg: 'SIM', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ user: 'guest', role }));
    return `${header}.${payload}.${btoa(`${secret}:${header}.${payload}`)}`;
}

function validAdminToken(token, secret) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        const payload = JSON.parse(atob(parts[1]));
        return payload.role === 'admin' && parts[2] === btoa(`${secret}:${parts[0]}.${parts[1]}`);
    } catch (_) { return false; }
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function currentStep() {
    return scenarioSteps[scenarioId].find(step => !scenarioData.progress.has(step.id));
}

function updateProgressUI() {
    const steps = scenarioSteps[scenarioId];
    const step = currentStep();
    scenarioLabel.textContent = '미션 ' + scenarioId + ' · ' + scenarioNames[scenarioId];
    stepLabel.textContent = step
        ? '진행 ' + scenarioData.progress.size + '/' + steps.length + ' · 다음: ' + step.label
        : '완료 · 시스템 복구 성공';
    suggestionButton.disabled = !step;
}

function markStep(id) {
    const steps = scenarioSteps[scenarioId];
    const index = steps.findIndex(step => step.id === id);
    if (index < 0 || scenarioData.progress.has(id)) return;
    for (let i = 0; i <= index; i++) scenarioData.progress.add(steps[i].id);
    hintLevel = 0;
    updateProgressUI();
    const next = currentStep();
    if (next) print('[진행 ' + scenarioData.progress.size + '/' + steps.length + '] ' + next.label + ' — ' + next.tip, 'system');
}

function initBootMenu() {
    gameState = 'BOOT_MENU';
    awaitingPasswordFor = null;
    bootHeader.hidden = false;
    bootActions.hidden = false;
    quickActions.hidden = true;
    outputDiv.innerHTML = '';
    print("GNU GRUB  version 2.06 - HACKER CTF EDITION", "system");
    print("-----------------------------------------", "system");
    print("위에서 미션을 선택하거나 숫자 1-7을 입력하세요. 처음이라면 1번을 권장합니다.", "success");
    promptSpan.innerHTML = "선택 (1-7): ";
    cmdInput.type = 'text';
    cmdInput.value = '';
    promptSpan.style.display = 'inline';
    window.scrollTo(0, 0);
}

// ROT13 암호화/복호화 (알파벳만 변환)
function rot13(str) {
    return str.replace(/[a-zA-Z]/g, function (c) {
        return String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
    });
}

function loadScenario(id) {
    scenarioId = id;
    if (scenarioId === 7) scenarioId = Math.floor(Math.random() * 6) + 1;
    bootHeader.hidden = true;
    bootActions.hidden = true;
    quickActions.hidden = false;
    gameState = 'PLAYING';
    scenarioData = { progress: new Set() };
    hintLevel = 0;
    currentUser = 'guest';
    currentPath = ['home', 'guest'];
    history = [];
    historyIndex = -1;
    awaitingPasswordFor = null;

    outputDiv.innerHTML = '';

    // 기본 파일 시스템
    fileSystem = {
        _type: "dir", perms: "drwxr-xr-x", owner: "root",
        "bin": { _type: "dir", perms: "drwxr-xr-x", owner: "root" },
        "sbin": {
            _type: "dir", perms: "drwxr-xr-x", owner: "root",
            "sys_unlock": {
                _type: "exec", perms: "-rwxr-xr-x", owner: "root", size: "112K", date: "Oct 24 00:01",
                fn: function (args) {
                    if (currentUser === 'admin' || currentUser === 'root') {
                        winGame("Admin privileges verified. Core system unlocked.");
                        return { out: "", err: false, success: true };
                    } else {
                        return { out: "sys_unlock: Permission denied. You must be 'admin' or 'root'.", err: true };
                    }
                }
            }
        },
        "etc": { _type: "dir", perms: "drwxr-xr-x", owner: "root" },
        "var": {
            _type: "dir", perms: "drwxr-xr-x", owner: "root",
            "backups": { _type: "dir", perms: "drwxr-xr-x", owner: "root" },
            "log": {
                _type: "dir", perms: "drwxr-xr-x", owner: "root",
                "syslog": { _type: "file", perms: "-rw-r--r--", owner: "root", content: "Kernel boot... OK\nNetwork module... OK", size: "120K", date: "Today 01:00" },
                "auth.log": { _type: "file", perms: "-rw-r--r--", owner: "root", content: "Failed password for root from 192.168.0.5\n", size: "50K", date: "Today 05:22" }
            }
        },
        "tmp": { _type: "dir", perms: "drwxrwxrwt", owner: "root" },
        "opt": { _type: "dir", perms: "drwxr-xr-x", owner: "root" },
        "usr": {
            _type: "dir", perms: "drwxr-xr-x", owner: "root",
            "share": {
                _type: "dir", perms: "drwxr-xr-x", owner: "root",
                "wordlists": { _type: "dir", perms: "drwxr-xr-x", owner: "root" }
            },
            "bin": { _type: "dir", perms: "drwxr-xr-x", owner: "root" }
        },
        "root": { _type: "dir", perms: "drwx------", owner: "root" },
        "home": {
            _type: "dir", perms: "drwxr-xr-x", owner: "root",
            "guest": {
                _type: "dir", perms: "drwxr-xr-x", owner: "guest",
                ".bash_history": { _type: "file", perms: "-rw-------", owner: "guest", content: "ls -la\nwhoami\ncat readme.txt", size: "30B", date: "Today 10:00" }
            },
            "admin": { _type: "dir", perms: "drwx------", owner: "admin" }
        }
    };

    const guideText = "=========================================\n[시스템 사용 가이드]\n💡 `help`: 명령어 목록\n💡 `hint`: 단계별 힌트 (명확한 명령어 가이드 포함)\n💡 파이프라인('|')과 'grep', 'find'를 활용해 단서를 찾으세요.\n=========================================\n\n";

    // 튜토리얼 1: 숨겨진 파일 및 단순 읽기
    if (scenarioId === 1) {
        scenarioData.password = "easyadmin";

        fileSystem.home.guest["readme.txt"] = {
            _type: "file", perms: "-rw-r--r--", owner: "guest", size: "480", content: guideText + "목표: /sbin/sys_unlock 파일을 실행하여 시스템을 복구하세요.\n\n시스템 관리자가 어디선가 암호를 적어놓고 숨겨두었습니다.\n숨겨진 파일은 보통 파일명 앞에 마침표(.)가 붙어 있습니다. 여러분의 홈 디렉토리 어딘가에 관리자의 비밀번호가 적힌 숨김 파일이 있는지 찾아보세요!"
        }; fileSystem.home.guest[".secret_note"] = {
            _type: "file", perms: "-rw-r--r--", owner: "guest", size: "12", content: "admin 계정의 비밀번호는 easyadmin 입니다."
        };
    }
    // 튜토리얼 2: 환경변수와 디렉토리 이동
    else if (scenarioId === 2) {
        scenarioData.password = "root2026";

        fileSystem.home.guest["readme.txt"] = {
            _type: "file", perms: "-rw-r--r--", owner: "guest", size: "480", content: guideText + "목표: /sbin/sys_unlock 파일을 실행하여 시스템을 복구하세요.\n\n이번에는 조금 더 깊이 찾아야 합니다. /etc 디렉토리 어딘가에 시스템 관리자가 설정 파일을 남겨두었습니다. 디렉토리를 이동하며 파일을 뒤져 관리자(admin)의 비밀번호를 획득하세요."
        }; fileSystem.etc["admin_config.txt"] = {
            _type: "file", perms: "-rw-r--r--", owner: "root", size: "35", content: "Temporary admin password set to: root2026\nPlease change ASAP."
        };
    }
    // 시나리오 1: 다중 인코딩 (Base64 + ROT13)
    else if (scenarioId === 3) {
        const secretKey = "SECRETKEY" + Math.floor(Math.random() * 9999);
        scenarioData.password = secretKey;
        // ROT13으로 먼저 변환하고 Base64로 인코딩
        const rot13Key = rot13(secretKey);
        const finalEncrypted = btoa(rot13Key);

        fileSystem.home.guest["readme.txt"] = {
            _type: "file", perms: "-rw-r--r--", owner: "guest", size: "480", content: guideText + "목표: /sbin/sys_unlock 파일을 실행하여 시스템을 복구하세요.\n\n시스템 어딘가에 관리자의 백업된 인증 정보가 숨겨져 있습니다.\n해당 단서를 적절한 도구로 해독하고 관리자 계정('admin')으로 전환해야 합니다."
        }; fileSystem.var.backups["admin_pass.crypt"] = {
            _type: "file", perms: "-rw-r--r--", owner: "root", size: "44", content: finalEncrypted
        };
    }
    // 시나리오 2: 해시 크래킹 + 워드리스트 + 솔트
    else if (scenarioId === 4) {
        const targetPass = "apple123";
        const salt = "XyZ" + Math.floor(Math.random() * 99);
        scenarioData.password = targetPass;

        fileSystem.home.guest["readme.txt"] = {
            _type: "file", perms: "-rw-r--r--", owner: "guest", size: "480", content: guideText + "목표: /sbin/sys_unlock 파일을 실행하여 시스템을 복구하세요.\n\n시스템 임시 폴더 근처에 권한 관리를 위한 주요 백업 파일이 유출되었습니다.\n또한 시스템에 적용된 보안 설정값(Salt) 문서를 찾아, 단어 사전으로 관리자 계정('admin') 비밀번호를 알아내야 합니다. 해시 형식은 이 미션을 위한 학습용 가상 방식입니다."
        }; fileSystem.tmp["shadow.bak"] = {
            _type: "file", perms: "-rw-r--r--", owner: "root", content: `root:*:18353:7:::\nadmin:$sim$${salt}$${trainingHash(targetPass, salt)}:18353:7:::\nguest:*:18353:7:::`
        };
        fileSystem.usr.share.wordlists["rockyou.txt"] = {
            _type: "file", perms: "-rw-r--r--", owner: "root", content: "123456\npassword\napple123\nadmin\nqwerty"
        };
        fileSystem.opt[".env"] = {
            _type: "file", perms: "-rw-r--r--", owner: "root", content: `DB_NAME=core\nHASH_SALT=${salt}\nDEBUG=false`
        };
    }
    // 시나리오 3: JWT 위조 및 API 침투
    else if (scenarioId === 5) {
        const secret = "SUPER_SECRET_" + Math.random().toString(36).substr(2, 5);
        scenarioData.port = Math.floor(8000 + Math.random() * 1000);
        scenarioData.secret = secret;
        scenarioData.oldToken = makeToken('user', secret);

        fileSystem.home.guest["readme.txt"] = {
            _type: "file", perms: "-rw-r--r--", owner: "guest", size: "480", content: guideText + "목표: 서버의 백도어 API를 호출하여 시스템 권한을 우회하세요.\n\n로컬 네트워크 상의 숨겨진 백그라운드 포트를 추적하고, 취약한 인증(JWT) 관리 서버의 비밀 키를 탈취하세요. 위조된 인증 토큰을 만들어 관리자 권한으로 API에 접근해야 합니다.\n이 미션의 JWT 서명은 학습용 가상 방식입니다. 생성한 토큰은 $TOKEN으로 다시 사용할 수 있습니다."
        }; fileSystem.opt.api = {
            _type: "dir", perms: "drwxr-xr-x", owner: "root",
            "config.js": { _type: "file", perms: "-rw-r--r--", owner: "root", content: `module.exports = {\n  port: ${scenarioData.port},\n  jwt_secret: '${secret}'\n}` }
        };
        fileSystem.var.log["api.log"] = {
            _type: "file", perms: "-rw-r--r--", owner: "root", content: `[INFO] Request to /login by guest\n[DEBUG] Token generated: ${scenarioData.oldToken}`
        };
    }
    // 시나리오 4: SUID 기반 버퍼 오버플로우
    else if (scenarioId === 6) {
        fileSystem.home.guest["readme.txt"] = {
            _type: "file", perms: "-rw-r--r--", owner: "guest", size: "480", content: guideText + "목표: 시스템의 취약점을 공략하여 root 권한을 탈취 후 /sbin/sys_unlock 실행\n\n시스템에 잘못된 특수 권한이 설정된 채 설치된 프로그램이 존재합니다. 메모리 오버플로우를 발생시켜 최고 관리자(root) 셸을 확보하세요."
        }; fileSystem.usr.bin["vuln_prog"] = {
            _type: "exec", perms: "-rwsr-xr-x", owner: "root", size: "15M", date: "Today 12:00",
            fn: function (args) {
                if (args.length === 0) return { out: "Usage: vuln_prog [input]", err: true };
                if (args[0].length > 40) {
                    currentUser = 'root'; // 권한 상승!
                    currentPath = ['root'];
                    updatePrompt();
                    return { out: "Segmentation fault (core dumped)...\nExploit successful. Spawning root shell.", success: true };
                } else {
                    return { out: `Hello, ${args[0]}! Input buffer safe.`, err: false };
                }
            }
        };
    }

    print("Ubuntu 22.04.1 LTS linux-core tty1", "system");
    print(`[INFO] ${scenarioNames[scenarioId]} 미션이 시작되었습니다.`, "system");
    print("Welcome to Linux. Type 'help' for a list of available commands.");
    print("💡 [SYSTEM] 시작하려면 <span class='system'>cat readme.txt</span> 를 입력하여 미션 목표를 확인하세요.<br>");
    updatePrompt();
    updateProgressUI();
    print('[첫 단계] ' + currentStep().tip + ' 추천 명령 버튼을 눌러 입력창에 명령어를 넣을 수 있습니다.', 'system');
}

const outputDiv = document.getElementById('output');
const cmdInput = document.getElementById('cmd');
const promptSpan = document.getElementById('prompt');
const bootHeader = document.getElementById('boot-header');
const bootActions = document.getElementById('boot-actions');
const quickActions = document.getElementById('quick-actions');
const scenarioLabel = document.getElementById('scenario-label');
const stepLabel = document.getElementById('step-label');
const suggestionButton = document.getElementById('suggestion-button');

bootActions.addEventListener('click', event => {
    const button = event.target.closest('button[data-scenario]');
    if (!button || gameState !== 'BOOT_MENU') return;
    cmdInput.value = button.dataset.scenario;
    cmdInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    cmdInput.focus();
});

quickActions.addEventListener('click', event => {
    const button = event.target.closest('button[data-command]');
    if (!button || cmdInput.disabled) return;
    if (awaitingPasswordFor) {
        if (button.dataset.command === 'reboot') {
            cmdInput.type = 'text';
            initBootMenu();
        } else {
            print('암호 입력 중입니다. 찾은 암호를 입력하거나 $PASS를 사용하세요.', 'system');
        }
        cmdInput.focus();
        return;
    }
    cmdInput.value = button.dataset.command;
    cmdInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    cmdInput.focus();
});

suggestionButton.addEventListener('click', () => {
    if (suggestionButton.disabled || gameState !== 'PLAYING') return;
    if (awaitingPasswordFor) {
        if (!scenarioData.knownPassword) {
            print('아직 암호 단서를 읽지 않았습니다. 찾은 암호를 직접 입력하세요.', 'system');
            return;
        }
        cmdInput.value = '$PASS';
    } else {
        cmdInput.value = currentStep().command;
    }
    cmdInput.focus();
});

function getDisplayPath() {
    const pathStr = '/' + currentPath.join('/');
    if (pathStr === `/home/${currentUser}`) return '~';
    if (pathStr.startsWith(`/home/${currentUser}/`)) return '~' + pathStr.substring(`/home/${currentUser}`.length);
    return pathStr || '/';
}

function updatePrompt() {
    const userClass = `user-${currentUser}`;
    promptSpan.innerHTML = `<span class="${userClass}">${currentUser}@linux</span>:<span class="prompt-dir">${getDisplayPath()}</span>$`;
}

function print(text, className = '') {
    const div = document.createElement('div');
    if (className) div.className = className;
    div.innerHTML = text;
    outputDiv.appendChild(div);

    const scrollToOutput = () => {
        if (gameState !== 'BOOT_MENU') window.scrollTo(0, document.body.scrollHeight);
    };
    if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        MathJax.typesetPromise([div]).then(scrollToOutput);
    } else scrollToOutput();
}

function winGame(msg) {
    if (gameState === 'WON') return;
    gameState = 'WON';
    markStep('unlock');
    print("\n=========================================", "success");
    print("[SUCCESS] SYSTEM HACKED AND RECOVERED!", "success");
    print(`[INFO] Msg: ${msg}`, "success");

    // 아스키 아트 출력 부분
    const asciiArt = `
  _________                            __         ._.
 /   _____/ ____   ___________   _____/  |_  _____| |
 \\_____  \\_/ ___\\ /  _ \\_  __ \\_/ __ \\   __\\/  ___/ |
 /        \\  \\___(  <_> )  | \\/\\  ___/|  |  \\___ \\|\\|
/_______  /\\___  >____/|__|    \\___  >__| /____  >__
        \\/     \\/                  \\/          \\/ \\/
            `;
    print(`<pre class="success ascii-art">${asciiArt}</pre>`, "");

    print("\n🎉 시스템 권한을 성공적으로 복구했습니다! 축하합니다! 🎉", "success");
    print("=========================================", "success");
    print("[INFO] 다른 미션을 시작하려면 'reboot'을 입력하세요.", "system");
}

function checkPerm(node, user, actionType) {
    if (user === 'root') return true;
    let offset = (node.owner === user) ? 1 : 7;
    let charToCheck = actionType === 'read' ? 'r' : (actionType === 'write' ? 'w' : (actionType === 'exec' ? 'x' : 's'));

    // SUID 체크
    if (actionType === 'exec' && node.perms[3] === 's') return true;

    if (actionType === 'read') return node.perms[offset] === charToCheck;
    if (actionType === 'exec') return node.perms[offset + 2] === charToCheck || node.perms[offset + 2] === 's';
    return false;
}

function resolvePath(targetPath) {
    if (!targetPath) return [...currentPath];
    let resPath = [...currentPath];
    let segments = targetPath.split('/');

    if (targetPath.startsWith('/')) resPath = [];
    else if (targetPath.startsWith('~')) {
        resPath = ['home', currentUser];
        segments.shift();
    }

    for (const segment of segments) {
        if (!segment || segment === '.') continue;
        if (segment === '..') {
            if (resPath.length > 0) resPath.pop();
        } else {
            resPath.push(segment);
        }
    }
    return resPath;
}

function getTargetNode(pathArray) {
    let current = fileSystem;
    for (const part of pathArray) {
        if (current && current[part]) current = current[part];
        else return null;
    }
    return current;
}

function getAllFilesRecursive(dir, pathStr = "", result = []) {
    for (const key in dir) {
        const node = dir[key];
        if (!node || typeof node !== 'object' || !node._type) continue;
        const fullPath = pathStr + "/" + key;
        result.push({ name: key, path: fullPath, node: node });
        if (node._type === 'dir') {
            getAllFilesRecursive(node, fullPath, result);
        }
    }
    return result;
}

cmdInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const inputVal = cmdInput.value.trim();
        cmdInput.value = '';

        if (gameState === 'BOOT_MENU') {
            print(`<div>${promptSpan.innerHTML} ${escapeHtml(inputVal)}</div>`);

            if (['1', '2', '3', '4', '5', '6', '7'].includes(inputVal)) {
                loadScenario(parseInt(inputVal));
            } else print("Invalid choice.", "error");
            return;
        }

        if (awaitingPasswordFor) {
            if (inputVal === 'reboot') {
                cmdInput.type = 'text';
                initBootMenu();
                return;
            }
            cmdInput.type = 'text';
            promptSpan.style.display = 'inline';
            print(`<div>Password: ********</div>`);

            let success = false;
            if ((scenarioId === 1 || scenarioId === 2 || scenarioId === 3 || scenarioId === 4) && awaitingPasswordFor === 'admin') {
                if (inputVal === scenarioData.password || (inputVal === '$PASS' && scenarioData.knownPassword === scenarioData.password)) success = true;
            }

            if (success) {
                currentUser = awaitingPasswordFor;
                currentPath = ['home', currentUser];
                updatePrompt();
                print(`[OK] ${currentUser} 계정으로 전환했습니다. 다음 목표는 /sbin/sys_unlock 실행입니다.`, "success");
                markStep('admin');
            } else print(`su: Authentication failure`, "error");
            awaitingPasswordFor = null;
            return;
        }

        if (inputVal) {
            history.push(inputVal);
            historyIndex = history.length;
        }
        print(`<div>${promptSpan.innerHTML} ${escapeHtml(inputVal)}</div>`);
        if (gameState === 'WON' && inputVal !== 'reboot') {
            print("미션을 완료했습니다. 다른 미션을 시작하려면 reboot을 입력하세요.", "system");
            return;
        }
        if (inputVal) processPipeline(inputVal);
    }
    else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex > 0) { historyIndex--; cmdInput.value = history[historyIndex]; }
    }
    else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex < history.length - 1) { historyIndex++; cmdInput.value = history[historyIndex]; }
        else { historyIndex = history.length; cmdInput.value = ''; }
    }
});

// 파이프라인 | 처리
function processPipeline(input) {
    const commands = input.split('|').map(s => s.trim());
    let currentOutput = null;

    for (let i = 0; i < commands.length; i++) {
        const isLast = (i === commands.length - 1);
        currentOutput = executeCommand(commands[i], currentOutput, isLast);
        if (currentOutput === null && !isLast) break; // 에러 시 파이프라인 중단
    }
}

function executeCommand(input, pipeInput, printOutput) {
    // 공백과 작은따옴표/큰따옴표를 해석한다. 힌트의 명령어를 그대로 붙여 넣을 수 있다.
    const args = [];
    let quote = null;
    let currentArg = "";
    for (let i = 0; i < input.length; i++) {
        if (input[i] === quote) { quote = null; }
        else if ((input[i] === '"' || input[i] === "'") && !quote) { quote = input[i]; }
        else if (input[i] === ' ' && !quote) {
            if (currentArg.length > 0) { args.push(currentArg); currentArg = ""; }
        } else currentArg += input[i];
    }
    if (currentArg.length > 0) args.push(currentArg);

    let cmd = args[0];
    if (!cmd) return null;
    let outData = "";
    let completedStep = null;

    if (cmd.includes('/')) {
        const execNode = getTargetNode(resolvePath(cmd));
        if (!execNode) { print(`bash: ${cmd}: No such file or directory`, "error"); return null; }
        if (execNode._type !== 'exec' || !checkPerm(execNode, currentUser, 'exec')) { print(`bash: ${cmd}: Permission denied`, "error"); return null; }
        const result = execNode.fn(args.slice(1));
        if (printOutput && result.out) print(result.out, result.success ? "success" : (result.err ? "error" : ""));
        if (scenarioId === 6 && cmd === '/usr/bin/vuln_prog' && !result.err) {
            markStep(currentUser === 'root' ? 'root' : 'probe');
        } else if (scenarioId === 6 && currentUser === 'root' && cmd === '/usr/bin/vuln_prog') {
            markStep('root');
        }
        return result.out;
    }

    switch (cmd) {
        case 'help':
            outData = "Available commands:\n\n [📁 File & Navigation]\n  ls [-a] [-l] [dir]  : List directory contents\n  cd [dir]            : Change directory\n  cat [file]          : Print file content\n  head [-n N] [file]  : Print first N lines\n  tail [-n N] [file]  : Print last N lines\n  find [path] -name   : Find files by name\n  file [path]         : Determine file type\n  strings [file]      : Extract readable strings\n  touch [file]        : Create empty file\n  mkdir [dir]         : Create directory\n  rm [file]           : Remove file\n  cp [src] [dst]      : Copy file\n  chmod [mode] [file] : Change permissions (root)\n\n [📝 Text Processing]\n  echo [text]         : Print text\n  grep [keyword]      : Filter lines by keyword\n  sort [file]         : Sort lines\n  uniq [file]         : Remove duplicate lines\n  wc [file]           : Count lines/words/bytes\n  base64 -d [file]    : Decode base64 data\n  tr [set1] [set2]    : Translate characters\n\n [🖥️ System Info]\n  whoami / id         : User identity info\n  pwd                 : Working directory\n  uname [-a]          : System info\n  hostname / date     : Host name / Date-time\n  env / printenv      : Environment variables\n  ps [aux]            : List processes\n  history             : Command history\n  man [cmd]           : Manual page\n\n [🌐 Network]\n  netstat -tuln       : Network connections\n  ifconfig            : Network interfaces\n  ping [host]         : Test connectivity\n  ssh [user@host]     : SSH connection\n  wget / curl [url]   : Transfer data\n\n [🔧 CTF Tools]\n  crack [opts] [file] : Hash bruteforce\n  jwt-forge [opts]    : Forge JWT tokens\n  su [user]           : Switch user\n  mission / hint      : 목표 확인 / 단계별 힌트\n  clear / reboot      : Clear screen / Restart";
            break;
        case 'mission':
            outData = '[미션 ' + scenarioId + '] ' + scenarioNames[scenarioId]
                + '\n' + fileSystem.home.guest['readme.txt'].content.split('목표: ')[1].split('\n')[0]
                + '\n진행 ' + scenarioData.progress.size + '/' + scenarioSteps[scenarioId].length
                + '\n다음 단계: ' + (currentStep() ? currentStep().label : '완료')
                + '\n상세 설명: cat /home/guest/readme.txt\n막히면 hint를 입력하세요.';
            break;
        case 'grep':
            if (args.length < 2) { print("Usage: grep [keyword]", "error"); return null; }
            const keyword = args[1];
            if (!pipeInput) { print("grep: waiting for input...", "error"); return null; }
            outData = pipeInput.split('\n').filter(l => l.includes(keyword)).join('\n');
            break;
        case 'find':
            const searchPath = args[1] || '/';
            const findNode = getTargetNode(resolvePath(searchPath));
            if (!findNode || findNode._type !== 'dir') { print(`find: ${searchPath}: No such directory`, "error"); return null; }
            let filterName = null;
            if (args.includes("-name")) filterName = args[args.indexOf("-name") + 1].replace(/\*/g, '');
            const allFiles = getAllFilesRecursive(findNode, searchPath === '/' ? "" : searchPath);
            outData = allFiles.filter(f => !filterName || f.name.includes(filterName)).map(f => f.path).join('\n');
            if (scenarioId === 4 && outData.split('\n').includes('/opt/.env')) completedStep = 'envfile';
            break;
        case 'hint': {
            const step = currentStep();
            if (!step) { outData = '미션을 완료했습니다. reboot으로 다른 미션을 선택하세요.'; break; }
            hintLevel = Math.min(hintLevel + 1, 2);
            outData = '[현재 단계 ' + (scenarioData.progress.size + 1) + '/' + scenarioSteps[scenarioId].length + '] ' + step.label + '\n' + step.tip;
            if (hintLevel === 2) outData += '\n추천 명령어: ' + step.command + '\n상단 버튼을 누르면 입력창에 명령어가 채워집니다.';
            break;
        }
        case 'reboot':
            print("The system is going down for reboot NOW!", "system");
            cmdInput.disabled = true;
            setTimeout(() => { cmdInput.disabled = false; initBootMenu(); }, 2000);
            return null;
        case 'clear':
            outputDiv.innerHTML = ''; return null;
        case 'pwd':
        case 'whoami':
            outData = cmd === 'pwd' ? '/' + currentPath.join('/') : currentUser;
            break;
        case 'su':
            const targetUser = args[1] || 'root';
            print(`Password for ${targetUser}:`);
            awaitingPasswordFor = targetUser;
            cmdInput.type = 'password';
            promptSpan.style.display = 'none';
            return null;
        case 'ls':
            let showHidden = args.includes('-a') || args.includes('-la') || args.includes('-al');
            let longFormat = args.includes('-l') || args.includes('-la') || args.includes('-al');
            let targetDirArg = args.find(a => !a.startsWith('-') && a !== 'ls');
            const lsNode = getTargetNode(resolvePath(targetDirArg || ''));
            if (!lsNode) { print(`ls: cannot access '${targetDirArg}': No such file or directory`, "error"); return null; }
            if (lsNode._type !== 'dir') { outData = targetDirArg; break; }
            if (!checkPerm(lsNode, currentUser, 'read')) { print(`ls: Permission denied`, "error"); return null; }
            for (const key in lsNode) {
                const item = lsNode[key];
                if (!item || typeof item !== 'object' || !item._type) continue;
                if (!showHidden && key.startsWith('.')) continue;
                let spanClass = item._type === 'dir' ? "dir" : (item._type === 'exec' ? "exec" : "");
                if (longFormat) outData += `${item.perms} 1 ${item.owner.padEnd(6)} ${item.owner.padEnd(6)} ${(item.size || '4.0K').padStart(5)} ${item.date || 'Oct 24 10:00'} <span class="${spanClass}">${key}</span>\n`;
                else outData += `<span class="${spanClass}">${key}</span>  `;
            }
            if (scenarioId === 1 && lsNode === fileSystem.home.guest && showHidden) completedStep = 'hidden';
            if (scenarioId === 2 && lsNode === fileSystem.etc) completedStep = 'directory';
            if (scenarioId === 3 && lsNode === fileSystem.var.backups) completedStep = 'directory';
            if (scenarioId === 4 && lsNode === fileSystem.tmp) completedStep = 'hashfile';
            if (scenarioId === 6 && lsNode === fileSystem.usr.bin) completedStep = 'binary';
            break;
        case 'cd':
            const newPath = resolvePath(args[1] || '~');
            const targetDir = getTargetNode(newPath);
            if (!targetDir || targetDir._type !== 'dir') print(`cd: ${args[1]}: Not a directory`, "error");
            else if (!checkPerm(targetDir, currentUser, 'exec')) print(`cd: Permission denied`, "error");
            else { currentPath = newPath; updatePrompt(); }
            return null;
        case 'cat':
            if (args.length < 2) { print("cat: missing file operand", "error"); return null; }
            const catFile = getTargetNode(resolvePath(args[1]));
            if (!catFile || catFile._type !== 'file') print(`cat: ${args[1]}: File not found`, "error");
            else if (!checkPerm(catFile, currentUser, 'read')) print(`cat: Permission denied`, "error");
            else {
                outData = catFile.content;
                if (catFile === fileSystem.home.guest['readme.txt']) completedStep = 'briefing';
                if (scenarioId === 1 && catFile === fileSystem.home.guest['.secret_note']) {
                    scenarioData.knownPassword = scenarioData.password;
                    completedStep = 'password';
                }
                if (scenarioId === 2 && catFile === fileSystem.etc['admin_config.txt']) {
                    scenarioData.knownPassword = scenarioData.password;
                    completedStep = 'password';
                }
                if (scenarioId === 3 && catFile === fileSystem.var.backups['admin_pass.crypt']) completedStep = 'encrypted';
                if (scenarioId === 4 && catFile === fileSystem.opt['.env']) {
                    scenarioData.knownSalt = catFile.content.match(/HASH_SALT=(.+)/)[1];
                    completedStep = 'salt';
                }
                if (scenarioId === 5 && catFile === fileSystem.opt.api['config.js']) {
                    scenarioData.knownSecret = scenarioData.secret;
                    completedStep = 'secret';
                }
            }
            break;
        case 'base64':
            let contentToDecode = pipeInput;
            if (args[1] === '-d' && args[2]) {
                const b64F = getTargetNode(resolvePath(args[2]));
                if (b64F && b64F._type === 'file') contentToDecode = b64F.content;
            }
            if (contentToDecode) {
                try { outData = atob(contentToDecode.trim()); } catch (e) { print("base64: invalid input", "error"); return null; }
                if (scenarioId === 3 && outData === rot13(scenarioData.password)) completedStep = 'base64';
            } else { print("Usage: base64 -d [file] or pipe data", "error"); return null; }
            break;
        case 'tr':
            if (args.length >= 3 && pipeInput) {
                // Very simplified tr for ROT13
                if (args[1] === "A-Za-z" && args[2] === "N-ZA-Mn-za-m") {
                    outData = rot13(pipeInput);
                    if (scenarioId === 3 && outData === scenarioData.password) {
                        scenarioData.knownPassword = outData;
                        completedStep = 'password';
                    }
                } else outData = pipeInput;
            } else { print("Usage: tr [set1] [set2]", "error"); return null; }
            break;
        case 'crack':
            const saltIndex = args.indexOf('--salt');
            const listIndex = args.indexOf('--wordlist');
            if (saltIndex < 0 || listIndex < 0 || !args[saltIndex + 1] || !args[listIndex + 1] || args.length < 6) {
                print("Usage: crack --salt [salt] --wordlist [file] [hashfile]", "error");
                return null;
            }
            const salt = args[saltIndex + 1] === '$SALT' ? scenarioData.knownSalt : args[saltIndex + 1];
            const wordlist = getTargetNode(resolvePath(args[listIndex + 1]));
            const hashFile = getTargetNode(resolvePath(args[args.length - 1]));
            if (!wordlist || wordlist._type !== 'file' || !checkPerm(wordlist, currentUser, 'read')) {
                print("crack: 단어 사전 파일을 읽을 수 없습니다.", "error");
                return null;
            }
            if (!hashFile || hashFile._type !== 'file' || !checkPerm(hashFile, currentUser, 'read')) {
                print("crack: 해시 파일을 읽을 수 없습니다.", "error");
                return null;
            }
            const record = hashFile.content.match(/admin:\$sim\$([^$:\n]+)\$([0-9a-f]{8})/);
            if (!record) {
                print("crack: admin 해시를 찾지 못했습니다.", "error");
                return null;
            }
            if (salt !== record[1]) {
                print("crack: 솔트가 해시 기록과 일치하지 않습니다. /opt/.env를 확인하세요.", "error");
                return null;
            }
            const match = wordlist.content.split(/\r?\n/).find(candidate => trainingHash(candidate, salt) === record[2]);
            if (match) {
                scenarioData.knownPassword = match;
                print(`[+] 해시 해독 성공! admin 비밀번호: ${escapeHtml(match)}`, "success");
                markStep('password');
            }
            else print("crack: 단어 사전에서 일치하는 비밀번호를 찾지 못했습니다.", "error");
            return null;
        case 'jwt-forge':
            let role = "", secretKey = "";
            for (let i = 1; i < args.length; i++) {
                if (args[i].startsWith('--role=')) role = args[i].split('=')[1];
                if (args[i].startsWith('--secret=')) secretKey = args[i].split('=')[1];
            }
            if (secretKey === '$SECRET') secretKey = scenarioData.knownSecret || '';
            if (role && secretKey) {
                outData = makeToken(role, secretKey);
                scenarioData.lastToken = outData;
                print(`토큰 생성 완료:\n${outData}\n\n긴 토큰을 복사하지 않아도 됩니다. curl 명령에서 $TOKEN을 사용하세요.`, "success");
                if (scenarioId === 5 && role === 'admin' && secretKey === scenarioData.secret) markStep('token');
                return null;
            } else print("Usage: jwt-forge --role=[role] --secret=[secret_key]", "error");
            return null;
        case 'netstat':
            if (args[1] === '-tuln') {
                outData = "Active Internet connections\nProto Local Address           State\ntcp   0.0.0.0:22              LISTEN";
                if (scenarioId === 5) {
                    outData += `\ntcp   127.0.0.1:${scenarioData.port}       LISTEN`;
                    scenarioData.knownPort = scenarioData.port;
                    completedStep = 'port';
                }
            } else print("Usage: netstat -tuln");
            break;
        case 'curl':
            const url = args[args.length - 1].replace('$PORT', scenarioData.knownPort || '$PORT');
            let authHeader = "";
            // -H 옵션 파싱: curl -H "Authorization: Bearer TOKEN" URL
            for (let ci = 1; ci < args.length - 1; ci++) {
                if (args[ci] === '-H' && args[ci + 1]) { authHeader = args[ci + 1]; ci++; }
            }
            let requestUrl;
            try { requestUrl = new URL(url); } catch (_) { requestUrl = null; }
            if (scenarioId === 5 && requestUrl && requestUrl.hostname === '127.0.0.1' && requestUrl.port === String(scenarioData.port) && requestUrl.pathname === '/unlock') {
                const bearer = authHeader.match(/^Authorization:\s*Bearer\s+(.+)$/i);
                const token = bearer && (bearer[1] === '$TOKEN' ? scenarioData.lastToken : bearer[1]);
                if (token && validAdminToken(token, scenarioData.secret)) {
                    winGame("API call authorized with forged JWT. Core unlocked remotely.");
                } else {
                    outData = bearer ? '{"error": "Invalid token, role, or secret. Check jwt-forge inputs."}' : '{"error": "Missing Authorization: Bearer token."}';
                }
            } else if (scenarioId === 5 && requestUrl && requestUrl.hostname === '127.0.0.1' && requestUrl.port === String(scenarioData.port)) {
                outData = `{"error": "404 Not Found. Try /unlock endpoint."}`;
            } else outData = `curl: (7) Failed to connect to port`;
            break;
        // === 텍스트 출력 / 시스템 정보 ===
        case 'echo':
            outData = args.slice(1).join(' ');
            break;
        case 'id':
            if (currentUser === 'root') outData = 'uid=0(root) gid=0(root) groups=0(root)';
            else if (currentUser === 'admin') outData = 'uid=1000(admin) gid=1000(admin) groups=1000(admin),27(sudo)';
            else outData = 'uid=1001(guest) gid=1001(guest) groups=1001(guest)';
            break;
        case 'uname':
            if (args.includes('-a')) outData = 'Linux linux-core 5.15.0-56-generic #62-Ubuntu SMP x86_64 GNU/Linux';
            else outData = 'Linux';
            break;
        case 'hostname':
            outData = 'linux-core';
            break;
        case 'date':
            outData = new Date().toString();
            break;
        // === 텍스트 처리 (파이프 지원) ===
        case 'head':
        case 'tail': {
            let htN = 10, htContent = pipeInput;
            for (let hi = 1; hi < args.length; hi++) {
                if (args[hi] === '-n' && args[hi + 1]) { htN = parseInt(args[hi + 1]); hi++; }
                else if (/^-\d+$/.test(args[hi])) htN = parseInt(args[hi].substring(1));
                else if (!args[hi].startsWith('-')) {
                    const htF = getTargetNode(resolvePath(args[hi]));
                    if (htF && htF._type === 'file' && checkPerm(htF, currentUser, 'read')) htContent = htF.content;
                    else { print(`${cmd}: ${args[hi]}: No such file`, "error"); return null; }
                }
            }
            if (!htContent) { print(`${cmd}: missing input`, "error"); return null; }
            const htLines = htContent.split('\n');
            outData = cmd === 'head' ? htLines.slice(0, htN).join('\n') : htLines.slice(-htN).join('\n');
            break;
        }
        case 'wc': {
            let wcContent = pipeInput, wcLabel = '';
            if (args[1] && !args[1].startsWith('-')) {
                const wcF = getTargetNode(resolvePath(args[1]));
                if (wcF && wcF._type === 'file') { wcContent = wcF.content; wcLabel = ' ' + args[1]; }
                else { print(`wc: ${args[1]}: No such file`, "error"); return null; }
            }
            if (!wcContent) { print("wc: missing input", "error"); return null; }
            outData = `  ${wcContent.split('\n').length}  ${wcContent.split(/\s+/).filter(w => w).length} ${wcContent.length}${wcLabel}`;
            break;
        }
        case 'sort': {
            let sortContent = pipeInput;
            if (args[1] && !args[1].startsWith('-')) {
                const sF = getTargetNode(resolvePath(args[1]));
                if (sF && sF._type === 'file') sortContent = sF.content;
                else { print(`sort: ${args[1]}: No such file`, "error"); return null; }
            }
            if (!sortContent) { print("sort: missing input", "error"); return null; }
            const sLines = sortContent.split('\n');
            args.includes('-r') ? sLines.sort().reverse() : sLines.sort();
            outData = sLines.join('\n');
            break;
        }
        case 'uniq': {
            let uContent = pipeInput;
            if (args[1] && !args[1].startsWith('-')) {
                const uF = getTargetNode(resolvePath(args[1]));
                if (uF && uF._type === 'file') uContent = uF.content;
                else { print(`uniq: ${args[1]}: No such file`, "error"); return null; }
            }
            if (!uContent) { print("uniq: missing input", "error"); return null; }
            const uLines = uContent.split('\n');
            outData = uLines.filter((l, i) => i === 0 || l !== uLines[i - 1]).join('\n');
            break;
        }
        // === 파일 조작 ===
        case 'touch': {
            if (args.length < 2) { print("touch: missing file operand", "error"); return null; }
            const tPath = resolvePath(args[1]); const tName = tPath.pop();
            const tParent = getTargetNode(tPath);
            if (!tParent || tParent._type !== 'dir') { print(`touch: cannot touch '${args[1]}': No such directory`, "error"); return null; }
            if (!tParent[tName]) tParent[tName] = { _type: "file", perms: "-rw-r--r--", owner: currentUser, content: "", size: "0", date: "Today" };
            return null;
        }
        case 'mkdir': {
            if (args.length < 2) { print("mkdir: missing operand", "error"); return null; }
            const mPath = resolvePath(args[1]); const mName = mPath.pop();
            const mParent = getTargetNode(mPath);
            if (!mParent || mParent._type !== 'dir') { print(`mkdir: cannot create '${args[1]}': No such directory`, "error"); return null; }
            if (mParent[mName]) { print(`mkdir: '${args[1]}': File exists`, "error"); return null; }
            mParent[mName] = { _type: "dir", perms: "drwxr-xr-x", owner: currentUser };
            return null;
        }
        case 'rm': {
            if (args.length < 2) { print("rm: missing operand", "error"); return null; }
            const rPath = resolvePath(args[1]); const rName = rPath.pop();
            const rParent = getTargetNode(rPath);
            if (!rParent || !rParent[rName]) { print(`rm: cannot remove '${args[1]}': No such file`, "error"); return null; }
            if (rParent[rName]._type === 'dir' && !args.includes('-r') && !args.includes('-rf')) { print(`rm: cannot remove '${args[1]}': Is a directory`, "error"); return null; }
            if (rParent[rName].owner !== currentUser && currentUser !== 'root') { print("rm: Permission denied", "error"); return null; }
            delete rParent[rName];
            return null;
        }
        case 'cp': {
            if (args.length < 3) { print("cp: missing file operand", "error"); return null; }
            const cpSrc = getTargetNode(resolvePath(args[1]));
            if (!cpSrc || cpSrc._type === 'dir') { print(`cp: cannot copy '${args[1]}'`, "error"); return null; }
            const cpDP = resolvePath(args[2]); const cpDN = cpDP.pop();
            const cpPar = getTargetNode(cpDP);
            if (!cpPar || cpPar._type !== 'dir') { print(`cp: target '${args[2]}': No such directory`, "error"); return null; }
            cpPar[cpDN] = JSON.parse(JSON.stringify(cpSrc));
            return null;
        }
        case 'chmod': {
            if (args.length < 3) { print("chmod: missing operand", "error"); return null; }
            if (currentUser !== 'root') { print("chmod: Operation not permitted", "error"); return null; }
            const chNode = getTargetNode(resolvePath(args[2]));
            if (!chNode) { print(`chmod: '${args[2]}': No such file`, "error"); return null; }
            print(`chmod: mode of '${args[2]}' changed`, "system");
            return null;
        }
        // === 시스템 정보 ===
        case 'env':
        case 'printenv':
            outData = `USER=${currentUser}\nHOME=/home/${currentUser}\nSHELL=/bin/bash\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\nLANG=en_US.UTF-8\nTERM=xterm-256color\nHOSTNAME=linux-core`;
            break;
        case 'history':
            outData = history.length > 0 ? history.map((h, i) => `  ${(i + 1).toString().padStart(4)}  ${h}`).join('\n') : '(empty history)';
            break;
        case 'strings': {
            let strC = pipeInput;
            if (args[1]) {
                const strF = getTargetNode(resolvePath(args[1]));
                if (strF && (strF._type === 'file' || strF._type === 'exec')) strC = strF.content || `[binary: ${args[1]}]`;
                else { print(`strings: ${args[1]}: No such file`, "error"); return null; }
            }
            if (!strC) { print("strings: missing input", "error"); return null; }
            outData = strC.match(/[\x20-\x7E]{4,}/g)?.join('\n') || '(no strings found)';
            break;
        }
        case 'file': {
            if (args.length < 2) { print("file: missing operand", "error"); return null; }
            const fNode = getTargetNode(resolvePath(args[1]));
            if (!fNode) { print(`file: ${args[1]}: No such file`, "error"); return null; }
            if (fNode._type === 'dir') outData = `${args[1]}: directory`;
            else if (fNode._type === 'exec') outData = `${args[1]}: ELF 64-bit LSB executable, x86-64, dynamically linked`;
            else {
                const fc = fNode.content || '';
                if (fc.match(/^[A-Za-z0-9+/=\s]+$/) && fc.length > 10) outData = `${args[1]}: ASCII text (possibly base64 encoded)`;
                else if (fc.includes('$1$') || fc.includes(':*:')) outData = `${args[1]}: shadow password file, ASCII text`;
                else outData = `${args[1]}: ASCII text`;
            }
            break;
        }
        case 'ps': {
            outData = "  PID TTY          TIME CMD\n    1 ?        00:00:01 systemd\n  222 ?        00:00:00 sshd\n  333 tty1     00:00:00 bash\n  444 tty1     00:00:00 ps";
            if (scenarioId === 5) outData += `\n  ${scenarioData.port} ?        00:00:02 node /opt/api/server.js`;
            break;
        }
        // === 네트워크 ===
        case 'ifconfig':
        case 'ip':
            outData = "eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 192.168.0.10  netmask 255.255.255.0  broadcast 192.168.0.255\n        ether 08:00:27:f5:aa:bb  txqueuelen 1000\n\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0";
            break;
        case 'ping': {
            if (args.length < 2) { print("ping: missing host operand", "error"); return null; }
            const pH = args[1];
            const pIP = (pH === 'localhost' || pH === '127.0.0.1') ? '127.0.0.1' : '192.168.0.' + Math.floor(Math.random() * 254 + 1);
            outData = `PING ${pH} (${pIP}): 56 data bytes\n64 bytes from ${pIP}: icmp_seq=0 ttl=64 time=0.045 ms\n64 bytes from ${pIP}: icmp_seq=1 ttl=64 time=0.032 ms\n--- ${pH} ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss`;
            break;
        }
        case 'ssh':
            if (args.length < 2) { print("ssh: missing destination", "error"); return null; }
            print(`ssh: connect to host ${args[1]} port 22: Connection refused`, "error");
            return null;
        case 'wget':
            if (args.length < 2) { print("wget: missing URL", "error"); return null; }
            print(`--${new Date().toISOString()}--  ${args[1]}\nResolving host... failed: Name or service not known.`, "error");
            return null;
        case 'man': {
            const manDB = { ls:'ls - list directory contents\nUsage: ls [-a] [-l] [dir]  -a show hidden files, -l long format', cd:'cd - change directory\nUsage: cd [dir]  cd ~ home, cd .. up, cd / root', cat:'cat - print file content\nUsage: cat [file]', head:'head - output first part of files\nUsage: head [-n N] [file]  default: 10 lines', tail:'tail - output last part of files\nUsage: tail [-n N] [file]  default: 10 lines', find:'find - search for files\nUsage: find [path] -name [pattern]', grep:'grep - search text patterns\nUsage: command | grep [keyword]', su:'su - substitute user identity\nUsage: su [user]', base64:'base64 - encode/decode base64\nUsage: base64 -d [file] or pipe data', tr:'tr - translate characters\nUsage: tr [set1] [set2]  ROT13: tr \'A-Za-z\' \'N-ZA-Mn-za-m\'', crack:'crack - hash bruteforce\nUsage: crack --salt [salt] --wordlist [file] [hashfile]', 'jwt-forge':'jwt-forge - JWT token forgery\nUsage: jwt-forge --role=[role] --secret=[key]', curl:'curl - transfer data\nUsage: curl [-H "header"] [url]', netstat:'netstat - network connections\nUsage: netstat -tuln', chmod:'chmod - change file permissions\nUsage: chmod [mode] [file] (root only)', sort:'sort - sort lines of text\nUsage: sort [file] or pipe data  -r reverse', wc:'wc - word, line, byte count\nUsage: wc [file] or pipe data' };
            if (!args[1]) { print("What manual page do you want?\nUsage: man [command]", "error"); return null; }
            outData = manDB[args[1]] || `No manual entry for ${args[1]}`;
            break;
        }
        default:
            print(`${cmd}: command not found`, "error"); return null;
    }

    if (printOutput && outData) print(outData);
    if (completedStep) markStep(completedStep);
    return outData;
}

window.onload = function () {
    initBootMenu();
};

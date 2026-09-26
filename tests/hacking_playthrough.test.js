const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '../game/hacking/script.js'), 'utf8');

function createGame() {
    const elements = {};
    for (const id of ['output', 'cmd', 'prompt', 'boot-header', 'boot-actions', 'quick-actions', 'scenario-label', 'step-label', 'suggestion-button']) {
        elements[id] = {
            value: '', innerHTML: '', textContent: '', style: {}, hidden: false, disabled: false,
            children: [], addEventListener(type, listener) { this[type] = listener; },
            dispatchEvent(event) { this[event.type]({ ...event, preventDefault() {} }); },
            appendChild(child) { this.children.push(child); },
            focus() {}
        };
    }
    const context = vm.createContext({
        document: {
            getElementById(id) { return elements[id]; },
            createElement() { return { innerHTML: '', className: '' }; },
            body: { scrollHeight: 0 }
        },
        window: { scrollTo() {} },
        KeyboardEvent: class { constructor(type, options) { this.type = type; this.key = options.key; } },
        URL, Math, Date, console,
        btoa(value) { return Buffer.from(value, 'binary').toString('base64'); },
        atob(value) { return Buffer.from(value, 'base64').toString('binary'); },
        setTimeout(callback) { callback(); }
    });
    vm.runInContext(script, context);
    context.window.onload();

    function command(value) {
        const before = elements.output.children.length;
        elements.cmd.value = value;
        elements.cmd.keydown({ key: 'Enter', preventDefault() {} });
        return elements.output.children.slice(before).map(child => child.innerHTML).join('\n');
    }
    function state() { return vm.runInContext('gameState', context); }
    return { command, state, elements };
}

function unlockWithPassword(game, password) {
    game.command('su admin');
    game.command(password);
    game.command('/sbin/sys_unlock');
    assert.equal(game.state(), 'WON');
}

{
    const game = createGame();
    game.elements['boot-actions'].click({ target: { closest() { return { dataset: { scenario: '1' } }; } } });
    assert.equal(game.state(), 'PLAYING');
    assert.equal(game.elements['boot-actions'].hidden, true);
    assert.match(game.elements['step-label'].textContent, /0\/5.*임무 확인/);
    game.elements['suggestion-button'].click();
    assert.equal(game.elements.cmd.value, 'cat readme.txt');
    assert.match(game.elements['step-label'].textContent, /0\/5/);
    game.command(game.elements.cmd.value);
    assert.match(game.elements['step-label'].textContent, /1\/5.*숨김 파일 찾기/);
    assert.match(game.command('hint'), /숨김 파일 찾기/);
    assert.match(game.command('hint'), /ls -la/);
    assert.match(game.command('ls -la'), /secret_note/);
    assert.match(game.elements['step-label'].textContent, /2\/5.*비밀번호 단서 읽기/);
    game.command('su admin');
    assert.match(game.command('$PASS'), /Authentication failure/);
    assert.match(game.command('cat .secret_note'), /easyadmin/);
    game.command('su admin');
    assert.match(game.command('incorrect'), /Authentication failure/);
    assert.equal(game.state(), 'PLAYING');
    game.command('su admin');
    game.elements['suggestion-button'].click();
    assert.equal(game.elements.cmd.value, '$PASS');
    game.command(game.elements.cmd.value);
    game.command('/sbin/sys_unlock');
    assert.equal(game.state(), 'WON');
    game.command('reboot');
    assert.equal(game.state(), 'BOOT_MENU');
    assert.equal(game.elements['boot-actions'].hidden, false);
}

{
    const game = createGame();
    game.command('2');
    assert.match(game.command('cat /etc/admin_config.txt'), /root2026/);
    unlockWithPassword(game, 'root2026');
}

{
    const game = createGame();
    game.command('3');
    const decoded = game.command("cat /var/backups/admin_pass.crypt | base64 -d | tr 'A-Za-z' 'N-ZA-Mn-za-m'").match(/SECRETKEY\d+/)[0];
    unlockWithPassword(game, decoded);
}

{
    const game = createGame();
    game.command('4');
    assert.match(game.command('find / -name *.env*'), /\/opt\/\.env/);
    const salt = game.command('cat /opt/.env').match(/HASH_SALT=(\w+)/)[1];
    game.elements['suggestion-button'].click();
    assert.match(game.elements.cmd.value, /crack --salt \$SALT/);
    const suggestedCrack = game.elements.cmd.value;
    assert.match(game.command('crack --salt wrong --wordlist /usr/share/wordlists/rockyou.txt /tmp/shadow.bak'), /일치하지 않습니다/);
    assert.match(game.command('crack --salt ' + salt + ' --wordlist /home/guest/readme.txt /tmp/shadow.bak'), /찾지 못했습니다/);
    assert.match(game.command(suggestedCrack), /apple123/);
    unlockWithPassword(game, '$PASS');
}

{
    const game = createGame();
    game.command('5');
    const port = game.command('netstat -tuln').match(/127\.0\.0\.1:(\d+)/)[1];
    const secret = game.command('cat /opt/api/config.js').match(/jwt_secret: '([^']+)'/)[1];
    game.elements['suggestion-button'].click();
    assert.equal(game.elements.cmd.value, 'jwt-forge --role=admin --secret=$SECRET');
    game.command('jwt-forge --role=admin --secret=wrong');
    assert.match(game.command('curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:' + port + '/unlock'), /Invalid token/);
    assert.equal(game.state(), 'PLAYING');
    game.command('jwt-forge --role=user --secret=' + secret);
    assert.match(game.command('curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:' + port + '/unlock'), /Invalid token/);
    assert.equal(game.state(), 'PLAYING');
    game.command('jwt-forge --role=admin --secret=$SECRET');
    game.elements['suggestion-button'].click();
    assert.match(game.elements.cmd.value, /\$PORT\/unlock$/);
    game.command(game.elements.cmd.value);
    assert.equal(game.state(), 'WON');
}

{
    const game = createGame();
    game.command('6');
    game.command('/usr/bin/vuln_prog ' + 'A'.repeat(41));
    assert.match(game.command('pwd'), /\n\/root$/);
    game.command('/sbin/sys_unlock');
    assert.equal(game.state(), 'WON');
}

console.log('Hacking game: six complete playthroughs and failure paths passed');

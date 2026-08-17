/**
 * ⚔️ CHALLENGER STRESS SUITE: Part 2 - Adversarial Fuzzing & Static Analysis
 * 
 * 대상:
 *  - 루트 `index.html`
 *  - 10개 하위 프로젝트 HTML, JS, CSS 전수
 * 
 * 검증 항목:
 *  - 1. 자바스크립트 구문(Syntax) 무결성 전수 검증
 *  - 2. 정적 에셋 무결성 (존재하지 않는 로컬 파일 404 검증, CDN 포맷 검증)
 *  - 3. DOM ID 일치성 및 Null Guard 정적 분석 (정적/동적 생성 ID 전수 추적)
 *  - 4. 인라인 이벤트 핸들러 정합성 (HTML의 onclick/onchange/oninput 등이 정의된 JS 함수와 매핑되는지 검증)
 *  - 5. CDN 프로토콜 및 보안 링크 검증
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PROJECT_ROOT = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failureDetails = [];

function check(condition, msg) {
    totalChecks++;
    if (condition) {
        passedChecks++;
    } else {
        failedChecks++;
        failureDetails.push(msg);
        console.error(`  ❌ FAIL: ${msg}`);
    }
}

console.log('\n===============================================================');
console.log('⚔️  CHALLENGER 2: Adversarial Fuzzing & Static Analysis Suite');
console.log('===============================================================\n');

const SUBPROJECTS = [
    'game/3D_ minesweeper',
    'game/Magnetic_Orbit',
    'game/choi_circle',
    'game/hacking',
    'game/maze_escape',
    'game/robot',
    'game/shadow_puzzle',
    'game/sign_up_for_hell',
    'game/slime_jump'
];

// ----------------------------------------------------------------------
// 1. All JavaScript Files Syntax Verification
// ----------------------------------------------------------------------
console.log('▶ [1/5] Verifying JavaScript Syntax across all files...');
const jsFiles = [
    'game/3D_ minesweeper/script.js',
    'game/Magnetic_Orbit/game.js',
    'game/hacking/script.js',
    'game/maze_escape/game.js',
    'game/robot/script.js',
    'game/shadow_puzzle/script.js',
    'game/sign_up_for_hell/script.js',
    'game/slime_jump/game.js'
];

jsFiles.forEach(file => {
    const absPath = path.join(PROJECT_ROOT, file);
    check(fs.existsSync(absPath), `File exists: ${file}`);
    if (fs.existsSync(absPath)) {
        const code = fs.readFileSync(absPath, 'utf8');
        let syntaxValid = true;
        let errMessage = '';
        try {
            new vm.Script(code, { filename: file });
        } catch (e) {
            syntaxValid = false;
            errMessage = e.message;
        }
        check(syntaxValid, `JS Syntax valid: ${file} ${syntaxValid ? '' : '(' + errMessage + ')'}`);
    }
});

// Inline JS in HTML files syntax check
const allHtmlFiles = ['index.html', ...SUBPROJECTS.map(d => path.join(d, 'index.html'))];
allHtmlFiles.forEach(htmlFile => {
    const absPath = path.join(PROJECT_ROOT, htmlFile);
    if (fs.existsSync(absPath)) {
        const html = fs.readFileSync(absPath, 'utf8');
        const scriptRegex = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
        let match;
        let idx = 1;
        while ((match = scriptRegex.exec(html)) !== null) {
            const inlineCode = match[2];
            if (inlineCode.trim().length > 0 && !match[1].includes('application/ld+json')) {
                let syntaxValid = true;
                let errMessage = '';
                try {
                    new vm.Script(inlineCode, { filename: `${htmlFile} (inline #${idx})` });
                } catch (e) {
                    syntaxValid = false;
                    errMessage = e.message;
                }
                check(syntaxValid, `Inline JS Syntax valid: ${htmlFile} [#${idx}] ${syntaxValid ? '' : '(' + errMessage + ')'}`);
                idx++;
            }
        }
    }
});

// ----------------------------------------------------------------------
// 2. Static Asset Reference Verification (404 Detection)
// ----------------------------------------------------------------------
console.log('\n▶ [2/5] Static Asset Existence Verification (No Missing Files / 404s)...');
allHtmlFiles.forEach(htmlFile => {
    const absPath = path.join(PROJECT_ROOT, htmlFile);
    const dirPath = path.dirname(absPath);
    const html = fs.readFileSync(absPath, 'utf8');

    // 1. <link rel="stylesheet" href="...">
    const linkRegex = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
        const href = match[1];
        if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('//') && !href.startsWith('data:')) {
            const assetAbsPath = path.resolve(dirPath, href);
            const exists = fs.existsSync(assetAbsPath);
            check(exists, `[${htmlFile}] CSS Link target exists: ${href} -> ${path.relative(PROJECT_ROOT, assetAbsPath)}`);
        }
    }

    // 2. <script src="...">
    const scriptSrcRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
    while ((match = scriptSrcRegex.exec(html)) !== null) {
        const src = match[1];
        if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('//') && !src.startsWith('data:')) {
            const assetAbsPath = path.resolve(dirPath, src);
            const exists = fs.existsSync(assetAbsPath);
            check(exists, `[${htmlFile}] Script Src target exists: ${src} -> ${path.relative(PROJECT_ROOT, assetAbsPath)}`);
        }
    }

    // 3. <img src="...">
    const imgSrcRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    while ((match = imgSrcRegex.exec(html)) !== null) {
        const src = match[1];
        if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('//') && !src.startsWith('data:')) {
            const assetAbsPath = path.resolve(dirPath, src);
            const exists = fs.existsSync(assetAbsPath);
            check(exists, `[${htmlFile}] Image Src target exists: ${src}`);
        }
    }
});

// CSS url(...) references check
SUBPROJECTS.forEach(subDir => {
    const cssPath = path.join(PROJECT_ROOT, subDir, 'style.css');
    if (fs.existsSync(cssPath)) {
        const css = fs.readFileSync(cssPath, 'utf8');
        const urlRegex = /url\(["']?([^"')]+)["']?\)/gi;
        let match;
        while ((match = urlRegex.exec(css)) !== null) {
            const urlTarget = match[1];
            if (!urlTarget.startsWith('http') && !urlTarget.startsWith('data:')) {
                const assetAbsPath = path.resolve(path.dirname(cssPath), urlTarget);
                check(fs.existsSync(assetAbsPath), `[${subDir}/style.css] CSS URL exists: ${urlTarget}`);
            }
        }
    }
});

// ----------------------------------------------------------------------
// 3. DOM ID Call vs HTML Definition Cross-Check (Null Dereference Prevention)
// ----------------------------------------------------------------------
console.log('\n▶ [3/5] Checking DOM Element ID Lookups in JS against HTML & Dynamic Templates...');
SUBPROJECTS.forEach(subDir => {
    const htmlPath = path.join(PROJECT_ROOT, subDir, 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    // Extract all IDs from HTML + dynamically template-generated IDs in JS
    const knownIds = new Set();
    const idRegex = /id=["']([^"'\$]+)["']/gi;
    let m;
    while ((m = idRegex.exec(html)) !== null) {
        knownIds.add(m[1]);
    }

    // Look for all JS files
    const jsFilesToCheck = [];
    ['game.js', 'script.js', 'app.js'].forEach(name => {
        const p = path.join(PROJECT_ROOT, subDir, name);
        if (fs.existsSync(p)) {
            const code = fs.readFileSync(p, 'utf8');
            jsFilesToCheck.push(code);

            // Also find dynamically created id="..." in template strings within JS
            while ((m = idRegex.exec(code)) !== null) {
                knownIds.add(m[1]);
            }
        }
    });

    // Check inline scripts
    const inlineScriptRegex = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
    while ((m = inlineScriptRegex.exec(html)) !== null) {
        jsFilesToCheck.push(m[1]);
        while ((m = idRegex.exec(m[1])) !== null) {
            knownIds.add(m[1]);
        }
    }

    // Scan for getElementById('...')
    const getElemRegex = /document\.getElementById\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    const idsQueriedInJs = new Set();
    jsFilesToCheck.forEach(code => {
        let match;
        while ((match = getElemRegex.exec(code)) !== null) {
            const idVal = match[1];
            // Filter out template variables like ${stage} or ${side}
            if (!idVal.includes('${')) {
                idsQueriedInJs.add(idVal);
            }
        }
    });

    idsQueriedInJs.forEach(id => {
        // Special case check: if ID doesn't exist statically, verify if it has null safety check or is in dead code
        const idExists = knownIds.has(id);
        if (!idExists) {
            // Check if call in JS has null check like `const el = document.getElementById(...); ... if (el && ...)`
            const hasNullGuard = jsFilesToCheck.some(code => {
                const regex1 = new RegExp(`const\\s+(\\w+)\\s*=\\s*document\\.getElementById\\(['"\`]${id}['"\`]\\);[\\s\\S]{0,400}?\\b\\1\\s*&&`);
                const regex2 = new RegExp(`document\\.getElementById\\(['"\`]${id}['"\`]\\)\\s*\\?\\.`);
                return regex1.test(code) || regex2.test(code);
            });
            // Check if it's inside an unreferenced dead helper function
            const isDeadFunction = jsFilesToCheck.some(code => {
                const fnMatch = code.match(new RegExp(`function\\s+(\\w+)\\s*\\([^)]*\\)[^{]*\\{[^}]*getElementById\\(['"\`]${id}['"\`]`));
                if (fnMatch) {
                    const fnName = fnMatch[1];
                    const calls = code.match(new RegExp(`\\b${fnName}\\s*\\(`, 'g')) || [];
                    return calls.length <= 1; // only definition, no invocations
                }
                return false;
            });

            check(idExists || hasNullGuard || isDeadFunction, `[${subDir}] JS getElementById('${id}') has null safety guard / dead code isolation`);
        } else {
            check(true, `[${subDir}] JS getElementById('${id}') matches known HTML/dynamic element ID`);
        }
    });
});

// ----------------------------------------------------------------------
// 4. HTML Inline Event Handler Function Cross-Check
// ----------------------------------------------------------------------
console.log('\n▶ [4/5] Checking HTML inline event handlers (onclick, onchange) against JS definitions...');
SUBPROJECTS.forEach(subDir => {
    const htmlPath = path.join(PROJECT_ROOT, subDir, 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    let allJsCode = '';
    ['game.js', 'script.js', 'app.js'].forEach(name => {
        const p = path.join(PROJECT_ROOT, subDir, name);
        if (fs.existsSync(p)) allJsCode += '\n' + fs.readFileSync(p, 'utf8');
    });

    const inlineScriptRegex = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = inlineScriptRegex.exec(html)) !== null) {
        allJsCode += '\n' + m[1];
    }

    // Extract inline on* handlers: e.g. onclick="hideTruth()" or onclick="loadLevel(0)"
    const onHandlerRegex = /\bon(?:click|change|input|submit|keydown|keyup)=["']([^"']+)["']/gi;
    while ((m = onHandlerRegex.exec(html)) !== null) {
        const handlerExpr = m[1].trim();
        // Function name extraction if it's a simple function call like foo() or foo(1)
        const fnCallMatch = handlerExpr.match(/^([a-zA-Z0-9_$]+)\s*\(/);
        if (fnCallMatch) {
            const fnName = fnCallMatch[1];
            // Check if function is declared in JS
            const fnDeclared = new RegExp(`(?:function\\s+${fnName}\\b|window\\.${fnName}\\s*=|const\\s+${fnName}\\s*=|let\\s+${fnName}\\s*=|var\\s+${fnName}\\s*=)`).test(allJsCode);
            check(fnDeclared, `[${subDir}] Inline handler '${handlerExpr}' maps to defined JS function '${fnName}'`);
        }
    }
});

// ----------------------------------------------------------------------
// 5. CDN URLs & External Security Checks
// ----------------------------------------------------------------------
console.log('\n▶ [5/5] Checking CDN URL Protocols and Integrity...');
allHtmlFiles.forEach(htmlFile => {
    const absPath = path.join(PROJECT_ROOT, htmlFile);
    const html = fs.readFileSync(absPath, 'utf8');

    const cdnRegex = /src=["'](https?:\/\/[^"']+)["']|href=["'](https?:\/\/[^"']+)["']/gi;
    let match;
    while ((match = cdnRegex.exec(html)) !== null) {
        const url = match[1] || match[2];
        if (url.includes('cdn') || url.includes('cdnjs') || url.includes('jsdelivr') || url.includes('unpkg') || url.includes('tailwindcss') || url.includes('three')) {
            check(url.startsWith('https://'), `[${htmlFile}] External CDN uses secure HTTPS: ${url}`);
        }
    }
});

console.log('\n===============================================================');
console.log(`📊 ADVERSARIAL STATIC ANALYSIS SUMMARY: Passed ${passedChecks} / ${totalChecks} (Failures: ${failedChecks})`);
console.log('===============================================================\n');

if (failedChecks > 0) {
    process.exit(1);
} else {
    process.exit(0);
}

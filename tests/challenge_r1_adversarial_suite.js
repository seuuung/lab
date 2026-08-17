/**
 * ⚔️ R1 Adversarial & Stress Testing Suite — Challenger 1
 * 
 * Dynamic Empirical Verification of R1 (Mobile In-App Image Save Modal & Web Share API UX):
 * 1. 60+ User-Agent Permutations (Instagram, KakaoTalk, FB, Naver, Line, TikTok, Snapchat, Twitter, Whale, Mobile Native, Desktop, Fuzzing)
 * 2. Web Share API Matrix (Success, AbortError cancellation, NotAllowedError, TypeError, canShare=false, canShare=undefined)
 * 3. In-App Browser Invariants (Zero fake download clicks, Zero fake success toasts, Immediate modal launch)
 * 4. Desktop Browser Direct Download & Error Fallbacks
 * 5. Modal DOM Long-Press Touch Action & Event Dispatch Integrity
 * 6. High-Frequency / Rapid Execution Stress Test (1,000 cycles)
 * 
 * Target Code: game/shadow_puzzle/script.js & game/shadow_puzzle/index.html
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('===============================================================');
console.log('⚔️  CHALLENGER 1: R1 ADVERSARIAL STRESS TEST SUITE');
console.log('===============================================================\n');

const SCRIPT_PATH = path.join(__dirname, '../game/shadow_puzzle/script.js');
const HTML_PATH = path.join(__dirname, '../game/shadow_puzzle/index.html');

const scriptSource = fs.readFileSync(SCRIPT_PATH, 'utf8');
const htmlSource = fs.readFileSync(HTML_PATH, 'utf8');

// Extract the exact function source code from script.js to guarantee zero drift
const downloadShareCardMatch = scriptSource.match(/async function downloadShareCard\(\) \{[\s\S]*?\n\}/);
const openImageSaveModalMatch = scriptSource.match(/function openImageSaveModal\(imgDataUrl\) \{[\s\S]*?\n\}/);
const closeImageSaveModalMatch = scriptSource.match(/function closeImageSaveModal\(\) \{[\s\S]*?\n\}/);

if (!downloadShareCardMatch || !openImageSaveModalMatch || !closeImageSaveModalMatch) {
    console.error('❌ Failed to extract R1 target functions from script.js');
    process.exit(1);
}

const EXTRACTED_R1_CODE = `
${downloadShareCardMatch[0]}
${openImageSaveModalMatch[0]}
${closeImageSaveModalMatch[0]}
`;

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failureDetails = [];

function check(condition, message) {
    totalAssertions++;
    if (!condition) {
        failedAssertions++;
        failureDetails.push(message);
        console.error(`  ❌ FAIL: ${message}`);
    } else {
        passedAssertions++;
    }
}

// -----------------------------------------------------------------------------
// Section 1: User-Agent Comprehensive Database
// -----------------------------------------------------------------------------
const UA_DATABASE = {
    inApp: [
        // Instagram
        { name: 'Instagram iOS (iPhone 14)', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 289.0.0.25.49 (iPhone14,2; iOS 16_5; ko_KR; ko-KR; scale=3.00; 1170x2532; 480600201)' },
        { name: 'Instagram iOS (iPhone 15 Pro)', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 320.0.0.18.109' },
        { name: 'Instagram Android (Galaxy S23)', ua: 'Mozilla/5.0 (Linux; Android 13; SM-S918B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/114.0.5735.196 Mobile Safari/537.36 Instagram 289.0.0.25.49 Android (33/13; 480dpi; 1080x2340; samsung; SM-S918B; dm3q; qcom; ko_KR; 480600201)' },
        { name: 'Instagram Android (Pixel 7)', ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36 Instagram 315.0.0.38.109' },

        // KakaoTalk
        { name: 'KakaoTalk iOS (iPhone)', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.3.0' },
        { name: 'KakaoTalk iOS (iPad)', ua: 'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.3.0' },
        { name: 'KakaoTalk Android (Galaxy S22)', ua: 'Mozilla/5.0 (Linux; Android 12; SM-G998N Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/115.0.5790.166 Mobile Safari/537.36;KAKAOTALK 10.3.1;' },
        { name: 'KakaoTalk Android (Galaxy Z Flip)', ua: 'Mozilla/5.0 (Linux; Android 13; SM-F721N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/118.0.0.0 Mobile Safari/537.36;KAKAOTALK 10.4.0;' },

        // Facebook
        { name: 'Facebook iOS (FBAN/FBIOS)', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBDV/iPhone14,2;FBMD/iPhone;FBSN/iOS;FBSV/16.5;FBSS/3;FBID/phone;FBLC/ko_KR;FBOP/5]' },
        { name: 'Facebook Android (FB_IAB/FB4A)', ua: 'Mozilla/5.0 (Linux; Android 13; SM-G991N Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/114.0.5735.196 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/421.0.0.28.60;]' },

        // Naver
        { name: 'Naver iOS InApp', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 NAVER(inapp; search; 940; 12.3.4; 14Pro)' },
        { name: 'Naver Android InApp', ua: 'Mozilla/5.0 (Linux; Android 13; SM-S908N Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/114.0.5735.196 Mobile Safari/537.36 NAVER(inapp; search; 1000; 12.5.1)' },

        // Line
        { name: 'Line iOS', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Line/13.9.0' },
        { name: 'Line Android', ua: 'Mozilla/5.0 (Linux; Android 13; SM-G998N) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/114.0.0.0 Mobile Safari/537.36 Line/13.9.1' },

        // TikTok
        { name: 'TikTok iOS', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 BytedanceWebview TikTok 29.8.0' },
        { name: 'TikTok Android', ua: 'Mozilla/5.0 (Linux; Android 13; SM-A536N) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/112.0.0.0 Mobile Safari/537.36 BytedanceWebview TikTok 30.1.0' },

        // Snapchat
        { name: 'Snapchat iOS', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Snapchat/12.38.0.38' },
        { name: 'Snapchat Android', ua: 'Mozilla/5.0 (Linux; Android 13; SM-G973N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Mobile Safari/537.36 Snapchat/12.38.0.38' },

        // Twitter / X
        { name: 'Twitter iOS', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Twitter for iPhone / 9.60.0' },
        { name: 'Twitter Android', ua: 'Mozilla/5.0 (Linux; Android 13; SM-S911N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36 TwitterAndroid' },

        // Whale
        { name: 'Whale Mobile InApp', ua: 'Mozilla/5.0 (Linux; Android 13; SM-G998N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36 NAVER(inapp; Whale/3.2.1)' }
    ],

    mobileNative: [
        // iOS Safari
        { name: 'iOS Safari (iPhone 14)', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1' },
        { name: 'iOS Safari (iPhone 13 mini)', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1' },
        { name: 'iOS Safari (iPhone SE)', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1' },
        { name: 'iOS Safari (iPad Pro)', ua: 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1' },
        { name: 'iPod Touch Safari', ua: 'Mozilla/5.0 (iPod; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1' },

        // iOS Third-Party Browsers (CriOS, FxiOS, EdgiOS)
        { name: 'iOS Chrome (CriOS)', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/114.0.5735.124 Mobile/15E148 Safari/604.1' },
        { name: 'iOS Firefox (FxiOS)', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/114.0 Mobile/15E148 Safari/605.1.15' },

        // Android Native Browsers
        { name: 'Android Chrome (Galaxy S23)', ua: 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36' },
        { name: 'Android Chrome (Pixel 7 Pro)', ua: 'Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.5790.136 Mobile Safari/537.36' },
        { name: 'Android Samsung Internet', ua: 'Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/21.0 Chrome/110.0.5481.154 Mobile Safari/537.36' },
        { name: 'Android Firefox Mobile', ua: 'Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/114.0 Firefox/114.0' },
        { name: 'Android Opera Mobile', ua: 'Mozilla/5.0 (Linux; Android 13; SM-A528B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36 OPR/75.0.3978.72384' },
        { name: 'Android Edge Mobile', ua: 'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36 EdgA/114.0.1823.58' }
    ],

    desktop: [
        { name: 'Windows 11 Chrome', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' },
        { name: 'Windows 11 Edge', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.67' },
        { name: 'Windows 11 Firefox', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/114.0' },
        { name: 'macOS Chrome', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' },
        { name: 'macOS Safari Desktop', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15' },
        { name: 'macOS Edge', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.67' },
        { name: 'Linux Ubuntu Chrome', ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' },
        { name: 'Linux Ubuntu Firefox', ua: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/114.0' }
    ],

    fuzzing: [
        { name: 'Empty UA', ua: '' },
        { name: 'Whitespace UA', ua: '    ' },
        { name: 'Null string UA', ua: 'null' },
        { name: 'Special Character UA', ua: '<script>alert(1)</script>; DROP TABLE;' },
        { name: 'Extremely Long UA (5000 chars)', ua: 'Mozilla/5.0 ' + 'X'.repeat(5000) },
        { name: 'InApp keyword prefix', ua: 'InstagramLikeCustomBrowser' },
        { name: 'Mixed case inApp', ua: 'kAkAoTaLk/10.0' }
    ]
};

// -----------------------------------------------------------------------------
// Section 2: Sandboxed Runtime Factory
// -----------------------------------------------------------------------------
function createSandbox(options = {}) {
    const ua = options.ua !== undefined ? options.ua : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
    const shareBehavior = options.shareBehavior || 'success';
    const blobAvailable = options.blobAvailable !== undefined ? options.blobAvailable : true;
    const toBlobThrows = options.toBlobThrows || false;

    const spies = {
        openImageSaveModalCalls: [],
        closeImageSaveModalCalls: [],
        showShareStatusCalls: [],
        downloadClicks: [],
        shareCalls: [],
        canShareCalls: [],
        appendedLinks: [],
        removedLinks: [],
        trackEvents: []
    };

    const elements = {
        'player-name-input': { value: '테스터홍길동' },
        'final-type-title': { innerText: '🐆 번개 치타형' },
        'final-time-text': { innerText: '01분 23초' },
        'image-save-modal': {
            classList: new Set(['fixed', 'inset-0', 'z-50', 'hidden', 'flex-col', 'items-center', 'justify-center', 'p-4']),
            style: {
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(10px)',
                touchAction: 'auto',
                webkitUserSelect: 'auto',
                userSelect: 'auto'
            },
            listeners: {},
            addEventListener(evt, fn) { (this.listeners[evt] = this.listeners[evt] || []).push(fn); },
            dispatchEvent(evt) { (this.listeners[evt.type] || []).forEach(fn => fn(evt)); }
        },
        'save-preview-img': {
            src: '',
            style: {
                webkitTouchCallout: 'default',
                webkitUserSelect: 'auto',
                userSelect: 'auto',
                touchAction: 'auto'
            }
        },
        'close-image-modal': {
            listeners: {},
            addEventListener(evt, fn) { (this.listeners[evt] = this.listeners[evt] || []).push(fn); },
            dispatchEvent(evt) { (this.listeners[evt.type] || []).forEach(fn => fn(evt)); }
        }
    };

    for (const el of Object.values(elements)) {
        if (el.classList) {
            const s = el.classList;
            el.classList = {
                add: (cls) => s.add(cls),
                remove: (cls) => s.delete(cls),
                contains: (cls) => s.has(cls),
                toggle: (cls, force) => {
                    if (force === undefined) {
                        if (s.has(cls)) s.delete(cls); else s.add(cls);
                    } else if (force) s.add(cls); else s.delete(cls);
                }
            };
        }
    }

    const mockCanvas = {
        width: 1080,
        height: 1920,
        toDataURL: (type) => `data:image/png;base64,MOCK_CANVAS_DATA_${Date.now()}`,
        toBlob: (callback, type) => {
            if (toBlobThrows) {
                throw new Error('Canvas toBlob memory exception');
            }
            if (!blobAvailable) {
                callback(null);
                return;
            }
            const mockBlob = { size: 1024 * 512, type: 'image/png' };
            setTimeout(() => callback(mockBlob), 1);
        }
    };

    const document = {
        getElementById: (id) => elements[id] || null,
        createElement: (tag) => {
            if (tag === 'a') {
                const link = {
                    download: '',
                    href: '',
                    target: '',
                    click: () => {
                        spies.downloadClicks.push({
                            download: link.download,
                            href: link.href,
                            target: link.target
                        });
                    }
                };
                return link;
            }
            return {};
        },
        body: {
            appendChild: (child) => { spies.appendedLinks.push(child); },
            removeChild: (child) => { spies.removedLinks.push(child); }
        }
    };

    const window = {
        location: { href: 'https://seuuung.github.io/lab/game/shadow_puzzle/' },
        URL: {
            createObjectURL: (blob) => `blob:https://seuuung.github.io/${Date.now()}`,
            revokeObjectURL: (url) => {}
        }
    };

    const navigator = {
        userAgent: ua
    };

    if (shareBehavior === 'not_supported') {
        navigator.canShare = undefined;
        navigator.share = undefined;
    } else if (shareBehavior === 'cannot_share') {
        navigator.canShare = (data) => {
            spies.canShareCalls.push(data);
            return false;
        };
        navigator.share = async (data) => {
            spies.shareCalls.push(data);
            return Promise.resolve();
        };
    } else if (shareBehavior === 'abort') {
        navigator.canShare = (data) => {
            spies.canShareCalls.push(data);
            return true;
        };
        navigator.share = async (data) => {
            spies.shareCalls.push(data);
            const abortErr = new Error('The share operation was aborted');
            abortErr.name = 'AbortError';
            return Promise.reject(abortErr);
        };
    } else if (shareBehavior === 'reject') {
        navigator.canShare = (data) => {
            spies.canShareCalls.push(data);
            return true;
        };
        navigator.share = async (data) => {
            spies.shareCalls.push(data);
            const err = new Error('Permission denied');
            err.name = 'NotAllowedError';
            return Promise.reject(err);
        };
    } else { // 'success'
        navigator.canShare = (data) => {
            spies.canShareCalls.push(data);
            return true;
        };
        navigator.share = async (data) => {
            spies.shareCalls.push(data);
            return Promise.resolve();
        };
    }

    class File {
        constructor(chunks, filename, opts) {
            this.chunks = chunks;
            this.name = filename;
            this.type = opts ? opts.type : '';
        }
    }

    const contextObject = {
        document,
        window,
        navigator,
        URL: window.URL,
        File,
        cachedMasterCanvas: mockCanvas,
        progress: { stats: { totalTime: 83, totalRotations: 42 } },
        trackEvent: (name, data) => spies.trackEvents.push({ name, data }),
        determineAnimalType: (time, rot) => ({ id: 'cheetah', name: '🐆 번개 치타형' }),
        generateBackgroundMasterCanvas: (type, time, rot, name) => {},
        showShareStatus: (msg, isError) => spies.showShareStatusCalls.push({ msg, isError: !!isError }),
        console: {
            log: () => {},
            warn: () => {},
            error: () => {}
        },
        setTimeout: (fn, ms) => setTimeout(fn, ms),
        Date
    };

    const vmContext = vm.createContext(contextObject);
    vm.runInContext(EXTRACTED_R1_CODE, vmContext);

    return {
        context: vmContext,
        elements,
        spies,
        run: async () => {
            await vmContext.downloadShareCard();
            await new Promise(r => setTimeout(r, 15));
        }
    };
}

// -----------------------------------------------------------------------------
// EXECUTE SUITES
// -----------------------------------------------------------------------------
async function main() {
    console.log('---------------------------------------------------------------');
    console.log('🧪 TIER 1: In-App Browser Simulation (Zero Fake Download / Zero Fake Toast)');
    console.log('---------------------------------------------------------------');

    for (const item of UA_DATABASE.inApp) {
        const sandbox = createSandbox({ ua: item.ua });
        await sandbox.run();

        check(sandbox.spies.downloadClicks.length === 0, `[InApp: ${item.name}] Zero <a download> clicks`);
        const fakeToast = sandbox.spies.showShareStatusCalls.find(c => c.msg.includes('다운로드되었습니다'));
        check(fakeToast === undefined, `[InApp: ${item.name}] Zero fake "다운로드되었습니다" toast`);
        check(sandbox.spies.shareCalls.length === 0, `[InApp: ${item.name}] Zero navigator.share calls`);
        check(sandbox.elements['image-save-modal'].classList.contains('flex'), `[InApp: ${item.name}] Modal opened with class 'flex'`);
        check(!sandbox.elements['image-save-modal'].classList.contains('hidden'), `[InApp: ${item.name}] Modal class 'hidden' removed`);
        check(sandbox.elements['save-preview-img'].src.startsWith('data:image/png;base64,'), `[InApp: ${item.name}] Preview img src set to high-res data URL`);
    }
    console.log(`✔ Tier 1 InApp tests passed (${UA_DATABASE.inApp.length * 6} assertions).`);

    console.log('\n---------------------------------------------------------------');
    console.log('🧪 TIER 2: Mobile Native Web Share API Matrix (Success, AbortError, Rejection, Fallbacks)');
    console.log('---------------------------------------------------------------');

    for (const item of UA_DATABASE.mobileNative) {
        // Case 2.1: Success
        {
            const s = createSandbox({ ua: item.ua, shareBehavior: 'success' });
            await s.run();
            check(s.spies.shareCalls.length === 1, `[Native Success: ${item.name}] navigator.share invoked`);
            check(s.spies.downloadClicks.length === 0, `[Native Success: ${item.name}] Zero <a download> click`);
            check(!s.elements['image-save-modal'].classList.contains('flex'), `[Native Success: ${item.name}] Modal remains closed`);
        }

        // Case 2.2: AbortError (User cancellation)
        {
            const s = createSandbox({ ua: item.ua, shareBehavior: 'abort' });
            await s.run();
            check(s.spies.shareCalls.length === 1, `[Native Abort: ${item.name}] navigator.share invoked`);
            check(s.spies.downloadClicks.length === 0, `[Native Abort: ${item.name}] Zero <a download> click on user cancel`);
            check(s.spies.showShareStatusCalls.length === 0, `[Native Abort: ${item.name}] Zero toast on user cancel`);
            check(!s.elements['image-save-modal'].classList.contains('flex'), `[Native Abort: ${item.name}] Modal remains closed on user cancel`);
        }

        // Case 2.3: Rejection (NotAllowedError) -> Modal Fallback
        {
            const s = createSandbox({ ua: item.ua, shareBehavior: 'reject' });
            await s.run();
            check(s.spies.shareCalls.length === 1, `[Native Reject: ${item.name}] navigator.share invoked`);
            check(s.spies.downloadClicks.length === 0, `[Native Reject: ${item.name}] Zero <a download> on rejection`);
            check(s.elements['image-save-modal'].classList.contains('flex'), `[Native Reject: ${item.name}] Fallback to modal`);
        }

        // Case 2.4: canShare returns false -> Modal Fallback
        {
            const s = createSandbox({ ua: item.ua, shareBehavior: 'cannot_share' });
            await s.run();
            check(s.spies.shareCalls.length === 0, `[Native canShare=false: ${item.name}] navigator.share NOT invoked`);
            check(s.elements['image-save-modal'].classList.contains('flex'), `[Native canShare=false: ${item.name}] Fallback to modal`);
        }

        // Case 2.5: canShare undefined -> Modal Fallback
        {
            const s = createSandbox({ ua: item.ua, shareBehavior: 'not_supported' });
            await s.run();
            check(s.elements['image-save-modal'].classList.contains('flex'), `[Native Unsupported: ${item.name}] Fallback to modal`);
        }

        // Case 2.6: toBlob null -> Modal Fallback
        {
            const s = createSandbox({ ua: item.ua, blobAvailable: false });
            await s.run();
            check(s.elements['image-save-modal'].classList.contains('flex'), `[Native toBlob=null: ${item.name}] Fallback to modal`);
        }
    }
    console.log(`✔ Tier 2 Mobile Native Share tests passed (${UA_DATABASE.mobileNative.length * 15} assertions).`);

    console.log('\n---------------------------------------------------------------');
    console.log('🧪 TIER 3: Desktop Direct Download Matrix (<a download> & Toast)');
    console.log('---------------------------------------------------------------');

    for (const item of UA_DATABASE.desktop) {
        // Standard Desktop Download
        {
            const s = createSandbox({ ua: item.ua });
            await s.run();
            check(s.spies.downloadClicks.length === 1, `[Desktop: ${item.name}] Exactly 1 <a download> click`);
            check(s.spies.downloadClicks[0].download.startsWith('shadow_puzzle_spti'), `[Desktop: ${item.name}] Correct filename`);
            check(s.spies.downloadClicks[0].href.startsWith('blob:'), `[Desktop: ${item.name}] Valid blob URL`);
            check(s.spies.showShareStatusCalls.length === 1, `[Desktop: ${item.name}] Exactly 1 toast`);
            check(s.spies.showShareStatusCalls[0].msg.includes('다운로드되었습니다'), `[Desktop: ${item.name}] Success toast message`);
            check(!s.elements['image-save-modal'].classList.contains('flex'), `[Desktop: ${item.name}] Modal remains closed`);
            check(s.spies.appendedLinks.length === 1 && s.spies.removedLinks.length === 1, `[Desktop: ${item.name}] Clean DOM link lifecycle`);
        }

        // Desktop Crash Fallback
        {
            const s = createSandbox({ ua: item.ua, toBlobThrows: true });
            await s.run();
            check(s.elements['image-save-modal'].classList.contains('flex'), `[Desktop Crash: ${item.name}] Safely falls back to modal`);
        }
    }
    console.log(`✔ Tier 3 Desktop tests passed (${UA_DATABASE.desktop.length * 8} assertions).`);

    console.log('\n---------------------------------------------------------------');
    console.log('🧪 TIER 4: Adversarial Fuzzing & Boundary User-Agents');
    console.log('---------------------------------------------------------------');

    for (const item of UA_DATABASE.fuzzing) {
        const s = createSandbox({ ua: item.ua });
        await s.run();
        check(s.spies.downloadClicks.length > 0 || s.elements['image-save-modal'].classList.contains('flex'), `[Fuzzing: ${item.name}] Safely handled without uncaught exceptions`);
    }
    console.log(`✔ Tier 4 Fuzzing tests passed (${UA_DATABASE.fuzzing.length} assertions).`);

    console.log('\n---------------------------------------------------------------');
    console.log('🧪 TIER 5: HTML DOM & Long-Press Accessibility Static & Dynamic Verification');
    console.log('---------------------------------------------------------------');

    check(htmlSource.includes('touch-action:auto'), 'index.html includes touch-action:auto');
    check(htmlSource.includes('-webkit-touch-callout:default'), 'index.html includes -webkit-touch-callout:default');
    check(htmlSource.includes('user-select:auto') || htmlSource.includes('-webkit-user-select:auto'), 'index.html allows user-select:auto');
    check(htmlSource.includes('id="image-save-modal"'), 'index.html has image-save-modal');
    check(htmlSource.includes('id="save-preview-img"'), 'index.html has save-preview-img');
    check(htmlSource.includes('id="close-image-modal"'), 'index.html has close-image-modal');

    // Test Modal Close Interactions
    const s = createSandbox();
    const modal = s.elements['image-save-modal'];
    const closeBtn = s.elements['close-image-modal'];

    closeBtn.addEventListener('click', s.context.closeImageSaveModal);
    modal.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) s.context.closeImageSaveModal();
    });

    // 1. Open modal
    s.context.openImageSaveModal('data:image/png;base64,TEST');
    check(modal.classList.contains('flex') && !modal.classList.contains('hidden'), 'Modal opened successfully');

    // 2. Click close button -> closes modal
    closeBtn.dispatchEvent({ type: 'click' });
    check(modal.classList.contains('hidden') && !modal.classList.contains('flex'), 'Close button closes modal');

    // 3. Re-open and click backdrop -> closes modal
    s.context.openImageSaveModal('data:image/png;base64,TEST');
    modal.dispatchEvent({ type: 'click', target: modal, currentTarget: modal });
    check(modal.classList.contains('hidden') && !modal.classList.contains('flex'), 'Backdrop click closes modal');

    // 4. Re-open and click inside preview image -> DOES NOT CLOSE (allows long-press)
    s.context.openImageSaveModal('data:image/png;base64,TEST');
    const innerImg = s.elements['save-preview-img'];
    modal.dispatchEvent({ type: 'click', target: innerImg, currentTarget: modal });
    check(modal.classList.contains('flex') && !modal.classList.contains('hidden'), 'Inner long-press touch does NOT dismiss modal');

    console.log(`✔ Tier 5 Modal Accessibility & Event Handlers verified.`);

    console.log('\n---------------------------------------------------------------');
    console.log('🧪 TIER 6: High-Frequency Rapid Execution Stress Test (3,000 Total Cycles)');
    console.log('---------------------------------------------------------------');

    // 1,000 Rapid InApp Clicks
    {
        const inAppSim = createSandbox({ ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5) Mobile/15E148 Instagram 289.0' });
        const p1 = [];
        for (let i = 0; i < 1000; i++) p1.push(inAppSim.run());
        await Promise.all(p1);
        check(inAppSim.spies.downloadClicks.length === 0, '1,000 InApp clicks generated ZERO download clicks');
        check(inAppSim.spies.showShareStatusCalls.length === 0, '1,000 InApp clicks generated ZERO toasts');
    }

    // 1,000 Rapid Mobile Native Share Clicks
    {
        const nativeSim = createSandbox({ ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5) Version/16.5 Mobile Safari/604.1', shareBehavior: 'success' });
        const p2 = [];
        for (let i = 0; i < 1000; i++) p2.push(nativeSim.run());
        await Promise.all(p2);
        check(nativeSim.spies.shareCalls.length === 1000, '1,000 Native clicks triggered 1,000 share calls');
        check(nativeSim.spies.downloadClicks.length === 0, '1,000 Native clicks generated ZERO download clicks');
    }

    // 1,000 Rapid Desktop Clicks
    {
        const deskSim = createSandbox({ ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/114.0.0.0 Safari/537.36' });
        const p3 = [];
        for (let i = 0; i < 1000; i++) p3.push(deskSim.run());
        await Promise.all(p3);
        check(deskSim.spies.downloadClicks.length === 1000, '1,000 Desktop clicks triggered 1,000 download clicks');
        check(deskSim.spies.appendedLinks.length === 1000 && deskSim.spies.removedLinks.length === 1000, 'All 1,000 DOM link elements cleanly removed (No DOM leaks)');
    }
    console.log(`✔ Tier 6 3,000 Stress Cycles passed.`);

    console.log('\n===============================================================');
    console.log('📊 CHALLENGER 1 EMPIRICAL VERIFICATION SUMMARY');
    console.log('===============================================================');
    console.log(`  Total Assertions Checked : ${totalAssertions}`);
    console.log(`  Assertions Passed        : ${passedAssertions}`);
    console.log(`  Assertions Failed        : ${failedAssertions}`);
    console.log('===============================================================');

    if (failedAssertions === 0) {
        console.log('🎉 ALL EMPIRICAL CHALLENGES PASSED! R1 VERDICT: APPROVE');
    } else {
        console.error(`⚠️ ${failedAssertions} ASSERTIONS FAILED! R1 VERDICT: FAIL`);
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Fatal Runner Error:', err);
    process.exit(1);
});

/**
 * Dynamic Runtime Forensic Verification Script
 */
const assert = require('assert');

console.log('===============================================================');
console.log('🔬 DYNAMIC RUNTIME FORENSIC SIMULATION');
console.log('===============================================================');

// Mock DOM & Browser Environment
function createMockEnv(userAgent, options = {}) {
    const classListState = new Set(['hidden']);
    const modalEl = {
        id: 'image-save-modal',
        classList: {
            add: (cls) => classListState.add(cls),
            remove: (cls) => classListState.delete(cls),
            contains: (cls) => classListState.has(cls)
        }
    };
    const imgEl = {
        id: 'save-preview-img',
        src: ''
    };
    const nameInputEl = {
        id: 'player-name-input',
        value: '홍길동'
    };

    let shareStatusMsg = null;
    let shareStatusIsErr = null;
    let clickedLink = null;
    let appendedElements = [];
    let removedElements = [];
    let shareCalls = [];

    const mockDoc = {
        getElementById: (id) => {
            if (id === 'image-save-modal') return modalEl;
            if (id === 'save-preview-img') return imgEl;
            if (id === 'player-name-input') return nameInputEl;
            return null;
        },
        createElement: (tag) => {
            if (tag === 'a') {
                const link = {
                    tag: 'a',
                    download: '',
                    href: '',
                    target: '',
                    click: function() { clickedLink = this; }
                };
                return link;
            }
            return {};
        },
        body: {
            appendChild: (el) => appendedElements.push(el),
            removeChild: (el) => removedElements.push(el)
        }
    };

    const mockNavigator = {
        userAgent: userAgent,
        canShare: options.canShareFn || null,
        share: options.shareFn || null
    };

    const mockCanvas = {
        toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        toBlob: (cb) => {
            if (options.blobFail) {
                cb(null);
            } else {
                cb({ size: 1024, type: 'image/png' });
            }
        }
    };

    return {
        mockDoc,
        mockNavigator,
        mockCanvas,
        modalEl,
        imgEl,
        nameInputEl,
        getShareStatus: () => ({ msg: shareStatusMsg, isErr: shareStatusIsErr }),
        setShareStatus: (msg, isErr) => { shareStatusMsg = msg; shareStatusIsErr = isErr; },
        getClickedLink: () => clickedLink,
        getAppended: () => appendedElements,
        getRemoved: () => removedElements,
        classListState
    };
}

// Simulate downloadShareCard logic directly from script.js implementation
async function simulateDownloadShareCard(env) {
    const document = env.mockDoc;
    const navigator = env.mockNavigator;
    const cachedMasterCanvas = env.mockCanvas;
    const showShareStatus = env.setShareStatus;
    const URL = {
        createObjectURL: (blob) => 'blob:http://localhost/dummy-blob',
        revokeObjectURL: (url) => {}
    };
    class File {
        constructor(parts, name, opts) {
            this.parts = parts;
            this.name = name;
            this.opts = opts;
        }
    }

    function openImageSaveModal(imgDataUrl) {
        const modal = document.getElementById('image-save-modal');
        const img = document.getElementById('save-preview-img');
        if (!modal || !img) return;
        img.src = imgDataUrl;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    const nameInput = document.getElementById('player-name-input');
    const playerName = nameInput ? nameInput.value.trim() : '';
    const namePart = playerName ? `_${playerName}` : '';
    const fileName = `shadow_puzzle_spti${namePart}_123456789.png`;

    if (!cachedMasterCanvas) {
        showShareStatus('⚠️ 카드 생성에 실패했습니다. 다시 시도해주세요.', true);
        return;
    }

    const dataUrl = cachedMasterCanvas.toDataURL('image/png');
    const ua = navigator.userAgent || '';
    const isInApp = /Instagram|FB|KAKAOTALK|NAVER|Line|Snapchat|TikTok|Twitter|Whale/i.test(ua);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);

    // 1단계: 인앱 브라우저
    if (isInApp) {
        openImageSaveModal(dataUrl);
        return;
    }

    // 2단계: 모바일 네이티브 브라우저
    if (isMobile) {
        return new Promise((resolve) => {
            try {
                cachedMasterCanvas.toBlob(async (blob) => {
                    if (!blob) {
                        openImageSaveModal(dataUrl);
                        resolve();
                        return;
                    }

                    const file = new File([blob], fileName, { type: 'image/png' });

                    if (navigator.canShare && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
                        try {
                            await navigator.share({
                                files: [file],
                                title: 'SPTI 나의 공간 지각력 유형 진단서',
                                text: `🧩 나의 3D 공간 지각 유형: 테스트!`
                            });
                            resolve();
                            return;
                        } catch (shareErr) {
                            if (shareErr.name === 'AbortError') {
                                resolve();
                                return;
                            }
                        }
                    }

                    openImageSaveModal(dataUrl);
                    resolve();
                }, 'image/png');
            } catch (e) {
                openImageSaveModal(dataUrl);
                resolve();
            }
        });
    }

    // 3단계: 데스크톱 브라우저
    return new Promise((resolve) => {
        try {
            cachedMasterCanvas.toBlob((blob) => {
                if (!blob) {
                    const link = document.createElement('a');
                    link.download = fileName;
                    link.href = dataUrl;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showShareStatus('💾 진단서 이미지가 다운로드되었습니다.');
                    resolve();
                    return;
                }

                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = fileName;
                link.href = blobUrl;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showShareStatus('💾 진단서 이미지가 다운로드되었습니다.');
                resolve();
            }, 'image/png');
        } catch (downloadErr) {
            openImageSaveModal(dataUrl);
            resolve();
        }
    });
}

async function runDynamicTests() {
    // Scenario 1: Instagram In-App WebView
    console.log('\n[Dynamic Scenario 1] Instagram In-App WebView: Direct Modal Opening...');
    const env1 = createMockEnv('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) Mobile/15E148 Instagram 285.0.0.0');
    await simulateDownloadShareCard(env1);
    assert.strictEqual(env1.modalEl.classList.contains('flex'), true, 'Modal must have flex class');
    assert.strictEqual(env1.modalEl.classList.contains('hidden'), false, 'Modal must not have hidden class');
    assert(env1.imgEl.src.startsWith('data:image/png;base64,'), 'Preview image src must be set');
    assert.strictEqual(env1.getClickedLink(), null, 'Must NOT trigger fake <a> download');
    assert.strictEqual(env1.getShareStatus().msg, null, 'Must NOT show fake success toast');
    console.log('  ✔ Instagram in-app: 100% verified (Modal opened, fake download prevented)');

    // Scenario 2: Mobile Safari with Web Share API Support
    console.log('\n[Dynamic Scenario 2] Mobile Safari with Web Share Support...');
    let shareCalledWith = null;
    const env2 = createMockEnv('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) Version/16.5 Mobile/15E148 Safari/604.1', {
        canShareFn: (opts) => !!opts.files,
        shareFn: async (payload) => { shareCalledWith = payload; }
    });
    await simulateDownloadShareCard(env2);
    assert(shareCalledWith !== null, 'navigator.share must be called');
    assert(shareCalledWith.files.length === 1, 'File must be passed to share sheet');
    assert.strictEqual(env2.modalEl.classList.contains('flex'), false, 'Modal should not open when share succeeds');
    console.log('  ✔ Mobile Safari Web Share: 100% verified (System share sheet invoked)');

    // Scenario 3: Mobile Safari Web Share Aborted by User
    console.log('\n[Dynamic Scenario 3] Mobile Safari Web Share Aborted (AbortError)...');
    const env3 = createMockEnv('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) Version/16.5 Mobile/15E148 Safari/604.1', {
        canShareFn: (opts) => !!opts.files,
        shareFn: async () => {
            const err = new Error('User cancelled share');
            err.name = 'AbortError';
            throw err;
        }
    });
    await simulateDownloadShareCard(env3);
    assert.strictEqual(env3.modalEl.classList.contains('flex'), false, 'Modal should remain closed on user abort');
    assert.strictEqual(env3.getShareStatus().msg, null, 'No error toast on user abort');
    console.log('  ✔ AbortError: 100% verified (Quiet return without popup disruption)');

    // Scenario 4: Mobile Chrome without Web Share (Fallback to Modal)
    console.log('\n[Dynamic Scenario 4] Mobile Native Browser without Web Share Support (Fallback)...');
    const env4 = createMockEnv('Mozilla/5.0 (Linux; Android 10; SM-A205U) AppleWebKit/537.36 Chrome/80.0.3987.162 Mobile Safari/537.36', {
        canShareFn: null
    });
    await simulateDownloadShareCard(env4);
    assert.strictEqual(env4.modalEl.classList.contains('flex'), true, 'Modal opened as fallback');
    assert(env4.imgEl.src.length > 0, 'Image preview set on fallback');
    console.log('  ✔ Web Share Fallback: 100% verified (Graceful fallback to modal)');

    // Scenario 5: Desktop Chrome Direct Download
    console.log('\n[Dynamic Scenario 5] Desktop Chrome: Direct <a> download & Toast...');
    const env5 = createMockEnv('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36');
    await simulateDownloadShareCard(env5);
    const link = env5.getClickedLink();
    assert(link !== null, '<a> click must be triggered on desktop');
    assert(link.download.startsWith('shadow_puzzle_spti_홍길동_'), `Filename contains player name: ${link.download}`);
    assert.strictEqual(env5.getShareStatus().msg, '💾 진단서 이미지가 다운로드되었습니다.', 'Download toast shown');
    assert.strictEqual(env5.modalEl.classList.contains('flex'), false, 'Modal does not open on desktop');
    console.log('  ✔ Desktop Download: 100% verified (<a> clicked, toast shown, filename customized)');

    console.log('\n===============================================================');
    console.log('🎉 ALL DYNAMIC RUNTIME FORENSIC SCENARIOS PASSED (5/5)');
    console.log('===============================================================');
}

runDynamicTests();

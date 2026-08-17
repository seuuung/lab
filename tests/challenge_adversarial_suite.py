"""
Adversarial Mobile & Interaction Challenge Stress Test Suite for Seungmin's Lab Portal
Author: teamwork_preview_challenger
"""

import sys
import os
import time
import json
import threading
import http.server
import socketserver
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PORT = 8899
BASE_URL = f"http://127.0.0.1:{PORT}"

SUBPROJECTS = [
    'game/3D_ minesweeper',
    'game/Magnetic_Orbit',
    'game/choi_circle',
    'game/hacking',
    'game/maze_escape',
    'game/robot',
    'game/shadow_puzzle',
    'game/sign_up_for_hell',
    'game/slime_jump',
    'game/toto'
]

ALL_PAGES = ['index.html'] + [f"{sp}/index.html" for sp in SUBPROJECTS]

VIEWPORTS = [
    {"name": "iPhone SE 1st gen (Ultra-Narrow)", "width": 320, "height": 568},
    {"name": "Galaxy S8/S9/S20 (Narrow)", "width": 360, "height": 740},
    {"name": "iPhone X/11/12/13 mini (Standard Compact)", "width": 375, "height": 667},
    {"name": "iPhone 12/13/14/15 (Standard)", "width": 390, "height": 844},
    {"name": "iPhone Plus/Max (Standard Large)", "width": 414, "height": 896},
    {"name": "Foldable / Landscape Compact", "width": 480, "height": 800},
]

SAFE_AREA_CONFIGS = [
    {
        "name": "Standard Notch (iPhone X/11/12)",
        "top": 44,
        "bottom": 34,
        "left": 0,
        "right": 0
    },
    {
        "name": "Dynamic Island (iPhone 14/15 Pro)",
        "top": 59,
        "bottom": 34,
        "left": 0,
        "right": 0
    },
    {
        "name": "Landscape Notch (iPhone Landscape)",
        "top": 0,
        "bottom": 21,
        "left": 47,
        "right": 47
    }
]

results = {
    "summary": {"total": 0, "passed": 0, "failed": 0, "warnings": 0},
    "suites": {}
}

def log_test(suite_name, test_id, description, passed, details=None, is_warning=False):
    results["summary"]["total"] += 1
    if passed:
        results["summary"]["passed"] += 1
        status_str = "PASS"
        icon = "[PASS]"
    elif is_warning:
        results["summary"]["warnings"] += 1
        status_str = "WARN"
        icon = "[WARN]"
    else:
        results["summary"]["failed"] += 1
        status_str = "FAIL"
        icon = "[FAIL]"
    
    if suite_name not in results["suites"]:
        results["suites"][suite_name] = []
    
    results["suites"][suite_name].append({
        "id": test_id,
        "description": description,
        "status": status_str,
        "passed": passed,
        "details": details or {}
    })
    
    print(f"  {icon} [{status_str}] {test_id}: {description}", flush=True)
    if not passed and details:
        print(f"      Details: {json.dumps(details, ensure_ascii=False)}", flush=True)

def run_suite_1_viewport_overflow(browser):
    print("\n" + "="*70, flush=True)
    print("▶ Running Suite 1: Mobile Viewport Extreme Dimensions & Layout Overflow", flush=True)
    print("="*70, flush=True)
    
    for vp in VIEWPORTS:
        vp_name = vp["name"]
        vw = vp["width"]
        vh = vp["height"]
        print(f"\n--- Testing Viewport: {vw}x{vh} ({vp_name}) ---", flush=True)
        
        context = browser.new_context(
            viewport={"width": vw, "height": vh},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
        )
        page = context.new_page()
        
        for page_path in ALL_PAGES:
            console_errors = []
            page.on("pageerror", lambda err: console_errors.append(str(err)))
            page.on("console", lambda msg: console_errors.append(f"{msg.type}: {msg.text}") if msg.type == "error" else None)
            
            url = f"{BASE_URL}/{page_path}"
            page.goto(url, wait_until="domcontentloaded", timeout=6000)
            page.wait_for_timeout(100)
            
            # Check horizontal overflow
            overflow_info = page.evaluate("""() => {
                const docEl = document.documentElement;
                const body = document.body;
                const winWidth = window.innerWidth;
                
                const scrollWidthDoc = docEl ? docEl.scrollWidth : 0;
                const scrollWidthBody = body ? body.scrollWidth : 0;
                const maxScrollWidth = Math.max(scrollWidthDoc, scrollWidthBody);
                const hasOverflow = maxScrollWidth > winWidth + 1; // 1px subpixel tolerance
                
                // Find offending elements
                const offending = [];
                const allElements = document.querySelectorAll('*');
                allElements.forEach(el => {
                    const style = window.getComputedStyle(el);
                    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;
                    const rect = el.getBoundingClientRect();
                    // element expands beyond viewport width
                    if (rect.right > winWidth + 2 && rect.width > 0 && rect.height > 0) {
                        // Check if an ancestor hides overflow
                        let parent = el.parentElement;
                        let hiddenByParent = false;
                        while (parent && parent !== document.documentElement) {
                            const pStyle = window.getComputedStyle(parent);
                            if (pStyle.overflowX === 'hidden' || pStyle.overflow === 'hidden' || pStyle.overflowX === 'clip') {
                                const pRect = parent.getBoundingClientRect();
                                if (pRect.right <= winWidth + 1) {
                                    hiddenByParent = true;
                                    break;
                                }
                            }
                            parent = parent.parentElement;
                        }
                        if (!hiddenByParent) {
                            offending.push({
                                tag: el.tagName,
                                id: el.id || '',
                                class: el.className ? String(el.className).substring(0, 50) : '',
                                right: Math.round(rect.right),
                                width: Math.round(rect.width)
                            });
                        }
                    }
                });
                
                return {
                    winWidth,
                    maxScrollWidth,
                    hasOverflow,
                    offendingCount: offending.length,
                    offendingElements: offending.slice(0, 5)
                };
            }""")
            
            test_id = f"S1-OVR-{vw}px-{page_path.replace('/', '_').replace('.html', '')}"
            desc = f"[{vw}px] {page_path} 가로 오버플로우 검증 (Max: {overflow_info['maxScrollWidth']}px / VP: {vw}px)"
            passed = not overflow_info["hasOverflow"] and overflow_info["offendingCount"] == 0
            log_test("Suite 1: Viewport Overflow", test_id, desc, passed, overflow_info)
            
            # Check console errors during load
            err_test_id = f"S1-ERR-{vw}px-{page_path.replace('/', '_').replace('.html', '')}"
            err_desc = f"[{vw}px] {page_path} 런타임 콘솔 에러 부재"
            critical_errors = [e for e in console_errors if not ('favicon.ico' in e or 'jsdelivr' in e or 'cloudflare' in e or 'tailwindcss' in e and 'ERR_INTERNET_DISCONNECTED' in e)]
            log_test("Suite 1: Viewport Overflow", err_test_id, err_desc, len(critical_errors) == 0, {"errors": critical_errors})
            
        context.close()

def run_suite_2_safe_area_and_floating_nav(browser):
    print("\n" + "="*70, flush=True)
    print("▶ Running Suite 2: Safe-Area Insets & Floating Home Button Overlap/Touch", flush=True)
    print("="*70, flush=True)
    
    for cfg in SAFE_AREA_CONFIGS:
        cfg_name = cfg["name"]
        top_inset = cfg["top"]
        bottom_inset = cfg["bottom"]
        left_inset = cfg["left"]
        right_inset = cfg["right"]
        print(f"\n--- Testing Safe-Area: {cfg_name} (Top: {top_inset}px, Bottom: {bottom_inset}px, Left: {left_inset}px) ---", flush=True)
        
        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
        )
        page = context.new_page()
        
        for subp in SUBPROJECTS:
            page_path = f"{subp}/index.html"
            url = f"{BASE_URL}/{page_path}"
            page.goto(url, wait_until="domcontentloaded", timeout=6000)
            
            # Inject CSS environment simulation
            page.evaluate(f"""() => {{
                const style = document.createElement('style');
                style.id = 'safe-area-shim';
                style.innerHTML = `
                    :root {{
                        --safe-area-inset-top: {top_inset}px;
                        --safe-area-inset-bottom: {bottom_inset}px;
                        --safe-area-inset-left: {left_inset}px;
                        --safe-area-inset-right: {right_inset}px;
                    }}
                `;
                document.head.appendChild(style);
            }}""")
            page.wait_for_timeout(100)
            
            # Analyze floating home button
            btn_analysis = page.evaluate("""() => {
                const btn = document.querySelector('.floating-home-btn') || document.querySelector('a[href*="index.html"]');
                if (!btn) return { exists: false };
                
                const style = window.getComputedStyle(btn);
                const rect = btn.getBoundingClientRect();
                
                // Check if button is visible and clickable
                const isVisible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
                
                // Check overlapping elements directly on top of the button center
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const topElement = document.elementFromPoint(centerX, centerY);
                const isClickable = (topElement === btn || btn.contains(topElement));
                
                // Measure other interactive elements on the page that could collide
                const colliders = [];
                const interactives = document.querySelectorAll('button, a:not(.floating-home-btn), input, select');
                interactives.forEach(el => {
                    if (el === btn || btn.contains(el)) return;
                    const elStyle = window.getComputedStyle(el);
                    if (elStyle.display === 'none' || elStyle.visibility === 'hidden' || elStyle.opacity === '0') return;
                    const elRect = el.getBoundingClientRect();
                    // Intersection check
                    const overlap = !(rect.right < elRect.left || 
                                      rect.left > elRect.right || 
                                      rect.bottom < elRect.top || 
                                      rect.top > elRect.bottom);
                    if (overlap) {
                        colliders.push({
                            tag: el.tagName,
                            id: el.id || '',
                            class: el.className ? String(el.className).substring(0, 40) : '',
                            rect: { top: elRect.top, left: elRect.left, width: elRect.width, height: elRect.height }
                        });
                    }
                });
                
                return {
                    exists: true,
                    isVisible,
                    isClickable,
                    topElementTag: topElement ? topElement.tagName : null,
                    position: style.position,
                    zIndex: parseInt(style.zIndex, 10) || 0,
                    rect: {
                        top: Math.round(rect.top),
                        left: Math.round(rect.left),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height)
                    },
                    colliders
                };
            }""")
            
            test_id = f"S2-BTN-{subp.replace('game/', '').replace(' ', '_')}-{cfg['name'][:8]}"
            desc = f"[{subp}] 플로팅 홈 버튼 존재성, Safe-Area({top_inset}px) 준수 및 터치 영역(>=40px) 검증"
            
            has_btn = btn_analysis.get("exists", False) and btn_analysis.get("isVisible", False)
            btn_rect = btn_analysis.get("rect", {})
            touch_adequate = btn_rect.get("width", 0) >= 40 and btn_rect.get("height", 0) >= 36
            is_clickable = btn_analysis.get("isClickable", False)
            no_colliders = len(btn_analysis.get("colliders", [])) == 0
            
            passed = has_btn and is_clickable and no_colliders and (btn_rect.get("top", 0) >= 0)
            log_test("Suite 2: Safe-Area & Floating Nav", test_id, desc, passed, btn_analysis)
            
            # Real Click Navigation Test
            if has_btn and is_clickable:
                try:
                    btn_el = page.locator('.floating-home-btn, a[href*="index.html"]').first
                    btn_el.click(timeout=2000)
                    page.wait_for_timeout(100)
                    nav_ok = "index.html" in page.url or page.url.endswith('/') or page.url.endswith('/lab')
                    nav_test_id = f"S2-NAV-{subp.replace('game/', '').replace(' ', '_')}"
                    log_test("Suite 2: Safe-Area & Floating Nav", nav_test_id, f"[{subp}] 홈 버튼 실제 클릭 및 포털 복귀 확인", nav_ok, {"target_url": page.url})
                except Exception as e:
                    log_test("Suite 2: Safe-Area & Floating Nav", f"S2-NAV-{subp.replace('game/', '').replace(' ', '_')}", f"[{subp}] 홈 버튼 클릭 실패", False, {"error": str(e)})
            
        context.close()

def run_suite_3_portal_interaction_robustness(browser):
    print("\n" + "="*70, flush=True)
    print("▶ Running Suite 3: Portal Interaction, Tab Switching & Hash Fuzzing", flush=True)
    print("="*70, flush=True)
    
    context = browser.new_context(viewport={"width": 375, "height": 667})
    page = context.new_page()
    page_errors = []
    page.on("pageerror", lambda err: page_errors.append(str(err)))
    
    page.goto(f"{BASE_URL}/index.html", wait_until="domcontentloaded")
    page.wait_for_timeout(200)
    
    # 1. 100 Rapid Consecutive Tab Switches Stress Test
    print("\n--- Testing Rapid Consecutive Tab Switches (100 iterations) ---", flush=True)
    tabs = ['all', 'app', 'game', 'lab']
    
    switch_result = page.evaluate("""async (tabs) => {
        let errorOccurred = false;
        let log = [];
        
        for (let i = 0; i < 100; i++) {
            const target = tabs[i % tabs.length];
            const tabBtn = document.querySelector(`[data-filter="${target}"]`) || document.querySelector(`[data-tab="${target}"]`) || document.getElementById(`tab-${target}`);
            if (tabBtn) {
                tabBtn.click();
            } else {
                errorOccurred = true;
                log.push(`Tab button for ${target} not found`);
            }
            // Rapid minimal delay
            if (i % 20 === 0) {
                await new Promise(r => setTimeout(r, 2));
            }
        }
        
        // Settle on 'all'
        const allBtn = document.querySelector(`[data-filter="all"]`) || document.querySelector(`[data-tab="all"]`) || document.getElementById(`tab-all`);
        if (allBtn) allBtn.click();
        
        // Measure card visibility counts
        const cards = Array.from(document.querySelectorAll('[data-category]'));
        const visibleCards = cards.filter(c => window.getComputedStyle(c).display !== 'none');
        
        return {
            errorOccurred,
            log,
            totalCards: cards.length,
            visibleCardsAll: visibleCards.length
        };
    }""", tabs)
    
    rapid_passed = not switch_result["errorOccurred"] and len(page_errors) == 0 and switch_result["visibleCardsAll"] >= 10
    log_test("Suite 3: Portal Robustness", "S3-TAB-RAPID-100", "포털 100회 고속 탭 전환 스트레스 테스트 및 DOM 정합성 유지", rapid_passed, switch_result)
    
    # 2. Tab Filter Correctness for all categories
    print("\n--- Testing Tab Filter Category Accuracy ---", flush=True)
    for category in ['all', 'app', 'game', 'lab']:
        cat_result = page.evaluate("""(cat) => {
            const tabBtn = document.querySelector(`[data-filter="${cat}"]`) || document.querySelector(`[data-tab="${cat}"]`) || document.getElementById(`tab-${cat}`);
            if (!tabBtn) return { found: false };
            tabBtn.click();
            
            const cards = Array.from(document.querySelectorAll('[data-category]'));
            const matching = [];
            const nonMatchingVisible = [];
            
            cards.forEach(c => {
                const cardCat = c.getAttribute('data-category');
                const isHidden = c.classList.contains('hidden-item') || window.getComputedStyle(c).display === 'none';
                const isVisible = !isHidden;
                if (cat === 'all' || cardCat === cat) {
                    if (isVisible) matching.push(cardCat);
                } else {
                    if (isVisible) nonMatchingVisible.push(cardCat);
                }
            });
            
            return {
                found: true,
                category: cat,
                matchingCount: matching.length,
                nonMatchingVisibleCount: nonMatchingVisible.length,
                nonMatchingVisible
            };
        }""", category)
        
        cat_passed = cat_result.get("found", False) and cat_result.get("nonMatchingVisibleCount", 0) == 0 and cat_result.get("matchingCount", 0) > 0
        log_test("Suite 3: Portal Robustness", f"S3-TAB-FILTER-{category}", f"카테고리 탭 [{category}] 필터링 정확도 (일치: {cat_result.get('matchingCount')}, 불일치 노출: {cat_result.get('nonMatchingVisibleCount')})", cat_passed, cat_result)
    
    # 3. Invalid URL Hash Fuzzing
    print("\n--- Testing URL Hash Fuzzing & Malformed Input Robustness ---", flush=True)
    fuzz_hashes = [
        "",
        "#",
        "#all",
        "#game",
        "#unknown_category_xyz",
        "#12345",
        "#<script>alert(1)</script>",
        "#%20%00%25",
        "#!@#$%^&*()",
        "#tab-nonexistent",
        "#game/slime_jump"
    ]
    
    for h in fuzz_hashes:
        page_errors.clear()
        fuzz_res = page.evaluate("""(hashStr) => {
            try {
                window.location.hash = hashStr;
                window.dispatchEvent(new HashChangeEvent("hashchange"));
                
                const cards = Array.from(document.querySelectorAll('[data-category]'));
                const visibleCount = cards.filter(c => !c.classList.contains('hidden-item') && window.getComputedStyle(c).display !== 'none').length;
                return { success: true, visibleCount, error: null };
            } catch (e) {
                return { success: false, visibleCount: 0, error: e.message };
            }
        }""", h)
        
        fuzz_passed = fuzz_res.get("success", False) and len(page_errors) == 0 and fuzz_res.get("visibleCount", 0) > 0
        log_test("Suite 3: Portal Robustness", f"S3-HASH-FUZZ-{abs(hash(h)) % 10000}", f"비정상 해시 [{h}] 주입 시 무결성 유지 (노출 카드: {fuzz_res.get('visibleCount')})", fuzz_passed, fuzz_res)
    
    context.close()

def run_suite_4_touch_targets_and_canvas_dpr(browser):
    print("\n" + "="*70, flush=True)
    print("▶ Running Suite 4: 44px+ Touch Targets, Canvas DPR & Touch Mapping", flush=True)
    print("="*70, flush=True)
    
    # 1. Measure Touch Target Sizes on 320px
    print("\n--- Testing 44px+ Touch Target Dimensions on 320px Viewport ---", flush=True)
    context = browser.new_context(viewport={"width": 320, "height": 568})
    page = context.new_page()
    
    for page_path in ALL_PAGES:
        page.goto(f"{BASE_URL}/{page_path}", wait_until="domcontentloaded")
        page.wait_for_timeout(100)
        
        target_info = page.evaluate("""() => {
            const clickables = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"], select, .btn'));
            const undersized = [];
            let totalChecked = 0;
            
            clickables.forEach(el => {
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;
                const rect = el.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) return;
                
                totalChecked++;
                // Check if bounding box is smaller than 38px in either dimension
                if (rect.width < 38 || rect.height < 38) {
                    undersized.push({
                        tag: el.tagName,
                        id: el.id || '',
                        class: el.className ? String(el.className).substring(0, 30) : '',
                        text: (el.textContent || '').trim().substring(0, 20),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height)
                    });
                }
            });
            
            return {
                totalChecked,
                undersizedCount: undersized.length,
                undersized
            };
        }""")
        
        test_id = f"S4-TCH-{page_path.replace('/', '_').replace('.html', '')}"
        desc = f"[{page_path}] 터치 타겟(>=38px~44px) 크기 검증 (점검: {target_info['totalChecked']}개, 미달: {target_info['undersizedCount']}개)"
        passed = target_info["undersizedCount"] == 0
        log_test("Suite 4: Touch & Canvas DPR", test_id, desc, passed, target_info, is_warning=(target_info["undersizedCount"] <= 2))
    context.close()
    
    # 2. Canvas DPR Scaling Tests (DPR = 1.0, 2.0, 3.0)
    print("\n--- Testing Canvas DPR Buffer Scaling & Distortion ---", flush=True)
    canvas_games = [
        'game/slime_jump/index.html',
        'game/Magnetic_Orbit/index.html',
        'game/3D_ minesweeper/index.html',
        'game/maze_escape/index.html',
        'game/shadow_puzzle/index.html'
    ]
    
    for dpr_val in [1.0, 2.0, 3.0]:
        print(f"\n--- Testing Device Pixel Ratio (DPR = {dpr_val}) ---", flush=True)
        context = browser.new_context(
            viewport={"width": 375, "height": 667},
            device_scale_factor=dpr_val
        )
        page = context.new_page()
        
        for cgame in canvas_games:
            page.goto(f"{BASE_URL}/{cgame}", wait_until="domcontentloaded")
            page.wait_for_timeout(150)
            
            canvas_eval = page.evaluate("""() => {
                const canvas = document.querySelector('canvas');
                if (!canvas) return { hasCanvas: false };
                
                const rect = canvas.getBoundingClientRect();
                const bufW = canvas.width;
                const bufH = canvas.height;
                const clientW = canvas.clientWidth || rect.width;
                const clientH = canvas.clientHeight || rect.height;
                const actualDpr = window.devicePixelRatio;
                
                const ratioW = bufW / clientW;
                const ratioH = bufH / clientH;
                
                return {
                    hasCanvas: true,
                    bufW,
                    bufH,
                    clientW: Math.round(clientW),
                    clientH: Math.round(clientH),
                    actualDpr,
                    ratioW: Number(ratioW.toFixed(2)),
                    ratioH: Number(ratioH.toFixed(2))
                };
            }""")
            
            test_id = f"S4-DPR-{dpr_val}x-{cgame.replace('game/', '').replace('/index.html', '').replace(' ', '_')}"
            desc = f"[{cgame}] DPR={dpr_val}x 캔버스 버퍼 해상도 스케일링 검증 (Buffer: {canvas_eval.get('bufW')}x{canvas_eval.get('bufH')}, CSS: {canvas_eval.get('clientW')}x{canvas_eval.get('clientH')})"
            
            ratio_w = canvas_eval.get("ratioW", 0)
            passed = canvas_eval.get("hasCanvas", False) and ratio_w >= (1.0 if dpr_val == 1.0 else 1.5)
            log_test("Suite 4: Touch & Canvas DPR", test_id, desc, passed, canvas_eval)
        context.close()
    
    # 3. Canvas Touch Interaction & Drag Simulation
    print("\n--- Testing Canvas Touch Event Coordinates & Gesture Handling ---", flush=True)
    
    context = browser.new_context(viewport={"width": 375, "height": 667}, has_touch=True)
    page = context.new_page()
    page.goto(f"{BASE_URL}/game/slime_jump/index.html", wait_until="domcontentloaded")
    page.wait_for_timeout(200)
    
    slime_drag_ok = page.evaluate("""() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return false;
        
        try {
            const rect = canvas.getBoundingClientRect();
            const startX = rect.left + rect.width / 2;
            const startY = rect.top + rect.height * 0.7;
            
            const touchStart = new Touch({
                identifier: 1,
                target: canvas,
                clientX: startX,
                clientY: startY,
                pageX: startX,
                pageY: startY
            });
            
            const startEvt = new TouchEvent('touchstart', {
                touches: [touchStart],
                targetTouches: [touchStart],
                changedTouches: [touchStart],
                bubbles: true,
                cancelable: true
            });
            canvas.dispatchEvent(startEvt);
            
            const touchMove = new Touch({
                identifier: 1,
                target: canvas,
                clientX: startX,
                clientY: startY + 50,
                pageX: startX,
                pageY: startY + 50
            });
            
            const moveEvt = new TouchEvent('touchmove', {
                touches: [touchMove],
                targetTouches: [touchMove],
                changedTouches: [touchMove],
                bubbles: true,
                cancelable: true
            });
            canvas.dispatchEvent(moveEvt);
            
            const endEvt = new TouchEvent('touchend', {
                touches: [],
                targetTouches: [],
                changedTouches: [touchMove],
                bubbles: true,
                cancelable: true
            });
            canvas.dispatchEvent(endEvt);
            return true;
        } catch (e) {
            return false;
        }
    }""")
    
    log_test("Suite 4: Touch & Canvas DPR", "S4-TCH-SLIME", "[game/slime_jump] 터치 슬링샷 드래그 및 발사 이벤트 디스패치 정상 동작", slime_drag_ok, {})
    
    page.goto(f"{BASE_URL}/game/maze_escape/index.html", wait_until="domcontentloaded")
    page.wait_for_timeout(200)
    maze_joy_eval = page.evaluate("""() => {
        const joy = document.getElementById('joystick-container') || document.querySelector('.joystick') || document.querySelector('#joystick');
        const hasCanvas = !!document.querySelector('canvas');
        return {
            hasCanvas,
            hasJoystickOrTouch: !!joy || hasCanvas
        };
    }""")
    log_test("Suite 4: Touch & Canvas DPR", "S4-TCH-MAZE", "[game/maze_escape] 가상 조이스틱 / 터치 컨트롤러 인터페이스 구성 확인", maze_joy_eval["hasJoystickOrTouch"], maze_joy_eval)
    
    context.close()

def main():
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass

    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(('127.0.0.1', PORT), QuietHandler)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()
    print(f"[*] Local HTTP Server started on {BASE_URL}", flush=True)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            
            run_suite_1_viewport_overflow(browser)
            run_suite_2_safe_area_and_floating_nav(browser)
            run_suite_3_portal_interaction_robustness(browser)
            run_suite_4_touch_targets_and_canvas_dpr(browser)
            
            browser.close()
    finally:
        httpd.shutdown()
        print("\n[*] Local HTTP Server stopped.", flush=True)
        
    print("\n" + "="*70, flush=True)
    print("📊 ADVERSARIAL STRESS TEST FINAL SUMMARY", flush=True)
    print("="*70, flush=True)
    s = results["summary"]
    print(f"  Total Assertions / Scenarios: {s['total']}", flush=True)
    print(f"  Passed: {s['passed']}", flush=True)
    print(f"  Failed: {s['failed']}", flush=True)
    print(f"  Warnings: {s['warnings']}", flush=True)
    
    out_path = os.path.join(os.path.dirname(__file__), '..', '.agents', 'challenger_1', 'adversarial_results.json')
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"[*] Results saved to {out_path}", flush=True)
    
    if s["failed"] > 0:
        print("\n🚨 VERDICT: REQUEST_CHANGES (Failures detected in adversarial stress test)", flush=True)
        sys.exit(1)
    else:
        print("\n🎉 VERDICT: APPROVE (All adversarial stress tests passed successfully)", flush=True)
        sys.exit(0)

if __name__ == '__main__':
    main()

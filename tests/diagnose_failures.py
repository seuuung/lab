import sys
import http.server
import socketserver
import threading
import json
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

PORT = 8901
BASE_URL = f"http://127.0.0.1:{PORT}"

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

httpd = socketserver.TCPServer(('127.0.0.1', PORT), QuietHandler)
server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
server_thread.start()

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # 1. Diagnose choi_circle overflow & button click instability
        print("=== DIAGNOSING choi_circle ===")
        page = browser.new_page(viewport={'width': 320, 'height': 568})
        page.goto(f"{BASE_URL}/game/choi_circle/index.html", wait_until="domcontentloaded")
        page.wait_for_timeout(200)
        
        choi_diag = page.evaluate("""() => {
            const html = document.documentElement;
            const body = document.body;
            const winW = window.innerWidth;
            
            const offending = [];
            document.querySelectorAll('*').forEach(el => {
                const r = el.getBoundingClientRect();
                if (r.right > winW + 1) {
                    offending.push({
                        tag: el.tagName,
                        id: el.id,
                        class: el.className,
                        w: Math.round(r.width),
                        r: Math.round(r.right),
                        l: Math.round(r.left)
                    });
                }
            });
            
            // Floating home btn inspection
            const btn = document.querySelector('.floating-home-btn');
            let btnInfo = null;
            if (btn) {
                const bRect = btn.getBoundingClientRect();
                const bStyle = window.getComputedStyle(btn);
                btnInfo = {
                    transform: bStyle.transform,
                    animation: bStyle.animation,
                    bodyAnimation: window.getComputedStyle(body).animation,
                    rect: bRect
                };
            }
            
            return {
                docScrollW: html.scrollWidth,
                bodyScrollW: body.scrollWidth,
                offending,
                btnInfo
            };
        }""")
        print("choi_circle Diag:", json.dumps(choi_diag, indent=2, ensure_ascii=False))
        page.close()
        
        # 2. Diagnose Portal Category Tab Selectors
        print("\n=== DIAGNOSING index.html Category Tabs ===")
        page = browser.new_page(viewport={'width': 375, 'height': 667})
        page.goto(f"{BASE_URL}/index.html", wait_until="domcontentloaded")
        page.wait_for_timeout(200)
        
        tab_diag = page.evaluate("""() => {
            const allBtns = Array.from(document.querySelectorAll('button, a, [role="tab"], .tab, [data-category], [data-tab]'));
            const tabButtons = allBtns.map(el => ({
                tag: el.tagName,
                id: el.id,
                class: el.className,
                text: (el.textContent || '').trim().substring(0, 30),
                dataset: Object.assign({}, el.dataset)
            }));
            
            const cards = Array.from(document.querySelectorAll('[data-category]')).map(c => ({
                id: c.id,
                cat: c.getAttribute('data-category'),
                title: (c.querySelector('h3, h2, .font-bold') || {}).textContent || ''
            }));
            
            return {
                tabButtons: tabButtons.filter(b => b.text.includes('전체') || b.text.includes('앱') || b.text.includes('게임') || b.text.includes('실험실') || b.dataset.tab || b.dataset.category),
                cards
            };
        }""")
        print("index.html Tabs Diag:", json.dumps(tab_diag, indent=2, ensure_ascii=False))
        page.close()
        
        
        browser.close()
finally:
    httpd.shutdown()

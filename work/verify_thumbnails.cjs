const { chromium } = require('C:/Users/figig/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const root=process.cwd();
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');let file=decodeURIComponent(url.pathname);if(file.endsWith('/'))file+='index.html';file=path.resolve(root,'.'+file);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}fs.readFile(file,(e,data)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(data)});});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/google-analytics|googletagmanager/,r=>r.abort());
  async function loaded(){await page.locator('.project-thumbnail').evaluateAll(images=>images.forEach(image=>image.loading='eager'));await page.waitForFunction(()=>[...document.querySelectorAll('.project-thumbnail')].every(i=>i.complete&&i.naturalWidth>0),{timeout:25000});}
  await page.goto(origin,{waitUntil:'networkidle'});await loaded();
  assert.equal(await page.locator('.project-thumbnail').count(),12);
  assert.equal(await page.locator('.app-thumbnail').evaluateAll(imgs=>imgs.filter(i=>i.currentSrc.startsWith('https://play-lh.googleusercontent.com/')).length),3);
  await page.screenshot({path:'work/thumbnails-desktop.png',fullPage:true});
  await page.locator('[data-filter="app"]').click();assert.equal(await page.locator('.project-item:visible').count(),3);
  await page.screenshot({path:'work/thumbnails-apps.png',fullPage:true});
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});await page.locator('[data-filter="all"]').click();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), 'No horizontal overflow at '+width);
   if(width===390) await page.screenshot({path:'work/thumbnails-mobile.png',fullPage:true});
  }
  await page.route('https://play-lh.googleusercontent.com/**',r=>r.abort());
  await page.reload({waitUntil:'networkidle'});await loaded();
  assert.equal(await page.locator('.app-thumbnail').evaluateAll(imgs=>imgs.filter(i=>i.currentSrc.includes('/assets/thumbnails/')).length),3);
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS: all 12 images; 3 official Google images; app filter; 390px and 320px overflow; 3 local fallbacks with Google blocked; no runtime errors.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

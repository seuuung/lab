const { chromium } = require('C:/Users/figig/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const root = process.cwd();
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg'};
const server = http.createServer((req,res)=> {
  const url=new URL(req.url,'http://localhost');
  let name=decodeURIComponent(url.pathname);if(name.endsWith('/'))name+='index.html';
  const file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data)});
});
(async()=> {
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 try {
 const context=await browser.newContext({viewport:{width:1000,height:660},deviceScaleFactor:1});
 await context.route(/google-analytics|googletagmanager/,route=>route.abort());
 const games=[['shadow-puzzle','shadow_puzzle','#start-game-btn'],['slime-jump','slime_jump','#startBtn'],['magnetic-orbit','Magnetic_Orbit','#startBtn'],['maze-runner','maze_escape','#instructions'],['minesweeper','3D_%20minesweeper','.diff-btn[data-size="5"]'],['hacker-ctf','hacking',null],['sign-up','sign_up_for_hell',null],['choi-circle','choi_circle',null],['robot','robot',null]];
 const reports=[];
 for(const [slug,dir,selector] of games){
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try {
   await page.goto(origin+'/game/'+dir+'/index.html',{waitUntil:'networkidle',timeout:45000});
   await page.evaluate(()=>document.fonts.ready);
   if(selector){await page.locator(selector).click({timeout:10000});await page.waitForTimeout(450);}
   await page.addStyleTag({content: '.floating-home-btn { visibility: hidden !important; }'});
   await page.screenshot({path:'assets/thumbnails/'+slug+'.jpg',type:'jpeg',quality:88,animations:'disabled'});
   reports.push({slug,errors});console.log('CAPTURED',slug,errors.length?'errors: '+errors.join('; '):'OK');
  }catch(e){reports.push({slug,failed:e.message,errors});console.log('FAILED',slug,e.message)}
  await page.close();
 }
 fs.writeFileSync('work/capture-report.json',JSON.stringify(reports,null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});

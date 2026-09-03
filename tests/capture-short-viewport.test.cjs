const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {firefox}=require('playwright');

const route=path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges');
const types={'.html':'text/html','.js':'text/javascript','.webmanifest':'application/manifest+json','.png':'image/png','.woff2':'font/woff2'};

const serve=()=>new Promise(resolve=>{
 const server=http.createServer((request,response)=>{
  try{const url=new URL(request.url,'http://127.0.0.1'),relative=decodeURIComponent(url.pathname).replace(/^\/+/,''),candidate=path.join(route,relative||'index.html');if(!candidate.startsWith(route+path.sep))throw new Error('invalid path');const stat=fs.statSync(candidate),file=stat.isDirectory()?path.join(candidate,'index.html'):candidate;response.setHeader('content-type',types[path.extname(file)]||'application/octet-stream');response.setHeader('cache-control','no-store');response.end(fs.readFileSync(file))}catch{response.statusCode=404;response.end('not found')}
 });
 server.listen(0,'127.0.0.1',()=>resolve({server,origin:`http://127.0.0.1:${server.address().port}`}));
});

test('375x667 recording keeps raw-audio preservation truth visible above navigation in both themes',async()=>{
 const {server,origin}=await serve();let browser;
 try{
  browser=await firefox.launch({headless:true});
  for(const theme of['light','dark']){
   const context=await browser.newContext({viewport:{width:375,height:667},hasTouch:true,colorScheme:theme});
   const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(String(error)));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
   await page.goto(`${origin}/index.html?theme=${theme}&screen=log&viewport-regression=1`,{waitUntil:'networkidle'});
   await page.evaluate(()=>document.querySelectorAll('[data-log-state]').forEach(state=>state.classList.toggle('active',state.dataset.logState==='recording')));
   const geometry=await page.evaluate(()=>{const hint=document.querySelector('.recording-hint').getBoundingClientRect(),tab=document.querySelector('.tabbar').getBoundingClientRect(),recording=document.querySelector('.capture-recording').getBoundingClientRect(),screen=document.querySelector('[data-screen="log"]');return{hintTop:hint.top,hintBottom:hint.bottom,hintHeight:hint.height,tabTop:tab.top,recordingBottom:recording.bottom,horizontalOverflow:screen.scrollWidth>screen.clientWidth+1}});
   assert.deepEqual(errors,[],`${theme} recording emitted browser errors`);
   assert.ok(geometry.hintHeight>0,`${theme} preservation hint has no rendered height`);
   assert.ok(geometry.hintTop>=0,`${theme} preservation hint begins above the viewport`);
   assert.ok(geometry.hintBottom<=geometry.tabTop,`${theme} preservation hint ends at ${geometry.hintBottom}, below tab bar top ${geometry.tabTop}`);
   assert.ok(geometry.recordingBottom<=geometry.tabTop,`${theme} recording surface is clipped by navigation`);
   assert.equal(geometry.horizontalOverflow,false,`${theme} recording surface overflows horizontally`);
   await context.close();
  }
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
});

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {firefox}=require('playwright');
const route=path.join(__dirname,'..','sketches','release-ui-overhaul','06-five-slot-badges');
const html=fs.readFileSync(path.join(route,'index.html'),'utf8');
const worker=fs.readFileSync(path.join(route,'service-worker.js'),'utf8');
const types={'.html':'text/html','.js':'text/javascript','.webmanifest':'application/manifest+json','.png':'image/png','.woff2':'font/woff2'};
const serve=()=>new Promise(resolve=>{const server=http.createServer((request,response)=>{try{const url=new URL(request.url,'http://127.0.0.1'),relative=decodeURIComponent(url.pathname).replace(/^\/+/,''),candidate=path.join(route,relative||'index.html');if(!candidate.startsWith(route+path.sep))throw new Error('invalid path');const stat=fs.statSync(candidate),file=stat.isDirectory()?path.join(candidate,'index.html'):candidate;response.setHeader('content-type',types[path.extname(file)]||'application/octet-stream');response.setHeader('cache-control','no-store');response.end(fs.readFileSync(file))}catch{response.statusCode=404;response.end('not found')}});server.listen(0,'127.0.0.1',()=>resolve({server,origin:`http://127.0.0.1:${server.address().port}`}))});

test('all five destinations share one semantic app canvas in each theme',async()=>{const {server,origin}=await serve();let browser;try{browser=await firefox.launch({headless:true});for(const viewport of[{width:331,height:690},{width:390,height:844}])for(const [theme,expected] of [['light','rgb(244, 243, 239)'],['dark','rgb(17, 19, 16)']]){const context=await browser.newContext({viewport,hasTouch:true,colorScheme:theme}),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(String(error)));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});await page.goto(`${origin}/index.html?theme=${theme}&bg-regression=1`,{waitUntil:'networkidle'});for(const tab of['alarm','history','log','insights','profile']){await page.locator(`[data-tab="${tab}"]`).click();const colors=await page.evaluate(tab=>{const color=node=>getComputedStyle(node).backgroundColor,screen=document.querySelector('.screen.active'),dominant=tab==='log'?(screen.querySelector('[data-log-state].active')||screen):screen;return{phone:color(document.querySelector('.phone')),status:color(document.querySelector('.statusbar')),viewport:color(document.querySelector('.viewport')),screen:color(screen),dominant:color(dominant),dominantImage:getComputedStyle(dominant).backgroundImage,tabbar:color(document.querySelector('.tabbar'))}},tab);assert.deepEqual(colors,{phone:expected,status:expected,viewport:expected,screen:expected,dominant:expected,dominantImage:'none',tabbar:expected},`${theme} ${tab} must use the shared app canvas`)}await page.locator('[data-tab="log"]').click();const captureStates=await page.evaluate(()=>{const states=[...document.querySelectorAll('.capture-redesign [data-log-state]')];return states.map(state=>{states.forEach(item=>item.classList.remove('active'));state.classList.add('active');const style=getComputedStyle(state);return{name:state.dataset.logState,color:style.backgroundColor,image:style.backgroundImage}})});assert.equal(captureStates.length,9);for(const state of captureStates)assert.deepEqual(state,{name:state.name,color:expected,image:'none'},`${theme} Capture ${state.name} must use the shared app canvas`);assert.deepEqual(errors,[]);await context.close()}}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}});

test('the shared app canvas is a semantic token rather than per-tab hardcoding',()=>{
 assert.match(html,/:root\{[^}]*--app-canvas:#f4f3ef/);
 assert.match(html,/:root\[data-theme="dark"\]\{[^}]*--app-canvas:#111310/);
 assert.match(html,/\.phone,\.statusbar,\.viewport,\.screen,\.tabbar\{background:var\(--app-canvas\)!important/);
 assert.match(html,/\.capture-redesign \[data-log-state\]\{background:var\(--app-canvas\)!important/);
 assert.match(html,/const APP_SHELL_VERSION='93'/);
 assert.match(worker,/const CACHE='dreamworld-pwa-20260830-93'/);
});

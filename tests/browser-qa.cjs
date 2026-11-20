const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
let base;
const root = path.resolve(__dirname, '..');
const shots = path.join(root, 'qa-screenshots');
fs.mkdirSync(shots, { recursive: true });
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp4':'video/mp4','.ico':'image/x-icon','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1');
  const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()) {res.writeHead(404);res.end();return;}
  const size=fs.statSync(file).size;
  const type=mime[path.extname(file)]||'application/octet-stream';
  const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
  if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),size-1):size-1;if(start>=size||end<start){res.writeHead(416);res.end();return;}res.writeHead(206,{'Content-Type':type,'Content-Length':end-start+1,'Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${size}`});fs.createReadStream(file,{start,end}).pipe(res);return;}
  res.writeHead(200,{'Content-Type':type,'Content-Length':size,'Accept-Ranges':'bytes'});fs.createReadStream(file).pipe(res);
});
const routes = ['index','services','portfolio','quote'];
async function ready() {
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  base='http://127.0.0.1:'+server.address().port+'/';
  console.log('Preview server listening:',base);
}
async function renderCheck(page,name,device) {
  await page.goto(base+name+'.html',{waitUntil:'domcontentloaded'});
  await page.locator('h1').waitFor();
  await page.evaluate(async()=>{ await document.fonts.ready; });
  // Force lazy-loaded local portfolio images to decode for the full-page capture.
  const broken = await page.evaluate(async()=>{
    const imgs=[...document.images].filter(img=>img.getAttribute('src') && !img.closest('[hidden]'));
    for(const img of imgs) img.loading='eager';
    await Promise.all(imgs.map(img=>img.decode().catch(()=>{})));
    return imgs.filter(img=>!img.naturalWidth).map(img=>img.currentSrc || img.src);
  });
  assert.deepEqual(broken,[],name+' broken images');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,name+' '+device+' horizontal overflow');
  assert.equal(await page.locator('h1').count(),1);
  await page.screenshot({path:path.join(shots,device+'-'+name+'.png'),fullPage:true,animations:'disabled'});
  console.log('PASS render:',device,name);
}
(async()=>{
  await ready();
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  try {
    const page=await browser.newPage({viewport:{width:1365,height:900}});
    const errors=[];
    page.on('pageerror',err=>errors.push(err.message));
    page.on('console',msg=>{if(msg.type()==='error' && !/Failed to load resource|net::ERR/.test(msg.text())) errors.push(msg.text())});
    // Do not send analytics or any actual customer request.
    await page.route('**/googletagmanager.com/**',r=>r.abort());
    await page.route('**/google-analytics.com/**',r=>r.abort());
    await page.route('**/wa.me/**',r=>r.abort());
    for(const name of routes) await renderCheck(page,name,'desktop');
    await page.goto(base+'index.html');
    await page.locator('[data-stage="3"]').click();
    assert.equal(await page.locator('#stage-title').innerText(),'Completed spaces');
    console.log('PASS desktop execution-stage tabs');
    await page.goto(base+'services.html');
    await page.locator('[data-filter="technical"]').click();
    assert.equal(await page.locator('.service-detail:visible').count(),2);
    await page.locator('#electrical a.btn').click();
    await page.waitForURL('**/quote.html?service=electrical*');
    assert.equal(await page.locator('#service').inputValue(),'electrical');
    console.log('PASS service filters and quote prefill');
    await page.locator('#wizard-next').click();
    assert.match(await page.locator('#wizard-label').innerText(),/Step 1/i);
    await page.getByRole('button',{name:'House / Townhouse',exact:true}).click();
    await page.locator('#wizard-next').click();
    assert.match(await page.locator('#wizard-label').innerText(),/Step 2/i);
    await page.locator('#wizard-next').click();
    await page.locator('#location').fill('Test suburb');
    await page.locator('#details').fill('Synthetic electrical assessment test');
    await page.locator('#wizard-next').click();
    await page.locator('#customer-name').fill('Test User');
    await page.locator('#customer-phone').fill('123');
    await page.locator('#send-whatsapp').click();
    assert.equal(await page.locator('#quote-modal').isVisible(),false,'invalid phone must block review');
    await page.locator('#customer-phone').fill('071 234 5678');
    await page.locator('#send-whatsapp').click();
    await page.locator('#quote-modal').waitFor({state:'visible'});
    const href=await page.locator('#whatsapp-link').getAttribute('href');
    assert.match(href,/^https:\/\/wa.me\/27746437729\?text=/);
    assert.match(decodeURIComponent(href),/Electrical/i);
    assert.match(decodeURIComponent(href),/Synthetic electrical assessment test/);
    await page.screenshot({path:path.join(shots,'desktop-quote-review.png')});
    await page.locator('.modal-close').click();
    await page.locator('#clear-request').click();
    assert.match(await page.locator('#wizard-label').innerText(),/Step 1/i);
    console.log('PASS quote wizard required fields, phone validation, summary, WhatsApp handoff and clear');
    await page.goto(base+'portfolio.html');
    assert.equal(await page.locator('.project-image-button').count(),20);
    assert.deepEqual(await page.locator('video source').evaluateAll(els=>els.map(x=>x.getAttribute('src'))),['assets/video/exterior-renovation-walkthrough.mp4','assets/video/exterior-painting-scaffold-progress.mp4']);
    assert.equal(await page.locator('video[autoplay][muted][loop][playsinline]').count(),2);
    const media=await page.locator('video').evaluateAll(async videos=>Promise.all(videos.map(async v=>{
      await new Promise((resolve,reject)=>{
        if(v.readyState>=1) return resolve();
        v.addEventListener('loadedmetadata',resolve,{once:true});
        v.addEventListener('error',()=>reject(new Error('Video failed')), {once:true});
        setTimeout(()=>reject(new Error('Video metadata timeout')),15000);
      });
      await v.play();
      return {duration:v.duration,muted:v.muted,paused:v.paused,loop:v.loop};
    })));
    assert.ok(media.every(v=>v.duration>0&&v.muted&&!v.paused&&v.loop));
    console.log('PASS both exact videos decode and play muted/looping');
    await page.locator('[data-filter="bathroom"]').click();
    assert.equal(await page.locator('.portfolio-group:visible').count(),1);
    await page.locator('.portfolio-group:visible .project-image-button').first().click();
    await page.locator('#project-lightbox').waitFor({state:'visible'});
    await page.locator('.project-lightbox-next').click();
    assert.match(await page.locator('#project-lightbox-image').getAttribute('src'),/bathroom/);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#project-lightbox').isVisible(),false);
    console.log('PASS portfolio filter, image viewer, next and Escape');
    await page.setViewportSize({width:390,height:844});
    for(const name of routes) await renderCheck(page,name,'mobile');
    await page.locator('.menu-toggle').click();
    assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
    await page.locator('#primary-nav a[href="portfolio.html"]').click();
    assert.match(page.url(),/portfolio.html/);
    await page.locator('[data-filter="kitchen"]').click();
    assert.equal(await page.locator('.portfolio-group:visible').count(),1);
    await page.locator('.portfolio-group:visible .project-image-button').first().click();
    await page.locator('#project-lightbox').waitFor({state:'visible'});
    await page.locator('.project-lightbox-close').click();
    console.log('PASS mobile navigation, filter and image viewer');
    await page.goto(base+'quote.html');
    await page.getByRole('button',{name:'Apartment',exact:true}).click();
    await page.locator('#wizard-next').click();
    await page.locator('#service').selectOption('plumbing');
    await page.locator('#wizard-next').click();
    await page.locator('#location').fill('Test suburb');
    await page.locator('#details').fill('Synthetic mobile plumbing assessment');
    await page.locator('#wizard-next').click();
    await page.locator('#customer-name').fill('Test User');
    await page.locator('#customer-phone').fill('071 234 5678');
    await page.locator('#send-whatsapp').click();
    await page.locator('#quote-modal').waitFor({state:'visible'});
    const mobileHref=await page.locator('#whatsapp-link').getAttribute('href');
    assert.match(decodeURIComponent(mobileHref),/Synthetic mobile plumbing assessment/);
    await page.screenshot({path:path.join(shots,'mobile-quote-review.png')});
    await page.locator('.modal-close').click();
    await page.locator('#clear-request').click();
    console.log('PASS mobile quote wizard and review');
    assert.deepEqual(errors,[]);
    console.log('PASS no application console errors');
  } finally {await browser.close();server.close();}
})().catch(err=>{console.error(err);server.close();process.exitCode=1});

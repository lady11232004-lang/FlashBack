import { test, expect } from '@playwright/test';

test('all 69 frame presets produce distinct exported decorations', async({page})=>{
  await page.goto('/');
  const output=await page.evaluate(async()=>{
    const {FRAME_PRESETS}=await import('/src/utils/frames.ts');
    const {generatePhotoStrip,DEFAULT_CUSTOMIZATION}=await import('/src/utils/photoStrip.ts');
    const canvas=document.createElement('canvas');canvas.width=80;canvas.height=60;
    const ctx=canvas.getContext('2d')!;ctx.fillStyle='#8b8580';ctx.fillRect(0,0,80,60);const photo=canvas.toDataURL();
    const results=[];
    for(const frame of FRAME_PRESETS)results.push({id:frame.id,src:await generatePhotoStrip([photo,photo,photo],{...DEFAULT_CUSTOMIZATION,frameId:frame.id,dateText:' '})});
    return results;
  });
  expect(output).toHaveLength(69);expect(new Set(output.map(frame=>frame.src)).size).toBe(69);
  await page.setContent(`<html><style>body{background:#f6f2ec;font:14px system-ui;padding:24px;margin:0}h1{font-size:24px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}.card{text-align:center}.card img{height:420px;max-width:100%;object-fit:contain}.card p{text-transform:capitalize}</style><h1>FlashBack · Signature collection</h1><div class="grid">${output.filter(frame=>frame.id.startsWith('signature-')).map(frame=>`<div class="card"><img src="${frame.src}"/><p>${frame.id.replace('signature-','').replaceAll('-',' ')}</p></div>`).join('')}</div></html>`);
  await page.screenshot({path:'test-results/signature-frames.png',fullPage:true});
});

for (const width of [1440, 390]) test(`couple setup uses a responsive layout at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await page.goto('/#couple-create');
  await expect(page.locator('.room-card')).toHaveCount(0);
  const box = await page.locator('.couple-create-page').boundingBox();
  if (width > 1000) expect(box!.width).toBeGreaterThan(700);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/couple-setup-${width}.png`, fullPage: true });
});

test('story export contains the complete image at 1080 by 1920', async ({ page }) => {
  await page.goto('/'); const output=await page.evaluate(async()=>{const {generateStory}=await import('/src/utils/photoStrip.ts');const c=document.createElement('canvas');c.width=100;c.height=500;const ctx=c.getContext('2d')!;ctx.fillStyle='#f00';ctx.fillRect(0,0,100,500);const src=await generateStory(c.toDataURL());const img=new Image();img.src=src;await img.decode();const out=document.createElement('canvas');out.width=img.width;out.height=img.height;const draw=out.getContext('2d')!;draw.drawImage(img,0,0);return {width:img.width,height:img.height,center:Array.from(draw.getImageData(540,960,1,1).data),edge:Array.from(draw.getImageData(10,10,1,1).data)};});expect(output.width).toBe(1080);expect(output.height).toBe(1920);expect(output.center[0]).toBeGreaterThan(240);expect(output.center[1]).toBeLessThan(20);expect(output.edge[1]).toBeGreaterThan(200);
});

test('captions are opt-in and selected fonts change the exported image', async ({ page }) => {
  await page.goto('/');const result=await page.evaluate(async()=>{const {generatePhotoStrip,DEFAULT_CUSTOMIZATION}=await import('/src/utils/photoStrip.ts');const c=document.createElement('canvas');c.width=80;c.height=60;c.getContext('2d')!.fillRect(0,0,80,60);const p=c.toDataURL();const values={...DEFAULT_CUSTOMIZATION,titleText:'Our memories',namesText:'Lady & Partner',dateText:'October 2026',frameId:'signature-analog-roll'};const original=CanvasRenderingContext2D.prototype.fillText;const text:string[]=[];CanvasRenderingContext2D.prototype.fillText=function(value,...args){text.push(value);return original.call(this,value,...args);};let offCount=0;let off='';const fonts:string[]=[];try{off=await generatePhotoStrip([p,p,p],values);offCount=text.length;for(const fontFamily of ['Sans','Serif','Mono'])fonts.push(await generatePhotoStrip([p,p,p],{...values,showText:true,fontFamily}));}finally{CanvasRenderingContext2D.prototype.fillText=original;}return {offCount,text,off,fonts};});expect(result.offCount).toBe(0);expect(result.text).toContain('Our memories');expect(new Set(result.fonts).size).toBe(3);for(const image of result.fonts)expect(image).not.toBe(result.off);
});

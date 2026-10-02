import { test, expect } from '@playwright/test';

test('room choices persist and categorized frames render into the saved downloadable image', async ({ page }) => {
  await page.goto('/#rooms');
  await expect(page.locator('.room-card')).toHaveCount(8);
  for (const room of await page.locator('.room-card').all()) {
    await room.click(); await expect(room).toHaveAttribute('aria-pressed','true');
  }
  await page.getByRole('button', { name: /Airplane Window-seat/ }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: /Airplane Window-seat/ })).toHaveAttribute('aria-pressed','true');
  await page.screenshot({path:'test-results/room-picker.png',fullPage:true});
  await page.getByRole('button', { name: /NEXT — CHECK CAMERA/ }).click();
  await expect(page.locator('.camera-preview')).toHaveAttribute('data-room','airplane');
  await expect(page.getByText('READY',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'3',exact:true}).click();
  await page.getByRole('button',{name:'Start capture'}).click();
  for(let i=0;i<3;i++) {await page.getByRole('button',{name:i?'CAPTURE NEXT':'START SESSION',exact:true}).click();await expect(page.locator('.shot-boxes img')).toHaveCount(i+1);}
  await page.getByRole('button',{name:'DONE — SELECT PHOTOS'}).click();
  await expect(page.locator('.select-card')).toHaveCount(3);
  for(const card of await page.locator('.select-card').all()) await card.click();
  await page.getByRole('button',{name:'CONTINUE TO CUSTOMIZE'}).click();
  await page.getByRole('button',{name:'FRAME',exact:true}).click();
  for(const category of ['Signature','Portrait','Simple','Patterns','Collage','Travel','Food','Fall','Winter','Memes','Themes']) {
    await page.getByRole('tab',{name:new RegExp(`^${category} `)}).click();
    const frames=page.locator('.frame-option');
    for(const frame of await frames.all()) {await expect(frame.locator('img')).toBeVisible();await frame.click();await expect(frame).toHaveAttribute('aria-pressed','true');}
  }
  await page.getByRole('tab',{name:/^Travel /}).click();
  const before=await page.locator('.photo-strip img').getAttribute('src');
  await page.getByRole('button',{name:'Ticket frame preview Ticket',exact:true}).click();
  await expect.poll(()=>page.locator('.photo-strip img').getAttribute('src')).not.toBe(before);
  await page.screenshot({path:'test-results/frame-picker.png',fullPage:true});
  await page.getByRole('button',{name:'TEXT',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'ADD TEXT TO MY STRIP'})).not.toBeChecked();
  await expect(page.locator('.photo-strip small')).toHaveCount(0);
  await page.getByRole('checkbox',{name:'ADD TEXT TO MY STRIP'}).check();
  for(const font of ['Sans','Serif','Mono','Script','Handwritten']) { await page.getByLabel('Caption font').selectOption(font); await expect(page.getByLabel('Caption font')).toHaveValue(font); }
  await page.getByRole('checkbox',{name:'ADD TEXT TO MY STRIP'}).uncheck();
  await page.getByRole('button',{name:'NEXT STEP'}).click();
  const source=await page.locator('.final-strip>img').getAttribute('src');
  expect(source).toMatch(/^data:image\/jpeg/);
  const storyDownload=page.waitForEvent('download');await page.getByRole('button',{name:'STORY 9:16',exact:true}).click();expect((await storyDownload).suggestedFilename()).toBe('flashback-story.jpg');
  await page.getByRole('button',{name:'SAVE',exact:true}).click();
  await expect(page.getByRole('button',{name:'SAVED',exact:true})).toBeVisible();
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'DOWNLOAD',exact:true}).click();expect((await downloaded).suggestedFilename()).toBe('flashback-masterpiece.jpg');
  await page.reload();await expect(page.locator('.final-strip>img')).toHaveAttribute('src',source!);
  await page.goto('/#gallery');await page.locator('.gallery-open').first().click();
  await expect(page.locator('.archive-preview')).toHaveAttribute('src',source!);
});

test('all 57 frame presets produce distinct exported decorations', async({page})=>{
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
  expect(output).toHaveLength(57);expect(new Set(output.map(frame=>frame.src)).size).toBe(57);
  await page.setContent(`<html><style>body{background:#f6f2ec;font:14px system-ui;padding:24px;margin:0}h1{font-size:24px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}.card{text-align:center}.card img{height:420px;max-width:100%;object-fit:contain}.card p{text-transform:capitalize}</style><h1>FlashBack · Signature collection</h1><div class="grid">${output.filter(frame=>frame.id.startsWith('signature-')).map(frame=>`<div class="card"><img src="${frame.src}"/><p>${frame.id.replace('signature-','').replaceAll('-',' ')}</p></div>`).join('')}</div></html>`);
  await page.screenshot({path:'test-results/signature-frames.png',fullPage:true});
});

for (const width of [1440, 390]) test(`couple setup uses a responsive layout at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await page.goto('/#couple-create');
  await expect(page.locator('.room-card')).toHaveCount(8);
  const box = await page.locator('.couple-create-page').boundingBox();
  if (width > 1000) expect(box!.width).toBeGreaterThan(900);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/couple-setup-${width}.png`, fullPage: true });
});

test('story export contains the complete image at 1080 by 1920', async ({ page }) => {
  await page.goto('/'); const output=await page.evaluate(async()=>{const {generateStory}=await import('/src/utils/photoStrip.ts');const c=document.createElement('canvas');c.width=100;c.height=500;const ctx=c.getContext('2d')!;ctx.fillStyle='#f00';ctx.fillRect(0,0,100,500);const src=await generateStory(c.toDataURL());const img=new Image();img.src=src;await img.decode();const out=document.createElement('canvas');out.width=img.width;out.height=img.height;const draw=out.getContext('2d')!;draw.drawImage(img,0,0);return {width:img.width,height:img.height,center:Array.from(draw.getImageData(540,960,1,1).data),edge:Array.from(draw.getImageData(10,10,1,1).data)};});expect(output.width).toBe(1080);expect(output.height).toBe(1920);expect(output.center[0]).toBeGreaterThan(240);expect(output.center[1]).toBeLessThan(20);expect(output.edge[1]).toBeGreaterThan(200);
});

test('captions are opt-in and selected fonts change the exported image', async ({ page }) => {
  await page.goto('/');const result=await page.evaluate(async()=>{const {generatePhotoStrip,DEFAULT_CUSTOMIZATION}=await import('/src/utils/photoStrip.ts');const c=document.createElement('canvas');c.width=80;c.height=60;c.getContext('2d')!.fillRect(0,0,80,60);const p=c.toDataURL();const values={...DEFAULT_CUSTOMIZATION,titleText:'Our memories',namesText:'Lady & Partner',dateText:'October 2026',frameId:'signature-analog-roll'};const original=CanvasRenderingContext2D.prototype.fillText;const text:string[]=[];CanvasRenderingContext2D.prototype.fillText=function(value,...args){text.push(value);return original.call(this,value,...args);};let offCount=0;let off='';const fonts:string[]=[];try{off=await generatePhotoStrip([p,p,p],values);offCount=text.length;for(const fontFamily of ['Sans','Serif','Mono'])fonts.push(await generatePhotoStrip([p,p,p],{...values,showText:true,fontFamily}));}finally{CanvasRenderingContext2D.prototype.fillText=original;}return {offCount,text,off,fonts};});expect(result.offCount).toBe(0);expect(result.text).toContain('Our memories');expect(new Set(result.fonts).size).toBe(3);for(const image of result.fonts)expect(image).not.toBe(result.off);
});

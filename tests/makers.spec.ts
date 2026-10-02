import { test, expect } from '@playwright/test';

test('uploaded photos create editable collages and all instant-print formats, with exports and gallery persistence',async({page})=>{
  await page.goto('/#makers');
  await expect(page.getByRole('button',{name:'DOWNLOAD',exact:true})).toBeDisabled();
  const sources=await page.evaluate(()=>['#c84348','#477794','#86a66b'].map(color=>{const c=document.createElement('canvas');c.width=600;c.height=400;const x=c.getContext('2d')!;x.fillStyle=color;x.fillRect(0,0,600,400);x.fillStyle='#fff';x.fillRect(100,80,60,60);return c.toDataURL('image/png').split(',')[1];}));
  await page.getByLabel('Upload photos',{exact:true}).setInputFiles(sources.map((data,i)=>({name:`photo-${i}.png`,mimeType:'image/png',buffer:Buffer.from(data,'base64')})));
  await expect(page.locator('.maker-photos img')).toHaveCount(3);
  await expect(page.getByAltText('Created photo design')).toBeVisible();
  const results=[];
  for(const layout of ['grid','scrapbook','magazine']){const before=await page.getByAltText('Created photo design').getAttribute('src');await page.getByLabel('Maker layout').selectOption(layout);if(layout!=='grid')await expect.poll(()=>page.getByAltText('Created photo design').getAttribute('src')).not.toBe(before);results.push(await page.getByAltText('Created photo design').getAttribute('src'));}
  expect(new Set(results).size).toBe(3);
  const before=await page.getByAltText('Created photo design').getAttribute('src');await page.getByRole('button',{name:'Move photo 2 earlier'}).click();await expect.poll(()=>page.getByAltText('Created photo design').getAttribute('src')).not.toBe(before);
  await page.getByLabel('Maker caption').fill('Our favorite moments');await page.getByLabel('Maker font').selectOption('Mono');await page.getByLabel('Paper color').selectOption('#f3dfe5');
  await page.screenshot({path:'test-results/collage-maker.png',fullPage:true});
  await page.getByRole('button',{name:'INSTANT PRINT MAKER',exact:true}).click();
  for(const [layout,width,height] of [['mini',600,900],['square',850,1000],['wide',1100,760]] as const){await page.getByLabel('Maker layout').selectOption(layout);await expect.poll(()=>page.getByAltText('Created photo design').evaluate((img:HTMLImageElement)=>[img.naturalWidth,img.naturalHeight])).toEqual([width,height]);}
  await page.getByRole('button',{name:'Remove photo 3'}).click();await expect(page.locator('.maker-photos img')).toHaveCount(2);
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'DOWNLOAD',exact:true}).click();expect((await download).suggestedFilename()).toBe('flashback-instant.jpg');
  const story=page.waitForEvent('download');await page.getByRole('button',{name:'STORY 9:16',exact:true}).click();expect((await story).suggestedFilename()).toBe('flashback-story.jpg');
  await expect(page.getByRole('button',{name:'SAVE TO GALLERY'})).toBeEnabled();await page.getByRole('button',{name:'SAVE TO GALLERY'}).click();await expect(page.getByRole('status')).toContainText('Saved');
  const image=await page.getByAltText('Created photo design').getAttribute('src');await page.reload();await page.goto('/#gallery');await page.locator('.gallery-open').first().click();await expect(page.locator('.archive-preview')).toHaveAttribute('src',image!);
});

test('upload validation and full-width laptop layout',async({page})=>{
  await page.setViewportSize({width:1536,height:960});await page.goto('/#makers');
  expect(await page.locator('.app-shell').evaluate(el=>el.getBoundingClientRect().width)).toBe(1536);
  await page.getByLabel('Upload photos',{exact:true}).setInputFiles({name:'invalid.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')});await expect(page.getByRole('alert')).toContainText('JPG, PNG, or WebP');
  for(const width of [1536,768,390]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);}
});

test('camera zoom changes preview and capture crop, with composition grid',async({page})=>{
  await page.goto('/#preview');await expect(page.getByText('READY',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Zoom out',exact:true})).toBeDisabled();
  for(let i=0;i<10;i++)await page.getByRole('button',{name:'Zoom in',exact:true}).click();await expect(page.getByLabel('Camera zoom')).toHaveValue('2');
  await page.getByRole('button',{name:'Composition grid'}).click();await expect(page.locator('.camera-grid')).toBeVisible();
  await expect(page.locator('video')).toHaveCSS('transform',/matrix\(-2, 0, 0, 2/);
  const crop=await page.evaluate(async()=>{const {zoomCrop}=await import('/src/utils/cameraZoom.ts');return {normal:zoomCrop(640,480,2),wide:zoomCrop(1920,1080,2,4/3)};});expect(crop).toEqual({normal:{x:160,y:120,w:320,h:240},wide:{x:600,y:270,w:720,h:540}});
  await page.getByRole('button',{name:'Start capture',exact:true}).click();await page.getByRole('button',{name:'START SESSION',exact:true}).click();await expect(page.locator('.shot-boxes img')).toHaveCount(1,{timeout:10000});
  const source=await page.locator('.shot-boxes img').getAttribute('src');expect(source).toMatch(/^data:image\/jpeg/);
  await expect(page.getByLabel('Camera zoom')).toHaveValue('2');
});

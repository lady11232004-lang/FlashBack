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
  for(const category of ['Simple','Patterns','Collage','Travel','Food','Fall','Winter','Memes']) {
    await page.getByRole('tab',{name:new RegExp(`^${category} `)}).click();
    const frames=page.locator('.frame-option');
    for(const frame of await frames.all()) {await expect(frame.locator('img')).toBeVisible();await frame.click();await expect(frame).toHaveAttribute('aria-pressed','true');}
  }
  await page.getByRole('tab',{name:/^Travel /}).click();
  const before=await page.locator('.photo-strip img').getAttribute('src');
  await page.getByRole('button',{name:'Ticket frame preview Ticket',exact:true}).click();
  await expect.poll(()=>page.locator('.photo-strip img').getAttribute('src')).not.toBe(before);
  await page.screenshot({path:'test-results/frame-picker.png',fullPage:true});
  await page.getByRole('button',{name:'NEXT STEP'}).click();
  const source=await page.locator('.final-strip>img').getAttribute('src');
  expect(source).toMatch(/^data:image\/jpeg/);
  await page.getByRole('button',{name:'SAVE',exact:true}).click();
  await expect(page.getByRole('button',{name:'SAVED',exact:true})).toBeVisible();
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'DOWNLOAD',exact:true}).click();expect((await downloaded).suggestedFilename()).toBe('flashback-masterpiece.jpg');
  await page.reload();await expect(page.locator('.final-strip>img')).toHaveAttribute('src',source!);
  await page.goto('/#gallery');await page.locator('.gallery-open').first().click();
  await expect(page.locator('.archive-preview')).toHaveAttribute('src',source!);
});

test('all 35 frame presets produce distinct exported decorations', async({page})=>{
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
  expect(output).toHaveLength(35);expect(new Set(output.map(frame=>frame.src)).size).toBe(35);
});

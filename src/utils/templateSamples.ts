import { DEFAULT_CUSTOMIZATION, generatePhotoStrip, TEMPLATE_LAYOUTS, TEMPLATE_STYLES } from './photoStrip';
const cache = new Map<string, Promise<string>>();
/** Original landscape samples contain no private or third-party photos. */
export function templateSample(template: string) {
  const scenes=sampleScenes(),count=template==='COUPLE'?8:TEMPLATE_LAYOUTS[template]?.slots || 4;
  const photos=Array.from({length:count},(_,i)=>scenes[i%scenes.length]);
  if(!cache.has(template))cache.set(template,generatePhotoStrip(photos,{...DEFAULT_CUSTOMIZATION,...TEMPLATE_STYLES[template],template,layout:TEMPLATE_LAYOUTS[template]?.layout || 'vertical'}));
  return cache.get(template)!;
}

export function sampleScenes(){return ['#bfd7dc','#e9c6b2','#bac9a4','#d8c6e5'].map((color,i)=>{const c=document.createElement('canvas');c.width=240;c.height=300;const x=c.getContext('2d')!;x.fillStyle=color;x.fillRect(0,0,240,300);x.fillStyle='#fff3d0';x.beginPath();x.arc(170,75,32,0,Math.PI*2);x.fill();x.fillStyle=['#718a80','#ac7c62','#63836f','#8a799d'][i];x.beginPath();x.moveTo(0,230);x.lineTo(80,145);x.lineTo(160,230);x.lineTo(240,175);x.lineTo(240,300);x.lineTo(0,300);x.fill();x.fillStyle='#ffffff66';x.fillRect(22,265,196,2);return c.toDataURL('image/jpeg',.9);});}

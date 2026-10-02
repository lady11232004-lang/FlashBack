import { DEFAULT_CUSTOMIZATION, generatePhotoStrip, TEMPLATE_LAYOUTS } from './photoStrip';
let samples: string[] | undefined;
const cache = new Map<string, Promise<string>>();
/** Original sample illustrations avoid shipping anybody's private camera photos. */
export function samplePortraits() {
  if(samples)return samples;
  samples=Array.from({length:3},(_,i)=>{
    const c=document.createElement('canvas');c.width=240;c.height=300;const x=c.getContext('2d')!;
    const colors=[['#d6e1db','#976a50','#322f30','#ece2d4'],['#e9d1c9','#cf9a78','#67453a','#43656b'],['#d4dce8','#b78364','#262527','#b85b51']][i];
    x.fillStyle=colors[0];x.fillRect(0,0,240,300);x.fillStyle='#ffffff45';x.fillRect(15,15,100,260);
    x.fillStyle=colors[2];x.beginPath();x.ellipse(120,135,67,99,0,0,Math.PI*2);x.fill();
    x.fillStyle=colors[1];x.fillRect(104,181,32,55);x.beginPath();x.ellipse(120,128,49,69,0,0,Math.PI*2);x.fill();
    x.fillStyle=colors[2];x.beginPath();x.ellipse(105,70,52,27,-.35,0,Math.PI*2);x.fill();
    x.fillStyle='#302726';for(const eye of [100,141]){x.beginPath();x.ellipse(eye,130,3,2,0,0,Math.PI*2);x.fill();}
    x.strokeStyle='#915347';x.lineWidth=2;x.beginPath();x.moveTo(109,164);x.quadraticCurveTo(120,171,132,163);x.stroke();
    x.fillStyle=colors[3];x.beginPath();x.ellipse(120,299,101,86,0,0,Math.PI*2);x.fill();x.fillStyle=colors[1];x.beginPath();x.ellipse(120,219,26,16,0,0,Math.PI);x.fill();
    return c.toDataURL('image/jpeg',.9);
  });return samples;
}
export function templateSample(template: string) {
  if(!cache.has(template))cache.set(template,generatePhotoStrip(samplePortraits(),{...DEFAULT_CUSTOMIZATION,template,layout:TEMPLATE_LAYOUTS[template]?.layout || 'vertical'}));
  return cache.get(template)!;
}

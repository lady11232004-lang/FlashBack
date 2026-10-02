import { STRIP_FONTS } from './photoStrip';
export type MakerOptions = { tool: 'collage' | 'instant'; layout: string; background: string; caption: string; font: string };
export async function renderMaker(photos: string[], options: MakerOptions) {
  if (!photos.length) return '';
  const images=await Promise.all(photos.map(src=>new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('One image could not be opened. Use JPG, PNG, or WebP.'));img.src=src;})));
  const canvas=document.createElement('canvas');
  const instant=options.tool==='instant';
  const dimensions=instant ? ({mini:[600,900],square:[850,1000],wide:[1100,760]} as Record<string,number[]>)[options.layout] || [600,900] : options.layout==='magazine'?[1200,1600]:[1200,1200];
  [canvas.width,canvas.height]=dimensions;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image rendering is unavailable.');
  const w=canvas.width,h=canvas.height;ctx.fillStyle=options.background;ctx.fillRect(0,0,w,h);
  const draw=(img:HTMLImageElement,x:number,y:number,width:number,height:number)=>{const ratio=Math.max(width/img.width,height/img.height),sw=width/ratio,sh=height/ratio;ctx.drawImage(img,(img.width-sw)/2,(img.height-sh)/2,sw,sh,x,y,width,height);};
  if(instant){draw(images[0],40,40,w-80,h-180);}
  else {
    const count=Math.min(images.length,6),columns=count===1?1:2,rows=Math.ceil(count/columns),gap=26,pad=48;
    const cellW=(w-pad*2-gap*(columns-1))/columns,cellH=(h-pad*2-80-gap*(rows-1))/rows;
    if(options.layout==='magazine') {
      const heroH=count===1?h-pad*2-80:Math.round(h*.46);
      draw(images[0],pad,pad,w-pad*2,heroH);
      const lowerRows=Math.ceil((count-1)/2),lowerY=pad+heroH+gap,lowerH=(h-pad-80-lowerY-gap*(lowerRows-1))/Math.max(1,lowerRows);
      for(let i=1;i<count;i++)draw(images[i],pad+((i-1)%2)*(cellW+gap),lowerY+Math.floor((i-1)/2)*(lowerH+gap),cellW,lowerH);
    } else for(let i=0;i<count;i++){
      const x=pad+(i%columns)*(cellW+gap),y=pad+Math.floor(i/columns)*(cellH+gap);
      if(options.layout==='scrapbook'){
        ctx.save();ctx.translate(x+cellW/2,y+cellH/2);ctx.rotate((i%2?1:-1)*.045);
        ctx.fillStyle='#fffdfa';ctx.fillRect(-cellW/2,-cellH/2,cellW,cellH);
        draw(images[i],-cellW/2+14,-cellH/2+14,cellW-28,cellH-46);
        ctx.fillStyle='#d6c9a8';ctx.globalAlpha=.8;ctx.fillRect(-32,-cellH/2-5,64,18);ctx.restore();
      }else draw(images[i],x,y,cellW,cellH);
    }
  }
  if(options.caption){ctx.fillStyle=options.background==='#242126'?'#fff7e9':'#34312d';ctx.textAlign='center';ctx.font=`28px ${STRIP_FONTS[options.font] || STRIP_FONTS.Serif}`;ctx.fillText(options.caption,w/2,h-55,w-100);}
  return canvas.toDataURL('image/jpeg',.95);
}

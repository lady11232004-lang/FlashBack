export type FramePreset = { id: string; label: string; category: string; color: string; ink: string; motif: string; mark: string };
export const FRAME_CATEGORIES = ['Signature', 'Portrait', 'Simple', 'Patterns', 'Collage', 'Travel', 'Food', 'Fall', 'Winter', 'Memes', 'Themes'];
const group = (category: string, items: [string, string, string, string, string][]): FramePreset[] => items.map(([label, color, ink, motif, mark]) => ({ id: `${category.toLowerCase()}-${label.toLowerCase().replace(/\W+/g, '-')}`, label, category, color, ink, motif, mark }));
export const FRAME_PRESETS: FramePreset[] = [
  ...group('Portrait', [['Rose Portrait','#f1dcdd','#8c5364','sakura',''],['Sage Portrait','#dce4d6','#4b674f','botanical',''],['Editorial Noir','#17191f','#d8c6a4','noir',''],['Blue Hour','#dbe4ed','#445775','orbit',''],['Sunday Coffee','#e8d7c2','#73533b','ribbon',''],['Peach Film','#f2dbbd','#7d513b','analog','']]),
  ...group('Signature', [['Sakura','#f8e9e8','#985064','sakura','BLOOM WITH YOU'],['Ribbon Diary','#f4e9ef','#965770','ribbon','LITTLE MOMENTS, BIG FEELINGS'],['Botanical','#edf0e4','#46614a','botanical','PRESSED INTO MEMORY'],['Coastal Postcard','#e6efef','#396a79','coastal','MEET ME BY THE SEA'],['Silver Orbit','#e5e8ee','#3d4263','orbit','SAME SKY, DIFFERENT CITIES'],['Velvet Noir','#232126','#e1c49a','noir','ONE NIGHT TO REMEMBER'],['Cherry Picnic','#fff0df','#a3424b','cherry','SWEET LITTLE MEMORIES'],['Analog Roll','#282a2b','#f1c783','analog','ISO 400 · FLASHBACK']]),
  ...group('Themes', [['Ocean','#cce7eb','#256775','dots','SEA YOU SOON'],['Garden','#e0ead3','#476d3c','flowers','GROW TOGETHER'],['Sunset','#f2c5a6','#8f4c46','lines','GOLDEN HOUR'],['Galaxy','#282143','#d4c0ed','stars','UNDER THE SAME SKY'],['Birthday','#f9ddad','#9a584c','stars','MAKE A WISH'],['Wedding','#fff8ee','#9b7a64','hearts','FOREVER STARTS HERE'],['Rainy Day','#dbe1ec','#506b8b','lines','RAIN OR SHINE'],['Love Letter','#f4dbe0','#a15265','postcard','WITH LOVE']]),
  ...group('Simple', [['Black','#191919','#fff','plain',''],['White','#fff','#222','plain',''],['Cream','#f5e9d1','#3b3224','plain',''],['Pink','#f4cede','#723b53','plain',''],['Blue','#cddfeb','#29475e','plain',''],['Mint','#d9e9dc','#345746','plain',''],['Slate','#69767f','#fff','plain','']]),
  ...group('Patterns', [['Gingham','#ffeded','#ae5d65','checks',''],['Daisy','#faf5db','#977833','flowers','✿'],['Hearts','#f7d9e4','#bd5579','hearts','♥'],['Dots','#ebe3d6','#78614f','dots',''],['Stars','#222b49','#e3c782','stars','★']]),
  ...group('Collage', [['Scrapbook','#dfcdb0','#715236','tape','MEMORIES'],['Notebook','#f6f3e9','#566a83','lines','DEAR DIARY'],['Newsprint','#eee9dd','#242321','news','THE GOOD TIMES'],['Gallery','#efe7df','#6d564a','tape','OUR LITTLE GALLERY']]),
  ...group('Travel', [['Ticket','#ede8dc','#26344d','ticket','TICKET TO YOUR HEART'],['Postcard','#e9dfc4','#675444','postcard','WISH YOU WERE HERE'],['Tokyo','#f8dfe0','#a74153','flowers','TOKYO · 東京'],['Paris','#ead8c7','#795844','postcard','BONJOUR, PARIS'],['Batik','#347776','#f4d9bc','flowers','WANDER TOGETHER']]),
  ...group('Food', [['Cherry','#f7eadc','#b63b45','hearts','🍒'],['Matcha','#dbe4bf','#596d3d','dots','MATCHA MOMENT'],['Coffee','#d6bda3','#5c3c29','checks','COFFEE BREAK'],['Lemon','#faf0bf','#8d7e35','flowers','🍋']]),
  ...group('Fall', [['Autumn','#e8c5a1','#985b33','leaves','AUTUMN DAYS'],['Pumpkin','#f3dbc1','#a45f30','dots','🎃'],['Cozy','#e2d3c3','#705347','checks','SWEATER WEATHER']]),
  ...group('Winter', [['Snow','#e4eef5','#6484a1','stars','❄'],['Nordic','#f1e7dc','#a45252','checks','WINTER TOGETHER'],['Midnight','#22394c','#e9e7d8','stars','COLD HANDS, WARM HEARTS']]),
  ...group('Memes', [['Main Character','#f7de8d','#30303b','ticket','MAIN CHARACTER ENERGY'],['Chaos','#dccbef','#654f83','stars','A LITTLE CHAOS'],['Besties','#f7c5a2','#8a493a','hearts','CERTIFIED BESTIES'],['No Thoughts','#d6e3de','#45645b','plain','NO THOUGHTS, JUST VIBES']]),
];
export const ROOMS = [
  { id:'classic', label:'Classic', description:'Clean studio', color:'#e9e3d8', symbol:'●', frame:'signature-velvet-noir' },
  { id:'vintage', label:'Vintage', description:'Curtain booth', color:'#833e38', symbol:'▥', frame:'signature-analog-roll' },
  { id:'meme', label:'Meme', description:'A little unserious', color:'#e9c987', symbol:'☺', frame:'memes-main-character' },
  { id:'laundry', label:'Laundry', description:'Late-night laundromat', color:'#a6c5b9', symbol:'◎', frame:'signature-cherry-picnic' },
  { id:'prison', label:'Prison', description:'Mugshot moment', color:'#8c9296', symbol:'▥', frame:'simple-slate' },
  { id:'subway', label:'Subway', description:'Last train home', color:'#577174', symbol:'▣', frame:'travel-ticket' },
  { id:'airplane', label:'Airplane', description:'Window-seat memories', color:'#c9dce9', symbol:'✈', frame:'signature-coastal-postcard' },
  { id:'karaoke', label:'Karaoke', description:'After-hours stage', color:'#705775', symbol:'♫', frame:'signature-silver-orbit' },
];

export function drawFrameDecoration(ctx: CanvasRenderingContext2D, id: string | undefined, w: number, h: number, pad: number, showText = false, font = 'Georgia, serif') {
  const frame = FRAME_PRESETS.find(frame => frame.id === id);
  if (!frame) return;
  ctx.save(); ctx.fillStyle = frame.color; ctx.fillRect(0,0,w,h);
  if (['Signature','Portrait'].includes(frame.category)) { drawSignature(ctx, frame, w, h, pad, showText, font); ctx.restore(); return; }
  ctx.strokeStyle = frame.ink; ctx.fillStyle = frame.ink; ctx.globalAlpha = .25;
  if (frame.motif === 'checks') for (let y=0;y<h;y+=24) for (let x=0;x<w;x+=24) if ((x/24+y/24)%2===0) ctx.fillRect(x,y,24,24);
  if (frame.motif === 'lines' || frame.motif === 'news') for (let y=12;y<h;y+=18) { ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke(); }
  if (frame.motif === 'ticket') { ctx.setLineDash([5,5]);ctx.strokeRect(pad/2,pad/2,w-pad,h-pad);ctx.setLineDash([]); }
  if (frame.motif === 'postcard') { ctx.strokeRect(5,5,w-10,h-10);ctx.strokeRect(9,9,w-18,h-18); }
  if (['flowers','hearts','dots','stars','leaves'].includes(frame.motif)) {
    ctx.font='14px serif';ctx.textAlign='center';
    const symbol = ({flowers:'✿',hearts:'♥',dots:'·',stars:'✦',leaves:'❧'} as Record<string,string>)[frame.motif];
    for (let y=16;y<h;y+=30) {ctx.fillText(symbol,pad/2,y);ctx.fillText(symbol,w-pad/2,y);}
    for (let x=pad;x<w-pad;x+=30) ctx.fillText(symbol,x,16);
  }
  if (frame.motif === 'tape') { ctx.globalAlpha=.5;ctx.fillStyle='#fff8d7';ctx.fillRect(w/2-36,5,72,18); }
  ctx.restore();
}

function drawSignature(ctx: CanvasRenderingContext2D, frame: FramePreset, w: number, h: number, pad: number, showText = false, font = 'Georgia, serif') {
  ctx.fillStyle=frame.ink;ctx.strokeStyle=frame.ink;ctx.lineWidth=1.2;
  // Fine paper flecks are deterministic, so previews and downloads use identical artwork.
  ctx.globalAlpha=.07;for(let i=0;i<900;i++){const x=(i*73.37)%w,y=(i*151.19)%h;ctx.fillRect(x,y,1,1);}ctx.globalAlpha=1;
  const flower=(x:number,y:number,size:number)=>{ctx.save();ctx.translate(x,y);for(let i=0;i<5;i++){ctx.rotate(Math.PI*2/5);ctx.fillStyle=i%2?'#e5a6b7':'#f2c7cf';ctx.beginPath();ctx.ellipse(0,-size*.55,size*.38,size*.64,0,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#c39162';ctx.beginPath();ctx.arc(0,0,size*.16,0,Math.PI*2);ctx.fill();ctx.restore();};
  const bow=(x:number,y:number)=>{ctx.save();ctx.translate(x,y);ctx.fillStyle='#be7b96';ctx.strokeStyle='#8e506c';ctx.lineWidth=1.5;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(side*28,-22,side*29,13,0,0);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(0,2);ctx.quadraticCurveTo(side*5,17,side*12,25);ctx.stroke();}ctx.fillRect(-3,-3,6,7);ctx.restore();};
  for(const x of [pad/2,w-pad/2]){
    if(frame.motif==='sakura'){ctx.strokeStyle='#b58475';ctx.beginPath();ctx.moveTo(x,h-60);ctx.bezierCurveTo(x-9,h*.7,x+10,h*.3,x,30);ctx.stroke();for(let y=70;y<h-110;y+=145)flower(x,y,14);}
    if(frame.motif==='ribbon'){ctx.strokeStyle='#d6b4c5';ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(x,20);ctx.lineTo(x,h-35);ctx.stroke();ctx.setLineDash([]);for(let y=100;y<h-110;y+=270)bow(x,y);}
    if(frame.motif==='botanical'){ctx.strokeStyle='#738568';ctx.beginPath();ctx.moveTo(x,35);ctx.lineTo(x,h-45);ctx.stroke();for(let y=55;y<h-80;y+=48){ctx.fillStyle=y%96<50?'#7c916d':'#a5b095';ctx.beginPath();ctx.ellipse(x-6,y,5,13,-.65,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(x+6,y+16,5,13,.65,0,Math.PI*2);ctx.fill();}}
    if(frame.motif==='cherry'){for(let y=75;y<h-100;y+=150){ctx.strokeStyle='#6a8357';ctx.beginPath();ctx.moveTo(x-7,y+14);ctx.quadraticCurveTo(x-2,y-7,x+4,y-10);ctx.lineTo(x+10,y+12);ctx.stroke();ctx.fillStyle='#b54858';for(const dx of [-7,10]){ctx.beginPath();ctx.arc(x+dx,y+16,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e994a0';ctx.fillRect(x+dx-2,y+12,2,2);ctx.fillStyle='#b54858';}}}
    if(frame.motif==='analog'){ctx.fillStyle='#e8dcc1';for(let y=12;y<h-30;y+=30)ctx.fillRect(x-6,y,12,17);if(showText){ctx.fillStyle=frame.ink;ctx.save();ctx.translate(x,h/2);ctx.rotate(-Math.PI/2);ctx.font=`9px ${font}`;ctx.textAlign='center';ctx.fillText('FLASHBACK 400  /  COLOR NEGATIVE',0,0);ctx.restore();}}
  }
  if(frame.motif==='coastal'){ctx.strokeStyle='#709aa3';for(let y=25;y<h;y+=95){ctx.beginPath();for(let x=0;x<=w;x+=5){const yy=y+Math.sin(x/20)*4;if(x===0)ctx.moveTo(x,yy);else ctx.lineTo(x,yy);}ctx.stroke();}ctx.strokeStyle='#396a79';ctx.setLineDash([2,4]);ctx.strokeRect(9,9,w-18,h-18);ctx.setLineDash([]);}
  if(frame.motif==='orbit'){ctx.strokeStyle='#8790a8';for(let y=120;y<h-100;y+=235){ctx.save();ctx.translate(y%2?pad/2:w-pad/2,y);ctx.rotate(-.5);ctx.beginPath();ctx.ellipse(0,0,19,7,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#adb5c8';ctx.beginPath();ctx.arc(0,0,10,0,Math.PI*2);ctx.fill();ctx.restore();}ctx.fillStyle='#606a8a';for(let i=0;i<70;i++){const x=i%2?15:w-15,y=(i*97)%h;ctx.fillRect(x,y,2,2);}}
  if(frame.motif==='noir'){ctx.strokeStyle='#bba178';ctx.strokeRect(9,9,w-18,h-18);ctx.strokeRect(14,14,w-28,h-28);for(const x of [25,w-25])for(const y of [25,h-25]){ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.strokeRect(-6,-6,12,12);ctx.restore();}}
  if(showText){ctx.fillStyle=frame.ink;ctx.font=`9px ${font}`;ctx.textAlign='center';ctx.fillText(frame.label.toUpperCase(),w/2,24);}
}

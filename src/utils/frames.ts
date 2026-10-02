export type FramePreset = { id: string; label: string; category: string; color: string; ink: string; motif: string; mark: string };
export const FRAME_CATEGORIES = ['Simple', 'Patterns', 'Collage', 'Travel', 'Food', 'Fall', 'Winter', 'Memes', 'Themes'];
const group = (category: string, items: [string, string, string, string, string][]): FramePreset[] => items.map(([label, color, ink, motif, mark]) => ({ id: `${category.toLowerCase()}-${label.toLowerCase().replace(/\W+/g, '-')}`, label, category, color, ink, motif, mark }));
export const FRAME_PRESETS: FramePreset[] = [
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
  { id:'classic', label:'Classic', description:'Clean studio', color:'#e9e3d8', symbol:'●', frame:'simple-cream' },
  { id:'vintage', label:'Vintage', description:'Curtain booth', color:'#833e38', symbol:'▥', frame:'collage-scrapbook' },
  { id:'meme', label:'Meme', description:'A little unserious', color:'#e9c987', symbol:'☺', frame:'memes-main-character' },
  { id:'laundry', label:'Laundry', description:'Late-night laundromat', color:'#a6c5b9', symbol:'◎', frame:'patterns-gingham' },
  { id:'prison', label:'Prison', description:'Mugshot moment', color:'#8c9296', symbol:'▥', frame:'simple-slate' },
  { id:'subway', label:'Subway', description:'Last train home', color:'#577174', symbol:'▣', frame:'travel-ticket' },
  { id:'airplane', label:'Airplane', description:'Window-seat memories', color:'#c9dce9', symbol:'✈', frame:'travel-postcard' },
  { id:'karaoke', label:'Karaoke', description:'After-hours stage', color:'#705775', symbol:'♫', frame:'patterns-stars' },
];

export function drawFrameDecoration(ctx: CanvasRenderingContext2D, id: string | undefined, w: number, h: number, pad: number) {
  const frame = FRAME_PRESETS.find(frame => frame.id === id);
  if (!frame) return;
  ctx.save(); ctx.fillStyle = frame.color; ctx.fillRect(0,0,w,h);
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

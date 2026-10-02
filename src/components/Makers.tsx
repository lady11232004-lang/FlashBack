import { useEffect, useState } from 'react';
import { usePhotobooth } from '@/context/PhotoboothContext';
import { renderMaker, type MakerOptions } from '@/utils/makers';
import { downloadDataUrl, generateStory, STRIP_FONTS } from '@/utils/photoStrip';

export function Makers({ notify }: { notify: (message: string) => void }) {
  const pb=usePhotobooth();
  const [photos,setPhotos]=useState<string[]>([]);
  const [options,setOptions]=useState<MakerOptions>({tool:'collage',layout:'grid',background:'#f5eee3',caption:'',font:'Serif'});
  const [result,setResult]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saving,setSaving]=useState(false),[uploading,setUploading]=useState(false);
  useEffect(()=>{let cancelled=false;setBusy(true);setResult('');setError('');void renderMaker(photos,options).then(image=>{if(!cancelled)setResult(image);}).catch(err=>{if(!cancelled)setError(err.message);}).finally(()=>{if(!cancelled)setBusy(false);});return()=>{cancelled=true;};},[photos,options]);
  const upload=async(files:FileList|null)=>{
    if(!files?.length || uploading)return;setError('');setUploading(true);
    try {
      if(files.length+photos.length>6)throw new Error('Choose up to six photos. Remove a photo before adding more.');
      const added=await Promise.all(Array.from(files).map(file=>new Promise<string>((resolve,reject)=>{
        if(!['image/jpeg','image/png','image/webp'].includes(file.type))return reject(new Error('Use JPG, PNG, or WebP images. Convert HEIC photos first.'));
        if(file.size>15*1024*1024)return reject(new Error('Each photo must be smaller than 15 MB.'));
        const reader=new FileReader();reader.onload=()=>{const image=new Image();image.onload=()=>{const canvas=document.createElement('canvas'),scale=Math.min(1,2000/Math.max(image.width,image.height));canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);const ctx=canvas.getContext('2d');if(!ctx)return reject(new Error('Could not process the photo.'));ctx.drawImage(image,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.92));};image.onerror=()=>reject(new Error('This image is damaged or unsupported.'));image.src=String(reader.result);};reader.onerror=()=>reject(new Error('Could not read the photo.'));reader.readAsDataURL(file);
      })));
      setPhotos(previous=>[...previous,...added]);
    }catch(err){setError(err instanceof Error?err.message:'Upload failed.');}finally{setUploading(false);}
  };
  return <main className="maker-page section-pad"><span className="eyebrow">FLASHBACK CREATE</span><h1>MAKE SOMETHING<br/>WORTH KEEPING.</h1><p>Use your own photos. Uploads are processed on this device. Save your finished design to the gallery before leaving.</p><div className="maker-layout"><section className="maker-controls">
    <div className="maker-tabs"><button aria-pressed={options.tool==='collage'} onClick={()=>setOptions({...options,tool:'collage',layout:'grid'})}>COLLAGE MAKER</button><button aria-pressed={options.tool==='instant'} onClick={()=>setOptions({...options,tool:'instant',layout:'mini'})}>INSTANT PRINT MAKER</button></div>
    <label className="maker-upload">UPLOAD PHOTOS<input aria-label="Upload photos" type="file" disabled={uploading} accept="image/jpeg,image/png,image/webp" multiple onChange={event=>{void upload(event.target.files);event.target.value='';}}/></label>
    <p className="frame-help">Up to 6 photos · JPG, PNG, WebP · 15 MB each. Instant prints use the first photo.</p>
    <div className="maker-photos">{photos.map((photo,i)=><div key={i}><img src={photo} alt={`Uploaded photo ${i+1}`}/><button aria-label={`Remove photo ${i+1}`} onClick={()=>setPhotos(photos.filter((_,index)=>index!==i))}>Remove</button>{i>0&&<button aria-label={`Move photo ${i+1} earlier`} onClick={()=>{const next=[...photos];[next[i-1],next[i]]=[next[i],next[i-1]];setPhotos(next);}}>Move earlier</button>}</div>)}</div>
    <label>LAYOUT<select aria-label="Maker layout" value={options.layout} onChange={event=>setOptions({...options,layout:event.target.value})}>{(options.tool==='instant'?['mini','square','wide']:['grid','scrapbook','magazine']).map(layout=><option key={layout} value={layout}>{layout.toUpperCase()}</option>)}</select></label>
    <label>PAPER COLOR<select aria-label="Paper color" value={options.background} onChange={event=>setOptions({...options,background:event.target.value})}>{[['Cream','#f5eee3'],['White','#ffffff'],['Blush','#f3dfe5'],['Sage','#e0e7d9'],['Ink','#242126']].map(([name,color])=><option key={color} value={color}>{name}</option>)}</select></label>
    <label>CAPTION (OPTIONAL)<input aria-label="Maker caption" value={options.caption} maxLength={70} onChange={event=>setOptions({...options,caption:event.target.value})}/></label>
    <label>FONT<select aria-label="Maker font" value={options.font} onChange={event=>setOptions({...options,font:event.target.value})}>{Object.keys(STRIP_FONTS).map(font=><option key={font}>{font}</option>)}</select></label>
    {error&&<p className="couple-error" role="alert">{error}</p>}
  </section><section className="maker-preview" aria-busy={busy}>{result?<img src={result} alt="Created photo design"/>:<p>{busy?'Preparing preview…':'Upload photos to begin.'}</p>}
    <div className="maker-actions"><button className="button dark" disabled={!result||busy||uploading} onClick={()=>downloadDataUrl(result,`flashback-${options.tool}.jpg`)}>DOWNLOAD</button><button className="button light" disabled={!result||busy||uploading} onClick={async()=>{try{downloadDataUrl(await generateStory(result),'flashback-story.jpg');}catch(err){notify(err instanceof Error?err.message:'Export failed.');}}}>STORY 9:16</button><button className="button light" disabled={!result||busy||saving||uploading} onClick={async()=>{setSaving(true);try{await pb.saveToGallery({item_type:'strip',data_url:result,title:options.caption||`${options.tool} ${options.layout}`,template:options.layout});notify('Saved to this device’s gallery');}catch(err){notify(err instanceof Error?err.message:'Save failed.');}finally{setSaving(false);}}}>{saving?'SAVING…':'SAVE TO GALLERY'}</button></div>
  </section></div></main>;
}

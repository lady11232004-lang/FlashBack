import { samplePortraits } from '@/utils/templateSamples';
import { useEffect, useState } from 'react';
import { FRAME_CATEGORIES, FRAME_PRESETS, ROOMS } from '@/utils/frames';
import { DEFAULT_CUSTOMIZATION, generatePhotoStrip } from '@/utils/photoStrip';

export function RoomPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return <div className="room-grid">{ROOMS.map(room => <button type="button" key={room.id} aria-pressed={value === room.id} className={`room-card ${value === room.id ? 'selected' : ''}`} data-room={room.id} onClick={() => onChange(room.id)} style={{ backgroundColor:room.color }}><span aria-hidden="true">{room.symbol}</span><strong>{room.label}</strong><small>{room.description}</small></button>)}</div>;
}

export function FramePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [category,setCategory] = useState(() => FRAME_PRESETS.find(frame=>frame.id===value)?.category || 'Signature');
  const [previews,setPreviews] = useState<Record<string,string>>({});
  useEffect(() => {
    let cancelled=false;
    const photo=samplePortraits()[0];
    void Promise.all(FRAME_PRESETS.filter(frame=>frame.category===category).map(async frame=>[frame.id,await generatePhotoStrip([photo,photo,photo,photo],{...DEFAULT_CUSTOMIZATION,frameId:frame.id,titleText:'',dateText:' ',layout:'vertical'})] as const)).then(entries=>{if(!cancelled)setPreviews(prev=>({...prev,...Object.fromEntries(entries)}));});
    return ()=>{cancelled=true;};
  },[category]);
  return <div className="frame-picker"><p className="frame-help">Choose a frame. Artwork is included in your download. Portrait designs use one hero photo.</p><div className="frame-categories" role="tablist" aria-label="Frame categories">{FRAME_CATEGORIES.map(item=><button type="button" role="tab" aria-selected={category===item} key={item} onClick={()=>setCategory(item)}>{item} <small>{FRAME_PRESETS.filter(frame=>frame.category===item).length}</small></button>)}</div><div className="frame-grid">{FRAME_PRESETS.filter(frame=>frame.category===category).map(frame=><button type="button" aria-pressed={value===frame.id} key={frame.id} className={`frame-option ${value===frame.id?'selected':''}`} onClick={()=>onChange(frame.id)}>{previews[frame.id]?<img src={previews[frame.id]} alt={`${frame.label} frame preview`} />:<span className="frame-loading" aria-label="Loading preview" />}<span>{frame.label}</span></button>)}</div><button type="button" className="back-link" onClick={()=>onChange('')}>USE CUSTOM BACKGROUND</button></div>;
}

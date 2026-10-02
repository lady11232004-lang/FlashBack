import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Camera, Check, Copy, Download, Heart,
  Layout, Link2, Loader2, Menu,
  Play, RefreshCw, Search, Share2, Sparkles, SwitchCamera,
  User, Users, Video, X,
} from 'lucide-react';
import { backendConfigured } from '@/lib/supabase';
import { type GalleryItem } from '@/lib/gallery';
import { usePhotobooth } from '@/context/PhotoboothContext';
import { useCoupleSync } from '@/hooks/useCoupleSync';
import { useSessionRecorder } from '@/hooks/useSessionRecorder';
import { COLOR_FILTERS, getFilterCss, getFilterLabel } from '@/hooks/useFilters';
import {
  TEMPLATE_KEYS, TEMPLATE_LAYOUTS, STRIP_BACKGROUNDS, STRIP_BORDERS,
  STRIP_TEXTURES, TEXT_COLORS, ACCENT_COLORS, DEFAULT_CUSTOMIZATION,
  downloadDataUrl, StripOrientation,
} from '@/utils/photoStrip';

type View = 'home' | 'about' | 'gallery' | 'modes' | 'preview' | 'session' | 'select' | 'edit' | 'result'
  | 'couple-create' | 'couple-waiting' | 'couple-join' | 'couple-session' | 'privacy' | 'terms';
type GalleryTab = 'MY PHOTOS' | 'MY STRIPS' | 'MY VIDEOS' | 'TEMPLATES';

const images = {
  memories: '/illustrations/archive.svg',
  mode: '/illustrations/capture.svg',
  preview: '/illustrations/together.svg',
  session: '/illustrations/capture.svg',
};

const SHOT_OPTIONS = [3, 4, 6];
const COUNTDOWN_OPTIONS = [3, 5, 10];
const STICKER_OPTIONS = ['\u2665', '\u2605', '\u2728', '\u2729', '\u2606', '\u2661', '\u2764', '\u2727', '\u2726', '\u2600', '\u2601', '\u2602'];
const SOLO_TEMPLATES = ['CLASSIC', 'MINIMAL', 'FILM', '35MM FILM', 'VINTAGE 70S', 'DATE STAMP', 'POLAROID', 'RETRO', 'EDITORIAL', 'CLEAN MODERN', 'KODAK'];
const COUPLE_TEMPLATES = ['COUPLE', 'CLASSIC', 'FILM', '35MM FILM', 'POLAROID', 'KODAK'];

const VIEWS: View[] = ['home', 'about', 'gallery', 'modes', 'preview', 'session', 'select', 'edit', 'result', 'couple-create', 'couple-waiting', 'couple-join', 'couple-session', 'privacy', 'terms'];
function routeView(): View {
  if (new URLSearchParams(location.search).has('join')) return 'couple-join';
  const requested = location.hash.slice(1) as View;
  if (!backendConfigured && ['couple-session', 'couple-waiting'].includes(requested)) return 'couple-create';
  return VIEWS.includes(requested) ? requested : 'home';
}
function App() {
  const [view, setView] = useState<View>(routeView);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [coupleSessionId, setCoupleSessionId] = useState<string | null>(() => sessionStorage.getItem('flashback-couple-session'));
  const pb = usePhotobooth();

  const { loadGallery, stopCamera, resetSession, draftReady, capturedShots, setMode } = pb;
  useEffect(() => { void loadGallery(); }, [loadGallery]);

  const navigate = useCallback((next: View) => {
    if (!['session', 'preview', 'couple-session'].includes(next)) stopCamera();
    if (next === 'modes' || next === 'home') resetSession();
    if (next === 'preview') setMode('SOLO');
    setView(next); setMenuOpen(false);
    const url = new URL(location.href);
    if (next !== 'couple-join') url.searchParams.delete('join');
    url.hash = next;
    history.pushState({}, '', url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stopCamera, resetSession, setMode]);

  useEffect(() => {
    const onBack = () => { stopCamera(); setView(routeView()); setMenuOpen(false); };
    window.addEventListener('popstate', onBack);
    return () => window.removeEventListener('popstate', onBack);
  }, [stopCamera]);
  useEffect(() => {
    if (draftReady && ['select', 'edit', 'result'].includes(view) && !capturedShots.length) navigate('preview');
  }, [draftReady, view, capturedShots.length, navigate]);

  const notify = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  if (!draftReady) return <main className="empty-state" aria-busy="true"><Loader2 className="spin" /><p>Opening your studio...</p></main>;

  return (
    <div className="app-shell">
      <Header view={view} navigate={navigate} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      {pb.galleryError && view !== 'gallery' && <p className="couple-error" role="alert">{pb.galleryError}</p>}
      {view === 'home' && <Home navigate={navigate} />}
      {view === 'about' && <About navigate={navigate} />}
      {view === 'gallery' && <Gallery navigate={navigate} notify={notify} />}
      {view === 'modes' && <Modes navigate={navigate} />}
      {view === 'preview' && <Preview navigate={navigate} notify={notify} />}
      {view === 'session' && <Session navigate={navigate} notify={notify} />}
      {view === 'select' && <Select navigate={navigate} notify={notify} />}
      {view === 'edit' && <Edit navigate={navigate} notify={notify} />}
      {view === 'result' && <Result navigate={navigate} notify={notify} />}
      {view === 'couple-create' && <CoupleCreate navigate={navigate} notify={notify} onCreated={(id) => { setCoupleSessionId(id); navigate('couple-waiting'); }} />}
      {view === 'couple-waiting' && <CoupleWaiting navigate={navigate} notify={notify} sessionId={coupleSessionId} onBothReady={() => navigate('couple-session')} />}
      {view === 'couple-join' && <CoupleJoin navigate={navigate} notify={notify} onJoined={() => navigate('couple-session')} />}
      {view === 'couple-session' && <CoupleSession navigate={navigate} notify={notify} onComplete={() => navigate('edit')} />}
      {(view === 'privacy' || view === 'terms') && <InformationPage view={view} />}
      <Footer navigate={navigate} />
      {toast && <div className="toast" role="status"><Check size={16} /> {toast}</div>}
    </div>
  );
}

function Header({ view, navigate, menuOpen, setMenuOpen }: { view: View; navigate: (view: View) => void; menuOpen: boolean; setMenuOpen: (open: boolean) => void }) {
  return <header className="site-header">
    <button className="brand" onClick={() => navigate('home')}><span className="brand-mark"><Camera size={17} /></span> FLASHBACK</button>
    <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
      <button className={view === 'about' ? 'active' : ''} onClick={() => navigate('about')}>ABOUT</button>
      <button className={view === 'gallery' ? 'active' : ''} onClick={() => navigate('gallery')}>GALLERY</button>
      <button className={view === 'modes' ? 'active' : ''} onClick={() => navigate('modes')}>BOOK</button>
    </nav>
    <button className="menu-button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
  </header>;
}

function Home({ navigate }: { navigate: (view: View) => void }) {
  return <main>
    <section className="hero section-pad">
      <div className="hero-copy"><Eyebrow text="EST. 2026 — VIRTUAL STUDIO" /><h1>MAKE A MEMORY,<br /><span>wherever</span><br />YOU ARE.</h1><p>High-end, editorial-quality photography experiences delivered through your browser. Live color filters, nostalgic templates, and customizable photo strips.</p><div className="button-row"><button className="button dark" onClick={() => navigate('modes')}>TAKE A PHOTO <ArrowRight size={17} /></button><button className="button light" onClick={() => navigate('gallery')}>VIEW GALLERY</button></div></div>
      <div className="hero-image"><span className="image-note">the moment is yours</span></div>
    </section>
    <section className="modes-intro section-pad"><Script text="Choose Your Perspective" /><h2>SELECT YOUR CAPTURE MODE</h2><div className="mode-grid"><ModeCard icon={<User />} title="SOLO MODE" text="Individual portrait sessions designed for profile aesthetics and personal archives. Professional filters applied in real-time." action="LAUNCH SESSION" onClick={() => navigate('preview')} /><ModeCard icon={<Heart />} title="LONG-DISTANCE" text="Sync with your partner across the globe for a shared session. Composite frames that bring you together." action="START TOGETHER" onClick={() => navigate('couple-create')} /><ModeCard icon={<Users />} title="YOUR ARCHIVE" text="Keep photos, strips, and session videos on this device. Download your favorites to share or back them up." action="OPEN GALLERY" onClick={() => navigate('gallery')} /></div></section>
    <section className="dark-cta"><h2>READY TO<br />CAPTURE<br />YOUR<br />NEXT ICONIC<br />MOMENT?</h2><button className="button light" onClick={() => navigate('preview')}>ENTER THE BOOTH</button><div className="stats"><b>19<small>COLOR FILTERS</small></b><b>12<small>TEMPLATES</small></b><b>10<small>SHOTS PER SESSION</small></b></div></section>
  </main>;
}

function About({ navigate }: { navigate: (view: View) => void }) {
  return <main><section className="about-head section-pad"><Script text="it's simpler than you think" /><h1>HOW IT<br />WORKS.</h1><p>We've stripped away the complexity of the traditional photobooth to bring you a pure, editorial photography experience that fits in your pocket or stands tall at your event.</p></section><section className="steps section-pad"><Step number="01" title="CHOOSE YOUR MODE" text="Choose a solo session, or invite a partner to a shared session when a backend is connected. Video records automatically on supported browsers." image={images.mode} reverse={false} /><Step number="02" title="TAKE YOUR SHOTS" text="Watch the countdown, find your light, and let the Flashback lens do the rest. Choose your color filter, capture up to ten shots, and retake any frame before selecting your favorites." image={images.session} reverse /><Step number="03" title="KEEP THE MEMORY" text="Customize your strip, save it to this device, or download it. Share the image using your browser’s share menu when supported." image={images.memories} reverse={false} /></section><section className="blueprint section-pad"><div><Script text="the blueprint" /><h2>Technical<br />Mastery.</h2><p>FlashBack uses the camera you already have. Choose a filter, customize your strip, and save your memories in this browser.</p><button className="button dark" onClick={() => navigate('modes')}>BOOK YOUR SESSION</button></div><div className="spec-list">{['YOUR DEVICE CAMERA', 'LIVE COLOR FILTERS', 'CUSTOMIZABLE PHOTO STRIPS', '3 / 5 / 10 SECOND COUNTDOWN', 'DEVICE GALLERY STORAGE', 'IMAGE & VIDEO DOWNLOADS'].map((spec) => <span key={spec}>{spec}</span>)}</div></section><section className="ready section-pad"><Script text="experience the flow" /><h2>Ready to<br /><i>Flashback?</i></h2><button className="button dark" onClick={() => navigate('modes')}>START SESSION</button></section></main>;
}

/* ============ GALLERY ============ */

function Gallery({ navigate, notify }: { navigate: (view: View) => void; notify: (message: string) => void }) {
  const pb = usePhotobooth();
  const { loadGallery } = pb;
  const [tab, setTab] = useState<GalleryTab>('MY STRIPS');
  const [query, setQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const selectedItem = pb.galleryItems.find(item => item.id === selectedId);
  useEffect(() => { void loadGallery(); }, [loadGallery]);
  useEffect(() => {
    if (!selectedId) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null);
      if (event.key === 'Tab') {
        const nodes = Array.from(document.querySelectorAll<HTMLElement>('.archive-dialog button:not(:disabled), .archive-dialog input, .archive-dialog video'));
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [selectedId]);
  const type = tab === 'MY PHOTOS' ? 'photo' : tab === 'MY VIDEOS' ? 'video' : 'strip';
  const items = pb.galleryItems.filter(item => item.item_type === type && (!favoritesOnly || item.favorite) && `${item.title} ${item.template} ${item.mode}`.toLowerCase().includes(query.toLowerCase()));
  const openItem = (item: GalleryItem) => { setSelectedId(item.id); setTitle(item.title); setConfirmDelete(false); };
  const perform = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try { await action(); } catch (error) { notify(error instanceof Error ? error.message : 'Could not save changes.'); }
    finally { setBusy(false); }
  };
  const reuse = (template: string) => { pb.resetSession(); pb.setMode('SOLO'); pb.setCustomization({ template }); navigate('preview'); };

  return <main>
    <section className="gallery-head section-pad"><Script text="memories on film" /><h1>THE<br /><i>ARCHIVE.</i></h1>
      <p>Your photos, strips, and videos are saved privately in this browser. Download them for backup or to use them on another device.</p>
      <div className="gallery-tools">
        <label><Search size={16} /><input aria-label="Search gallery" value={query} onChange={event => setQuery(event.target.value)} placeholder="FIND A MEMORY..." /></label>
        <button className="button light" disabled={pb.galleryLoading} onClick={() => void loadGallery()}><RefreshCw size={14} /> REFRESH</button>
        <button className="button light" aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly(!favoritesOnly)}><Heart size={14} fill={favoritesOnly ? 'currentColor' : 'none'} /> FAVORITES</button>
      </div>
    </section>
    <div className="gallery-tabs section-pad" role="tablist" aria-label="Gallery categories">{(['MY PHOTOS', 'MY STRIPS', 'MY VIDEOS', 'TEMPLATES'] as GalleryTab[]).map(item => <button role="tab" aria-selected={tab === item} key={item} className={tab === item ? 'selected' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
    {pb.galleryError && <p className="couple-error" role="alert">{pb.galleryError}</p>}
    {pb.galleryLoading && <p className="empty-state" role="status">Loading saved memories...</p>}
    <section className="gallery-grid section-pad">
      {tab === 'TEMPLATES' ? TEMPLATE_KEYS.filter(key => key.toLowerCase().includes(query.toLowerCase())).map(key => <article className="gallery-card template-card" key={key}>
        <div className="gallery-image template-preview"><Layout size={28} /><b>{TEMPLATE_LAYOUTS[key].slots} FRAMES</b></div>
        <em>{TEMPLATE_LAYOUTS[key].label}</em><p>{TEMPLATE_LAYOUTS[key].desc}</p>
        <button className="button dark template-try" onClick={() => reuse(key)}>TRY NOW <ArrowRight size={14} /></button>
      </article>) : items.length ? items.map(item => <article className="gallery-card" key={item.id}>
        <button className="gallery-open" onClick={() => openItem(item)} aria-label={`Open ${item.title}`}>
          <div className="gallery-image">{item.item_type === 'video' ? <>{item.thumbnail ? <img src={item.thumbnail} alt="" /> : <Video size={32} />}<span className="play-overlay"><Play size={24} /></span></> : <img src={item.data_url} alt={item.title} />}<b>{item.template || item.item_type.toUpperCase()}</b></div>
          <div className="meta"><span>DATE<br /><strong>{new Date(item.created_at).toLocaleDateString()}</strong></span><span>MODE<br /><strong>{item.mode}</strong></span>{item.favorite && <Heart size={14} fill="currentColor" />}</div><em>{item.title}</em>
        </button>
      </article>) : !pb.galleryLoading && <div className="empty-state"><Camera size={28} /><p>{query || favoritesOnly ? 'No memories match your filters.' : 'No saved memories in this category yet.'}</p><button className="button dark" onClick={() => navigate('preview')}>START SESSION</button></div>}
    </section>
    {selectedItem && <div className="video-modal" onClick={() => setSelectedId(null)}>
      <section className="archive-dialog" role="dialog" aria-modal="true" aria-label="Saved memory" onClick={event => event.stopPropagation()}>
        <button ref={closeRef} className="close-modal" aria-label="Close saved memory" onClick={() => setSelectedId(null)}><X size={24} /></button>
        {selectedItem.item_type === 'video' ? <video src={selectedItem.data_url} controls /> : <img className="archive-preview" src={selectedItem.data_url} alt={selectedItem.title} />}
        <form onSubmit={event => { event.preventDefault(); void perform(async () => { await pb.updateGalleryItem(selectedItem.id, { title }); notify('Title saved'); }); }}><label>TITLE<input value={title} onChange={event => setTitle(event.target.value)} maxLength={80} required /></label><button className="button dark" disabled={busy}>SAVE TITLE</button></form>
        <div className="result-item-actions">
          <button className="button light" onClick={() => downloadDataUrl(selectedItem.data_url, `flashback-${selectedItem.item_type}.${selectedItem.item_type === 'video' ? (selectedItem.data_url.startsWith('data:video/mp4') ? 'mp4' : 'webm') : 'jpg'}`)}><Download size={15} /> DOWNLOAD</button>
          <button className="button light" disabled={busy} onClick={() => void perform(async () => { await pb.updateGalleryItem(selectedItem.id, { favorite: !selectedItem.favorite }); })}><Heart size={15} fill={selectedItem.favorite ? 'currentColor' : 'none'} /> {selectedItem.favorite ? 'UNFAVORITE' : 'FAVORITE'}</button>
          {selectedItem.item_type === 'strip' && <button className="button light" onClick={() => reuse(selectedItem.template || 'CLASSIC')}>REUSE TEMPLATE</button>}
          <button className="button light" disabled={busy} onClick={() => setConfirmDelete(true)}>DELETE</button>
        </div>
        {confirmDelete && <div className="couple-error"><p>Delete this saved memory from this device?</p><button className="button dark" disabled={busy} onClick={() => void perform(async () => { await pb.deleteGalleryItem(selectedItem.id); setSelectedId(null); notify('Memory deleted'); })}>DELETE MEMORY</button><button className="button light" onClick={() => setConfirmDelete(false)}>CANCEL</button></div>}
      </section>
    </div>}
  </main>;
}

function Modes({ navigate }: { navigate: (view: View) => void }) {
  const pb = usePhotobooth();
  return <main><section className="modes-page section-pad"><Eyebrow text="SELECT YOUR EXPERIENCE" /><h1>HOW WILL<br />YOU FLASH?</h1><Script text="capture the magic" /><div className="quote">"Photography is the story I fail to put into words."</div><div className="mode-choice-grid"><Experience image={images.mode} label="SOLO MODE" title="SINGLE FRAME" text="The classic editorial experience. Studio-grade lighting optimized for a single subject. Perfect for headshots, fashion poses, or intimate self-portraits." onClick={() => { pb.setMode('SOLO'); navigate('preview'); }} /><Experience image={images.preview} label="TOGETHER MODE" title="LONG-DISTANCE" text="Bridge the distance. Create a session, share the link with your partner, and capture synchronized photos together — same booth, different places." onClick={() => { pb.setMode('DOUBLE'); navigate('couple-create'); }} /></div><div className="tip"><Sparkles size={16} /> PRO TIP <p>Long-distance mode works best with a high-speed connection. Ensure both partners are in well-lit areas and have granted camera permission.</p></div></section></main>;
}

/* ============ FILTER PANEL ============ */

/* ============ RIGHT-SIDE TOOLS PANEL (FILTERS + TEMPLATES) ============ */

function SideToolsPanel({ filterKey, onPickFilter, template, onPickTemplate, templates }: {
  filterKey: string; onPickFilter: (key: string) => void;
  template: string; onPickTemplate: (key: string) => void;
  templates: string[];
}) {
  return <div className="side-tools-panel">
    <div className="side-tools-section">
      <h3>FILTERS</h3>
      <div className="side-filter-list">
        {COLOR_FILTERS.map((f) => (
          <button key={f.key} className={filterKey === f.key ? 'side-filter-item selected' : 'side-filter-item'} onClick={() => onPickFilter(f.key)}>
            <span className="side-filter-preview" style={{ filter: f.css }} />
            <small>{f.label}</small>
          </button>
        ))}
      </div>
    </div>
    <div className="side-tools-section">
      <h3>TEMPLATES</h3>
      <div className="side-template-list">
        {templates.map((key) => {
          const def = TEMPLATE_LAYOUTS[key];
          return (
            <button key={key} className={template === key ? 'side-template-item selected' : 'side-template-item'} onClick={() => onPickTemplate(key)}>
              <span className="side-template-icon"><Layout size={16} /></span>
              <div>
                <strong>{def?.label || key}</strong>
                <small>{def?.slots} frame{def && def.slots > 1 ? 's' : ''} - {def?.layout}</small>
              </div>
              {template === key && <Check size={14} />}
            </button>
          );
        })}
      </div>
    </div>
  </div>;
}

/* ============ CAMERA VIEW ============ */

function CameraView({ filterKey, videoRef, facingMode, flash, countdown, error, ready, onRetry }: {
  filterKey: string; videoRef: React.RefObject<HTMLVideoElement>; facingMode: 'user' | 'environment';
  flash: boolean; countdown: number; error: string | null; ready: boolean; onRetry: () => void;
}) {
  const filterCss = getFilterCss(filterKey);
  return <div className="camera-feed-container">
    <video ref={videoRef} autoPlay playsInline muted className={`camera-feed ${facingMode === 'user' ? 'mirror' : ''}`} style={{ filter: filterCss }} />
    {flash && <div className="capture-flash" />}
    {countdown > 0 && <div className="countdown-overlay">{countdown}</div>}
    {error && <div className="camera-error"><Camera size={32} /><p>{error}</p><button className="button dark" onClick={onRetry}>RETRY</button></div>}
    {!ready && !error && <div className="camera-loading"><Loader2 className="spin" size={28} /><p>Requesting camera access...</p></div>}
  </div>;
}

/* ============ PREVIEW (SOLO) ============ */

function Preview({ navigate, notify }: { navigate: (view: View) => void; notify: (message: string) => void }) {
  const pb = usePhotobooth();
  const [showPanel, setShowPanel] = useState(true);

  const { startCamera, reattach, ready } = pb;
  useEffect(() => { void startCamera(); }, [startCamera]);
  useEffect(() => { if (ready) reattach(); }, [ready, reattach]);

  const pickFilter = (key: string) => { pb.setFilterKey(key); notify(`Filter: ${getFilterLabel(key)}`); };
  const pickTemplate = (key: string) => { pb.setCustomization({ template: key }); notify(`Template: ${TEMPLATE_LAYOUTS[key]?.label || key}`); };

  return <main><section className="preview-page section-pad">
    <div className="preview-sidebar">
      <button className="back-link" onClick={() => navigate('modes')}><ArrowLeft size={14} /> BACK</button>
      <Eyebrow text="ACTIVE SESSION" /><h1>STUDIO<br />PREVIEW</h1>
      <p>Adjust your frame, check the lighting, and strike a pose. The camera is primed for your next memory.</p>
      <div className="preview-stats">
        <span>STATUS<strong>{pb.error ? 'ERROR' : pb.ready ? 'READY' : 'CONNECTING'}</strong></span>
        <span>SHOTS<strong>{pb.totalShots}</strong></span>
        <span>LENS<strong>{pb.facingMode === 'user' ? 'FRONT' : 'REAR'}</strong></span>
        <span>LOC<strong>VIRTUAL</strong></span>
      </div>
      <Script text="how many final photos?" />
      <div className="shot-selector">
        {SHOT_OPTIONS.map(n => <button key={n} className={pb.totalShots === n ? 'selected' : ''} onClick={() => pb.setTotalShots(n)}>{n}</button>)}
      </div>
      <Script text="countdown duration" />
      <div className="shot-selector">
        {COUNTDOWN_OPTIONS.map(n => <button key={n} className={pb.countdownDuration === n ? 'selected' : ''} onClick={() => pb.setCountdownDuration(n)}>{n}s</button>)}
      </div>
    </div>
    <div className="camera-preview">
      <CameraView filterKey={pb.filterKey} videoRef={pb.videoRef} facingMode={pb.facingMode} flash={pb.flash} countdown={pb.countdown} error={pb.error} ready={pb.ready} onRetry={() => pb.startCamera()} />
      <div className="live-badge"><span /> LIVE FEED</div>
      <div className="camera-controls">
        <span>FILTER<strong>{getFilterLabel(pb.filterKey)}</strong></span>
        <span>COUNTDOWN<strong>{pb.countdownDuration} SECONDS</strong></span>
        <button className="shutter" onClick={() => navigate('session')} disabled={!pb.ready} aria-label="Start capture"><Camera size={26} /></button>
        <button className="icon-button" onClick={() => pb.switchCamera()} aria-label="Switch camera"><SwitchCamera size={19} /></button>
        <button className={`icon-button ${showPanel ? 'tool-on' : ''}`} onClick={() => setShowPanel(!showPanel)} aria-label="Toggle tools"><Sparkles size={19} /></button>
      </div>
    </div>
    {showPanel && <SideToolsPanel filterKey={pb.filterKey} onPickFilter={pickFilter} template={pb.customization.template} onPickTemplate={pickTemplate} templates={SOLO_TEMPLATES} />}
  </section></main>;
}

/* ============ SESSION (SOLO) ============ */

function Session({ navigate, notify }: { navigate: (view: View) => void; notify: (message: string) => void }) {
  const pb = usePhotobooth();
  const [showPanel, setShowPanel] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [retakeIndex, setRetakeIndex] = useState<number | null>(null);
  const recorder = useSessionRecorder();

  const { startCamera, reattach, ready, videoRef, setVideoBlobUrl } = pb;
  const { startRecording, stopRecording } = recorder;
  useEffect(() => { void startCamera(); }, [startCamera]);
  useEffect(() => {
    if (!ready) return;
    reattach();
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (stream) startRecording(stream);
  }, [ready, reattach, videoRef, startRecording]);

  const shots = pb.capturedShots.length;
  const sessionFull = shots >= pb.MAX_SHOTS;
  const hasMinShots = shots >= pb.totalShots;

  const handleCapture = async () => {
    if (sessionFull) { notify('Maximum 10 shots reached'); return; }
    await pb.startCapture();
  };

  const handleRetake = async (index: number) => {
    setRetakeIndex(index);
    await pb.retakeShot(index);
    setRetakeIndex(null);
    notify('Photo retaken');
  };

  const handleFinish = async () => {
    if (pb.isCapturing || finishing) return;
    setFinishing(true);
    const video = await stopRecording();
    setVideoBlobUrl(video);
    navigate('select');
  };

  const pickFilter = (key: string) => { pb.setFilterKey(key); notify(`Filter: ${getFilterLabel(key)}`); };
  const pickTemplate = (key: string) => { pb.setCustomization({ template: key }); notify(`Template: ${TEMPLATE_LAYOUTS[key]?.label || key}`); };

  return <main>
    <div className="session-bar"><span className="live-dot" /> LIVE SESSION
      <span className="shot-count">{pb.capturedShots.map((_, i) => <i className="filled" key={i} />)} SHOT {Math.max(shots, 1)} / {pb.MAX_SHOTS} <small>(SELECT {pb.totalShots})</small></span>
      <span className="camera-details">LENS <b>{pb.facingMode === 'user' ? 'FRONT' : 'REAR'}</b> FILTER <b>{getFilterLabel(pb.filterKey)}</b> COUNTDOWN <b>{pb.countdownDuration}S</b></span>
    </div>
    {recorder.error && <p className="couple-error" role="status">{recorder.error}</p>}
    <button className="button light session-tools-toggle" onClick={() => setShowPanel(!showPanel)} aria-expanded={showPanel}>FILTERS &amp; TEMPLATES</button>
    <section className={showPanel ? 'session-page with-panel' : 'session-page'}><aside>
      <h1>strike a<br />pose.</h1>
      <Script text="don't be shy!" />
      <div className="progress-label">CAPTURED <b>{shots}</b> / MAX {pb.MAX_SHOTS} <small>NEED {pb.totalShots} FINAL</small></div>
      <div className="progress"><span style={{ width: `${Math.min((shots / pb.MAX_SHOTS) * 100, 100)}%` }} /></div>
      <p>{'\u25A3'} &nbsp; UP TO 10 SHOTS, CHOOSE BEST {pb.totalShots}</p>
      <p>{'\u25CB'} &nbsp; {getFilterLabel(pb.filterKey)} FILTER</p>
      <p>{'\u25F7'} &nbsp; {pb.countdownDuration}S SHUTTER DELAY</p>
      <button className="button dark session-btn" onClick={handleCapture} disabled={!pb.ready || pb.isCapturing || sessionFull || finishing}>
        {pb.isCapturing ? 'CAPTURING...' : sessionFull ? 'MAX REACHED' : shots > 0 ? 'CAPTURE NEXT' : 'START SESSION'} <Camera size={16} />
      </button>
      {hasMinShots && !sessionFull && <button className="button light session-btn-skip" onClick={handleFinish} disabled={pb.isCapturing || finishing}><Check size={15} /> DONE — SELECT PHOTOS</button>}
      {sessionFull && <button className="button dark session-btn" onClick={handleFinish} disabled={pb.isCapturing || finishing}>SELECT BEST PHOTOS <ArrowRight size={16} /></button>}
    </aside><div className="session-camera">
      <div className="camera-feed-container session-feed">
        <CameraView filterKey={pb.filterKey} videoRef={pb.videoRef} facingMode={pb.facingMode} flash={pb.flash} countdown={pb.countdown} error={pb.error} ready={pb.ready} onRetry={() => pb.startCamera()} />
      </div>
      <div className="exposure">DEVICE CAMERA &nbsp; FRAME <b>#{shots}</b></div>
    </div>
    {showPanel && <SideToolsPanel filterKey={pb.filterKey} onPickFilter={pickFilter} template={pb.customization.template} onPickTemplate={pickTemplate} templates={SOLO_TEMPLATES} />}</section>
    <section className="shot-history section-pad">
      <span>SHOT HISTORY — TAP ANY PHOTO TO RETAKE</span>
      <div className="shot-boxes">{Array.from({ length: Math.max(shots, pb.totalShots) }).map((_, i) => <div key={i} className={i < shots ? 'has-photo' : ''} onClick={() => i < shots && !pb.isCapturing && !finishing && handleRetake(i)}>{i < shots ? <><img src={pb.capturedShots[i]} alt={`Shot ${i + 1}`} />{retakeIndex === i && <div className="retaking"><Loader2 className="spin" size={16} /> RETAKING</div>}<small className="retake-label">RETAKE</small></> : <Camera size={22} />}</div>)}</div>
      <p>Take up to 10 photos, then choose your best {pb.totalShots}. Tap any captured photo to retake it.</p>
    </section>
  </main>;
}

/* ============ SELECT (CHOOSE BEST PHOTOS) ============ */

function Select({ navigate, notify }: { navigate: (view: View) => void; notify: (message: string) => void }) {
  const pb = usePhotobooth();
  const [selected, setSelected] = useState<number[]>(pb.selectedShots);

  const toggle = (index: number) => {
    setSelected(prev => {
      if (prev.includes(index)) return prev.filter(i => i !== index);
      if (prev.length >= pb.totalShots) { notify(`You can only select ${pb.totalShots} photos`); return prev; }
      return [...prev, index];
    });
  };

  const handleContinue = () => {
    if (selected.length !== pb.totalShots) { notify(`Select ${pb.totalShots} photos`); return; }
    pb.setSelectedShotsBulk(selected);
    navigate('edit');
  };

  const handleRetakeSession = () => { pb.resetSession(); navigate('preview'); };

  return <main><section className="select-page section-pad">
    <button className="back-link" onClick={() => navigate('session')}><ArrowLeft size={14} /> BACK TO CAMERA</button>
    <Eyebrow text="PHOTO SELECTION" />
    <h1>CHOOSE YOUR<br />BEST SHOTS.</h1>
    <Script text={`select ${pb.totalShots} photos for your strip`} />
    <p>You captured {pb.capturedShots.length} photos. Select the {pb.totalShots} you want in your final photo strip. Selected: {selected.length} / {pb.totalShots}</p>
    <div className="select-grid">
      {pb.capturedShots.map((photo, i) => <div key={i} className={selected.includes(i) ? 'select-card selected' : 'select-card'} onClick={() => toggle(i)}>
        <img src={photo} alt={`Shot ${i + 1}`} />
        <div className="select-check">{selected.includes(i) && <><Check size={20} /> <span>#{selected.indexOf(i) + 1}</span></>}</div>
        <small>SHOT {i + 1}</small>
      </div>)}
    </div>
    <div className="select-actions">
      <button className="button light" onClick={handleRetakeSession}><RefreshCw size={15} /> START OVER</button>
      <button className="button dark" onClick={handleContinue} disabled={selected.length !== pb.totalShots}>CONTINUE TO CUSTOMIZE <ArrowRight size={16} /></button>
    </div>
  </section></main>;
}

/* ============ COUPLE: CREATE SESSION ============ */

function CoupleCreate({ navigate, notify, onCreated }: { navigate: (view: View) => void; notify: (message: string) => void; onCreated: (id: string) => void }) {
  const pb = usePhotobooth();
  const sync = useCoupleSync();
  const [label, setLabel] = useState('');
  const [shotCount, setShotCount] = useState(4);
  const [countdownSec, setCountdownSec] = useState(3);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (creating || !backendConfigured) return;
    if (!label.trim()) { notify('Enter your name and city'); return; }
    setCreating(true);
    try {
      pb.setMode('DOUBLE');
      pb.setTotalShots(shotCount);
      pb.setCountdownDuration(countdownSec);
      pb.resetSession();
      pb.setCustomization({ template: 'COUPLE' });
      const id = await sync.createSession(label.trim(), shotCount, countdownSec);
      notify('Session created! Share the link with your partner.');
      onCreated(id);
    } catch {
      notify('Failed to create session. Try again.');
    } finally {
      setCreating(false);
    }
  };

  return <main><section className="couple-create-page section-pad">
    <button className="back-link" onClick={() => navigate('modes')}><ArrowLeft size={14} /> BACK</button>
    <Eyebrow text="TOGETHER MODE" />
    <h1>CREATE A<br />COUPLE SESSION.</h1>
    <Script text="same booth, different places" />
    <p>Set up a shared photobooth session for you and your partner. You'll get a link to send them — when they join, both cameras sync up for simultaneous capture.</p>
    <form id="create-couple" className="couple-form" onSubmit={event => { event.preventDefault(); void handleCreate(); }}>
      <label>YOUR NAME &amp; CITY<small>e.g. "MIA / MANILA"</small>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Your name / your city" required maxLength={40} />
      </label>
      <label>NUMBER OF FINAL PHOTOS
        <div className="shot-selector">{SHOT_OPTIONS.map(n => <button type="button" key={n} className={shotCount === n ? 'selected' : ''} onClick={() => setShotCount(n)}>{n}</button>)}</div>
      </label>
      <label>COUNTDOWN DURATION
        <div className="shot-selector">{COUNTDOWN_OPTIONS.map(n => <button type="button" key={n} className={countdownSec === n ? 'selected' : ''} onClick={() => setCountdownSec(n)}>{n}s</button>)}</div>
      </label>
    </form>
    <button form="create-couple" type="submit" className="button dark" disabled={creating || !backendConfigured}>
      {creating ? <><Loader2 className="spin" size={16} /> CREATING...</> : <>CREATE SESSION <ArrowRight size={16} /></>}
    </button>
    {!backendConfigured && <div className="couple-error" role="status">Long-distance sessions require a connected backend. Solo capture and this device’s gallery are available.</div>}
    {sync.error && <div className="couple-error" role="alert">{sync.error}</div>}
  </section></main>;
}

/* ============ COUPLE: WAITING FOR PARTNER ============ */

function CoupleWaiting({ navigate, notify, sessionId, onBothReady }: { navigate: (view: View) => void; notify: (message: string) => void; sessionId: string | null; onBothReady: () => void }) {
  const sync = useCoupleSync();
  const [copied, setCopied] = useState(false);
  const joinedRef = useRef(false);

  const { loadSession, cleanup, session } = sync;
  useEffect(() => {
    if (sessionId) void loadSession(sessionId);
    return cleanup;
  }, [sessionId, loadSession, cleanup]);
  useEffect(() => {
    if (session?.partner_user_id && !joinedRef.current) {
      joinedRef.current = true; onBothReady();
    }
  }, [session?.partner_user_id, onBothReady]);

  const joinUrl = sessionId ? `${window.location.origin}${window.location.pathname}?join=${sessionId}` : '';
  const code = sync.session?.code || '------';

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(joinUrl); setCopied(true); notify('Link copied to clipboard!'); setTimeout(() => setCopied(false), 2000); }
    catch { notify('Copy failed — select and copy manually'); }
  };

  const shareLink = async () => {
    if (navigator.share) { try { await navigator.share({ title: 'Join my FLASHBACK session', url: joinUrl }); } catch { /* Sharing can be cancelled by the user. */ } }
    else { copyLink(); }
  };

  return <main><section className="couple-waiting-page section-pad">
    <button className="back-link" onClick={() => navigate('couple-create')}><ArrowLeft size={14} /> BACK</button>
    <Eyebrow text="WAITING FOR PARTNER" />
    <h1>INVITE YOUR<br />PARTNER.</h1>
    <Script text="share the love" />
    <div className="invite-card">
      <div className="invite-code"><small>SESSION CODE</small><b>{code}</b></div>
      <div className="invite-link-box"><Link2 size={18} /><input readOnly value={joinUrl} onClick={(e) => (e.target as HTMLInputElement).select()} /></div>
      <div className="invite-actions">
        <button className="button dark" onClick={copyLink}>{copied ? <><Check size={16} /> COPIED</> : <><Copy size={16} /> COPY LINK</>}</button>
        <button className="button light" onClick={shareLink}><Share2 size={16} /> SHARE</button>
      </div>
    </div>
    <div className="waiting-status">
      <div className="participant-indicator"><div className={sync.session?.host_ready ? 'dot ready' : 'dot'} /><span>YOU (HOST)</span><small>{sync.session?.host_label || 'Waiting...'}</small></div>
      <div className="participant-indicator"><div className={sync.session?.partner_ready ? 'dot ready' : 'dot'} /><span>PARTNER</span><small>{sync.session?.partner_label || 'Not joined yet'}</small></div>
    </div>
    <div className="waiting-visual">
      {!sync.session?.partner_ready ? <><Loader2 className="spin" size={32} /><p>Waiting for your partner to join...</p></> : <><Check size={32} /><p>Both ready! Starting session...</p></>}
    </div>
  </section></main>;
}

/* ============ COUPLE: JOIN SESSION ============ */

function CoupleJoin({ notify, onJoined }: { navigate: (view: View) => void; notify: (message: string) => void; onJoined: () => void }) {
  const pb = usePhotobooth();
  const sync = useCoupleSync();
  const [label, setLabel] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinId, setJoinId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jid = params.get('join');
    if (jid) setJoinId(jid);
  }, []);

  const handleJoin = async () => {
    if (joining || !backendConfigured) return;
    if (!label.trim()) { notify('Enter your name and city'); return; }
    if (!joinId) { notify('No session link found'); return; }
    setJoining(true);
    try {
      pb.setMode('DOUBLE');
      pb.resetSession();
      const s = await sync.joinSession(joinId, label.trim());
      if (s) { pb.setTotalShots(s.total_shots); pb.setCountdownDuration(s.countdown_seconds); pb.setCustomization({ template: 'COUPLE' }); notify('Joined session!'); onJoined(); }
    } catch { notify('Failed to join session'); }
    finally { setJoining(false); }
  };

  return <main><section className="couple-join-page section-pad">
    <Eyebrow text="JOIN SESSION" />
    <h1>JOIN YOUR<br />PARTNER.</h1>
    <Script text="the other half" />
    <p>Your partner has invited you to a FLASHBACK couple session. Enter your details to join and start capturing together.</p>
    <form id="join-couple" className="couple-form" onSubmit={event => { event.preventDefault(); void handleJoin(); }}>
      <label>YOUR NAME &amp; CITY<small>e.g. "ALEX / TOKYO"</small>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Your name / your city" required maxLength={40} />
      </label>
    </form>
    <button form="join-couple" type="submit" className="button dark" disabled={joining || !backendConfigured}>
      {joining ? <><Loader2 className="spin" size={16} /> JOINING...</> : <>JOIN SESSION <ArrowRight size={16} /></>}
    </button>
    {!backendConfigured && <div className="couple-error" role="status">Long-distance sessions require a connected backend. Solo capture and this device’s gallery are available.</div>}
    {sync.error && <div className="couple-error" role="alert">{sync.error}</div>}
    {!joinId && <div className="couple-error">No session link detected. Ask your partner to share the invite link.</div>}
  </section></main>;
}

/* ============ COUPLE: SYNCHRONIZED SESSION ============ */

function CoupleSession({ navigate, notify, onComplete }: { navigate: (view: View) => void; notify: (message: string) => void; onComplete: () => void }) {
  const pb = usePhotobooth();
  const sync = useCoupleSync();
  const [localCountdown, setLocalCountdown] = useState(0);
  const handledShot = useRef(-1);
  const { startCamera, reattach, ready, videoRef, facingMode, filterKey, replaceShots, setPartnerPhotos, setCustomization, setTotalShots, setCountdownDuration } = pb;
  const { session, sessionId, loadSession, cleanup, setReady, role, submitPhoto, finishCountdown } = sync;
  const isHost = role === 'host';
  const bothReady = session?.host_ready && session?.partner_ready;
  const myPhotos = (isHost ? session?.host_photos : session?.partner_photos) || [];
  const partnerPhotos = (isHost ? session?.partner_photos : session?.host_photos) || [];
  const shotsDone = Math.min(myPhotos.filter(Boolean).length, partnerPhotos.filter(Boolean).length);
  const allDone = shotsDone >= (session?.total_shots || 4);

  useEffect(() => { if (sessionId) void loadSession(sessionId); return cleanup; }, [sessionId, loadSession, cleanup]);
  useEffect(() => { void startCamera(); }, [startCamera]);
  useEffect(() => { if (ready) reattach(); }, [ready, reattach]);
  const ownReady = isHost ? session?.host_ready : session?.partner_ready;
  useEffect(() => {
    if (session && ownReady !== ready) void setReady(ready).catch(error => notify(error.message));
  }, [session, ownReady, ready, setReady, notify]);

  useEffect(() => {
    if (!session) return;
    const own = role === 'host' ? session.host_photos : session.partner_photos;
    const other = role === 'host' ? session.partner_photos : session.host_photos;
    replaceShots(own.filter(Boolean)); setPartnerPhotos(other.filter(Boolean));
    setTotalShots(session.total_shots); setCountdownDuration(session.countdown_seconds);
    setCustomization({ namesText: `${session.host_label} ♥ ${session.partner_label}` });
  }, [session, role, replaceShots, setPartnerPhotos, setTotalShots, setCountdownDuration, setCustomization]);

  const submitRef = useRef(submitPhoto);
  useEffect(() => { submitRef.current = submitPhoto; }, [submitPhoto]);
  const captureAt = session?.capture_at;
  const currentShot = session?.current_shot ?? 0;
  useEffect(() => {
    if (!captureAt || !ready || handledShot.current === currentShot) return;
    handledShot.current = currentShot;
    let cancelled = false;
    const deadline = new Date(captureAt).getTime();
    const tick = window.setInterval(() => setLocalCountdown(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))), 100);
    const timer = window.setTimeout(() => {
      window.clearInterval(tick); setLocalCountdown(0);
      if (cancelled) return;
      const photo = videoRef.current ? captureFromVideo(videoRef.current, facingMode, getFilterCss(filterKey)) : null;
      if (photo) void submitRef.current(photo, currentShot).catch(error => notify(error.message));
      else { notify('Camera frame unavailable. Reconnect your camera.'); }
    }, Math.max(0, deadline - Date.now()));
    return () => { cancelled = true; window.clearInterval(tick); window.clearTimeout(timer); handledShot.current = -1; };
  }, [captureAt, currentShot, ready, videoRef, facingMode, filterKey, notify]);

  useEffect(() => {
    if (isHost && session?.countdown_active && session.host_photos[currentShot] && session.partner_photos[currentShot]) {
      void finishCountdown().catch(error => notify(error.message));
    }
  }, [isHost, session, currentShot, finishCountdown, notify]);

  const handleStartSynced = async () => {
    try { await sync.startCountdown(); } catch (error) { notify(error instanceof Error ? error.message : 'Could not start capture'); }
  };
  const handleComplete = async () => {
    if (!allDone) return;
    try {
      if (isHost) { const strip = await pb.generateStrip(); if (strip) await sync.completeSession(strip); }
      onComplete();
    } catch (error) { notify(error instanceof Error ? error.message : 'Could not complete shared session'); }
  };

  return <main>
    <div className="session-bar">
      <span className="live-dot" /> COUPLE SESSION
      <span className="shot-count">{Array.from({ length: sync.session?.total_shots || 4 }).map((_, i) => <i className={i < shotsDone ? 'filled' : ''} key={i} />)} SHOT {Math.max(shotsDone, 1)} / {sync.session?.total_shots || 4}</span>
      <span className="camera-details">CODE <b>{sync.session?.code}</b> ROLE <b>{isHost ? 'HOST' : 'PARTNER'}</b></span>
    </div>
    {sync.error && <p className="couple-error" role="alert">{sync.error}</p>}
    <section className="session-page couple-session-page">
      <aside>
        <button className="back-link" onClick={() => navigate('modes')}><ArrowLeft size={14} /> EXIT</button>
        <h1>together<br />apart.</h1>
        <Script text="sync those lenses!" />
        <div className="couple-labels">
          <div className="participant-indicator"><div className={sync.session?.host_ready ? 'dot ready' : 'dot'} /><span>{sync.session?.host_label || 'HOST'}</span></div>
          <div className="participant-indicator"><div className={sync.session?.partner_ready ? 'dot ready' : 'dot'} /><span>{sync.session?.partner_label || 'PARTNER'}</span></div>
        </div>
        <div className="progress-label">SYNC PROGRESS <b>{Math.round((shotsDone / (sync.session?.total_shots || 4)) * 100)}%</b></div>
        <div className="progress"><span style={{ width: `${(shotsDone / (sync.session?.total_shots || 4)) * 100}%` }} /></div>
        {!bothReady && <p className="waiting-text">Waiting for both partners to connect cameras...</p>}
        {bothReady && !allDone && <p className="ready-text">Both ready! {isHost ? 'Press START to capture together.' : 'Host will start the session.'}</p>}
        {allDone && <p className="ready-text">All shots captured! Generate your strip.</p>}
        {isHost && bothReady && !allDone && <button className="button dark session-btn" onClick={handleStartSynced} disabled={localCountdown > 0 || Boolean(session?.countdown_active)}>{localCountdown > 0 ? `COUNTDOWN ${localCountdown}` : 'START SYNCED CAPTURE'} <Camera size={16} /></button>}
        {allDone && <button className="button dark session-btn" onClick={handleComplete}>GENERATE STRIP <ArrowRight size={16} /></button>}
      </aside>
      <div className="session-camera couple-session-camera">
        <div className="camera-feed-container session-feed">
          <CameraView filterKey={pb.filterKey} videoRef={pb.videoRef} facingMode={pb.facingMode} flash={pb.flash} countdown={localCountdown} error={pb.error} ready={pb.ready} onRetry={() => pb.startCamera()} />
        </div>
        <div className="couple-photos-preview">
          <div className="photo-column"><small>YOU</small>{myPhotos.map((p, i) => <img key={i} src={p} alt={`My shot ${i + 1}`} />)}</div>
          {partnerPhotos.length > 0 && <div className="photo-column"><small>PARTNER</small>{partnerPhotos.map((p, i) => <img key={i} src={p} alt={`Partner shot ${i + 1}`} />)}</div>}
        </div>
      </div>
    </section>
    <section className="shot-history section-pad">
      <span>SYNCED SHOT HISTORY</span>
      <div className="shot-boxes">{Array.from({ length: sync.session?.total_shots || 4 }).map((_, i) => <div key={i}>{i < myPhotos.length ? <img src={myPhotos[i]} alt={`Shot ${i + 1}`} /> : <Camera size={22} />}</div>)}</div>
      <p>Your photos sync with your partner in real-time. The final strip will combine both perspectives.</p>
    </section>
  </main>;
}

function captureFromVideo(video: HTMLVideoElement, facingMode: 'user' | 'environment', filterCss: string): string | null {
  if (!video.videoWidth || !video.videoHeight) return null;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.save();
  if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
  ctx.filter = filterCss || 'none';
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();
  return canvas.toDataURL('image/jpeg', 0.92);
}

/* ============ EDIT / CUSTOMIZATION ============ */

function Edit({ navigate, notify }: { navigate: (view: View) => void; notify: (message: string) => void }) {
  const pb = usePhotobooth();
  const [editTab, setEditTab] = useState<'TEMPLATE' | 'BACKGROUND' | 'BORDER' | 'TEXT' | 'STICKERS' | 'ORIENTATION'>('TEMPLATE');
  const templates = pb.mode === 'DOUBLE' ? COUPLE_TEMPLATES : SOLO_TEMPLATES;
  const bgKeys = Object.keys(STRIP_BACKGROUNDS);
  const borderKeys = Object.keys(STRIP_BORDERS);
  const textColors = Object.keys(TEXT_COLORS);
  const accentColors = Object.keys(ACCENT_COLORS);

  const { generateStrip, capturedShots, customization } = pb;
  useEffect(() => {
    if (!capturedShots.length) return;
    const timer = window.setTimeout(() => { void generateStrip().catch(error => notify(error.message)); }, 300);
    return () => window.clearTimeout(timer);
  }, [capturedShots.length, customization, generateStrip, notify]);

  const updateCustom = (patch: Partial<typeof pb.customization>) => pb.setCustomization(patch);

  const addSticker = (emoji: string) => {
    updateCustom({ stickers: [...pb.customization.stickers, { emoji, x: 0.1 + Math.random() * 0.8, y: 0.1 + Math.random() * 0.8, size: 1 }] });
    notify('Sticker added!');
  };

  const removeStickers = () => { updateCustom({ stickers: [] }); notify('Stickers cleared'); };

  return <main>
    <div className="edit-toolbar">
      <button onClick={() => navigate(pb.mode === 'DOUBLE' ? 'couple-session' : 'select')}><ArrowLeft size={15} /> BACK</button>
      <span>LIVE EDITING</span>
      <button onClick={() => { pb.setCustomization(DEFAULT_CUSTOMIZATION); notify('Edits reset'); }}>RESET</button>
      <button className="button dark" disabled={pb.stripLoading || !pb.stripDataUrl} onClick={async () => { try { const strip = await pb.generateStrip(); if (strip) navigate('result'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not generate strip'); } }}>NEXT STEP <ArrowRight size={15} /></button>
    </div>
    <section className="edit-page">
      <aside>
        <Eyebrow text="CUSTOMIZE" />
        <div className="edit-tabs">
          {(['TEMPLATE', 'ORIENTATION', 'BACKGROUND', 'BORDER', 'TEXT', 'STICKERS'] as const).map(t => <button key={t} className={editTab === t ? 'selected' : ''} onClick={() => setEditTab(t)}>{t}</button>)}
        </div>

        {editTab === 'TEMPLATE' && <div className="edit-section">
          {templates.map(item => {
            const def = TEMPLATE_LAYOUTS[item];
            return <button key={item} className={pb.customization.template === item ? 'template selected' : 'template'} onClick={() => updateCustom({ template: item })}>
              {def?.label || item}{pb.customization.template === item && <Check size={15} />}
              <small>{def?.desc || ''} — {def?.slots} frame{def && def.slots > 1 ? 's' : ''}</small>
            </button>;
          })}
        </div>}

        {editTab === 'BACKGROUND' && <div className="edit-section">
          <p className="edit-hint">Choose a background color for your strip. Dark backgrounds work well with light text.</p>
          <div className="color-grid">
            {bgKeys.map(bg => <button key={bg} className={pb.customization.background === bg ? 'color-swatch selected' : 'color-swatch'} onClick={() => updateCustom({ background: bg })} style={{ background: STRIP_BACKGROUNDS[bg] }}><small>{bg.replace('_', ' ')}</small></button>)}
          </div>
          <div className="edit-subsection">
            <small className="edit-sub-label">TEXTURE OVERLAY</small>
            <div className="texture-grid">
              {Object.keys(STRIP_TEXTURES).map(tex => {
                const def = STRIP_TEXTURES[tex];
                return (
                  <button key={tex} className={pb.customization.texture === tex ? 'texture-item selected' : 'texture-item'} onClick={() => updateCustom({ texture: tex })}>
                    <span className="texture-preview" data-tex={def.overlay} />
                    <small>{def.label}</small>
                    {pb.customization.texture === tex && <Check size={12} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>}

        {editTab === 'BORDER' && <div className="edit-section">
          <p className="edit-hint">Choose a border style for your photo strip.</p>
          <div className="border-list">
            {borderKeys.map(bd => (
              <button key={bd} className={pb.customization.border === bd ? 'border-item selected' : 'border-item'} onClick={() => updateCustom({ border: bd })}>
                <span className="border-preview" style={{ border: STRIP_BORDERS[bd] !== 'none' ? STRIP_BORDERS[bd] : '1px solid #eee' }} />
                <span>{bd.replace('_', ' ')}</span>
                {pb.customization.border === bd && <Check size={14} />}
              </button>
            ))}
          </div>
          <div className="edit-subsection">
            <small className="edit-sub-label">TEXT COLOR</small>
            <div className="color-grid small">
              {textColors.map(tc => <button key={tc} className={pb.customization.textColor === tc ? 'color-swatch selected' : 'color-swatch'} onClick={() => updateCustom({ textColor: tc })} style={{ background: TEXT_COLORS[tc] || 'transparent' }}><small>{tc}</small></button>)}
            </div>
          </div>
          <div className="edit-subsection">
            <small className="edit-sub-label">ACCENT COLOR</small>
            <div className="color-grid small">
              {accentColors.map(ac => <button key={ac} className={pb.customization.accentColor === ac ? 'color-swatch selected' : 'color-swatch'} onClick={() => updateCustom({ accentColor: ac })} style={{ background: ACCENT_COLORS[ac] || 'transparent' }}><small>{ac}</small></button>)}
            </div>
          </div>
        </div>}

        {editTab === 'TEXT' && <div className="edit-section text-custom">
          <label>TITLE<small>Strip header text</small><input value={pb.customization.titleText} onChange={e => updateCustom({ titleText: e.target.value })} placeholder="FLASHBACK STUDIO" maxLength={30} /></label>
          <label>NAMES<small>Couple or person names</small><input value={pb.customization.namesText} onChange={e => updateCustom({ namesText: e.target.value })} placeholder={pb.mode === 'DOUBLE' ? 'MIA \u2665 ALEX' : 'YOUR NAME'} maxLength={40} /></label>
          <label>LOCATION<small>City or cities</small><input value={pb.customization.locationText} onChange={e => updateCustom({ locationText: e.target.value })} placeholder={pb.mode === 'DOUBLE' ? 'MANILA \u00d7 TOKYO' : 'YOUR CITY'} maxLength={40} /></label>
          <label>DATE<small>Date text</small><input value={pb.customization.dateText} onChange={e => updateCustom({ dateText: e.target.value })} placeholder={new Date().toLocaleDateString('en-US')} maxLength={20} /></label>
          <label>MESSAGE<small>A short caption</small><input value={pb.customization.messageText} onChange={e => updateCustom({ messageText: e.target.value })} placeholder={pb.mode === 'DOUBLE' ? 'same booth, different places.' : 'a moment to remember'} maxLength={60} /></label>
        </div>}

        {editTab === 'ORIENTATION' && <div className="edit-section">
          <p className="edit-hint">Choose your strip orientation. Portrait is the classic vertical photobooth strip. Landscape gives a wider, more cinematic layout.</p>
          <div className="orientation-choice">
            {(['portrait', 'landscape'] as StripOrientation[]).map(o => (
              <button key={o} className={pb.customization.orientation === o ? 'orientation-card selected' : 'orientation-card'} onClick={() => updateCustom({ orientation: o })}>
                <div className={o === 'portrait' ? 'orientation-visual portrait' : 'orientation-visual landscape'}>
                  <span />
                  <span />
                </div>
                <strong>{o === 'portrait' ? 'PORTRAIT' : 'LANDSCAPE'}</strong>
                <small>{o === 'portrait' ? 'Classic vertical strip' : 'Wide cinematic layout'}</small>
                {pb.customization.orientation === o && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>}

        {editTab === 'STICKERS' && <div className="edit-section">
          <div className="sticker-grid">{STICKER_OPTIONS.map(s => <button key={s} className="sticker-btn" onClick={() => addSticker(s)}>{s}</button>)}</div>
          {pb.customization.stickers.length > 0 && <button className="button light" onClick={removeStickers} style={{ marginTop: 12, width: '100%', minHeight: 36 }}>CLEAR STICKERS ({pb.customization.stickers.length})</button>}
        </div>}

        <div className="metadata">
          <Eyebrow text="STRIP_METADATA" />
          <span>TEMPLATE <b>{TEMPLATE_LAYOUTS[pb.customization.template]?.label || pb.customization.template}</b></span>
          <span>SHOTS <b>{String(pb.selectedShots.length || pb.capturedShots.slice(0, TEMPLATE_LAYOUTS[pb.customization.template]?.slots || 4).length).padStart(2, '0')}</b></span>
          <span>MODE <b>{pb.mode}</b></span>
        </div>
      </aside>

      <div className="strip-stage">
        <Script text="make it yours!" />
        <div className={`photo-strip ${pb.customization.template === '35MM FILM' ? 'film' : ''}`} style={{ border: STRIP_BORDERS[pb.customization.border] !== 'none' ? STRIP_BORDERS[pb.customization.border] : undefined }}>
          {pb.stripLoading && <div className="strip-loading"><Loader2 className="spin" size={22} /></div>}
          {pb.stripDataUrl && <img src={pb.stripDataUrl} alt="Your photo strip" />}
          <small>{pb.customization.titleText || 'FLASHBACK STUDIO'}<br />{pb.customization.namesText && <>{pb.customization.namesText}<br /></>}{pb.customization.locationText && <>{pb.customization.locationText}<br /></>}{pb.customization.dateText || new Date().toLocaleDateString('en-US')}</small>
        </div>
        <p className="edit-hint">Preview fitted to your screen. Downloads retain the full image size.</p>
      </div>

      <aside className="intel">
        <Eyebrow text="SESSION_INTEL" />
        <p>TIMESTAMP <b>{new Date().toLocaleDateString('en-US')}</b></p>
        <p>LOCATION <b>{pb.mode === 'DOUBLE' ? 'LONG-DISTANCE' : 'VIRTUAL STUDIO'}</b></p>
        <p>SHOTS <b>{String(pb.capturedShots.length).padStart(2, '0')} CAPTURED</b></p>
        <p>FILTER <b>{getFilterLabel(pb.filterKey)}</b></p>
        <div className="social-ready"><Share2 size={16} /> SOCIAL READY<p>Download your customized strip as a JPEG to share in your favorite app.</p></div>
        <button className="button dark" onClick={() => { if (pb.stripDataUrl) { downloadDataUrl(pb.stripDataUrl, 'flashback-strip.jpg'); notify('High-res download started'); } else { notify('Generating...'); void pb.generateStrip().catch(error => notify(error.message)); } }}><Download size={16} /> DOWNLOAD STRIP</button>
      </aside>
    </section>
  </main>;
}

/* ============ RESULT ============ */

function Result({ navigate, notify }: { navigate: (view: View) => void; notify: (message: string) => void }) {
  const pb = usePhotobooth();
  const [savedStrip, setSavedStrip] = useState(false);
  const [savedVideo, setSavedVideo] = useState(false);
  const [saving, setSaving] = useState(false);
  const saved = pb.galleryItems.find(item => item.item_type === 'strip' && item.data_url === pb.stripDataUrl);
  const favorited = saved?.favorite ?? false;
  const isSavedStrip = savedStrip || Boolean(saved);
  const isSavedVideo = savedVideo || pb.galleryItems.some(item => item.item_type === 'video' && item.data_url === pb.videoBlobUrl);

  const stripImage = pb.stripDataUrl;

  const handleDownloadStrip = () => {
    if (pb.stripDataUrl) { downloadDataUrl(pb.stripDataUrl, 'flashback-masterpiece.jpg'); notify('Your strip is downloading'); }
    else notify('No strip to download yet');
  };

  const handleDownloadVideo = () => {
    if (pb.videoBlobUrl) { const a = document.createElement('a'); a.href = pb.videoBlobUrl; a.download = pb.videoBlobUrl.startsWith('data:video/mp4') ? 'flashback-session.mp4' : 'flashback-session.webm'; document.body.appendChild(a); a.click(); document.body.removeChild(a); notify('Session video downloading'); }
    else notify('No session video available');
  };

  const handleShare = async () => {
    if (navigator.share && pb.stripDataUrl) {
      try {
        const res = await fetch(pb.stripDataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'flashback-strip.jpg', { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'My Flashback Strip' }); return; }
      } catch { /* Sharing can be cancelled by the user. */ }
    }
    handleDownloadStrip(); notify('Image downloaded. Attach it in the app you want to share to.');
  };

  const save = async (type: 'strip' | 'video' | 'photo', favorite?: boolean) => {
    if (saving) return;
    const data = type === 'strip' ? pb.stripDataUrl : type === 'video' ? pb.videoBlobUrl : pb.capturedShots[0];
    if (!data) { notify('No media available to save'); return; }
    setSaving(true);
    try {
      await pb.saveToGallery({ item_type: type, data_url: data, thumbnail: pb.capturedShots[0], title: pb.customization.namesText || (type === 'video' ? 'Session video' : 'Untitled'), template: pb.customization.template, favorite });
      if (type === 'strip') setSavedStrip(true);
      if (type === 'video') setSavedVideo(true);
      notify('Saved to this device’s gallery');
    } catch (error) { notify(error instanceof Error ? error.message : 'Could not save media'); }
    finally { setSaving(false); }
  };
  const handleSaveStrip = () => save('strip');
  const handleSaveVideo = () => save('video');
  const handleSavePhotos = async () => {
    if (saving) return;
    setSaving(true);
    try { for (let index = 0; index < pb.capturedShots.length; index++) await pb.saveToGallery({ item_type: 'photo', data_url: pb.capturedShots[index], title: `Shot ${index + 1}` }); notify('Photos saved to this device'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Could not save photos'); }
    finally { setSaving(false); }
  };

  const handleTakeAnother = () => { pb.resetSession(); navigate(pb.mode === 'DOUBLE' ? 'couple-create' : 'preview'); };

  return <main><section className="result-page section-pad">
    <button className="back-link" onClick={handleTakeAnother}><ArrowLeft size={14} /> TAKE ANOTHER</button>
    <div className="result-title"><h1>your<br /><i>masterpiece.</i></h1>
    <div>SESSION <b>{pb.mode}</b> &nbsp; DATE <b>{new Date().toLocaleDateString('en-US')}</b> &nbsp; SHOTS <b>{pb.capturedShots.length}</b></div></div>
    <div className="result-grid">
      <div className="final-strip">
        <Script text="absolutely stunning!" />
        <img src={stripImage} alt="Finished photo strip" />
        <small>{pb.customization.titleText || 'FLASHBACK STUDIO'}<br />{pb.customization.namesText && <>{pb.customization.namesText}<br /></>}{pb.customization.locationText}<br />{pb.customization.dateText || new Date().toLocaleDateString('en-US')}</small>
        <div className="result-item-actions">
          <button className="button dark" onClick={handleDownloadStrip}><Download size={15} /> DOWNLOAD</button>
          <button className={isSavedStrip ? 'button light saved' : 'button light'} onClick={handleSaveStrip} disabled={isSavedStrip || saving || !pb.stripDataUrl}>{isSavedStrip ? <><Check size={15} /> SAVED</> : <><Heart size={15} /> SAVE</>}</button>
          <button className="button light" onClick={handleShare}><Share2 size={15} /> SHARE</button>
        </div>
      </div>
      <div className="result-actions">
        <div className="result-video">
          <h3>SESSION VIDEO</h3>
          {pb.videoBlobUrl ? <video src={pb.videoBlobUrl} controls /> : <div className="no-video"><Video size={28} /><p>No session video was recorded.</p></div>}
          <div className="result-item-actions">
            <button className="button dark" onClick={handleDownloadVideo} disabled={!pb.videoBlobUrl}><Download size={15} /> DOWNLOAD VIDEO</button>
            <button className={isSavedVideo ? 'button light saved' : 'button light'} onClick={handleSaveVideo} disabled={isSavedVideo || !pb.videoBlobUrl || saving}>{isSavedVideo ? <><Check size={15} /> SAVED</> : <><Heart size={15} /> SAVE VIDEO</>}</button>
          </div>
        </div>
        <p>{pb.mode === 'DOUBLE' ? 'Two locations, one memory. Your synchronized couple strip captures the magic of being together even when apart.' : 'We captured the moments between the flashes. Your session video records the full photobooth experience.'}</p>
        <div className="action-grid">
          <button className="button light" disabled={saving} onClick={() => void save('strip', !favorited)}><Heart size={16} fill={favorited ? 'currentColor' : 'none'} /> {favorited ? 'FAVORITED' : 'ADD TO FAVORITES'}</button>
          <button className="button light" disabled={saving} onClick={handleSavePhotos}>SAVE INDIVIDUAL PHOTOS</button>
          <button className="button light" onClick={() => navigate('gallery')}><Layout size={16} /> VIEW GALLERY</button>
        </div>
        <div className="want-more"><b>WANT MORE?</b><p>{pb.mode === 'DOUBLE' ? 'Try a different template or take another couple session with new filters and stickers.' : 'Try another template, color filter, or strip background for your next memory.'}</p><button onClick={handleTakeAnother}>TAKE ANOTHER <RefreshCw size={15} /></button></div>
      </div>
    </div>
  </section></main>;
}

/* ============ SHARED COMPONENTS ============ */

function Step({ number, title, text, image, reverse }: { number: string; title: string; text: string; image: string; reverse: boolean }) { return <div className={reverse ? 'step reverse' : 'step'}><div><Eyebrow text={`STEP ${number}`} /><h2>{title}</h2><p>{text}</p><div className="mini-spec"><span>INTERFACE <b>YOUR BROWSER</b></span><span>STORAGE <b>YOUR DEVICE</b></span></div></div><img src={image} alt={title} /></div>; }
function Experience({ image, label, title, text, onClick }: { image: string; label: string; title: string; text: string; onClick: () => void }) { return <article className="experience"><img src={image} alt={title} /><Script text={label.toLowerCase()} /><h2>{title}</h2><p>{text}</p><button className="square-button" aria-label={`Start ${title.toLowerCase()}`} onClick={onClick}><ArrowRight /></button></article>; }
function ModeCard({ icon, title, text, action, onClick }: { icon: React.ReactNode; title: string; text: string; action: string; onClick: () => void }) { return <article className="mode-card">{icon}<h3>{title}</h3><p>{text}</p><button onClick={onClick}>{action} <ArrowRight size={15} /></button></article>; }
function Eyebrow({ text }: { text: string }) { return <span className="eyebrow">{text}</span>; }
function Script({ text }: { text: string }) { return <span className="script">{text}</span>; }
function InformationPage({ view }: { view: 'privacy' | 'terms' }) {
  return <main className="section-pad information-page"><Eyebrow text="FLASHBACK STUDIO" /><h1>{view === 'privacy' ? 'YOUR PRIVACY.' : 'USING FLASHBACK.'}</h1>
    {view === 'privacy' ? <><p>Solo photos, saved memories, and your current draft are stored in this browser using device storage. FlashBack does not send solo media to a server.</p><p>Use Delete in the gallery to remove saved memories. Starting over clears the current draft. Clearing this site’s browser data removes all locally saved memories. Download anything you want to keep.</p><p>If a Supabase backend is configured, shared sessions send participant labels and photos to that backend so the two participants can capture together. A private anonymous session identifies each participant. Anyone with an unused invite link can claim the partner’s place, so share it only with your intended partner.</p></> : <><p>Allow camera access to take photos. Use a secure HTTPS connection or localhost. Recording depends on browser support.</p><p>Capture only with the consent of the people in your photos. Keep downloaded backups: browser storage can be cleared or evicted and does not sync between devices.</p><p>This version provides browser photography and device storage. It does not offer event bookings, SMS, email delivery, or professional studio hardware. Long-distance capture requires a configured backend.</p></>}
  </main>;
}
function Footer({ navigate }: { navigate: (view: View) => void }) { return <footer><div><b>FLASHBACK</b><p>Capture a moment, wherever you are.</p><p>Your camera. Your memories.</p></div><div className="footer-bottom"><span>&copy; 2026 FLASHBACK STUDIO.</span><span><button onClick={() => navigate('privacy')}>Privacy</button> <button onClick={() => navigate('terms')}>Terms</button></span></div></footer>; }

export default App;

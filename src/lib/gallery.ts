// Device-private persistence: media belongs to this browser, never a public table.
export type GalleryItem = {
  id: string;
  item_type: 'photo' | 'strip' | 'video';
  data_url: string;
  thumbnail: string;
  title: string;
  template: string;
  mode: string;
  favorite: boolean;
  created_at: string;
  updated_at: string;
};
export type GalleryInput = Pick<GalleryItem, 'item_type' | 'data_url'> & Partial<Pick<GalleryItem, 'thumbnail' | 'title' | 'template' | 'favorite'>>;

let databasePromise: Promise<IDBDatabase> | null = null;
function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('flashback-device', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('gallery', { keyPath: 'id' });
      request.result.createObjectStore('draft');
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => { request.result.close(); databasePromise = null; };
      resolve(request.result);
    };
    request.onerror = () => { databasePromise = null; reject(new Error('Device storage is unavailable. Download your media to keep it.')); };
  });
  return databasePromise;
}

export async function deviceStore<T>(store: 'gallery' | 'draft', mode: IDBTransactionMode, operation: (objectStore: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const request = operation(tx.objectStore(store));
    tx.oncomplete = () => resolve(request.result);
    tx.onabort = tx.onerror = () => { reject(new Error(tx.error?.name === 'QuotaExceededError' ? 'Device storage is full. Delete older items or download your media.' : 'Could not save changes to device storage.')); };
  });
}

export async function listGallery() {
  const items = await deviceStore<GalleryItem[]>('gallery', 'readonly', store => store.getAll());
  return items.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function saveGallery(input: GalleryInput, mode: string) {
  if (!/^data:(image|video)\//.test(input.data_url)) throw new Error('Media must be a persistent image or video.');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input.data_url));
  const contentId = `${input.item_type}-${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
  const items = await listGallery();
  // Saving twice updates the original record rather than duplicating large media.
  const existing = items.find(item => item.item_type === input.item_type && item.data_url === input.data_url);
  const now = new Date().toISOString();
  const item: GalleryItem = {
    id: existing?.id || contentId, item_type: input.item_type,
    data_url: input.data_url, thumbnail: input.thumbnail || '', title: input.title?.trim() || 'Untitled',
    template: input.template || '', mode, favorite: input.favorite ?? existing?.favorite ?? false,
    created_at: existing?.created_at || now, updated_at: now,
  };
  await deviceStore('gallery', 'readwrite', store => store.put(item));
  return item;
}

export async function updateGallery(id: string, patch: { title?: string; favorite?: boolean }) {
  const item = await deviceStore<GalleryItem | undefined>('gallery', 'readonly', store => store.get(id));
  if (!item) throw new Error('This saved item no longer exists. Refresh the gallery.');
  if (patch.title !== undefined && !patch.title.trim()) throw new Error('Enter a title.');
  await deviceStore('gallery', 'readwrite', store => store.put({ ...item, ...patch, title: patch.title?.trim() || item.title, updated_at: new Date().toISOString() }));
}

export async function deleteGallery(id: string) {
  await deviceStore('gallery', 'readwrite', store => store.delete(id));
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the recording.'));
    reader.readAsDataURL(blob);
  });
}

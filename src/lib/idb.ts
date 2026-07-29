// Tiny IndexedDB blob store for offline downloads.
const DB_NAME = "rbmusic";
const DB_VER = 1;
const STORE = "downloads";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const r = fn(t.objectStore(STORE));
    r.onsuccess = () => resolve(r.result as T);
    r.onerror = () => reject(r.error);
  });
}

export async function putBlob(id: string, blob: Blob) {
  await tx("readwrite", (s) => s.put(blob, id));
}
export async function getBlob(id: string): Promise<Blob | undefined> {
  return tx<Blob | undefined>("readonly", (s) => s.get(id) as IDBRequest<Blob | undefined>);
}
export async function delBlob(id: string) {
  await tx("readwrite", (s) => s.delete(id));
}
export async function hasBlob(id: string): Promise<boolean> {
  const k = await tx<IDBValidKey | undefined>("readonly", (s) => s.getKey(id) as IDBRequest<IDBValidKey | undefined>);
  return k !== undefined;
}
export async function allKeys(): Promise<string[]> {
  const keys = await tx<IDBValidKey[]>("readonly", (s) => s.getAllKeys() as IDBRequest<IDBValidKey[]>);
  return keys.map(String);
}
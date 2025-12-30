// IndexedDB storage for photos (much larger quota than localStorage)
const DB_NAME = 'diary-photos-db';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

interface StoredPhoto {
  id: string; // filename as key
  base64: string;
  dateKey: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });

  return dbPromise;
};

export const savePhotoToIDB = async (filename: string, base64: string, dateKey: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put({ id: filename, base64, dateKey });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to save photo to IndexedDB:', e);
  }
};

export const getPhotoFromIDB = async (filename: string): Promise<string | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(filename);
      request.onsuccess = () => resolve(request.result?.base64 || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to get photo from IndexedDB:', e);
    return null;
  }
};

export const deletePhotoFromIDB = async (filename: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(filename);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to delete photo from IndexedDB:', e);
  }
};

export const getAllPhotosFromIDB = async (): Promise<StoredPhoto[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to get all photos from IndexedDB:', e);
    return [];
  }
};

// Migration: Move photos from localStorage to IndexedDB
export const migratePhotosToIDB = async (): Promise<void> => {
  const STORAGE_KEY = 'diary-app-data';
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return;

    const parsed = JSON.parse(data);
    let hasPhotosToMigrate = false;
    let photosToSave: { filename: string; base64: string; dateKey: string }[] = [];

    // Collect all photos with base64 data
    for (const [dateKey, value] of Object.entries(parsed)) {
      const dayData = value as { photos?: { filename: string; base64?: string }[] };
      if (Array.isArray(dayData.photos)) {
        for (const photo of dayData.photos) {
          if (photo.base64) {
            hasPhotosToMigrate = true;
            photosToSave.push({
              filename: photo.filename,
              base64: photo.base64,
              dateKey,
            });
          }
        }
      }
    }

    if (!hasPhotosToMigrate) return;

    // Save all photos to IndexedDB
    for (const photo of photosToSave) {
      await savePhotoToIDB(photo.filename, photo.base64, photo.dateKey);
    }

    // Remove base64 from localStorage to free up space
    for (const [dateKey, value] of Object.entries(parsed)) {
      const dayData = value as { photos?: { filename: string; base64?: string }[] };
      if (Array.isArray(dayData.photos)) {
        dayData.photos = dayData.photos.map(photo => ({
          ...photo,
          base64: undefined, // Remove base64 from localStorage
        }));
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    console.log(`Migrated ${photosToSave.length} photos to IndexedDB`);
  } catch (e) {
    console.error('Failed to migrate photos:', e);
  }
};
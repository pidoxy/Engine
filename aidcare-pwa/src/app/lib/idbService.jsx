import { openDB } from 'idb';

const DB_NAME = 'AidCareOfflineDB';
const DB_VERSION = 1;
const GUIDELINES_STORE_NAME = 'guidelines'; // For CHO/CHEW JSONs
const KB_METADATA_STORE_NAME = 'kb_metadata'; // For RAG metadata JSONs
const KB_INDEX_STORE_NAME = 'kb_indexes';    // For FAISS index Blobs

const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains(GUIDELINES_STORE_NAME)) {
        db.createObjectStore(GUIDELINES_STORE_NAME, { keyPath: 'id' }); // id like 'cho', 'chew'
      }
      if (!db.objectStoreNames.contains(KB_METADATA_STORE_NAME)) {
        db.createObjectStore(KB_METADATA_STORE_NAME, { keyPath: 'id' }); // id like 'chw_metadata'
      }
      if (!db.objectStoreNames.contains(KB_INDEX_STORE_NAME)) {
        db.createObjectStore(KB_INDEX_STORE_NAME, { keyPath: 'id' }); // id like 'chw_index_faiss'
      }

    },
  });
};

export const saveData = async (storeName, data) => {
  const db = await initDB();
  const tx = db.transaction(storeName, 'readwrite');
  await tx.store.put(data); 
  await tx.done;
};

export const getData = async (storeName, key) => {
  const db = await initDB();
  return db.get(storeName, key);
};
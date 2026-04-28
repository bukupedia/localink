/**
 * db.js - IndexedDB Module
 * 
 * IndexedDB Schema Design:
 * - Database: 'url-shortener-db'
 * - Version: 1
 * - Object Store: 'urls'
 *   - Key: 'id' (auto-increment integer, converted to Base62 short ID)
 *   - Indexes:
 *     - 'shortId' (unique): For O(1) lookup by short URL ID
 *     - 'originalUrl': Full URL that was shortened
 *     - 'createdAt': Timestamp of creation (for sorting)
 * 
 * The schema uses natural keys with indexed shortId for fast lookups.
 * This ensures O(1) redirect performance.
 */

const DB_NAME = 'url-shortener-db';
const DB_VERSION = 1;
const STORE_NAME = 'urls';

let dbInstance = null;

/**
 * Opens and returns the IndexedDB connection
 * Handles version upgrades for schema migrations
 * @returns {Promise<IDBDatabase>}
 */
export async function openDB() {
  return new Promise((resolve, reject) => {
    // If already connected, return cached instance
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Handle database upgrades (schema migrations)
    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create URLs object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        });

        // Create unique index on shortId for O(1) lookups
        store.createIndex('shortId', 'shortId', { unique: true });

        // Create index on originalUrl for searching
        store.createIndex('originalUrl', 'originalUrl', { unique: false });

        // Create index on createdAt for sorting
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    // Handle successful database open
    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    // Handle errors
    request.onerror = (event) => {
      reject(new Error(`IndexedDB error: ${event.target.error?.message || 'Unknown error'}`));
    };
  });
}

/**
 * Add a new URL entry to the database
 * @param {Object} urlEntry - { shortId, originalUrl, createdAt }
 * @returns {Promise<number>} - The auto-generated ID
 */
export async function addURL(urlEntry) {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Include shortId in the record
    const record = {
      shortId: urlEntry.shortId,
      originalUrl: urlEntry.originalUrl,
      createdAt: urlEntry.createdAt || Date.now()
    };

    const request = store.add(record);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to add URL: ${event.target.error?.message || 'Constraint error'}`));
    };
  });
}

/**
 * Get URL entry by short ID
 * @param {string} shortId - The 6-character short ID
 * @returns {Promise<Object|null>} - The URL entry or null if not found
 */
export async function getURLByShortId(shortId) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('shortId');
    const request = index.get(shortId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to get URL: ${event.target.error?.message}`));
    };
  });
}

/**
 * Get all URL entries sorted by creation date (newest first)
 * @returns {Promise<Array>} - Array of URL entries
 */
export async function getAllURLs() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by createdAt descending (newest first)
      const entries = request.result || [];
      entries.sort((a, b) => b.createdAt - a.createdAt);
      resolve(entries);
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to get URLs: ${event.target.error?.message}`));
    };
  });
}

/**
 * Delete a URL entry by ID
 * @param {number} id - The database ID
 * @returns {Promise<void>}
 */
export async function deleteURL(id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to delete URL: ${event.target.error?.message}`));
    };
  });
}

/**
 * Delete a URL entry by short ID
 * @param {string} shortId - The 6-character short ID
 * @returns {Promise<void>}
 */
export async function deleteURLByShortId(shortId) {
  const entry = await getURLByShortId(shortId);
  if (entry) {
    await deleteURL(entry.id);
  }
}

/**
 * Clear all URL entries
 * @returns {Promise<void>}
 */
export async function clearAllURLs() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to clear URLs: ${event.target.error?.message}`));
    };
  });
}

/**
 * Check if a short ID already exists
 * @param {string} shortId - The 6-character short ID
 * @returns {Promise<boolean>} - True if exists
 */
export async function shortIdExists(shortId) {
  const entry = await getURLByShortId(shortId);
  return entry !== null;
}

/**
 * Get total URL count
 * @returns {Promise<number>}
 */
export async function getURLCount() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.count();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to count URLs: ${event.target.error?.message}`));
    };
  });
}

/**
 * Close the database connection
 */
export function closeDB() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
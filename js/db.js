/**
 * db.js - API Module
 * 
 * API calls to PHP backend for URL shortener.
 * Handles all CRUD operations via REST API.
 */

const API_BASE = '';

/**
 * Opens connection (no-op for API, kept for compatibility)
 * @returns {Promise<void>}
 */
export async function openDB() {
  return Promise.resolve();
}

/**
 * Add a new URL entry to the database
 * @param {Object} urlEntry - { shortId, originalUrl, createdAt }
 * @returns {Promise<number>} - The auto-generated ID
 */
export async function addURL(urlEntry) {
  const response = await fetch(`${API_BASE}/api/shorten`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: urlEntry.originalUrl })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add URL');
  }
  
  const result = await response.json();
  return result.id;
}

/**
 * Get URL entry by short ID
 * @param {string} shortId - The 6-character short ID
 * @returns {Promise<Object|null>} - The URL entry or null if not found
 */
export async function getURLByShortId(shortId) {
  const response = await fetch(`${API_BASE}/api/redirect/${shortId}`);
  
  if (response.status === 404) {
    return null;
  }
  
  if (!response.ok) {
    throw new Error('Failed to get URL');
  }
  
  const result = await response.json();
  return {
    id: 0,
    shortId: shortId,
    originalUrl: result.original_url,
    createdAt: Date.now()
  };
}

/**
 * Get all URL entries sorted by creation date (newest first)
 * @returns {Promise<Array>} - Array of URL entries
 */
export async function getAllURLs() {
  const response = await fetch(`${API_BASE}/api/urls`);
  
  if (!response.ok) {
    throw new Error('Failed to get URLs');
  }
  
  const result = await response.json();
  return result.urls || [];
}

/**
 * Delete a URL entry by ID
 * @param {number} id - The database ID
 * @returns {Promise<void>}
 */
export async function deleteURL(id) {
  const response = await fetch(`${API_BASE}/api/urls/${id}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete URL');
  }
}

/**
 * Delete a URL entry by short ID
 * @param {string} shortId - The 6-character short ID
 * @returns {Promise<void>}
 */
export async function deleteURLByShortId(shortId) {
  // Need to get the ID first, then delete
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
  const response = await fetch(`${API_BASE}/api/clear`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error('Failed to clear URLs');
  }
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
  const response = await fetch(`${API_BASE}/api/count`);
  
  if (!response.ok) {
    throw new Error('Failed to count URLs');
  }
  
  const result = await response.json();
  return result.count;
}

/**
 * Close the database connection (no-op for API)
 */
export function closeDB() {
  // No-op for API
}
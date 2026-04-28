/**
 * shortener.js - URL Short ID Generator
 * 
 * Generates collision-safe 6-character Base62 IDs:
 * - Uses alphanumeric characters (a-z, A-Z, 0-9)
 * - Total possible combinations: 62^6 = ~56 billion unique IDs
 * - Collision detection via IndexedDB lookup
 * - Exponential backoff with max retries
 */

// Base62 character set (lowercase + uppercase + digits)
const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ID_LENGTH = 6;
const MAX_RETRIES = 10;

/**
 * Generates a random Base62 string of specified length
 * @param {number} length - Length of ID to generate
 * @returns {string} - Random Base62 encoded string
 */
function generateRandomId(length = ID_LENGTH) {
  let id = '';
  for (let i = 0; i < length; i++) {
    id += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
  }
  return id;
}

/**
 * Generates a collision-free short ID
 * Checks IndexedDB to ensure uniqueness
 * @param {Function} existsCheck - Async function to check if ID exists
 * @returns {Promise<string>} - Unique 6-character short ID
 */
export async function generateShortId(existsCheck) {
  let attempts = 0;
  let shortId;

  do {
    shortId = generateRandomId(ID_LENGTH);
    attempts++;

    // Check if this ID already exists in the database
    const exists = await existsCheck(shortId);
    
    if (!exists) {
      return shortId;
    }

    // Exponential backoff: wait longer each retry
    if (attempts < MAX_RETRIES) {
      await new Promise(resolve => 
        setTimeout(resolve, Math.min(attempts * 10, 100))
      );
    }
  } while (attempts < MAX_RETRIES);

  // Fallback: Generate longer ID if retries exhausted
  if (attempts >= MAX_RETRIES) {
    // Try with 7 characters as fallback
    for (let len = 7; len <= 10; len++) {
      shortId = generateRandomId(len);
      const exists = await existsCheck(shortId);
      if (!exists) {
        return shortId;
      }
    }
  }

  throw new Error('Failed to generate unique short ID after maximum retries');
}

/**
 * Validates a URL string
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid URL
 */
export function isValidURL(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);
    // Only http and https protocols allowed
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Normalizes a URL (adds https if missing)
 * @param {string} url - URL to normalize
 * @returns {string} - Normalized URL
 */
export function normalizeURL(url) {
  url = url.trim();
  
  // Add https:// if protocol missing
  if (!url.match(/^https?:\/\//i)) {
    url = 'https://' + url;
  }
  
  return url;
}

/**
 * Gets the current base URL for the application
 * Used to construct short URLs
 * @returns {string} - Base URL
 */
export function getBaseURL() {
  // Get the current page's base path
  const pathParts = window.location.pathname.split('/');
  pathParts.pop(); // Remove index.html
  const basePath = pathParts.join('/') || '/';
  
  return window.location.origin + basePath;
}

/**
 * Constructs a full short URL
 * @param {string} shortId - The short ID
 * @returns {string} - Full short URL
 */
export function constructShortURL(shortId) {
  return `${getBaseURL()}?id=${shortId}`;
}

/**
 * Formats a date timestamp
 * @param {number} timestamp - Unix timestamp
 * @returns {string} - Formatted date string
 */
export function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
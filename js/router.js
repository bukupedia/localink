/**
 * router.js - URL Routing Module
 * 
 * Routing Logic:
 * - Parses URL search params for ?id= parameter
 * - On app load, checks for redirect mode via query param
 * - Uses PHP backend to resolve the redirect
 * - Handles missing/invalid IDs gracefully with error page
 */

import { getURLByShortId } from './db.js';

/**
 * Get the short ID from URL query parameters
 * @returns {string|null} - The short ID or null if not present
 */
export function getShortIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

/**
 * Check if the app is in redirect mode
 * @returns {boolean} - True if ?id= parameter is present
 */
export function isRedirectMode() {
  return getShortIdFromURL() !== null;
}

/**
 * Redirect to the original URL by short ID
 * Fetches original URL from API and redirects
 * @returns {Promise<boolean>} - True if redirect succeeded
 */
export async function redirectById() {
  const shortId = getShortIdFromURL();

  if (!shortId) {
    return false;
  }

  // Validate short ID format (Base62, 6-10 chars)
  if (!/^[a-zA-Z0-9]{6,10}$/.test(shortId)) {
    console.error('Invalid short ID format');
    return false;
  }

  try {
    const entry = await getURLByShortId(shortId);

    if (!entry) {
      console.error('Short URL not found:', shortId);
      return false;
    }

    // Validate original URL before redirect
    if (!entry.originalUrl) {
      console.error('Original URL is missing');
      return false;
    }

    // Use replace to avoid creating history entry
    // This prevents users from hitting back to return to the short URL
    window.location.replace(entry.originalUrl);
    return true;

  } catch (error) {
    console.error('Redirect error:', error);
    return false;
  }
}

/**
 * Handle redirect error - show error page
 * @param {string} message - Error message to display
 */
export function showRedirectError(message) {
  document.documentElement.innerHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Link Not Found - URL Shortener</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
      <style>
        body { 
          min-height: 100vh; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .error-card {
          background: white;
          border-radius: 1rem;
          padding: 3rem;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .error-icon {
          font-size: 4rem;
          color: #dc3545;
          margin-bottom: 1.5rem;
        }
      </style>
    </head>
    <body>
      <div class="error-card">
        <i class="fas fa-link-slash error-icon"></i>
        <h1 class="h3 mb-3">Link Not Found</h1>
        <p class="text-muted mb-4">${message || 'This short link does not exist or has been deleted.'}</p>
        <a href="${window.location.pathname}" class="btn btn-primary">
          <i class="fas fa-home me-2"></i>Go to Home
        </a>
      </div>
    </body>
    </html>
  `;
}

/**
 * Clear the query parameter from URL
 * Removes ?id= while keeping the page
 * Call this after successfully detecting redirect mode
 */
export function clearRedirectParam() {
  const url = new URL(window.location.href);
  url.search = '';
  window.history.replaceState({}, '', url.toString());
}
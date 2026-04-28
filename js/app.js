/**
 * app.js - Application Bootstrapped
 * 
 * Application Entry Point:
 * - Initializes IndexedDB connection
 * - Checks for redirect mode first (before UI)
 * - If redirect, attempts redirect and exits
 * - Otherwise, initializes the main UI
 * - Sets up event handlers and loads history
 * 
 * Non-blocking initialization for fast redirects.
 */

import { openDB, addURL, getAllURLs, deleteURL, clearAllURLs, shortIdExists } from './db.js';
import { generateShortId, constructShortURL } from './shortener.js';
import { isRedirectMode, redirectById, getShortIdFromURL } from './router.js';
import { renderHistory, setupEventListeners, showToast, setLoading, updateURLCount, showClearButton } from './ui.js';

/**
 * Main application initialization
 * Checks for redirect mode first
 */
export async function initApp() {
  // First: Check if we're in redirect mode (no UI needed)
  if (isRedirectMode()) {
    try {
      const success = await redirectById();
      if (!success) {
        // Not found - show error
        showRedirectError('This link does not exist or has been deleted.');
      }
    } catch (error) {
      console.error('Redirect failed:', error);
      showRedirectError('An error occurred while redirecting.');
    }
    return; // Don't initialize UI in redirect mode
  }

  // Second: Initialize the application UI
  await initializeUI();
}

/**
 * Initialize the main UI
 */
async function initializeUI() {
  try {
    // Initialize IndexedDB
    await openDB();

    // Set up event handlers
    setupEventListeners({
      onShorten: handleShorten,
      onDelete: handleDelete,
      onClear: handleClear,
      onCopy: handleCopy
    });

    // Load existing URLs
    await loadHistory();

  } catch (error) {
    console.error('Failed to initialize app:', error);
    showToast('Failed to initialize application', 'error');
  }
}

/**
 * Handle URL shortening
 * @param {string} normalizedURL - Validated and normalized URL
 */
async function handleShorten(normalizedURL) {
  setLoading(true);

  try {
    // Generate a unique short ID
    const shortId = await generateShortId(shortIdExists);

    // Add to database
    await addURL({
      shortId,
      originalUrl: normalizedURL,
      createdAt: Date.now()
    });

    // Show success message with the short URL
    const shortURL = constructShortURL(shortId);
    showToast(`URL shortened: ${shortURL}`, 'success');

    // Clear input
    const input = document.getElementById('urlInput');
    if (input) input.value = '';

    // Reload history
    await loadHistory();

  } catch (error) {
    console.error('Shorten error:', error);
    showToast('Failed to shorten URL', 'error');
  } finally {
    setLoading(false);
  }
}

/**
 * Handle delete operation
 * @param {number} id - Database ID
 */
async function handleDelete(id) {
  try {
    await deleteURL(id);
    showToast('URL deleted', 'success');
    await loadHistory();
  } catch (error) {
    console.error('Delete error:', error);
    showToast('Failed to delete URL', 'error');
  }
}

/**
 * Handle clear all operation
 */
async function handleClear() {
  try {
    await clearAllURLs();
    showToast('All URLs cleared', 'success');
    await loadHistory();
  } catch (error) {
    console.error('Clear error:', error);
    showToast('Failed to clear URLs', 'error');
  }
}

/**
 * Handle copy operation (placeholder for扩展)
 * @param {string} url - URL to copy
 */
async function handleCopy(url) {
  // Copy is handled in ui.js via event delegation
  // This is here for completeness
}

/**
 * Load and render history
 */
async function loadHistory() {
  try {
    const entries = await getAllURLs();
    
    // Render the history
    renderHistory(entries, handleDelete);

    // Update count
    updateURLCount(entries.length);

    // Show/hide clear button
    showClearButton(entries.length > 0);

  } catch (error) {
    console.error('Load history error:', error);
    showToast('Failed to load history', 'error');
  }
}

/**
 * Show redirect error page
 * @param {string} message - Error message
 */
function showRedirectError(message) {
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
        body { 
          min-height: 100vh; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Inter', sans-serif;
        }
        .error-card {
          background: white;
          border-radius: 1rem;
          padding: 3rem;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          max-width: 400px;
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

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
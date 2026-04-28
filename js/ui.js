/**
 * ui.js - UI Module
 * 
 * DOM Rendering & Event Handling:
 * - Handles URL input, validation, submission
 * - History table with URL, short link, date columns
 * - Copy-to-clipboard functionality
 * - Delete single entry and clear all history
 * - Toast notifications for feedback
 * - Empty state UI
 * 
 * Optimized for 100+ entries with efficient DOM updates.
 */

import { getAllURLs, addURL, deleteURL, clearAllURLs, shortIdExists } from './db.js';
import { generateShortId, isValidURL, normalizeURL, constructShortURL, formatDate } from './shortener.js';

/**
 * Shows a toast notification
 * @param {string} message - Toast message
 * @param {string} type - 'success', 'error', 'warning', 'info'
 */
export function showToast(message, type = 'info') {
  // Remove existing toasts
  const existingToast = document.querySelector('.toast-container');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast-container position-fixed top-0 end-0 p-3`;
  toast.style.zIndex = '9999';

  const icons = {
    success: 'fa-check-circle text-success',
    error: 'fa-exclamation-circle text-danger',
    warning: 'fa-exclamation-triangle text-warning',
    info: 'fa-info-circle text-info'
  };

  toast.innerHTML = `
    <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header">
        <i class="fas ${icons[type]} me-2"></i>
        <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
      </div>
      <div class="toast-body">${message}</div>
    </div>
  `;

  document.body.appendChild(toast);

  const bsToast = new bootstrap.Toast(toast.querySelector('.toast'), {
    animation: true,
    autohide: true,
    delay: 3000
  });
  bsToast.show();

  // Remove from DOM after hide
  toast.querySelector('.toast').addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
}

/**
 * Clears the history table
 */
function clearHistoryTable() {
  const tbody = document.getElementById('historyBody');
  if (tbody) {
    tbody.innerHTML = '';
  }
}

/**
 * Renders a single history row
 * @param {Object} entry - URL entry
 * @param {Function} onDelete - Delete callback
 * @returns {HTMLTableRowElement}
 */
function renderHistoryRow(entry, onDelete) {
  const tr = document.createElement('tr');
  tr.dataset.id = entry.id;
  tr.dataset.shortId = entry.shortId;

  const shortURL = constructShortURL(entry.shortId);
  const displayURL = entry.originalUrl.length > 60 
    ? entry.originalUrl.substring(0, 57) + '...' 
    : entry.originalUrl;

  tr.innerHTML = `
    <td class="text-truncate" style="max-width: 200px;" title="${entry.originalUrl}">
      <a href="${entry.originalUrl}" target="_blank" class="text-decoration-none">${displayURL}</a>
    </td>
    <td>
      <div class="input-group input-group-sm">
        <input type="text" class="form-control form-control-plaintext" 
               value="${shortURL}" readonly id="short-${entry.id}">
        <button class="btn btn-outline-secondary copy-btn" type="button" 
                data-short-id="${entry.shortId}" title="Copy link">
          <i class="fas fa-copy"></i>
        </button>
      </div>
    </td>
    <td class="text-muted small">${formatDate(entry.createdAt)}</td>
    <td>
      <button class="btn btn-sm btn-outline-danger delete-btn" 
              data-id="${entry.id}" title="Delete">
        <i class="fas fa-trash"></i>
      </button>
    </td>
  `;

  return tr;
}

/**
 * Renders the history table
 * @param {Array} entries - URL entries
 * @param {Function} onDelete - Delete callback
 */
export function renderHistory(entries, onDelete) {
  const tbody = document.getElementById('historyBody');
  const emptyState = document.getElementById('emptyState');
  const tableContainer = document.getElementById('tableContainer');

  if (!tbody) return;

  // Clear existing rows
  tbody.innerHTML = '';

  if (entries.length === 0) {
    // Show empty state
    if (emptyState) emptyState.classList.remove('d-none');
    if (tableContainer) tableContainer.classList.add('d-none');
    return;
  }

  // Hide empty state, show table
  if (emptyState) emptyState.classList.add('d-none');
  if (tableContainer) tableContainer.classList.remove('d-none');

  // Use DocumentFragment for efficient batch insertion
  const fragment = document.createDocumentFragment();
  
  entries.forEach(entry => {
    fragment.appendChild(renderHistoryRow(entry, onDelete));
  });

  tbody.appendChild(fragment);
}

/**
 * Gets the input URL value
 * @returns {string}
 */
export function getInputURL() {
  const input = document.getElementById('urlInput');
  return input ? input.value : '';
}

/**
 * Sets the input URL value
 * @param {string} value
 */
export function setInputURL(value) {
  const input = document.getElementById('urlInput');
  if (input) {
    input.value = value;
  }
}

/**
 * Validates URL input and shows feedback
 * @returns {Object} - { valid: boolean, normalized: string, error: string }
 */
export function validateInput() {
  const url = getInputURL().trim();
  
  if (!url) {
    return { valid: false, normalized: '', error: 'Please enter a URL' };
  }

  // Try to normalize
  let normalized;
  try {
    normalized = normalizeURL(url);
  } catch {
    return { valid: false, normalized: '', error: 'Invalid URL format' };
  }

  // Validate the normalized URL
  if (!isValidURL(normalized)) {
    return { valid: false, normalized: '', error: 'URL must start with http:// or https://' };
  }

  return { valid: true, normalized, error: '' };
}

/**
 * Sets loading state on button
 * @param {boolean} loading
 */
export function setLoading(loading) {
  const btn = document.getElementById('shortenBtn');
  const input = document.getElementById('urlInput');
  
  if (btn) {
    btn.disabled = loading;
    btn.innerHTML = loading 
      ? '<span class="spinner-border spinner-border-sm me-2"></span>Shortening...' 
      : '<i class="fas fa-link me-2"></i>Shorten URL';
  }

  if (input) {
    input.disabled = loading;
  }
}

/**
 * Sets up event listeners
 * @param {Object} handlers - { onShorten, onDelete, onClear, onCopy }
 */
export function setupEventListeners(handlers) {
  const form = document.getElementById('shortenForm');
  const clearBtn = document.getElementById('clearAllBtn');

  // Handle form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const validation = validateInput();
      
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return;
      }

      if (handlers.onShorten) {
        await handlers.onShorten(validation.normalized);
      }
    });
  }

  // Handle clear all button
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear all shortened URLs? This cannot be undone.')) {
        if (handlers.onClear) {
          await handlers.onClear();
        }
      }
    });
  }

  // Handle copy buttons (using event delegation)
  document.addEventListener('click', async (e) => {
    const copyBtn = e.target.closest('.copy-btn');
    if (copyBtn) {
      const shortId = copyBtn.dataset.shortId;
      const url = constructShortURL(shortId);
      
      try {
        await navigator.clipboard.writeText(url);
        showToast('Copied to clipboard!', 'success');
      } catch {
        showToast('Failed to copy', 'error');
      }
    }
  });

  // Handle delete buttons (using event delegation)
  document.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      const id = parseInt(deleteBtn.dataset.id, 10);
      
      if (confirm('Delete this shortened URL?')) {
        if (handlers.onDelete) {
          await handlers.onDelete(id);
        }
      }
    }
  });
}

/**
 * Updates the URL count display
 * @param {number} count
 */
export function updateURLCount(count) {
  const countEl = document.getElementById('urlCount');
  if (countEl) {
    countEl.textContent = `${count} URL${count !== 1 ? 's' : ''}`;
  }
}

/**
 * Shows/hides the clear button
 * @param {boolean} visible
 */
export function showClearButton(visible) {
  const clearBtn = document.getElementById('clearAllBtn');
  if (clearBtn) {
    clearBtn.classList.toggle('d-none', !visible);
  }
}
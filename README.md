# LocaLink - Personal URL Shortener

A project built for learning and experimentation with client-side architecture.

**LocaLink** is a client-side *Personal URL Shortener* web application that runs entirely in the browser without requiring any backend or external APIs.

It allows users to generate, store, and manage shortened URLs locally using **IndexedDB** for persistence and a **URL parameter-based (`?id=`)** system for redirection.

Built as a *Single Page Application (SPA)* using **Vanilla JavaScript (ES6 Modules)**, emphasizes performance, modular architecture, and seamless deployment.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🏗 Architecture

### Module Structure

```
js/
├── db.js        # IndexedDB operations
├── shortener.js # ID generation & URL utilities
├── router.js   # Redirect handling
├── ui.js      # DOM rendering & events
└── app.js     # Application bootstrapper
```

### IndexedDB Schema

- **Database**: `url-shortener-db`
- **Version**: 1
- **Object Store**: `urls`
  - `id`: Auto-increment key
  - `shortId`: Unique 6-character ID (indexed)
  - `originalUrl`: Full URL
  - `createdAt`: Timestamp

### ID Generation

- Uses Base62 charset: `a-z`, `A-Z`, `0-9`
- 6 characters = 56+ billion possible combinations
- Collision detection via IndexedDB lookup
- Exponential backoff retry (max 10 attempts)
- Fallback to longer IDs if needed

### Redirect Flow

1. App loads, checks for `?id=` parameter
2. If present, queries IndexedDB for shortId
3. On success: `window.location.replace(originalUrl)`
4. On failure: Shows error page

## ⚠️ Limitations

- Data is stored locally (no cross-device sync)
- No shared database between users
- Clearing browser data will remove all saved links

## 🐛 Troubleshooting

### Short URLs Not Working

- Ensure the app is deployed to the correct base path
- Check browser console for IndexedDB errors
- Verify the short ID exists in storage

### IndexedDB Not Available

- Some browsers block IndexedDB in private mode
- Enable cookies and storage for the site
- Check browser privacy settings

### CORS Errors

- Ensure files are served over HTTP/HTTPS, not `file://`
- Use a local server for development

## 📄 License

MIT License

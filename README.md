# Localink - Personal URL Shortener (PHP/MySQL Version)

A personal URL shortener application built with PHP and MySQL. This version uses a MySQL database for server-side storage, allowing access from multiple devices.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

- **Create Short URLs**: Shorten long URLs with a single click
- **URL History**: View all your previously shortened URLs
- **Copy to Clipboard**: One-click copy of shortened URLs
- **Delete URLs**: Remove individual URLs or clear all
- **Server-Side Storage**: URLs stored in MySQL (accessible from any device)
- **Fast Redirects**: Instant redirection to original URLs
- **Cross-Device Access**: Use on any device with the server

## Requirements

- PHP 8.0+
- MySQL 8.0+
- Web server (Apache, Nginx) or PHP built-in server

## Quick Start

### 1. Database Setup

The database is automatically created when you first run the server.

### 2. Run the Server

```bash
cd php
php -S 0.0.0.0:8080 router.php
```

Then open http://localhost:8080 in your browser.

## Configuration

Edit `php/config.php` to update database credentials:

```php
define('DB_HOST', 'localhost');       // MySQL host
define('DB_NAME', 'localink');      // Database name
define('DB_USER', 'root');          // MySQL username
define('DB_PASS', 'yourpassword');  // MySQL password
define('DB_PORT', 3306);            // MySQL port
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|------------|
| POST | `/api/shorten` | Create short URL |
| GET | `/api/redirect/:id` | Get original URL |
| GET | `/api/urls` | List all URLs |
| DELETE | `/api/urls/:id` | Delete URL |
| DELETE | `/api/clear` | Clear all URLs |
| GET | `/api/count` | Get URL count |

## Architecture

### File Structure

```
localink/
├── index.html          # Main application (unchanged)
├── js/
│   ├── app.js       # Application entry point
│   ├── db.js       # API client (updated for PHP)
│   ├── router.js   # URL routing (updated)
│   ├── shortener.js # Short ID generation
│   └── ui.js       # UI components
├── php/
│   ├── config.php   # Database configuration
│   ├── db.php     # Database operations
│   ├── api.php    # REST API
│   ├── router.php # Server router
│   ├── init.php   # Database initialization
│   └── localink.sql # SQL schema
```

### How It Works

1. **PHP Backend**: Handles all database operations via REST API
2. **MySQL Database**: Stores URLs with auto-increment ID and unique short_id
3. **JavaScript Client**: Communicates with PHP API for CRUD operations
4. **Redirect**: Uses query parameter (`?id=`) for URL resolution

## 🐛 Troubleshooting

### Database Connection Error

Verify MySQL is running and credentials are correct:
```bash
mysql -u root -p -e "USE localink; SELECT * FROM urls;"
```

### 404 Errors

For PHP built-in server, make sure to use the router:
```bash
php -S 0.0.0.0:8080 router.php
```

### Empty Short Link Column

Ensure you're accessing the correct base URL for your environment.

## 📄 License

MIT License

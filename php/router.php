<?php
/**
 * router.php - PHP Built-in Server Router
 * 
 * Routes requests to the appropriate handler:
 * - /api/* -> api.php
 * - / -> index.html
 * - *.html -> serve static files
 */

// Get the request URI
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Route API requests
if (strpos($path, '/api/') === 0) {
    // Forward request to api.php with original query string
    $_SERVER['SCRIPT_NAME'] = __DIR__ . '/api.php';
    include __DIR__ . '/api.php';
    exit;
}

// Serve static files
$filePath = __DIR__ . '/..' . $path;
if (pathinfo($filePath, PATHINFO_EXTENSION) && file_exists($filePath)) {
    // Serve static file
    $ext = pathinfo($filePath, PATHINFO_EXTENSION);
    $mimeTypes = [
        'html' => 'text/html',
        'js' => 'application/javascript',
        'css' => 'text/css',
        'json' => 'application/json',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
    ];
    header('Content-Type: ' . ($mimeTypes[$ext] ?? 'text/plain'));
    readfile($filePath);
    exit;
}

// Default: serve index.html
include __DIR__ . '/../index.html';
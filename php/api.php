<?php
/**
 * api.php - REST API Endpoints
 * 
 * API for URL shortener application.
 * Handles URL shortening, redirection, and CRUD operations.
 */

require_once __DIR__ . '/db.php';

// Set JSON content type
header('Content-Type: application/json');

// Enable CORS for development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/**
 * Generate a random Base62 short ID
 * @return string
 */
function generateShortId() {
    $charset = SHORT_ID_CHARSET;
    $length = SHORT_ID_LENGTH;
    $id = '';
    for ($i = 0; $i < $length; $i++) {
        $id .= $charset[random_int(0, strlen($charset) - 1)];
    }
    return $id;
}

/**
 * Generate a collision-free short ID
 * @return string
 */
function generateUniqueShortId() {
    $maxRetries = 10;
    $attempts = 0;
    
    do {
        $shortId = generateShortId();
        $attempts++;
        
        if (!shortIdExists($shortId)) {
            return $shortId;
        }
        
        // Exponential backoff simulation
        if ($attempts < $maxRetries) {
            usleep(min($attempts * 1000, 10000));
        }
    } while ($attempts < $maxRetries);
    
    // Fallback: try longer IDs
    for ($len = 7; $len <= 10; $len++) {
        $id = '';
        for ($i = 0; $i < $len; $i++) {
            $id .= SHORT_ID_CHARSET[random_int(0, strlen(SHORT_ID_CHARSET) - 1)];
        }
        if (!shortIdExists($id)) {
            return $id;
        }
    }
    
    throw new Exception('Failed to generate unique short ID');
}

/**
 * Validate URL
 * @param string $url
 * @return bool
 */
function isValidURL($url) {
    if (empty($url)) {
        return false;
    }
    
    $parsed = parse_url($url);
    if ($parsed === false || !isset($parsed['scheme']) || !isset($parsed['host'])) {
        return false;
    }
    
    return in_array($parsed['scheme'], ['http', 'https'], true);
}

/**
 * Normalize URL (add https if missing)
 * @param string $url
 * @return string
 */
function normalizeURL($url) {
    $url = trim($url);
    
    if (!preg_match('/^https?:\/\//i', $url)) {
        $url = 'https://' . $url;
    }
    
    return $url;
}

/**
 * Send JSON response
 * @param mixed $data
 * @param int $statusCode
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

/**
 * Send error response
 * @param string $message
 * @param int $statusCode
 */
function errorResponse($message, $statusCode = 400) {
    jsonResponse(['error' => $message], $statusCode);
}

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Route: /api/shorten - Create short URL
if ($path === '/api/shorten' && $method === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (empty($input['url'])) {
            errorResponse('URL is required', 400);
        }
        
        $url = normalizeURL($input['url']);
        
        if (!isValidURL($url)) {
            errorResponse('Invalid URL format', 400);
        }
        
        $shortId = generateUniqueShortId();
        $id = addURL($shortId, $url);
        
        // Construct full short URL
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'];
        $basePath = dirname($_SERVER['SCRIPT_NAME']);
        if ($basePath === '.' || $basePath === '/') {
            $basePath = '';
        }
        $shortUrl = $protocol . '://' . $host . $basePath . '/?id=' . $shortId;
        
        jsonResponse([
            'success' => true,
            'id' => $id,
            'short_id' => $shortId,
            'short_url' => $shortUrl,
            'original_url' => $url,
        ], 201);
        
    } catch (Exception $e) {
        errorResponse($e->getMessage(), 500);
    }
}

// Route: /api/redirect/:shortId - Get original URL for redirect
if (preg_match('#^/api/redirect/([a-zA-Z0-9]+)$#', $path, $matches) && $method === 'GET') {
    try {
        $shortId = $matches[1];
        
        $entry = getURLByShortId($shortId);
        
        if (!$entry) {
            errorResponse('Short URL not found', 404);
        }
        
        jsonResponse([
            'original_url' => $entry['original_url'],
        ]);
        
    } catch (Exception $e) {
        errorResponse($e->getMessage(), 500);
    }
}

// Route: /api/urls - Get all URLs (list)
if ($path === '/api/urls' && $method === 'GET') {
    try {
        $urls = getAllURLs();
        
        // Format for frontend
        $formatted = array_map(function($url) {
            return [
                'id' => (int) $url['id'],
                'shortId' => $url['short_id'],
                'originalUrl' => $url['original_url'],
                'createdAt' => strtotime($url['created_at']) * 1000,
            ];
        }, $urls);
        
        jsonResponse(['urls' => $formatted]);
        
    } catch (Exception $e) {
        errorResponse($e->getMessage(), 500);
    }
}

// Route: /api/urls/:id - Delete URL
if (preg_match('#^/api/urls/(\d+)$#', $path, $matches) && $method === 'DELETE') {
    try {
        $id = (int) $matches[1];
        
        $result = deleteURL($id);
        
        if ($result) {
            jsonResponse(['success' => true, 'message' => 'URL deleted']);
        } else {
            errorResponse('URL not found', 404);
        }
        
    } catch (Exception $e) {
        errorResponse($e->getMessage(), 500);
    }
}

// Route: /api/clear - Clear all URLs
if ($path === '/api/clear' && $method === 'DELETE') {
    try {
        clearAllURLs();
        jsonResponse(['success' => true, 'message' => 'All URLs cleared']);
        
    } catch (Exception $e) {
        errorResponse($e->getMessage(), 500);
    }
}

// Route: /api/count - Get URL count
if ($path === '/api/count' && $method === 'GET') {
    try {
        $count = getURLCount();
        jsonResponse(['count' => $count]);
        
    } catch (Exception $e) {
        errorResponse($e->getMessage(), 500);
    }
}

// Default: 404 Not Found
errorResponse('Not Found', 404);
<?php
/**
 * db.php - Database Operations
 * 
 * MySQL database operations for URL shortener.
 * Handles all CRUD operations for shortened URLs.
 */

require_once __DIR__ . '/config.php';

/**
 * Get PDO database connection
 * @return PDO
 */
function getDB() {
    static $pdo = null;
    
    if ($pdo === null) {
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', 
            DB_HOST, DB_PORT, DB_NAME);
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    }
    
    return $pdo;
}

/**
 * Add a new URL entry
 * @param string $shortId
 * @param string $originalUrl
 * @return int
 */
function addURL($shortId, $originalUrl) {
    $db = getDB();
    $stmt = $db->prepare(
        'INSERT INTO urls (short_id, original_url, created_at) VALUES (?, ?, NOW())'
    );
    $stmt->execute([$shortId, $originalUrl]);
    return (int) $db->lastInsertId();
}

/**
 * Get URL by short ID
 * @param string $shortId
 * @return array|null
 */
function getURLByShortId($shortId) {
    $db = getDB();
    $stmt = $db->prepare('SELECT * FROM urls WHERE short_id = ?');
    $stmt->execute([$shortId]);
    $result = $stmt->fetch();
    return $result ?: null;
}

/**
 * Get all URLs sorted by creation date (newest first)
 * @return array
 */
function getAllURLs() {
    $db = getDB();
    $stmt = $db->query('SELECT * FROM urls ORDER BY created_at DESC');
    return $stmt->fetchAll();
}

/**
 * Delete URL by ID
 * @param int $id
 * @return bool
 */
function deleteURL($id) {
    $db = getDB();
    $stmt = $db->prepare('DELETE FROM urls WHERE id = ?');
    return $stmt->execute([$id]);
}

/**
 * Delete URL by short ID
 * @param string $shortId
 * @return bool
 */
function deleteURLByShortId($shortId) {
    $db = getDB();
    $stmt = $db->prepare('DELETE FROM urls WHERE short_id = ?');
    return $stmt->execute([$shortId]);
}

/**
 * Clear all URLs
 * @return bool
 */
function clearAllURLs() {
    $db = getDB();
    return $db->exec('TRUNCATE TABLE urls') !== false;
}

/**
 * Check if short ID exists
 * @param string $shortId
 * @return bool
 */
function shortIdExists($shortId) {
    $db = getDB();
    $stmt = $db->prepare('SELECT 1 FROM urls WHERE short_id = ?');
    $stmt->execute([$shortId]);
    return $stmt->fetch() !== false;
}

/**
 * Get total URL count
 * @return int
 */
function getURLCount() {
    $db = getDB();
    $stmt = $db->query('SELECT COUNT(*) as cnt FROM urls');
    return (int) $stmt->fetch()['cnt'];
}
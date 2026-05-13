<?php
/**
 * init.php - Database Initialization
 * 
 * Initializes the database on first run.
 * Creates database and tables if they don't exist.
 * Call this once during deployment.
 */

require_once __DIR__ . '/config.php';

/**
 * Initialize the database
 */
function initDatabase() {
    try {
        // Connect without database to create it if needed
        $dsn = sprintf('mysql:host=%s;port=%d;charset=utf8mb4', DB_HOST, DB_PORT);
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);

        // Create database if not exists
        $pdo->exec(sprintf(
            "CREATE DATABASE IF NOT EXISTS %s CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
            DB_NAME
        ));
        $pdo->exec("USE " . DB_NAME);

        // Create URLs table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS urls (
                id INT AUTO_INCREMENT PRIMARY KEY,
                short_id VARCHAR(10) NOT NULL UNIQUE COMMENT '6-10 character Base62 short ID',
                original_url TEXT NOT NULL COMMENT 'Original URL that was shortened',
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp of creation',
                INDEX idx_short_id (short_id),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Shortened URLs table'
        ");

        return ['success' => true, 'message' => 'Database initialized successfully'];
        
    } catch (PDOException $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

// Run if called directly
if (php_sapi_name() === 'cli' || !empty($_GET['init'])) {
    $result = initDatabase();
    if ($result['success']) {
        echo "✓ " . $result['message'] . "\n";
    } else {
        echo "✗ " . $result['error'] . "\n";
        exit(1);
    }
}
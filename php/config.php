<?php
/**
 * config.php - Database Configuration
 * 
 * Configuration for MySQL database connection.
 * Update these values to match your MySQL setup.
 */

// Database credentials - update these for your environment
define('DB_HOST', getenv('DB_HOST') ?: '172.17.0.2');
define('DB_NAME', getenv('DB_NAME') ?: 'localink');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: 'root');
define('DB_PORT', getenv('DB_PORT') ?: 3306);

// Application settings
define('SHORT_ID_LENGTH', 6);
define('SHORT_ID_CHARSET', 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
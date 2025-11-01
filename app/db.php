<?php

function get_pdo(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $config = require __DIR__ . '/config.php';
    $db = $config['db'];

    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $db['host'], $db['port'], $db['name'], $db['charset']
    );

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    $pdo = new PDO($dsn, $db['user'], $db['pass'], $options);
    return $pdo;
}

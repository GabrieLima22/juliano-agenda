<?php

function ensure_meetings_schema(PDO $pdo): void {
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM meetings LIKE 'meeting_type'");
        $column = $stmt->fetch();
        $columnType = strtolower((string)($column['Type'] ?? ''));

        if ($columnType === '') {
            return;
        }

        $hasExternal = strpos($columnType, "'external'") !== false;
        $hasExterna = strpos($columnType, "'externa'") !== false;

        if ($hasExterna) {
            $pdo->exec("ALTER TABLE meetings MODIFY meeting_type ENUM('presencial','zoom','meet','externa','external') NOT NULL DEFAULT 'presencial'");
            $pdo->exec("UPDATE meetings SET meeting_type = 'external' WHERE meeting_type = 'externa'");
            $pdo->exec("ALTER TABLE meetings MODIFY meeting_type ENUM('presencial','zoom','meet','external') NOT NULL DEFAULT 'presencial'");
            return;
        }

        if (!$hasExternal) {
            $pdo->exec("ALTER TABLE meetings MODIFY meeting_type ENUM('presencial','zoom','meet','external') NOT NULL DEFAULT 'presencial'");
        }
    } catch (Throwable $e) {
        return;
    }
}

function get_pdo(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $config = require __DIR__ . '/config.php';
    $db = $config['db'];

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $db['host'],
        $db['port'],
        $db['name'],
        $db['charset']
    );

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    $pdo = new PDO($dsn, $db['user'], $db['pass'], $options);
    ensure_meetings_schema($pdo);

    return $pdo;
}

<?php

function db_driver_name(PDO $pdo): string {
    return strtolower((string)$pdo->getAttribute(PDO::ATTR_DRIVER_NAME));
}

function sqlite_driver_available(): bool {
    return in_array('sqlite', PDO::getAvailableDrivers(), true);
}

function ensure_parent_directory(string $filePath): void {
    $directory = dirname($filePath);
    if (is_dir($directory)) {
        return;
    }

    if (!mkdir($directory, 0777, true) && !is_dir($directory)) {
        throw new RuntimeException('Unable to create SQLite data directory');
    }
}

function get_table_columns(PDO $pdo, string $table): array {
    $driver = db_driver_name($pdo);

    if ($driver === 'sqlite') {
        $stmt = $pdo->query("PRAGMA table_info({$table})");
        $rows = $stmt ? $stmt->fetchAll() : [];
        $columns = [];
        foreach ($rows as $row) {
            if (!empty($row['name'])) {
                $columns[(string)$row['name']] = $row;
            }
        }
        return $columns;
    }

    $stmt = $pdo->query("SHOW COLUMNS FROM {$table}");
    $rows = $stmt ? $stmt->fetchAll() : [];
    $columns = [];
    foreach ($rows as $row) {
        if (!empty($row['Field'])) {
            $columns[(string)$row['Field']] = $row;
        }
    }
    return $columns;
}

function has_table_column(PDO $pdo, string $table, string $column): bool {
    $columns = get_table_columns($pdo, $table);
    return array_key_exists($column, $columns);
}

function db_normalize_weekday_abbr(?string $abbr): ?string {
    $abbr = trim((string)$abbr);
    if ($abbr === '') {
        return null;
    }

    $map = [
        'Dom' => 'Dom',
        'Seg' => 'Seg',
        'Ter' => 'Ter',
        'Qua' => 'Qua',
        'Qui' => 'Qui',
        'Sex' => 'Sex',
        'Sab' => 'Sab',
        'SÃƒÂ¡b' => 'Sab',
        'Sabado' => 'Sab',
        'SÃƒÂ¡bado' => 'Sab',
    ];

    return $map[$abbr] ?? null;
}

function backfill_recurrence_compatibility(PDO $pdo): void {
    $columns = get_table_columns($pdo, 'meetings');
    if (!array_key_exists('recurrence_monthly_rules', $columns)) {
        return;
    }

    $allWeekdaysJson = json_encode(['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'], JSON_UNESCAPED_UNICODE);
    $pdo->exec("UPDATE meetings SET recurrence_type = 'weekly', recurrence_days_of_week = " . $pdo->quote($allWeekdaysJson) . " WHERE is_recurring = 1 AND recurrence_type = 'daily' AND (recurrence_day_of_month IS NULL OR recurrence_day_of_month = 0)");
    $pdo->exec("UPDATE meetings SET recurrence_type = 'monthly' WHERE is_recurring = 1 AND recurrence_type = 'daily' AND recurrence_day_of_month IS NOT NULL");

    $stmt = $pdo->query("SELECT id, date, is_recurring, recurrence_type, recurrence_day_of_month, recurrence_monthly_week, recurrence_monthly_weekday, recurrence_monthly_rules FROM meetings WHERE is_recurring = 1");
    $rows = $stmt ? $stmt->fetchAll() : [];
    if (empty($rows)) {
        return;
    }

    $update = $pdo->prepare("UPDATE meetings SET recurrence_monthly_rules = :rules WHERE id = :id");

    foreach ($rows as $row) {
        $existingRules = json_decode((string)($row['recurrence_monthly_rules'] ?? ''), true);
        if (is_array($existingRules) && !empty($existingRules)) {
            continue;
        }

        $type = trim((string)($row['recurrence_type'] ?? ''));
        if ($type !== 'monthly') {
            continue;
        }

        $rules = [];
        $dayOfMonth = isset($row['recurrence_day_of_month']) ? (int)$row['recurrence_day_of_month'] : null;
        $monthlyWeek = isset($row['recurrence_monthly_week']) ? (int)$row['recurrence_monthly_week'] : null;
        $monthlyWeekday = db_normalize_weekday_abbr($row['recurrence_monthly_weekday'] ?? null);

        if (
            $monthlyWeek !== null &&
            $monthlyWeekday !== null &&
            ($monthlyWeek === -1 || ($monthlyWeek >= 1 && $monthlyWeek <= 5))
        ) {
            $rules[] = [
                'kind' => 'weekday',
                'week' => $monthlyWeek,
                'weekday' => $monthlyWeekday,
            ];
        } else {
            if (($dayOfMonth === null || $dayOfMonth < 1 || $dayOfMonth > 31) && !empty($row['date'])) {
                $dayOfMonth = (int)date('j', strtotime((string)$row['date']));
            }

            if ($dayOfMonth !== null && $dayOfMonth >= 1 && $dayOfMonth <= 31) {
                $rules[] = [
                    'kind' => 'dayOfMonth',
                    'dayOfMonth' => $dayOfMonth,
                ];
            }
        }

        if (empty($rules)) {
            continue;
        }

        $update->execute([
            ':id' => $row['id'],
            ':rules' => json_encode($rules, JSON_UNESCAPED_UNICODE),
        ]);
    }
}

function ensure_agenda_closure_table_mysql(PDO $pdo): void {
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS agenda_closure_settings (
            id TINYINT UNSIGNED NOT NULL,
            is_enabled TINYINT(1) NOT NULL DEFAULT 0,
            starts_at DATETIME DEFAULT NULL,
            ends_at DATETIME DEFAULT NULL,
            message TEXT DEFAULT NULL,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function ensure_agenda_closure_table_sqlite(PDO $pdo): void {
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS agenda_closure_settings (
            id INTEGER PRIMARY KEY,
            is_enabled INTEGER NOT NULL DEFAULT 0,
            starts_at TEXT DEFAULT NULL,
            ends_at TEXT DEFAULT NULL,
            message TEXT DEFAULT NULL,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )"
    );
}

function ensure_agenda_closure_schema(PDO $pdo): void {
    if (db_driver_name($pdo) === 'sqlite') {
        ensure_agenda_closure_table_sqlite($pdo);
    } else {
        ensure_agenda_closure_table_mysql($pdo);
    }

    $stmt = $pdo->prepare('SELECT COUNT(*) AS total FROM agenda_closure_settings WHERE id = 1');
    $stmt->execute();
    $row = $stmt->fetch();
    $count = isset($row['total']) ? (int)$row['total'] : 0;

    if ($count === 0) {
        $insert = $pdo->prepare(
            'INSERT INTO agenda_closure_settings (id, is_enabled, starts_at, ends_at, message, updated_at)
             VALUES (1, 0, NULL, NULL, NULL, CURRENT_TIMESTAMP)'
        );
        $insert->execute();
    }
}

function get_agenda_closure_settings(PDO $pdo): array {
    ensure_agenda_closure_schema($pdo);

    $stmt = $pdo->prepare('SELECT * FROM agenda_closure_settings WHERE id = 1');
    $stmt->execute();
    $row = $stmt->fetch();

    if (is_array($row)) {
        return $row;
    }

    return [
        'id' => 1,
        'is_enabled' => 0,
        'starts_at' => null,
        'ends_at' => null,
        'message' => null,
        'updated_at' => null,
    ];
}

function agenda_closure_is_active(array $settings, ?DateTimeImmutable $now = null): bool {
    if (empty($settings['is_enabled']) || empty($settings['starts_at']) || empty($settings['ends_at'])) {
        return false;
    }

    $timezone = new DateTimeZone('America/Sao_Paulo');
    $start = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', (string)$settings['starts_at'], $timezone);
    $end = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', (string)$settings['ends_at'], $timezone);

    if (!$start || !$end) {
        return false;
    }

    $reference = $now ?? new DateTimeImmutable('now', $timezone);
    return $reference >= $start && $reference <= $end;
}

function ensure_meetings_table_mysql(PDO $pdo): void {
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS meetings (
            id CHAR(36) NOT NULL,
            title VARCHAR(255) NOT NULL,
            date DATE NOT NULL,
            time TIME NOT NULL,
            participants TEXT NOT NULL,
            description TEXT DEFAULT NULL,
            agenda TEXT DEFAULT NULL,
            duration_minutes INT DEFAULT NULL,
            meeting_type ENUM('presencial','zoom','meet','external') NOT NULL DEFAULT 'presencial',
            online_link VARCHAR(500) DEFAULT NULL,
            is_recurring TINYINT(1) NOT NULL DEFAULT 0,
            recurrence_type VARCHAR(20) DEFAULT NULL,
            recurrence_day_of_month INT DEFAULT NULL,
            recurrence_days_of_week VARCHAR(100) DEFAULT NULL,
            recurrence_monthly_week INT DEFAULT NULL,
            recurrence_monthly_weekday VARCHAR(10) DEFAULT NULL,
            recurrence_monthly_rules TEXT DEFAULT NULL,
            excluded_occurrence_dates TEXT DEFAULT NULL,
            created_at DATETIME NOT NULL,
            status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
            PRIMARY KEY (id),
            KEY idx_date (date),
            KEY idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function ensure_meetings_table_sqlite(PDO $pdo): void {
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS meetings (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            participants TEXT NOT NULL,
            description TEXT DEFAULT NULL,
            agenda TEXT DEFAULT NULL,
            duration_minutes INTEGER DEFAULT NULL,
            meeting_type TEXT NOT NULL DEFAULT 'presencial',
            online_link TEXT DEFAULT NULL,
            is_recurring INTEGER NOT NULL DEFAULT 0,
            recurrence_type TEXT DEFAULT NULL,
            recurrence_day_of_month INTEGER DEFAULT NULL,
            recurrence_days_of_week TEXT DEFAULT NULL,
            recurrence_monthly_week INTEGER DEFAULT NULL,
            recurrence_monthly_weekday TEXT DEFAULT NULL,
            recurrence_monthly_rules TEXT DEFAULT NULL,
            excluded_occurrence_dates TEXT DEFAULT NULL,
            created_at TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending'
        )"
    );
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings (date)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings (status)");
}

function ensure_missing_meetings_columns(PDO $pdo): void {
    $driver = db_driver_name($pdo);
    $columns = get_table_columns($pdo, 'meetings');

    $definitions = $driver === 'sqlite'
        ? [
            'description' => "ALTER TABLE meetings ADD COLUMN description TEXT DEFAULT NULL",
            'agenda' => "ALTER TABLE meetings ADD COLUMN agenda TEXT DEFAULT NULL",
            'duration_minutes' => "ALTER TABLE meetings ADD COLUMN duration_minutes INTEGER DEFAULT NULL",
            'meeting_type' => "ALTER TABLE meetings ADD COLUMN meeting_type TEXT NOT NULL DEFAULT 'presencial'",
            'online_link' => "ALTER TABLE meetings ADD COLUMN online_link TEXT DEFAULT NULL",
            'is_recurring' => "ALTER TABLE meetings ADD COLUMN is_recurring INTEGER NOT NULL DEFAULT 0",
            'recurrence_type' => "ALTER TABLE meetings ADD COLUMN recurrence_type TEXT DEFAULT NULL",
            'recurrence_day_of_month' => "ALTER TABLE meetings ADD COLUMN recurrence_day_of_month INTEGER DEFAULT NULL",
            'recurrence_days_of_week' => "ALTER TABLE meetings ADD COLUMN recurrence_days_of_week TEXT DEFAULT NULL",
            'recurrence_monthly_week' => "ALTER TABLE meetings ADD COLUMN recurrence_monthly_week INTEGER DEFAULT NULL",
            'recurrence_monthly_weekday' => "ALTER TABLE meetings ADD COLUMN recurrence_monthly_weekday TEXT DEFAULT NULL",
            'recurrence_monthly_rules' => "ALTER TABLE meetings ADD COLUMN recurrence_monthly_rules TEXT DEFAULT NULL",
            'excluded_occurrence_dates' => "ALTER TABLE meetings ADD COLUMN excluded_occurrence_dates TEXT DEFAULT NULL",
            'created_at' => "ALTER TABLE meetings ADD COLUMN created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP",
            'status' => "ALTER TABLE meetings ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'",
        ]
        : [
            'description' => "ALTER TABLE meetings ADD COLUMN description TEXT DEFAULT NULL",
            'agenda' => "ALTER TABLE meetings ADD COLUMN agenda TEXT DEFAULT NULL",
            'duration_minutes' => "ALTER TABLE meetings ADD COLUMN duration_minutes INT DEFAULT NULL",
            'meeting_type' => "ALTER TABLE meetings ADD COLUMN meeting_type ENUM('presencial','zoom','meet','external') NOT NULL DEFAULT 'presencial'",
            'online_link' => "ALTER TABLE meetings ADD COLUMN online_link VARCHAR(500) DEFAULT NULL",
            'is_recurring' => "ALTER TABLE meetings ADD COLUMN is_recurring TINYINT(1) NOT NULL DEFAULT 0",
            'recurrence_type' => "ALTER TABLE meetings ADD COLUMN recurrence_type VARCHAR(20) DEFAULT NULL",
            'recurrence_day_of_month' => "ALTER TABLE meetings ADD COLUMN recurrence_day_of_month INT DEFAULT NULL",
            'recurrence_days_of_week' => "ALTER TABLE meetings ADD COLUMN recurrence_days_of_week VARCHAR(100) DEFAULT NULL",
            'recurrence_monthly_week' => "ALTER TABLE meetings ADD COLUMN recurrence_monthly_week INT DEFAULT NULL",
            'recurrence_monthly_weekday' => "ALTER TABLE meetings ADD COLUMN recurrence_monthly_weekday VARCHAR(10) DEFAULT NULL",
            'recurrence_monthly_rules' => "ALTER TABLE meetings ADD COLUMN recurrence_monthly_rules TEXT DEFAULT NULL",
            'excluded_occurrence_dates' => "ALTER TABLE meetings ADD COLUMN excluded_occurrence_dates TEXT DEFAULT NULL",
            'created_at' => "ALTER TABLE meetings ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
            'status' => "ALTER TABLE meetings ADD COLUMN status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending'",
        ];

    foreach ($definitions as $column => $statement) {
        if (!array_key_exists($column, $columns)) {
            $pdo->exec($statement);
        }
    }
}

function ensure_meetings_schema(PDO $pdo): void {
    $driver = db_driver_name($pdo);

    if ($driver === 'sqlite') {
        ensure_meetings_table_sqlite($pdo);
    } else {
        ensure_meetings_table_mysql($pdo);
    }

    ensure_missing_meetings_columns($pdo);

    try {
        $pdo->exec("UPDATE meetings SET meeting_type = 'external' WHERE meeting_type = 'externa'");

        if ($driver !== 'sqlite') {
            $columns = get_table_columns($pdo, 'meetings');
            $columnType = strtolower((string)($columns['meeting_type']['Type'] ?? ''));

            if ($columnType !== '') {
                $hasExternal = strpos($columnType, "'external'") !== false;
                $hasExterna = strpos($columnType, "'externa'") !== false;

                if ($hasExterna) {
                    $pdo->exec("ALTER TABLE meetings MODIFY meeting_type ENUM('presencial','zoom','meet','externa','external') NOT NULL DEFAULT 'presencial'");
                    $pdo->exec("UPDATE meetings SET meeting_type = 'external' WHERE meeting_type = 'externa'");
                    $pdo->exec("ALTER TABLE meetings MODIFY meeting_type ENUM('presencial','zoom','meet','external') NOT NULL DEFAULT 'presencial'");
                } elseif (!$hasExternal) {
                    $pdo->exec("ALTER TABLE meetings MODIFY meeting_type ENUM('presencial','zoom','meet','external') NOT NULL DEFAULT 'presencial'");
                }
            }
        }

        backfill_recurrence_compatibility($pdo);
        ensure_agenda_closure_schema($pdo);
    } catch (Throwable $e) {
        // Continua mesmo se essa migration falhar
    }
}

function has_recurring_column(PDO $pdo): bool {
    static $result = null;
    if ($result !== null) {
        return $result;
    }
    $result = has_table_column($pdo, 'meetings', 'is_recurring');
    return $result;
}

function get_pdo(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $config = require __DIR__ . '/config.php';
    $db = $config['db'];

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $db['host'],
        $db['port'],
        $db['name'],
        $db['charset']
    );

    try {
        $pdo = new PDO($dsn, $db['user'], $db['pass'], $options);
    } catch (PDOException $exception) {
        $fallbackToSqlite = !empty($db['fallback_to_sqlite']);
        if (!$fallbackToSqlite || !sqlite_driver_available()) {
            throw $exception;
        }

        $sqlitePath = (string)($db['sqlite_path'] ?? (__DIR__ . '/data/juliano_agenda.sqlite'));
        ensure_parent_directory($sqlitePath);
        $pdo = new PDO('sqlite:' . $sqlitePath, null, null, $options);
    }

    ensure_meetings_schema($pdo);
    ensure_agenda_closure_schema($pdo);

    return $pdo;
}

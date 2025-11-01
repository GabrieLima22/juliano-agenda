<?php
// Database configuration and app settings

// Helper to read env with fallback
$env = fn(string $k, $def = null) => getenv($k) !== false ? getenv($k) : $def;

return [
    'db' => [
        'host' => $env('DB_HOST', '127.0.0.1'),
        'port' => (int)$env('DB_PORT', 3306),
        'name' => $env('DB_NAME', 'juliano_agenda'),
        'user' => $env('DB_USER', 'root'),
        'pass' => $env('DB_PASS', ''), // XAMPP default is empty
        'charset' => 'utf8mb4',
    ],
    'admin' => [
        'username' => $env('ADMIN_USER', 'admin25jml'),
        'password' => $env('ADMIN_PASS', 'Jml@2024!@'),
    ],
    // Allowed origins for CORS during development
    'cors_allowed_origins' => (function() use ($env) {
        $fromEnv = $env('CORS_ALLOWED_ORIGINS');
        if ($fromEnv) {
            return array_map('trim', explode(',', $fromEnv));
        }
        return [
            'http://localhost',
            'http://localhost:80',
            'http://127.0.0.1',
            'http://localhost:8080', // Vite dev server
        ];
    })(),
];

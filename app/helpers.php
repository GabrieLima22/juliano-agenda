<?php

function start_session(): void {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        // More predictable session name
        session_name('JULIANO_AGENDA_SESSID');
        session_start();
    }
}

function setup_cors(): void {
    $config = require __DIR__ . '/config.php';
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin && in_array($origin, $config['cors_allowed_origins'], true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    }

    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function send_json($data, int $code = 200): void {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function json_input(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        send_json(['error' => 'Invalid JSON body'], 400);
        exit;
    }
    return is_array($data) ? $data : [];
}

function require_method(array $allowed): void {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if (!in_array($method, $allowed, true)) {
        send_json(['error' => 'Method not allowed'], 405);
        exit;
    }
}

function is_admin(): bool {
    start_session();
    return !empty($_SESSION['is_admin']);
}

function require_admin(): void {
    if (!is_admin()) {
        send_json(['error' => 'Unauthorized'], 401);
        exit;
    }
}

function uuidv4(): string {
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40); // version 4
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80); // variant
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function now_datetime(): string {
    return (new DateTime('now', new DateTimeZone('America/Sao_Paulo')))->format('Y-m-d H:i:s');
}

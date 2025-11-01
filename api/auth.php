<?php
require_once __DIR__ . '/../app/helpers.php';

setup_cors();
start_session();

$config = require __DIR__ . '/../app/config.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET') {
    send_json(['isAdmin' => is_admin()]);
    exit;
}

if ($method === 'POST') {
    $path = $_GET['action'] ?? '';
    $body = json_input();

    if ($path === 'login') {
        $u = trim((string)($body['username'] ?? ''));
        $p = trim((string)($body['password'] ?? ''));
        if ($u === $config['admin']['username'] && $p === $config['admin']['password']) {
            $_SESSION['is_admin'] = true;
            send_json(['ok' => true, 'isAdmin' => true]);
            exit;
        }
        send_json(['error' => 'Invalid credentials'], 401);
        exit;
    }

    if ($path === 'logout') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params['path'], $params['domain'], $params['secure'], $params['httponly']
            );
        }
        session_destroy();
        send_json(['ok' => true, 'isAdmin' => false]);
        exit;
    }

    send_json(['error' => 'Unknown action'], 400);
    exit;
}

send_json(['error' => 'Method not allowed'], 405);


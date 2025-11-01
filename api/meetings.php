<?php
require_once __DIR__ . '/../app/helpers.php';
require_once __DIR__ . '/../app/db.php';

setup_cors();
start_session();

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$pdo = get_pdo();

if ($method === 'GET') {
    $date = isset($_GET['date']) ? trim((string)$_GET['date']) : null; // YYYY-MM-DD
    $includeAll = (isset($_GET['includeAll']) && ($_GET['includeAll'] === '1' || strtolower($_GET['includeAll']) === 'true')) && is_admin();

    if ($date) {
        if ($includeAll) {
            $stmt = $pdo->prepare('SELECT * FROM meetings WHERE date = :date ORDER BY time ASC');
            $stmt->execute([':date' => $date]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM meetings WHERE date = :date AND status = 'approved' ORDER BY time ASC");
            $stmt->execute([':date' => $date]);
        }
    } else {
        if ($includeAll) {
            $stmt = $pdo->query('SELECT * FROM meetings ORDER BY date DESC, time ASC');
        } else {
            $stmt = $pdo->query("SELECT * FROM meetings WHERE status = 'approved' ORDER BY date DESC, time ASC");
        }
    }

    $rows = $stmt->fetchAll();
    $out = [];
    foreach ($rows as $r) {
        $out[] = [
            'id' => $r['id'],
            'title' => $r['title'],
            'date' => $r['date'],
            'time' => $r['time'],
            'participants' => json_decode($r['participants'], true) ?: [],
            'description' => $r['description'],
            'durationMinutes' => isset($r['duration_minutes']) ? (int)$r['duration_minutes'] : null,
            'meetingType' => $r['meeting_type'] ?? 'presencial',
            'onlineLink' => $r['online_link'] ?? null,
            'createdAt' => $r['created_at'],
            'status' => $r['status'],
        ];
    }
    send_json($out);
    exit;
}

if ($method === 'POST') {
    $data = json_input();
    $id = uuidv4();
    $title = trim((string)($data['title'] ?? ''));
    $date = trim((string)($data['date'] ?? ''));
    $time = trim((string)($data['time'] ?? ''));
    $participants = $data['participants'] ?? [];
    $description = isset($data['description']) ? trim((string)$data['description']) : null; // usaremos como 'pauta'
    $duration = isset($data['durationMinutes']) ? (int)$data['durationMinutes'] : null;
    $meetingType = isset($data['meetingType']) ? (string)$data['meetingType'] : 'presencial';
    if (!in_array($meetingType, ['presencial','zoom','meet'], true)) { $meetingType = 'presencial'; }
    $onlineLink = isset($data['onlineLink']) ? trim((string)$data['onlineLink']) : null;
    $createdAt = now_datetime();
    $status = 'pending';

    if ($title === '' || $date === '' || $time === '' || !is_array($participants)) {
        send_json(['error' => 'Missing required fields'], 400);
        exit;
    }

    $stmt = $pdo->prepare('INSERT INTO meetings (id, title, date, time, participants, description, agenda, duration_minutes, meeting_type, online_link, created_at, status) VALUES (:id, :title, :date, :time, :participants, :description, :agenda, :duration_minutes, :meeting_type, :online_link, :created_at, :status)');
    $stmt->execute([
        ':id' => $id,
        ':title' => $title,
        ':date' => $date,
        ':time' => $time,
        ':participants' => json_encode($participants, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ':description' => $description,
        ':agenda' => $description,
        ':duration_minutes' => $duration,
        ':meeting_type' => $meetingType,
        ':online_link' => $onlineLink,
        ':created_at' => $createdAt,
        ':status' => $status,
    ]);

    send_json([
        'id' => $id,
        'title' => $title,
        'date' => $date,
        'time' => $time,
        'participants' => $participants,
        'description' => $description,
        'durationMinutes' => $duration,
        'meetingType' => $meetingType,
        'onlineLink' => $onlineLink,
        'createdAt' => $createdAt,
        'status' => $status,
    ], 201);
    exit;
}

if ($method === 'PATCH') {
    require_admin();
    $data = json_input();
    $id = trim((string)($data['id'] ?? ''));
    $status = trim((string)($data['status'] ?? ''));
    if ($id === '' || !in_array($status, ['approved','rejected'], true)) {
        send_json(['error' => 'Invalid id or status'], 400);
        exit;
    }

    $stmt = $pdo->prepare('UPDATE meetings SET status = :status WHERE id = :id');
    $stmt->execute([':status' => $status, ':id' => $id]);
    send_json(['ok' => true]);
    exit;
}

if ($method === 'DELETE') {
    require_admin();
    $id = isset($_GET['id']) ? trim((string)$_GET['id']) : '';
    if ($id === '') {
        $body = json_input();
        $id = trim((string)($body['id'] ?? ''));
    }
    if ($id === '') {
        send_json(['error' => 'Missing id'], 400);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM meetings WHERE id = :id');
    $stmt->execute([':id' => $id]);
    send_json(['ok' => true]);
    exit;
}

send_json(['error' => 'Method not allowed'], 405);

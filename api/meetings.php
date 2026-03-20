<?php
require_once __DIR__ . '/../app/helpers.php';
require_once __DIR__ . '/../app/db.php';

setup_cors();
start_session();

function allowed_meeting_types(): array {
    return ['presencial', 'zoom', 'meet', 'external'];
}

function normalize_meeting_type(?string $meetingType): string {
    $meetingType = strtolower(trim((string)($meetingType ?? 'presencial')));
    if ($meetingType === 'externa') {
        $meetingType = 'external';
    }
    if (!in_array($meetingType, allowed_meeting_types(), true)) {
        return 'presencial';
    }
    return $meetingType;
}

function meeting_type_requires_online_link(string $meetingType): bool {
    return in_array($meetingType, ['zoom', 'meet'], true);
}

function get_requester_meeting_ids(): array {
    $ids = $_SESSION['meeting_request_ids'] ?? [];
    if (!is_array($ids)) {
        $ids = [];
    }

    $normalized = [];
    foreach ($ids as $id) {
        if (is_string($id) && $id !== '') {
            $normalized[$id] = $id;
        }
    }

    $_SESSION['meeting_request_ids'] = array_values($normalized);
    return $_SESSION['meeting_request_ids'];
}

function remember_requester_meeting(string $meetingId): void {
    $ids = get_requester_meeting_ids();
    $ids[] = $meetingId;
    $ids = array_values(array_unique($ids));
    if (count($ids) > 100) {
        $ids = array_slice($ids, -100);
    }
    $_SESSION['meeting_request_ids'] = $ids;
}

function get_requester_pending_meetings(PDO $pdo, ?string $date = null): array {
    $meetingIds = get_requester_meeting_ids();
    if (empty($meetingIds)) {
        return [];
    }

    $placeholders = [];
    $params = [':status' => 'pending'];

    foreach ($meetingIds as $index => $meetingId) {
        $placeholder = ":id{$index}";
        $placeholders[] = $placeholder;
        $params[$placeholder] = $meetingId;
    }

    $sql = 'SELECT * FROM meetings WHERE status = :status AND id IN (' . implode(', ', $placeholders) . ')';
    if ($date !== null) {
        $sql .= ' AND date = :date';
        $params[':date'] = $date;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function merge_meeting_rows(array ...$groups): array {
    $byId = [];
    foreach ($groups as $rows) {
        foreach ($rows as $row) {
            if (is_array($row) && !empty($row['id'])) {
                $byId[$row['id']] = $row;
            }
        }
    }
    return array_values($byId);
}

function sort_meeting_rows(array $rows, bool $singleDateView): array {
    usort($rows, static function (array $a, array $b) use ($singleDateView): int {
        if (!$singleDateView) {
            $dateCompare = strcmp((string)($b['date'] ?? ''), (string)($a['date'] ?? ''));
            if ($dateCompare !== 0) {
                return $dateCompare;
            }
        }

        return strcmp((string)($a['time'] ?? ''), (string)($b['time'] ?? ''));
    });

    return $rows;
}

function format_meeting_row(array $row): array {
    $participants = [];
    if (!empty($row['participants'])) {
        $decoded = json_decode($row['participants'], true);
        if (is_array($decoded)) {
            $participants = $decoded;
        }
    }

    $duration = null;
    if (array_key_exists('duration_minutes', $row) && $row['duration_minutes'] !== null) {
        $duration = (int)$row['duration_minutes'];
    }

    $meetingType = normalize_meeting_type($row['meeting_type'] ?? 'presencial');

    return [
        'id' => $row['id'],
        'title' => $row['title'],
        'date' => $row['date'],
        'time' => $row['time'],
        'participants' => $participants,
        'description' => $row['description'] ?? null,
        'durationMinutes' => $duration,
        'meetingType' => $meetingType,
        'onlineLink' => $row['online_link'] ?? null,
        'createdAt' => $row['created_at'],
        'status' => $row['status'],
    ];
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$pdo = get_pdo();

if ($method === 'GET') {
    $date = isset($_GET['date']) ? trim((string)$_GET['date']) : null;
    $includeAll = (isset($_GET['includeAll']) && ($_GET['includeAll'] === '1' || strtolower($_GET['includeAll']) === 'true')) && is_admin();
    $rows = [];

    if ($date) {
        if ($includeAll) {
            $stmt = $pdo->prepare('SELECT * FROM meetings WHERE date = :date ORDER BY time ASC');
            $stmt->execute([':date' => $date]);
            $rows = $stmt->fetchAll();
        } else {
            $stmt = $pdo->prepare("SELECT * FROM meetings WHERE date = :date AND status = 'approved' ORDER BY time ASC");
            $stmt->execute([':date' => $date]);
            $rows = merge_meeting_rows($stmt->fetchAll(), get_requester_pending_meetings($pdo, $date));
            $rows = sort_meeting_rows($rows, true);
        }
    } else {
        if ($includeAll) {
            $stmt = $pdo->query('SELECT * FROM meetings ORDER BY date DESC, time ASC');
            $rows = $stmt->fetchAll();
        } else {
            $stmt = $pdo->query("SELECT * FROM meetings WHERE status = 'approved' ORDER BY date DESC, time ASC");
            $rows = merge_meeting_rows($stmt->fetchAll(), get_requester_pending_meetings($pdo));
            $rows = sort_meeting_rows($rows, false);
        }
    }

    $out = array_map(static fn(array $row) => format_meeting_row($row), $rows);
    send_json($out);
    exit;
}

if ($method === 'POST') {
    $data = json_input();
    $id = uuidv4();
    $title = trim((string)($data['title'] ?? ''));
    $date = trim((string)($data['date'] ?? ''));
    $time = trim((string)($data['time'] ?? ''));
    $participantsInput = $data['participants'] ?? [];
    $description = isset($data['description']) ? trim((string)$data['description']) : null;
    if ($description === '') {
        $description = null;
    }
    $duration = isset($data['durationMinutes']) ? (int)$data['durationMinutes'] : null;
    $meetingType = normalize_meeting_type(isset($data['meetingType']) ? (string)$data['meetingType'] : 'presencial');
    $onlineLink = isset($data['onlineLink']) ? trim((string)$data['onlineLink']) : null;
    $createdAt = now_datetime();
    $status = 'pending';

    if ($title === '' || $date === '' || $time === '' || !is_array($participantsInput)) {
        send_json(['error' => 'Missing required fields'], 400);
        exit;
    }

    $participants = [];
    foreach ($participantsInput as $participant) {
        if (is_string($participant)) {
            $p = trim($participant);
            if ($p !== '') {
                $participants[] = $p;
            }
        }
    }

    if (meeting_type_requires_online_link($meetingType) && ($onlineLink === null || $onlineLink === '')) {
        send_json(['error' => 'Online link is required for virtual meetings'], 400);
        exit;
    }

    if (!meeting_type_requires_online_link($meetingType)) {
        $onlineLink = null;
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

    remember_requester_meeting($id);

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
    if ($id === '') {
        send_json(['error' => 'Missing id'], 400);
        exit;
    }

    $stmt = $pdo->prepare('SELECT * FROM meetings WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $existing = $stmt->fetch();
    if (!$existing) {
        send_json(['error' => 'Meeting not found'], 404);
        exit;
    }

    $fields = [];
    $params = [':id' => $id];

    if (array_key_exists('status', $data)) {
        $status = trim((string)$data['status']);
        if (!in_array($status, ['pending', 'approved', 'rejected'], true)) {
            send_json(['error' => 'Invalid status'], 400);
            exit;
        }
        $fields[] = 'status = :status';
        $params[':status'] = $status;
    }

    if (array_key_exists('title', $data)) {
        $title = trim((string)$data['title']);
        if ($title === '') {
            send_json(['error' => 'Title cannot be empty'], 400);
            exit;
        }
        $fields[] = 'title = :title';
        $params[':title'] = $title;
    }

    if (array_key_exists('date', $data)) {
        $date = trim((string)$data['date']);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            send_json(['error' => 'Invalid date format'], 400);
            exit;
        }
        $fields[] = 'date = :date';
        $params[':date'] = $date;
    }

    if (array_key_exists('time', $data)) {
        $time = trim((string)$data['time']);
        if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $time)) {
            send_json(['error' => 'Invalid time format'], 400);
            exit;
        }
        $fields[] = 'time = :time';
        $params[':time'] = $time;
    }

    if (array_key_exists('participants', $data)) {
        if (!is_array($data['participants'])) {
            send_json(['error' => 'Participants must be an array'], 400);
            exit;
        }
        $participants = [];
        foreach ($data['participants'] as $participant) {
            if (is_string($participant)) {
                $p = trim($participant);
                if ($p !== '') {
                    $participants[] = $p;
                }
            }
        }
        $fields[] = 'participants = :participants';
        $params[':participants'] = json_encode($participants, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    if (array_key_exists('description', $data)) {
        $descRaw = $data['description'];
        $description = null;
        if ($descRaw !== null) {
            $description = trim((string)$descRaw);
            if ($description === '') {
                $description = null;
            }
        }
        $fields[] = 'description = :description';
        $fields[] = 'agenda = :agenda';
        $params[':description'] = $description;
        $params[':agenda'] = $description;
    }

    if (array_key_exists('durationMinutes', $data)) {
        $durationRaw = $data['durationMinutes'];
        if ($durationRaw === null || $durationRaw === '') {
            $duration = null;
        } else {
            if (!is_numeric($durationRaw)) {
                send_json(['error' => 'Invalid duration'], 400);
                exit;
            }
            $duration = (int)$durationRaw;
            if ($duration < 0) {
                send_json(['error' => 'Duration must be positive'], 400);
                exit;
            }
        }
        $fields[] = 'duration_minutes = :duration_minutes';
        $params[':duration_minutes'] = $duration;
    }

    $currentType = normalize_meeting_type($existing['meeting_type'] ?? 'presencial');
    $meetingType = $currentType;
    $updateMeetingType = false;
    if (array_key_exists('meetingType', $data)) {
        $meetingType = normalize_meeting_type((string)$data['meetingType']);
        $updateMeetingType = true;
    }

    $onlineLink = $existing['online_link'] ?? null;
    $updateOnlineLink = false;
    if (array_key_exists('onlineLink', $data)) {
        $link = $data['onlineLink'];
        if ($link === null) {
            $onlineLink = null;
        } else {
            $link = trim((string)$link);
            $onlineLink = $link === '' ? null : $link;
        }
        $updateOnlineLink = true;
    }

    if (meeting_type_requires_online_link($meetingType) && ($onlineLink === null || $onlineLink === '')) {
        send_json(['error' => 'Online link is required for virtual meetings'], 400);
        exit;
    }

    if (!meeting_type_requires_online_link($meetingType)) {
        $onlineLink = null;
        $updateOnlineLink = true;
    }

    if ($updateMeetingType || $meetingType !== $currentType) {
        $fields[] = 'meeting_type = :meeting_type';
        $params[':meeting_type'] = $meetingType;
    }

    if ($updateOnlineLink) {
        $fields[] = 'online_link = :online_link';
        $params[':online_link'] = $onlineLink;
    }

    if (empty($fields)) {
        send_json(['error' => 'No fields to update'], 400);
        exit;
    }

    $setClauses = implode(', ', $fields);
    $stmt = $pdo->prepare("UPDATE meetings SET $setClauses WHERE id = :id");
    $stmt->execute($params);

    $stmt = $pdo->prepare('SELECT * FROM meetings WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $updated = $stmt->fetch();

    if (!$updated) {
        send_json(['error' => 'Meeting not found after update'], 500);
        exit;
    }

    send_json(format_meeting_row($updated));
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

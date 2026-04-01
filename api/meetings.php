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

function allowed_recurrence_types(): array {
    return ['daily', 'weekly', 'monthly'];
}

function allowed_monthly_weeks(): array {
    return [1, 2, 3, 4, 5, -1];
}

function normalize_weekday_abbr(?string $abbr): ?string {
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
        'SÃ¡b' => 'Sab',
        'Sabado' => 'Sab',
        'SÃ¡bado' => 'Sab',
    ];

    return $map[$abbr] ?? null;
}

function normalize_weekday_list(?array $days): array {
    if (!is_array($days)) {
        return [];
    }

    $normalized = [];
    foreach ($days as $day) {
        if (!is_string($day)) {
            continue;
        }

        $weekday = normalize_weekday_abbr($day);
        if ($weekday !== null) {
            $normalized[$weekday] = $weekday;
        }
    }

    $order = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    usort($normalized, static function (string $a, string $b) use ($order): int {
        return array_search($a, $order, true) <=> array_search($b, $order, true);
    });

    return array_values($normalized);
}

function parse_optional_int(mixed $value): ?int {
    if ($value === null || $value === '') {
        return null;
    }

    if (is_int($value)) {
        return $value;
    }

    if (is_numeric($value)) {
        return (int)$value;
    }

    return null;
}

function decode_days_json(?string $json): array {
    if ($json === null || $json === '') {
        return [];
    }

    $decoded = json_decode($json, true);
    return is_array($decoded) ? $decoded : [];
}

function resolve_recurrence_state(array $data, ?array $existing = null): array {
    $isRecurring = array_key_exists('isRecurring', $data)
        ? !empty($data['isRecurring'])
        : ($existing !== null ? !empty($existing['is_recurring']) : false);

    if (!$isRecurring) {
        return [
            'isRecurring' => 0,
            'recurrenceType' => null,
            'recurrenceDayOfMonth' => null,
            'recurrenceDaysOfWeek' => null,
            'recurrenceDaysOfWeekList' => null,
            'recurrenceMonthlyWeek' => null,
            'recurrenceMonthlyWeekday' => null,
        ];
    }

    $baseDate = trim((string)($data['date'] ?? ($existing['date'] ?? '')));
    $rawType = array_key_exists('recurrenceType', $data)
        ? trim((string)($data['recurrenceType'] ?? ''))
        : trim((string)($existing['recurrence_type'] ?? ''));

    $dayOfMonth = array_key_exists('recurrenceDayOfMonth', $data)
        ? parse_optional_int($data['recurrenceDayOfMonth'])
        : parse_optional_int($existing['recurrence_day_of_month'] ?? null);

    $daysOfWeek = array_key_exists('recurrenceDaysOfWeek', $data)
        ? (is_array($data['recurrenceDaysOfWeek']) ? $data['recurrenceDaysOfWeek'] : [])
        : decode_days_json($existing['recurrence_days_of_week'] ?? null);

    $monthlyWeek = array_key_exists('recurrenceMonthlyWeek', $data)
        ? parse_optional_int($data['recurrenceMonthlyWeek'])
        : parse_optional_int($existing['recurrence_monthly_week'] ?? null);

    $monthlyWeekday = array_key_exists('recurrenceMonthlyWeekday', $data)
        ? normalize_weekday_abbr(is_string($data['recurrenceMonthlyWeekday']) ? $data['recurrenceMonthlyWeekday'] : null)
        : normalize_weekday_abbr($existing['recurrence_monthly_weekday'] ?? null);

    // Compatibilidade com o formato antigo: "daily" + dia do mes era mensal.
    if ($rawType === 'daily' && $dayOfMonth !== null && $dayOfMonth >= 1) {
        $rawType = 'monthly';
    }

    if (!in_array($rawType, allowed_recurrence_types(), true)) {
        throw new InvalidArgumentException('Invalid recurrence type');
    }

    if ($rawType === 'daily') {
        return [
            'isRecurring' => 1,
            'recurrenceType' => 'daily',
            'recurrenceDayOfMonth' => null,
            'recurrenceDaysOfWeek' => null,
            'recurrenceDaysOfWeekList' => null,
            'recurrenceMonthlyWeek' => null,
            'recurrenceMonthlyWeekday' => null,
        ];
    }

    if ($rawType === 'weekly') {
        $normalizedDays = normalize_weekday_list($daysOfWeek);
        if (empty($normalizedDays)) {
            throw new InvalidArgumentException('Select at least one weekday for weekly recurrence');
        }

        return [
            'isRecurring' => 1,
            'recurrenceType' => 'weekly',
            'recurrenceDayOfMonth' => null,
            'recurrenceDaysOfWeek' => json_encode($normalizedDays, JSON_UNESCAPED_UNICODE),
            'recurrenceDaysOfWeekList' => $normalizedDays,
            'recurrenceMonthlyWeek' => null,
            'recurrenceMonthlyWeekday' => null,
        ];
    }

    $hasMonthlyWeekdayRule = $monthlyWeek !== null || $monthlyWeekday !== null;
    if ($hasMonthlyWeekdayRule) {
        if (
            $monthlyWeek === null ||
            $monthlyWeekday === null ||
            !in_array($monthlyWeek, allowed_monthly_weeks(), true)
        ) {
            throw new InvalidArgumentException('Invalid monthly weekday recurrence');
        }

        return [
            'isRecurring' => 1,
            'recurrenceType' => 'monthly',
            'recurrenceDayOfMonth' => null,
            'recurrenceDaysOfWeek' => null,
            'recurrenceDaysOfWeekList' => null,
            'recurrenceMonthlyWeek' => $monthlyWeek,
            'recurrenceMonthlyWeekday' => $monthlyWeekday,
        ];
    }

    if ($dayOfMonth === null && preg_match('/^\d{4}-\d{2}-\d{2}$/', $baseDate)) {
        $dayOfMonth = (int)date('j', strtotime($baseDate));
    }

    if ($dayOfMonth === null || $dayOfMonth < 1 || $dayOfMonth > 31) {
        throw new InvalidArgumentException('Invalid monthly day recurrence');
    }

    return [
        'isRecurring' => 1,
        'recurrenceType' => 'monthly',
        'recurrenceDayOfMonth' => $dayOfMonth,
        'recurrenceDaysOfWeek' => null,
        'recurrenceDaysOfWeekList' => null,
        'recurrenceMonthlyWeek' => null,
        'recurrenceMonthlyWeekday' => null,
    ];
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

    $isRecurring = !empty($row['is_recurring']);
    $recurrenceType = $row['recurrence_type'] ?? null;
    $recurrenceDayOfMonth = isset($row['recurrence_day_of_month']) ? (int)$row['recurrence_day_of_month'] : null;
    $recurrenceDaysOfWeek = decode_days_json($row['recurrence_days_of_week'] ?? null);
    if (empty($recurrenceDaysOfWeek)) {
        $recurrenceDaysOfWeek = null;
    }
    $recurrenceMonthlyWeek = isset($row['recurrence_monthly_week']) ? (int)$row['recurrence_monthly_week'] : null;
    $recurrenceMonthlyWeekday = normalize_weekday_abbr($row['recurrence_monthly_weekday'] ?? null);

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
        'isRecurring' => $isRecurring,
        'recurrenceType' => $isRecurring ? $recurrenceType : null,
        'recurrenceDayOfMonth' => $isRecurring ? $recurrenceDayOfMonth : null,
        'recurrenceDaysOfWeek' => $isRecurring ? $recurrenceDaysOfWeek : null,
        'recurrenceMonthlyWeek' => $isRecurring ? $recurrenceMonthlyWeek : null,
        'recurrenceMonthlyWeekday' => $isRecurring ? $recurrenceMonthlyWeekday : null,
        'createdAt' => $row['created_at'],
        'status' => $row['status'],
    ];
}

function weekday_abbr_to_number(string $abbr): ?int {
    $abbr = normalize_weekday_abbr($abbr);
    if ($abbr === null) {
        return null;
    }

    $map = [
        'Dom' => 0,
        'Seg' => 1,
        'Ter' => 2,
        'Qua' => 3,
        'Qui' => 4,
        'Sex' => 5,
        'Sab' => 6,
    ];

    return $map[$abbr] ?? null;
}

function get_effective_recurrence_type(array $row): ?string {
    $type = trim((string)($row['recurrence_type'] ?? ''));
    if ($type === 'daily' && !empty($row['recurrence_day_of_month'])) {
        return 'monthly';
    }

    return in_array($type, allowed_recurrence_types(), true) ? $type : null;
}

function get_monthly_day_from_row(array $row): int {
    $dayOfMonth = (int)($row['recurrence_day_of_month'] ?? 0);
    if ($dayOfMonth >= 1 && $dayOfMonth <= 31) {
        return $dayOfMonth;
    }

    return (int)date('j', strtotime((string)($row['date'] ?? 'now')));
}

function get_weekday_occurrence_in_month(string $dateStr): int {
    return intdiv(((int)date('j', strtotime($dateStr))) - 1, 7) + 1;
}

function is_last_weekday_of_month(string $dateStr): bool {
    return date('n', strtotime($dateStr . ' +7 days')) !== date('n', strtotime($dateStr));
}

function recurring_matches_date(array $row, string $dateStr): bool {
    if (empty($row['is_recurring'])) {
        return false;
    }

    $startDate = $row['date'] ?? '';
    if ($dateStr < $startDate) {
        return false;
    }

    $type = get_effective_recurrence_type($row);
    if ($type === null) {
        return false;
    }

    if ($type === 'daily') {
        return true;
    }

    if ($type === 'weekly') {
        $days = decode_days_json($row['recurrence_days_of_week'] ?? null);
        if (empty($days)) {
            return false;
        }

        $requestedDow = (int)date('w', strtotime($dateStr));
        foreach ($days as $abbr) {
            if (is_string($abbr) && weekday_abbr_to_number($abbr) === $requestedDow) {
                return true;
            }
        }
        return false;
    }

    $requestedDow = (int)date('w', strtotime($dateStr));
    $monthlyWeek = isset($row['recurrence_monthly_week']) ? (int)$row['recurrence_monthly_week'] : null;
    $monthlyWeekday = normalize_weekday_abbr($row['recurrence_monthly_weekday'] ?? null);

    if (
        $monthlyWeek !== null &&
        $monthlyWeekday !== null &&
        in_array($monthlyWeek, allowed_monthly_weeks(), true)
    ) {
        if (weekday_abbr_to_number($monthlyWeekday) !== $requestedDow) {
            return false;
        }

        if ($monthlyWeek === -1) {
            return is_last_weekday_of_month($dateStr);
        }

        return get_weekday_occurrence_in_month($dateStr) === $monthlyWeek;
    }

    return get_monthly_day_from_row($row) === (int)date('j', strtotime($dateStr));
}

function get_recurring_meetings_for_date(PDO $pdo, string $dateStr, bool $includeAll): array {
    $statusClause = $includeAll ? '' : " AND status = 'approved'";
    $stmt = $pdo->prepare("SELECT * FROM meetings WHERE is_recurring = 1{$statusClause}");
    $stmt->execute();
    $rows = $stmt->fetchAll();
    $matches = [];
    foreach ($rows as $row) {
        if (recurring_matches_date($row, $dateStr)) {
            $matches[] = $row;
        }
    }
    return $matches;
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$pdo = get_pdo();

if ($method === 'GET') {
    $date = isset($_GET['date']) ? trim((string)$_GET['date']) : null;
    $includeAll = (isset($_GET['includeAll']) && ($_GET['includeAll'] === '1' || strtolower($_GET['includeAll']) === 'true')) && is_admin();
    $rows = [];

    $hasRecurring = has_recurring_column($pdo);

    if ($date) {
        if ($includeAll) {
            if ($hasRecurring) {
                $stmt = $pdo->prepare('SELECT * FROM meetings WHERE date = :date AND is_recurring = 0 ORDER BY time ASC');
                $stmt->execute([':date' => $date]);
                $rows = merge_meeting_rows($stmt->fetchAll(), get_recurring_meetings_for_date($pdo, $date, true));
            } else {
                $stmt = $pdo->prepare('SELECT * FROM meetings WHERE date = :date ORDER BY time ASC');
                $stmt->execute([':date' => $date]);
                $rows = $stmt->fetchAll();
            }
            $rows = sort_meeting_rows($rows, true);
        } else {
            if ($hasRecurring) {
                $stmt = $pdo->prepare("SELECT * FROM meetings WHERE date = :date AND status = 'approved' AND is_recurring = 0 ORDER BY time ASC");
                $stmt->execute([':date' => $date]);
                $recurringRows = get_recurring_meetings_for_date($pdo, $date, false);
                $rows = merge_meeting_rows($stmt->fetchAll(), $recurringRows, get_requester_pending_meetings($pdo, $date));
            } else {
                $stmt = $pdo->prepare("SELECT * FROM meetings WHERE date = :date AND status = 'approved' ORDER BY time ASC");
                $stmt->execute([':date' => $date]);
                $rows = merge_meeting_rows($stmt->fetchAll(), get_requester_pending_meetings($pdo, $date));
            }
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

    try {
        $recurrenceState = resolve_recurrence_state($data);
    } catch (InvalidArgumentException $exception) {
        send_json(['error' => $exception->getMessage()], 400);
        exit;
    }

    $hasRecurringCol = has_recurring_column($pdo);

    if ($hasRecurringCol) {
        $stmt = $pdo->prepare('INSERT INTO meetings (id, title, date, time, participants, description, agenda, duration_minutes, meeting_type, online_link, is_recurring, recurrence_type, recurrence_day_of_month, recurrence_days_of_week, recurrence_monthly_week, recurrence_monthly_weekday, created_at, status) VALUES (:id, :title, :date, :time, :participants, :description, :agenda, :duration_minutes, :meeting_type, :online_link, :is_recurring, :recurrence_type, :recurrence_day_of_month, :recurrence_days_of_week, :recurrence_monthly_week, :recurrence_monthly_weekday, :created_at, :status)');
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
            ':is_recurring' => $recurrenceState['isRecurring'],
            ':recurrence_type' => $recurrenceState['recurrenceType'],
            ':recurrence_day_of_month' => $recurrenceState['recurrenceDayOfMonth'],
            ':recurrence_days_of_week' => $recurrenceState['recurrenceDaysOfWeek'],
            ':recurrence_monthly_week' => $recurrenceState['recurrenceMonthlyWeek'],
            ':recurrence_monthly_weekday' => $recurrenceState['recurrenceMonthlyWeekday'],
            ':created_at' => $createdAt,
            ':status' => $status,
        ]);
    } else {
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
    }

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
        'isRecurring' => (bool)$recurrenceState['isRecurring'],
        'recurrenceType' => $recurrenceState['recurrenceType'],
        'recurrenceDayOfMonth' => $recurrenceState['recurrenceDayOfMonth'],
        'recurrenceDaysOfWeek' => $recurrenceState['recurrenceDaysOfWeekList'],
        'recurrenceMonthlyWeek' => $recurrenceState['recurrenceMonthlyWeek'],
        'recurrenceMonthlyWeekday' => $recurrenceState['recurrenceMonthlyWeekday'],
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

    $recurrenceKeys = [
        'isRecurring',
        'recurrenceType',
        'recurrenceDayOfMonth',
        'recurrenceDaysOfWeek',
        'recurrenceMonthlyWeek',
        'recurrenceMonthlyWeekday',
    ];
    $shouldUpdateRecurrence = false;
    foreach ($recurrenceKeys as $key) {
        if (array_key_exists($key, $data)) {
            $shouldUpdateRecurrence = true;
            break;
        }
    }

    if ($shouldUpdateRecurrence) {
        try {
            $recurrenceState = resolve_recurrence_state($data, $existing);
        } catch (InvalidArgumentException $exception) {
            send_json(['error' => $exception->getMessage()], 400);
            exit;
        }

        $fields[] = 'is_recurring = :is_recurring';
        $fields[] = 'recurrence_type = :recurrence_type';
        $fields[] = 'recurrence_day_of_month = :recurrence_day_of_month';
        $fields[] = 'recurrence_days_of_week = :recurrence_days_of_week';
        $fields[] = 'recurrence_monthly_week = :recurrence_monthly_week';
        $fields[] = 'recurrence_monthly_weekday = :recurrence_monthly_weekday';
        $params[':is_recurring'] = $recurrenceState['isRecurring'];
        $params[':recurrence_type'] = $recurrenceState['recurrenceType'];
        $params[':recurrence_day_of_month'] = $recurrenceState['recurrenceDayOfMonth'];
        $params[':recurrence_days_of_week'] = $recurrenceState['recurrenceDaysOfWeek'];
        $params[':recurrence_monthly_week'] = $recurrenceState['recurrenceMonthlyWeek'];
        $params[':recurrence_monthly_weekday'] = $recurrenceState['recurrenceMonthlyWeekday'];
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

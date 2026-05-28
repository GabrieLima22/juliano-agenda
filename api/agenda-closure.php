<?php
require_once __DIR__ . '/../app/helpers.php';
require_once __DIR__ . '/../app/db.php';

setup_cors();
start_session();

$pdo = get_pdo();
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

function normalize_optional_datetime_input(mixed $value): ?string {
    if (!is_string($value)) {
        return null;
    }

    $trimmed = trim($value);
    if ($trimmed === '') {
        return null;
    }

    $timezone = new DateTimeZone('America/Sao_Paulo');
    $formats = ['Y-m-d\TH:i', 'Y-m-d H:i:s', 'Y-m-d H:i'];

    foreach ($formats as $format) {
        $parsed = DateTimeImmutable::createFromFormat($format, $trimmed, $timezone);
        if ($parsed instanceof DateTimeImmutable) {
            return $parsed->format('Y-m-d H:i:s');
        }
    }

    return null;
}

function format_agenda_closure_settings(array $settings): array {
    $active = agenda_closure_is_active($settings);
    $remainingSeconds = null;

    if ($active && !empty($settings['ends_at'])) {
        $timezone = new DateTimeZone('America/Sao_Paulo');
        $now = new DateTimeImmutable('now', $timezone);
        $end = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', (string)$settings['ends_at'], $timezone);
        if ($end instanceof DateTimeImmutable) {
            $remainingSeconds = max(0, $end->getTimestamp() - $now->getTimestamp());
        }
    }

    return [
        'isEnabled' => !empty($settings['is_enabled']),
        'isActive' => $active,
        'startsAt' => $settings['starts_at'] ?? null,
        'endsAt' => $settings['ends_at'] ?? null,
        'message' => $settings['message'] ?? null,
        'updatedAt' => $settings['updated_at'] ?? null,
        'remainingSeconds' => $remainingSeconds,
    ];
}

if ($method === 'GET') {
    send_json(format_agenda_closure_settings(get_agenda_closure_settings($pdo)));
    exit;
}

require_admin();

if ($method === 'PATCH' || $method === 'POST') {
    $body = json_input();
    $startsAt = normalize_optional_datetime_input($body['startsAt'] ?? null);
    $endsAt = normalize_optional_datetime_input($body['endsAt'] ?? null);
    $message = isset($body['message']) && is_string($body['message']) ? trim($body['message']) : null;
    $message = $message === '' ? null : $message;

    if ($startsAt === null || $endsAt === null) {
        send_json(['error' => 'Selecione o início e o fim do bloqueio.'], 400);
        exit;
    }

    $timezone = new DateTimeZone('America/Sao_Paulo');
    $startDate = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $startsAt, $timezone);
    $endDate = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $endsAt, $timezone);

    if (!$startDate || !$endDate) {
        send_json(['error' => 'Período de bloqueio inválido.'], 400);
        exit;
    }

    if ($endDate <= $startDate) {
        send_json(['error' => 'A data final precisa ser maior que a data inicial.'], 400);
        exit;
    }

    $stmt = $pdo->prepare(
        'UPDATE agenda_closure_settings
         SET is_enabled = 1, starts_at = :starts_at, ends_at = :ends_at, message = :message, updated_at = CURRENT_TIMESTAMP
         WHERE id = 1'
    );
    $stmt->execute([
        ':starts_at' => $startsAt,
        ':ends_at' => $endsAt,
        ':message' => $message,
    ]);

    send_json(format_agenda_closure_settings(get_agenda_closure_settings($pdo)));
    exit;
}

if ($method === 'DELETE') {
    $stmt = $pdo->prepare(
        'UPDATE agenda_closure_settings
         SET is_enabled = 0, starts_at = NULL, ends_at = NULL, message = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = 1'
    );
    $stmt->execute();

    send_json(format_agenda_closure_settings(get_agenda_closure_settings($pdo)));
    exit;
}

send_json(['error' => 'Method not allowed'], 405);

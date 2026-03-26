<?php
require_once __DIR__ . '/../app/helpers.php';

setup_cors();
start_session();

function mobile_context_cache_dir(): string {
    return rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'juliano_agenda_mobile_context';
}

function mobile_context_cache_key(float $lat, float $lon): string {
    return sha1(number_format($lat, 3, '.', '') . ':' . number_format($lon, 3, '.', ''));
}

function mobile_context_cache_get(string $key, int $ttlSeconds): ?array {
    $dir = mobile_context_cache_dir();
    $path = $dir . DIRECTORY_SEPARATOR . $key . '.json';

    if (!is_file($path)) {
        return null;
    }

    $raw = @file_get_contents($path);
    if ($raw === false || $raw === '') {
        return null;
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded) || !isset($decoded['timestamp'], $decoded['payload']) || !is_array($decoded['payload'])) {
        return null;
    }

    if ((int)$decoded['timestamp'] + $ttlSeconds < time()) {
        return null;
    }

    return $decoded['payload'];
}

function mobile_context_cache_put(string $key, array $payload): void {
    $dir = mobile_context_cache_dir();
    if (!is_dir($dir) && !@mkdir($dir, 0777, true) && !is_dir($dir)) {
        return;
    }

    $path = $dir . DIRECTORY_SEPARATOR . $key . '.json';
    @file_put_contents($path, json_encode([
        'timestamp' => time(),
        'payload' => $payload,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

function mobile_context_http_get_json(string $url, array $headers = []): ?array {
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $defaultHeaders = [
        'Accept: application/json',
        'Accept-Language: pt-BR,pt;q=0.9,en;q=0.8',
        'User-Agent: JulianoAgenda/1.0 (+https://' . $host . ')',
    ];
    $requestHeaders = array_merge($defaultHeaders, $headers);

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPHEADER => $requestHeaders,
            CURLOPT_FOLLOWLOCATION => false,
        ]);
        $raw = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);

        if ($raw === false || $status >= 400) {
            return null;
        }
    } else {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => 10,
                'header' => implode("\r\n", $requestHeaders),
            ],
        ]);
        $raw = @file_get_contents($url, false, $context);
        if ($raw === false) {
            return null;
        }
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : null;
}

function mobile_context_first_non_empty(array $values): ?string {
    foreach ($values as $value) {
        $candidate = trim((string)$value);
        if ($candidate !== '') {
            return $candidate;
        }
    }

    return null;
}

if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    send_json(['error' => 'Method not allowed'], 405);
    exit;
}

$latRaw = $_GET['lat'] ?? null;
$lonRaw = $_GET['lon'] ?? null;

if (!is_numeric($latRaw) || !is_numeric($lonRaw)) {
    send_json(['error' => 'Latitude and longitude are required'], 400);
    exit;
}

$lat = (float)$latRaw;
$lon = (float)$lonRaw;

if ($lat < -90 || $lat > 90 || $lon < -180 || $lon > 180) {
    send_json(['error' => 'Invalid latitude or longitude'], 400);
    exit;
}

$cacheKey = mobile_context_cache_key($lat, $lon);
$cached = mobile_context_cache_get($cacheKey, 600);
if ($cached !== null) {
    send_json($cached);
    exit;
}

$weatherQuery = http_build_query([
    'latitude' => $lat,
    'longitude' => $lon,
    'current' => 'temperature_2m,weather_code,is_day',
    'timezone' => 'auto',
], '', '&', PHP_QUERY_RFC3986);

$weather = mobile_context_http_get_json('https://api.open-meteo.com/v1/forecast?' . $weatherQuery);
if (!is_array($weather) || !isset($weather['current']) || !is_array($weather['current'])) {
    send_json(['error' => 'Weather service unavailable'], 502);
    exit;
}

$reverseQuery = http_build_query([
    'lat' => $lat,
    'lon' => $lon,
    'format' => 'jsonv2',
    'addressdetails' => 1,
    'zoom' => 10,
    'accept-language' => 'pt-BR',
], '', '&', PHP_QUERY_RFC3986);

$reverse = mobile_context_http_get_json('https://nominatim.openstreetmap.org/reverse?' . $reverseQuery);
$address = isset($reverse['address']) && is_array($reverse['address']) ? $reverse['address'] : [];

$city = mobile_context_first_non_empty([
    $address['city'] ?? null,
    $address['town'] ?? null,
    $address['municipality'] ?? null,
    $address['village'] ?? null,
    $address['suburb'] ?? null,
    $address['county'] ?? null,
]);

$region = mobile_context_first_non_empty([
    $address['state'] ?? null,
    $address['state_district'] ?? null,
    $address['region'] ?? null,
]);

$payload = [
    'coords' => [
        'latitude' => $lat,
        'longitude' => $lon,
    ],
    'weather' => [
        'temperature' => isset($weather['current']['temperature_2m']) ? (float)$weather['current']['temperature_2m'] : null,
        'weatherCode' => isset($weather['current']['weather_code']) ? (int)$weather['current']['weather_code'] : null,
        'isDay' => isset($weather['current']['is_day']) ? ((int)$weather['current']['is_day'] === 1) : true,
    ],
    'location' => [
        'city' => $city,
        'region' => $region,
        'label' => mobile_context_first_non_empty([
            $city !== null && $region !== null ? $city . ', ' . $region : null,
            $city,
            $region,
        ]),
    ],
    'resolvedAt' => gmdate('c'),
];

mobile_context_cache_put($cacheKey, $payload);
send_json($payload);

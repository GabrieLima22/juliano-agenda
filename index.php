<?php
// Serve o index do build sem alterar a URL (/juliano-agenda/)
$index = __DIR__ . '/dist/index.html';
if (file_exists($index)) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile($index);
    exit;
}
http_response_code(500);
echo 'Build não encontrado. Rode "npm run build".';
?>

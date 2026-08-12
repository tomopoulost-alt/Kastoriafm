<?php
/**
 * Code Snippet for WordPress (Code Snippets plugin)
 * Title: Kastoria FM Stream Proxy
 * Run snippet: Everywhere
 */

add_action('template_redirect', function () {
    if (!isset($_GET['kastoria_stream'])) {
        return;
    }

    @ini_set('zlib.output_compression', '0');
    @ini_set('output_buffering', '0');
    @set_time_limit(0);
    ignore_user_abort(true);

    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    $streamUrl = 'http://eco.onestreaming.com:8107/stream';
    $ch = curl_init($streamUrl);

    if ($ch === false) {
        status_header(502);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Stream unavailable';
        exit;
    }

    header('Content-Type: audio/mpeg');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Access-Control-Allow-Origin: *');
    header('X-Accel-Buffering: no');

    curl_setopt_array($ch, [
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_HEADER => false,
        CURLOPT_HTTPHEADER => [
            'Icy-MetaData: 1',
            'Connection: keep-alive',
        ],
        CURLOPT_WRITEFUNCTION => static function ($ch, string $data): int {
            echo $data;
            if (function_exists('flush')) {
                flush();
            }
            return strlen($data);
        },
        CURLOPT_TIMEOUT => 0,
        CURLOPT_CONNECTTIMEOUT => 10,
    ]);

    $ok = curl_exec($ch);
    if ($ok === false) {
        if (!headers_sent()) {
            status_header(502);
            header('Content-Type: text/plain; charset=utf-8');
        }
        echo 'Stream unavailable';
    }

    curl_close($ch);
    exit;
});

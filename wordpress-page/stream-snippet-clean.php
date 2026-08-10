/**
 * Kastoria FM Stream Proxy
 * Paste into Code Snippets WITHOUT <?php
 * Run: Everywhere
 */

add_action('template_redirect', function () {
    if (!isset($_GET['kastoria_stream'])) {
        return;
    }

    // Bypass caches / optimizers for the live stream endpoint.
    if (!defined('DONOTCACHEPAGE')) {
        define('DONOTCACHEPAGE', true);
    }
    if (!defined('DONOTCACHEDB')) {
        define('DONOTCACHEDB', true);
    }
    if (!defined('DONOTMINIFY')) {
        define('DONOTMINIFY', true);
    }
    if (!defined('DONOTCDN')) {
        define('DONOTCDN', true);
    }

    nocache_headers();

    @ini_set('zlib.output_compression', '0');
    @ini_set('output_buffering', '0');
    @set_time_limit(0);
    ignore_user_abort(true);

    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    $streamUrl = 'http://eco.onestreaming.com:8107/stream';

    if (!function_exists('curl_init')) {
        status_header(500);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'cURL missing';
        exit;
    }

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
            'Icy-MetaData: 0',
            'Connection: keep-alive',
            'User-Agent: KastoriaFM-WP-Proxy',
        ],
        CURLOPT_WRITEFUNCTION => static function ($ch, $data) {
            echo $data;
            if (function_exists('flush')) {
                flush();
            }
            return strlen($data);
        },
        CURLOPT_TIMEOUT => 0,
        CURLOPT_CONNECTTIMEOUT => 12,
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
}, 0);

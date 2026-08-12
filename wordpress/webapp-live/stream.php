<?php
/**
 * Kastoria FM live stream proxy.
 * Use ?debug=1 for diagnostics.
 */

@ini_set('zlib.output_compression', '0');
@ini_set('output_buffering', '0');
@ini_set('display_errors', '0');
@error_reporting(0);
@set_time_limit(0);
ignore_user_abort(true);

while (ob_get_level() > 0) {
    ob_end_clean();
}

$upstreams = [
    'http://eco.onestreaming.com:8107/stream',
    'http://eco.onestreaming.com:8107/;',
    'http://eco.onestreaming.com:8107/stream/1/',
];

$debug = isset($_GET['debug']);

function kfm_try_connect($url, $timeout = 8) {
    if (!function_exists('curl_init')) {
        return [false, 0, 'curl missing', ''];
    }
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_CONNECTTIMEOUT => $timeout,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_HTTPHEADER => ['Icy-MetaData: 0', 'User-Agent: KastoriaFM-Proxy'],
    ]);
    // Read only a small chunk for probe by aborting via write function.
    $buf = '';
    curl_setopt($ch, CURLOPT_WRITEFUNCTION, static function ($ch, $data) use (&$buf) {
        $buf .= $data;
        if (strlen($buf) >= 2048) {
            return 0; // abort after first bytes
        }
        return strlen($data);
    });
    curl_exec($ch);
    $errno = curl_errno($ch);
    $err = curl_error($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    // errno 23 = aborted by write callback after enough bytes — success for probe
    $ok = strlen($buf) > 64;
    return [$ok, $code, ($ok ? '' : $err), $buf];
}

if ($debug) {
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    echo 'PHP ' . PHP_VERSION . "\n";
    echo 'curl=' . (function_exists('curl_init') ? 'yes' : 'no') . "\n";
    foreach ($upstreams as $u) {
        list($ok, $code, $err, $buf) = kfm_try_connect($u, 6);
        echo "\nURL {$u}\n";
        echo 'ok=' . ($ok ? 'yes' : 'no') . " http={$code} err={$err} bytes=" . strlen($buf) . "\n";
    }
    exit;
}

$chosen = null;
$first = '';
foreach ($upstreams as $u) {
    list($ok, $code, $err, $buf) = kfm_try_connect($u, 7);
    if ($ok) {
        $chosen = $u;
        $first = $buf;
        break;
    }
}

if (!$chosen) {
    http_response_code(502);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    echo 'Upstream stream unavailable';
    exit;
}

header('Content-Type: audio/mpeg');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Access-Control-Allow-Origin: *');
header('X-Accel-Buffering: no');
header('Connection: keep-alive');

// Fresh full stream connection (probe used a separate aborted request).
$ch = curl_init($chosen);
curl_setopt_array($ch, [
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_RETURNTRANSFER => false,
    CURLOPT_HEADER => false,
    CURLOPT_HTTPHEADER => ['Icy-MetaData: 0', 'Connection: keep-alive', 'User-Agent: KastoriaFM-Proxy'],
    CURLOPT_WRITEFUNCTION => static function ($ch, $data) {
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
    // As last resort, at least emit probed bytes so player gets something.
    if ($first !== '') {
        echo $first;
        flush();
    }
}

curl_close($ch);

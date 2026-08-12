/**
 * One-time PWA deployer for /webapp
 * Visit (while logged in as admin): /?kfm_deploy_pwa=1
 * Then DELETE/deactivate this snippet.
 */
add_action('init', function () {
    if (!isset($_GET['kfm_deploy_pwa'])) {
        return;
    }
    if (!current_user_can('manage_options')) {
        status_header(403);
        echo 'Forbidden';
        exit;
    }

    $base = 'https://raw.githubusercontent.com/tomopoulost-alt/Kastoriafm/cursor/kastoria-fm-radio-player-8789/wordpress/webapp-live/';
    $dir = rtrim(ABSPATH, '/\\') . '/webapp';
    if (!is_dir($dir) && !wp_mkdir_p($dir)) {
        status_header(500);
        echo 'Cannot create webapp dir';
        exit;
    }

    $files = [
        'index.html',
        'manifest.webmanifest',
        'sw.js',
        'icon-192.png',
        'icon-512.png',
        'apple-touch-icon.png',
        'stream.php',
    ];

    $out = [];
    foreach ($files as $file) {
        $url = $base . $file;
        $resp = wp_remote_get($url, ['timeout' => 60, 'sslverify' => true]);
        if (is_wp_error($resp)) {
            $out[] = $file . ': ERROR ' . $resp->get_error_message();
            continue;
        }
        $code = wp_remote_retrieve_response_code($resp);
        $body = wp_remote_retrieve_body($resp);
        if ($code !== 200 || $body === '') {
            $out[] = $file . ': ERROR HTTP ' . $code;
            continue;
        }
        $ok = file_put_contents($dir . '/' . $file, $body);
        $out[] = $file . ': ' . ($ok === false ? 'WRITE FAIL' : 'OK (' . strlen($body) . ' bytes)');
    }

    header('Content-Type: text/plain; charset=utf-8');
    echo "PWA deploy to {$dir}\n\n" . implode("\n", $out) . "\n";
    exit;
});

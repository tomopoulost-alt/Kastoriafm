<?php
header('Content-Type: audio/mpeg');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Access-Control-Allow-Origin: *');
header('X-Accel-Buffering: no');
@ini_set('zlib.output_compression', '0');
@set_time_limit(0);
ignore_user_abort(true);
while (ob_get_level() > 0) { ob_end_clean(); }
$ch = curl_init('http://eco.onestreaming.com:8107/stream');
curl_setopt_array($ch, [
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_RETURNTRANSFER => false,
  CURLOPT_HEADER => false,
  CURLOPT_HTTPHEADER => ['Icy-MetaData: 0', 'User-Agent: KastoriaFM'],
  CURLOPT_WRITEFUNCTION => function($ch, $data){ echo $data; flush(); return strlen($data); },
  CURLOPT_TIMEOUT => 0,
  CURLOPT_CONNECTTIMEOUT => 12,
]);
curl_exec($ch);
curl_close($ch);

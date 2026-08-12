#!/usr/bin/env node

/**
 * Fix Kastoria FM WordPress - Add new snippet via REST API
 */

const https = require('https');

const WP_URL = 'https://kastoriafm.gr';
const WP_USER = 'super@dmin';
const WP_PASS = 'Super@dmin1992@@';

// The full HTML page code to serve
const WEBAPP_CODE = `/**
 * Serve standalone Kastoria FM player on /webapp
 */
add_action('template_redirect', function () {
    if (!is_page('webapp')) {
        return;
    }
    nocache_headers();
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="el"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /><meta name="theme-color" content="#dce8eb" /><meta name="apple-mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-title" content="Kastoria FM" /><title>Kastoria FM 91.5</title><link rel="icon" href="https://i0.wp.com/kastoriafm.gr/wp-content/uploads/2023/05/cropped-K91.5.png?fit=32%2C32&ssl=1" /><style>@import url(\\'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Figtree:wght@400;500;600&display=swap\\');*{box-sizing:border-box}html,body{margin:0;min-height:100%}body{min-height:100dvh;font-family:Figtree,sans-serif;color:#243033;background:#dce8eb}.kfm-wrap{min-height:100dvh;display:grid;place-items:center;padding:clamp(1.25rem,4vw,2.5rem);background:radial-gradient(120% 80% at 50% -10%,#f7fbfc 0%,transparent 55%),linear-gradient(180deg,#eaf2f4 0%,#dce8eb 42%,#b9cfd4 100%)}.kfm-stage{width:min(100%,28rem);display:flex;flex-direction:column;align-items:center;gap:1.75rem;text-align:center}.kfm-logo{width:clamp(8.5rem,32vw,12rem);height:auto;filter:drop-shadow(0 18px 28px rgba(15,63,72,.18))}.kfm-name{margin:.35rem 0 0;font-family:Syne,sans-serif;font-weight:800;font-size:clamp(2.1rem,7vw,3.2rem);letter-spacing:-.04em;line-height:.95;color:#0f3f48}.kfm-tag{margin:.55rem 0 0;font-size:1.02rem;font-weight:500;color:rgba(36,48,51,.72)}.kfm-play{width:5rem;height:5rem;border:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:#f4f8f9;background:#1f6f7c;box-shadow:0 16px 30px rgba(15,63,72,.22)}.kfm-play:hover{background:#0f3f48}.kfm-play .is-hidden{display:none}.kfm-play [data-icon=play]{transform:translateX(2px)}.kfm-live{display:inline-flex;align-items:center;gap:.45rem;font-family:Syne,sans-serif;font-size:.92rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#0f3f48}.kfm-dot{width:.55rem;height:.55rem;border-radius:50%;background:#c4493a}.kfm-status{margin:.35rem 0 0;font-size:.98rem;color:rgba(36,48,51,.68)}.kfm-eq{display:flex;align-items:flex-end;justify-content:center;gap:.28rem;height:1.35rem;opacity:.35}.kfm-eq.is-on{opacity:1}.kfm-eq span{width:.28rem;height:35%;border-radius:999px;background:#1f6f7c}.kfm-eq.is-on span{animation:kfmBars .9s ease-in-out infinite}.kfm-eq span:nth-child(2){animation-delay:.12s}.kfm-eq span:nth-child(3){animation-delay:.24s}.kfm-eq span:nth-child(4){animation-delay:.08s}.kfm-eq span:nth-child(5){animation-delay:.3s}.kfm-vol{width:min(100%,16rem);display:grid;gap:.35rem;justify-items:center}.kfm-vol label{font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:rgba(36,48,51,.55)}.kfm-vol input{width:100%;appearance:none;height:.28rem;border-radius:999px;background:rgba(15,63,72,.18)}.kfm-vol input::-webkit-slider-thumb{appearance:none;width:1rem;height:1rem;border-radius:50%;background:#0f3f48;border:2px solid #f4f8f9;cursor:pointer}.kfm-install{width:min(100%,18rem);display:none;gap:.5rem;justify-items:center}.kfm-install.show{display:grid}.kfm-install button{width:100%;border:0;background:transparent;border-bottom:2px solid #1f6f7c;color:#0f3f48;font-family:Syne,sans-serif;font-weight:700;font-size:1rem;padding:.8rem 1rem;cursor:pointer}.kfm-install p{margin:0;font-size:.9rem;color:rgba(36,48,51,.7)}@keyframes kfmBars{0%,100%{height:30%}50%{height:100%}}</style></head><body><div class="kfm-wrap" id="kfm-app"><div class="kfm-stage"><div><img class="kfm-logo" src="https://i0.wp.com/kastoriafm.gr/wp-content/uploads/2023/05/K91.5.png?w=400" alt="Kastoria FM 91.5" width="200" height="214" /><h1 class="kfm-name">Kastoria FM</h1><p class="kfm-tag">Ο σταθμός που ακούει η πόλη</p></div><button class="kfm-play" type="button" aria-label="Αναπαραγωγή" data-playing="0"><svg data-icon="play" viewBox="0 0 24 24" width="34" height="34" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.02-6.86a1 1 0 0 0 0-1.72L9.5 4.28a1 1 0 0 0-1.5.86z"/></svg><svg class="is-hidden" data-icon="pause" viewBox="0 0 24 24" width="34" height="34" fill="currentColor"><path d="M7 5h3.5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9.5 0H20a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-3.5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/></svg></button><div><div class="kfm-live"><span class="kfm-dot"></span><span>Live · 91.5</span></div><p class="kfm-status">Πατήστε play για να ακούσετε</p></div><div class="kfm-eq" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div><div class="kfm-vol"><label for="kfm-volume">Ένταση</label><input id="kfm-volume" type="range" min="0" max="1" step="0.01" value="0.85" /></div><div class="kfm-install" id="kfm-install"><button type="button" id="kfm-install-btn">Εγκατάσταση εφαρμογής</button><p id="kfm-install-hint" hidden></p></div></div><audio id="kfm-audio" preload="none" crossorigin="anonymous"></audio></div><script>(function(){var STREAM=window.location.origin+"/?kastoria_stream=1";var audio=document.getElementById("kfm-audio");var playBtn=document.querySelector(".kfm-play");var playIcon=playBtn.querySelector("[data-icon=play]");var pauseIcon=playBtn.querySelector("[data-icon=pause]");var statusEl=document.querySelector(".kfm-status");var eq=document.querySelector(".kfm-eq");var volume=document.getElementById("kfm-volume");var installBox=document.getElementById("kfm-install");var installBtn=document.getElementById("kfm-install-btn");var installHint=document.getElementById("kfm-install-hint");var playing=false,loading=false,deferredPrompt=null;function setPlaying(on){playing=on;playBtn.setAttribute("data-playing",on?"1":"0");playBtn.setAttribute("aria-label",on?"Παύση":"Αναπαραγωγή");playIcon.classList.toggle("is-hidden",on);pauseIcon.classList.toggle("is-hidden",!on);eq.classList.toggle("is-on",on)}function setStatus(t){statusEl.textContent=t}async function start(){if(loading)return;loading=true;setStatus("Σύνδεση…");try{audio.src=STREAM+"&t="+Date.now();audio.volume=Number(volume.value);await audio.play();setPlaying(true);setStatus("Παίζει ζωντανά")}catch(e){setPlaying(false);setStatus("Αδυναμία αναπαραγωγής. Δοκιμάστε ξανά.");console.error(e)}finally{loading=false}}function stop(){audio.pause();audio.removeAttribute("src");audio.load();setPlaying(false);setStatus("Σε παύση")}playBtn.addEventListener("click",function(){playing?stop():start()});volume.addEventListener("input",function(){audio.volume=Number(volume.value)});audio.addEventListener("waiting",function(){if(playing)setStatus("Φόρτωση…")});audio.addEventListener("playing",function(){setStatus("Παίζει ζωντανά")});audio.addEventListener("error",function(){setPlaying(false);setStatus("Σφάλμα ροής. Δοκιμάστε ξανά.")});function isIos(){return/iphone|ipad|ipod/i.test(navigator.userAgent)}function isStandalone(){return window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true}window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();deferredPrompt=e;if(!isStandalone())installBox.classList.add("show")});if(!isStandalone()&&isIos())installBox.classList.add("show");installBtn.addEventListener("click",async function(){if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBox.classList.remove("show");return}installHint.hidden=false;installHint.textContent=isIos()?"Στο iPhone: πατήστε Κοινή χρήση (□↑) και μετά «Προσθήκη στην οθόνη Αφετηρίας».":"Ανοίξτε το μενού του browser και επιλέξτε «Εγκατάσταση εφαρμογής»."})})();</script></body></html>';
    exit;
}, 1);`;

console.log('⚡ Kastoria FM WordPress Snippet Fix\n');
console.log('This script needs manual execution in wp-admin.');
console.log('Cloudflare protection prevents automated REST API access.\n');

console.log('=== MANUAL STEPS TO FIX ===\n');
console.log('1. Go to: https://kastoriafm.gr/wp-admin/admin.php?page=snippets');
console.log(`2. Login: ${WP_USER} / ${WP_PASS}`);
console.log('3. Find "Webapp Player HTML Content" snippet and click DEACTIVATE or DELETE');
console.log('4. Click "Add New" snippet');
console.log('5. Title: "Kastoria FM Webapp Page"');
console.log('6. Description: "Serves standalone player page for /webapp bypassing theme"');
console.log('7. Scope: "Run everywhere"');
console.log('8. Paste this code (NO <?php tag):');
console.log('\n--- CODE START ---\n');
console.log(WEBAPP_CODE);
console.log('\n--- CODE END ---\n');
console.log('9. Click SAVE and then ACTIVATE');
console.log('10. Visit: https://kastoriafm.gr/webapp/');
console.log('11. Click PLAY - should show "Παίζει ζωντανά"\n');

// Save the code to a file for easy copy-paste
const fs = require('fs');
fs.writeFileSync('/workspace/wordpress-page/webapp-snippet-final.php', WEBAPP_CODE);
console.log('✓ Code saved to: /workspace/wordpress-page/webapp-snippet-final.php\n');

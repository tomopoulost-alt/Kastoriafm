(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`/webapp/`,t=`${e}stream`,n=t=>`${e}${t.replace(/^\//,``)}`,r=document.querySelector(`#app`);r.innerHTML=`
  <div class="atmosphere" aria-hidden="true">
    <div class="mist mist-a"></div>
    <div class="mist mist-b"></div>
    <div class="horizon"></div>
    <div class="ripple"></div>
  </div>

  <main class="stage">
    <header class="brand">
      <img
        class="brand__mark"
        src="${n(`logo.png`)}"
        alt="Kastoria FM 91.5"
        width="220"
        height="235"
        decoding="async"
      />
      <h1 class="brand__name">Kastoria FM</h1>
      <p class="brand__tag">Ο σταθμός που ακούει η πόλη</p>
    </header>

    <section class="player" aria-label="Ζωντανή αναπαραγωγή">
      <button class="play" type="button" aria-pressed="false" aria-label="Αναπαραγωγή">
        <span class="play__icon" data-icon="play" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor">
            <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.02-6.86a1 1 0 0 0 0-1.72L9.5 4.28a1 1 0 0 0-1.5.86z"/>
          </svg>
        </span>
        <span class="play__icon is-hidden" data-icon="pause" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor">
            <path d="M7 5h3.5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9.5 0H20a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-3.5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>
          </svg>
        </span>
      </button>

      <div class="meta">
        <div class="live">
          <span class="live__dot" aria-hidden="true"></span>
          <span class="live__label">Live · 91.5</span>
        </div>
        <p class="status" role="status">Πατήστε play για να ακούσετε</p>
      </div>

      <div class="eq" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
      </div>

      <label class="volume">
        <span class="volume__label">Ένταση</span>
        <input
          class="volume__range"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value="0.85"
          aria-label="Ένταση"
        />
      </label>
    </section>

    <section class="install" hidden>
      <button class="install__btn" type="button">
        Εγκατάσταση εφαρμογής
      </button>
      <p class="install__hint" hidden></p>
    </section>
  </main>

  <audio id="audio" preload="none" crossorigin="anonymous"></audio>
`;var i=document.querySelector(`#audio`),a=document.querySelector(`.play`),o=document.querySelector(`.status`),s=document.querySelector(`.volume__range`),c=document.querySelector(`.eq`),l=document.querySelector(`[data-icon="play"]`),u=document.querySelector(`[data-icon="pause"]`),d=document.querySelector(`.install`),f=document.querySelector(`.install__btn`),p=document.querySelector(`.install__hint`),m=!1,h=!1,g=null;function _(e){m=e,a.setAttribute(`aria-pressed`,String(e)),a.setAttribute(`aria-label`,e?`Παύση`:`Αναπαραγωγή`),l.classList.toggle(`is-hidden`,e),u.classList.toggle(`is-hidden`,!e),document.body.classList.toggle(`is-playing`,e),c.classList.toggle(`is-active`,e)}function v(e){o.textContent=e}async function y(){if(!h){h=!0,v(`Σύνδεση…`),a.classList.add(`is-loading`);try{i.src=`${t}?t=${Date.now()}`,i.volume=Number(s.value),await i.play(),_(!0),v(`Παίζει ζωντανά`)}catch(e){_(!1),v(`Αδυναμία αναπαραγωγής. Δοκιμάστε ξανά.`),console.error(e)}finally{h=!1,a.classList.remove(`is-loading`)}}}function b(){i.pause(),i.removeAttribute(`src`),i.load(),_(!1),v(`Σε παύση`)}a.addEventListener(`click`,()=>{m?b():y()}),s.addEventListener(`input`,()=>{i.volume=Number(s.value)}),i.addEventListener(`waiting`,()=>{m&&v(`Φόρτωση…`)}),i.addEventListener(`playing`,()=>{v(`Παίζει ζωντανά`)}),i.addEventListener(`error`,()=>{_(!1),v(`Σφάλμα ροής. Δοκιμάστε ξανά.`)});function x(){return/iphone|ipad|ipod/i.test(navigator.userAgent)}function S(){return window.matchMedia(`(display-mode: standalone)`).matches||window.navigator.standalone===!0}function C(){d.hidden=!1}function w(){d.hidden=!0}window.addEventListener(`beforeinstallprompt`,e=>{e.preventDefault(),g=e,S()||C()}),window.addEventListener(`appinstalled`,()=>{g=null,w(),v(`Η εφαρμογή εγκαταστάθηκε`)}),f.addEventListener(`click`,async()=>{if(g){g.prompt();let e=await g.userChoice;g=null,e.outcome===`accepted`&&w();return}if(x()){p.hidden=!1,p.textContent=`Στο iPhone: πατήστε Κοινή χρήση (□↑) και μετά «Προσθήκη στην οθόνη Αφετηρίας».`;return}p.hidden=!1,p.textContent=`Ανοίξτε το μενού του browser και επιλέξτε «Εγκατάσταση εφαρμογής» ή «Add to Home screen».`}),!S()&&x()&&C(),`serviceWorker`in navigator&&window.addEventListener(`load`,()=>{navigator.serviceWorker.register(`${e}sw.js`).catch(e=>{console.warn(`Service worker registration failed`,e)})}),requestAnimationFrame(()=>{document.body.classList.add(`is-ready`)});
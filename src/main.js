import './style.css'

const BASE = import.meta.env.BASE_URL
const STREAM_URL = `${BASE}stream`
const asset = (path) => `${BASE}${path.replace(/^\//, '')}`

const app = document.querySelector('#app')

app.innerHTML = `
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
        src="${asset('logo.png')}"
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
`

const audio = document.querySelector('#audio')
const playBtn = document.querySelector('.play')
const statusEl = document.querySelector('.status')
const volumeInput = document.querySelector('.volume__range')
const eq = document.querySelector('.eq')
const playIcon = document.querySelector('[data-icon="play"]')
const pauseIcon = document.querySelector('[data-icon="pause"]')
const installSection = document.querySelector('.install')
const installBtn = document.querySelector('.install__btn')
const installHint = document.querySelector('.install__hint')

let isPlaying = false
let isLoading = false
let deferredPrompt = null

function setPlayingUI(playing) {
  isPlaying = playing
  playBtn.setAttribute('aria-pressed', String(playing))
  playBtn.setAttribute(
    'aria-label',
    playing ? 'Παύση' : 'Αναπαραγωγή',
  )
  playIcon.classList.toggle('is-hidden', playing)
  pauseIcon.classList.toggle('is-hidden', !playing)
  document.body.classList.toggle('is-playing', playing)
  eq.classList.toggle('is-active', playing)
}

function setStatus(text) {
  statusEl.textContent = text
}

async function startStream() {
  if (isLoading) return
  isLoading = true
  setStatus('Σύνδεση…')
  playBtn.classList.add('is-loading')

  try {
    audio.src = `${STREAM_URL}?t=${Date.now()}`
    audio.volume = Number(volumeInput.value)
    await audio.play()
    setPlayingUI(true)
    setStatus('Παίζει ζωντανά')
  } catch (err) {
    setPlayingUI(false)
    setStatus('Αδυναμία αναπαραγωγής. Δοκιμάστε ξανά.')
    console.error(err)
  } finally {
    isLoading = false
    playBtn.classList.remove('is-loading')
  }
}

function stopStream() {
  audio.pause()
  audio.removeAttribute('src')
  audio.load()
  setPlayingUI(false)
  setStatus('Σε παύση')
}

playBtn.addEventListener('click', () => {
  if (isPlaying) {
    stopStream()
  } else {
    startStream()
  }
})

volumeInput.addEventListener('input', () => {
  audio.volume = Number(volumeInput.value)
})

audio.addEventListener('waiting', () => {
  if (isPlaying) setStatus('Φόρτωση…')
})

audio.addEventListener('playing', () => {
  setStatus('Παίζει ζωντανά')
})

audio.addEventListener('error', () => {
  setPlayingUI(false)
  setStatus('Σφάλμα ροής. Δοκιμάστε ξανά.')
})

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function showInstall() {
  installSection.hidden = false
}

function hideInstall() {
  installSection.hidden = true
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  deferredPrompt = event
  if (!isStandalone()) showInstall()
})

window.addEventListener('appinstalled', () => {
  deferredPrompt = null
  hideInstall()
  setStatus('Η εφαρμογή εγκαταστάθηκε')
})

installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    deferredPrompt = null
    if (result.outcome === 'accepted') {
      hideInstall()
    }
    return
  }

  if (isIos()) {
    installHint.hidden = false
    installHint.textContent =
      'Στο iPhone: πατήστε Κοινή χρήση (□↑) και μετά «Προσθήκη στην οθόνη Αφετηρίας».'
    return
  }

  installHint.hidden = false
  installHint.textContent =
    'Ανοίξτε το μενού του browser και επιλέξτε «Εγκατάσταση εφαρμογής» ή «Add to Home screen».'
})

if (!isStandalone() && isIos()) {
  showInstall()
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${BASE}sw.js`).catch((err) => {
      console.warn('Service worker registration failed', err)
    })
  })
}

requestAnimationFrame(() => {
  document.body.classList.add('is-ready')
})

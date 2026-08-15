#!/usr/bin/env python3
"""
Afro House track generator — 128 BPM
Deep kick, syncopated African percussion, rolling bass,
and formant-synth call-and-response vocals.
"""

from __future__ import annotations

import math
import wave
from pathlib import Path

import numpy as np

SR = 44100
BPM = 128
BEAT = 60.0 / BPM
BAR = BEAT * 4
SAMPLE_DIR = Path(__file__).resolve().parent


def clamp(x: np.ndarray, peak: float = 0.98) -> np.ndarray:
    m = np.max(np.abs(x)) + 1e-12
    return x * min(1.0, peak / m)


def env_adsr(
    n: int,
    attack: float,
    decay: float,
    sustain: float,
    release: float,
    hold: float | None = None,
) -> np.ndarray:
    a = max(1, int(attack * SR))
    d = max(1, int(decay * SR))
    r = max(1, int(release * SR))
    if hold is None:
        h = max(0, n - a - d - r)
    else:
        h = max(0, int(hold * SR))
    total = a + d + h + r
    e = np.zeros(max(n, total), dtype=np.float64)
    e[:a] = np.linspace(0, 1, a, endpoint=False)
    e[a : a + d] = np.linspace(1, sustain, d, endpoint=False)
    e[a + d : a + d + h] = sustain
    e[a + d + h : a + d + h + r] = np.linspace(sustain, 0, r, endpoint=False)
    return e[:n]


def noise(n: int) -> np.ndarray:
    return np.random.default_rng(42).uniform(-1, 1, n)


def soft_clip(x: np.ndarray, drive: float = 1.2) -> np.ndarray:
    return np.tanh(x * drive)


def highpass(x: np.ndarray, cutoff: float) -> np.ndarray:
    """First-order high-pass (vectorized recursive)."""
    rc = 1.0 / (2 * math.pi * cutoff)
    dt = 1.0 / SR
    alpha = rc / (rc + dt)
    y = np.empty_like(x)
    if len(x) == 0:
        return y
    y[0] = x[0]
    for i in range(1, len(x)):
        y[i] = alpha * (y[i - 1] + x[i] - x[i - 1])
    return y


# --- Drum voices -----------------------------------------------------------

def kick(length: float = 0.45) -> np.ndarray:
    n = int(length * SR)
    t = np.arange(n) / SR
    # pitch sweep 160 -> 45 Hz
    phase = 2 * math.pi * (160 * t - 90 * t**1.4 / 1.4)
    body = np.sin(phase) * env_adsr(n, 0.001, 0.08, 0.35, 0.28)
    click = highpass(noise(n), 3000) * env_adsr(n, 0.0005, 0.008, 0.0, 0.01) * 0.35
    sub = np.sin(2 * math.pi * 48 * t) * env_adsr(n, 0.002, 0.12, 0.4, 0.25) * 0.55
    return soft_clip(body * 0.9 + click + sub)


def snare(length: float = 0.22) -> np.ndarray:
    n = int(length * SR)
    t = np.arange(n) / SR
    tone = np.sin(2 * math.pi * 190 * t) * env_adsr(n, 0.001, 0.04, 0.15, 0.12)
    nse = highpass(noise(n), 800) * env_adsr(n, 0.001, 0.05, 0.2, 0.12)
    return soft_clip(tone * 0.35 + nse * 0.85) * 0.7


def clap(length: float = 0.28) -> np.ndarray:
    n = int(length * SR)
    base = highpass(noise(n), 1200)
    e = np.zeros(n)
    # stacked micro-hits for clap character
    for delay_ms, amp in ((0, 1.0), (12, 0.75), (24, 0.45), (38, 0.25)):
        d = int(delay_ms * SR / 1000)
        piece = env_adsr(n - d, 0.0005, 0.02, 0.15, 0.12) * amp
        e[d:] += piece
    return clamp(base * e) * 0.65


def closed_hat(length: float = 0.06) -> np.ndarray:
    n = int(length * SR)
    return highpass(noise(n), 7000) * env_adsr(n, 0.0003, 0.015, 0.05, 0.03) * 0.28


def open_hat(length: float = 0.28) -> np.ndarray:
    n = int(length * SR)
    return highpass(noise(n), 5500) * env_adsr(n, 0.0005, 0.04, 0.25, 0.18) * 0.22


def shaker(length: float = 0.08) -> np.ndarray:
    n = int(length * SR)
    return highpass(noise(n), 9000) * env_adsr(n, 0.001, 0.02, 0.1, 0.04) * 0.18


def conga(freq: float, length: float = 0.22, tone: float = 0.7) -> np.ndarray:
    n = int(length * SR)
    t = np.arange(n) / SR
    # slight pitch drop like hand drum
    f = freq * (1 - 0.08 * t / length)
    body = np.sin(2 * math.pi * f * t)
    body += 0.35 * np.sin(2 * math.pi * f * 2.05 * t)
    body += 0.12 * np.sin(2 * math.pi * f * 3.1 * t)
    slap = highpass(noise(n), 2500) * env_adsr(n, 0.0004, 0.01, 0.05, 0.04) * 0.4
    return soft_clip(body * env_adsr(n, 0.001, 0.05, 0.2, 0.14) * tone + slap) * 0.55


# --- Melodic / bass / vocals ----------------------------------------------

def bass_note(freq: float, length: float, accent: float = 1.0) -> np.ndarray:
    n = int(length * SR)
    t = np.arange(n) / SR
    # slightly detuned saw-ish via additive
    wave_ = (
        np.sin(2 * math.pi * freq * t)
        + 0.45 * np.sin(2 * math.pi * freq * 2 * t)
        + 0.18 * np.sin(2 * math.pi * freq * 3 * t + 0.2)
    )
    # gentle filter envelope feel via amplitude shaping of partials already baked
    e = env_adsr(n, 0.005, 0.08, 0.7, 0.08, hold=max(0.0, length - 0.17))
    return soft_clip(wave_ * e * 0.55 * accent, 1.1)


# Formant tables approximating African open vowels (Hz)
FORMANTS = {
    "a": (730, 1090, 2440),
    "e": (530, 1840, 2480),
    "i": (390, 1990, 2550),
    "o": (570, 840, 2410),
    "u": (440, 1020, 2240),
    "ah": (700, 1220, 2600),
    "oh": (500, 800, 2300),
    "eh": (550, 1770, 2490),
}


def formant_voice(
    freq: float,
    length: float,
    vowel: str = "a",
    vibrato: float = 4.5,
    breath: float = 0.08,
) -> np.ndarray:
    """Singing voice via harmonic source shaped by vowel formants."""
    n = int(length * SR)
    t = np.arange(n) / SR
    vib = 1 + 0.012 * np.sin(2 * math.pi * vibrato * t)
    phase = 2 * math.pi * freq * vib * t
    # Rich glottal-ish spectrum
    source = (
        0.55 * np.sin(phase)
        + 0.30 * np.sin(2 * phase)
        + 0.18 * np.sin(3 * phase)
        + 0.10 * np.sin(4 * phase)
        + 0.06 * np.sin(5 * phase)
    )
    # Cheap breath noise (no recursive filter per note)
    rng = np.random.default_rng(int(freq * 10 + length * 1000) % (2**31))
    source += breath * rng.normal(0, 0.08, n)

    f1, f2, f3 = FORMANTS.get(vowel, FORMANTS["a"])
    voiced = np.zeros(n)
    for fc, gain in ((f1, 1.0), (f2, 0.55), (f3, 0.28)):
        # Amplitude-modulate formant carriers with pitched source
        voiced += gain * np.sin(2 * math.pi * fc * t) * (0.35 + 0.65 * np.abs(source))
        voiced += 0.25 * gain * source * np.sin(2 * math.pi * (fc / max(freq, 1)) * phase / (2 * math.pi))

    # Blend pitched body for intelligibility of melody
    mix = 0.55 * voiced + 0.45 * source
    e = env_adsr(n, 0.03, 0.08, 0.75, 0.12, hold=max(0.0, length - 0.23))
    return clamp(mix * e) * 0.42


def pad_chord(freqs: list[float], length: float) -> np.ndarray:
    n = int(length * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for f in freqs:
        out += np.sin(2 * math.pi * f * t)
        out += 0.3 * np.sin(2 * math.pi * f * 2.01 * t)
        out += 0.15 * np.sin(2 * math.pi * (f * 0.5) * t)
    e = env_adsr(n, 0.4, 0.5, 0.7, 0.8, hold=max(0.0, length - 1.7))
    return (out / max(len(freqs), 1)) * e * 0.12


# --- Arrangement helpers ---------------------------------------------------

def place(buf: np.ndarray, sound: np.ndarray, start_sec: float, gain: float = 1.0) -> None:
    start = int(start_sec * SR)
    end = start + len(sound)
    if start >= len(buf):
        return
    if end > len(buf):
        sound = sound[: len(buf) - start]
        end = len(buf)
    buf[start:end] += sound * gain


def midi_to_hz(m: float) -> float:
    return 440.0 * (2 ** ((m - 69) / 12))


# Key: A minor — deep afro-house feel
ROOT = 45  # A2
# Conga pitches
LOW_C = midi_to_hz(52)   # E3-ish
MID_C = midi_to_hz(57)   # A3
HI_C = midi_to_hz(62)    # D4

# Vocal chant melody (A minor pentatonic relative): A C D E G
CHANT_MIDI = [57, 60, 62, 64, 67, 64, 62, 60]  # A3..
VOWELS_CALL = ["ah", "eh", "oh", "ah", "eh", "oh", "ah", "u"]
VOWELS_RESP = ["o", "a", "e", "o", "a", "e", "oh", "ah"]


def build_track(bars: int = 72) -> np.ndarray:
    duration = bars * BAR
    n = int(duration * SR) + SR  # tail
    drums = np.zeros(n, dtype=np.float64)
    perc = np.zeros(n, dtype=np.float64)
    bass = np.zeros(n, dtype=np.float64)
    vocals = np.zeros(n, dtype=np.float64)
    pads = np.zeros(n, dtype=np.float64)

    k = kick()
    sn = snare()
    cl = clap()
    ch = closed_hat()
    oh = open_hat()
    sh = shaker()
    c_low = conga(LOW_C, 0.25, 0.85)
    c_mid = conga(MID_C, 0.2, 0.75)
    c_hi = conga(HI_C, 0.16, 0.65)

    # Afro-house conga timeline (16th grid accents)
    # pattern per bar (16 steps): L . M . L H . M | L . M H . L M .
    conga_pat = [
        ("L", 0), ("M", 2), ("L", 4), ("H", 5), ("M", 7),
        ("L", 8), ("M", 10), ("H", 11), ("L", 13), ("M", 14),
    ]

    # Bass pattern (root / fifth / minor 3rd motion) — 1 bar in 8ths
    # A2, A2, E2, A2 | C3, A2, G2, A2
    bass_pat = [45, 45, 40, 45, 48, 45, 43, 45]

    # Section map (bars): intro 0-7, groove 8-15, vocals 16-31, break 32-39,
    # drop 40-55, outro 56-71
    for bar in range(bars):
        t0 = bar * BAR
        section_intro = bar < 8
        section_groove = 8 <= bar < 16
        section_vocal = 16 <= bar < 32
        section_break = 32 <= bar < 40
        section_drop = 40 <= bar < 56
        section_outro = bar >= 56

        # Kick 4-on-floor (muted in pure vocal break start)
        if not (section_break and bar < 36):
            for b in range(4):
                gain = 0.55 if section_intro and bar < 4 else 1.0
                if section_outro:
                    gain *= max(0.15, 1 - (bar - 56) / 16)
                place(drums, k, t0 + b * BEAT, gain)

        # Clap / snare on 2 and 4
        if bar >= 4 and not (section_break and bar < 36):
            g = 0.75 if section_intro else 1.0
            if section_outro:
                g *= max(0.1, 1 - (bar - 56) / 14)
            place(drums, cl, t0 + 1 * BEAT, g * 0.9)
            place(drums, cl, t0 + 3 * BEAT, g)
            if bar >= 12 and bar % 4 == 3:
                place(drums, sn, t0 + 3.5 * BEAT, 0.35)

        # Hats: offbeat opens + 16th closed after bar 8
        if bar >= 2:
            for b in range(4):
                place(drums, oh, t0 + b * BEAT + BEAT / 2, 0.7 if bar >= 8 else 0.4)
            if bar >= 8 and not section_break:
                for s in range(16):
                    # skip some for groove
                    if s % 4 == 0:
                        continue
                    acc = 1.0 if s % 2 == 0 else 0.55
                    place(drums, ch, t0 + s * (BEAT / 4), 0.55 * acc)

        # Shakers always (African texture)
        for s in range(16):
            acc = 1.15 if s % 4 == 0 else (0.7 if s % 2 == 0 else 0.45)
            if section_intro and bar < 2:
                acc *= 0.5
            place(perc, sh, t0 + s * (BEAT / 4), acc)

        # Congas
        if bar >= 0:
            for kind, step in conga_pat:
                snd = c_low if kind == "L" else (c_mid if kind == "M" else c_hi)
                g = 0.85
                if section_break:
                    g = 1.1
                if section_outro:
                    g *= max(0.2, 1 - (bar - 56) / 16)
                place(perc, snd, t0 + step * (BEAT / 4), g)

        # Extra conga fill every 4 bars
        if bar >= 8 and bar % 4 == 3 and not section_break:
            for i, kind in enumerate(["H", "M", "H", "L", "H", "M"]):
                snd = c_low if kind == "L" else (c_mid if kind == "M" else c_hi)
                place(perc, snd, t0 + (10 + i) * (BEAT / 4), 0.95)

        # Bass
        if bar >= 8 and not (32 <= bar < 36):
            for i, note in enumerate(bass_pat):
                length = BEAT / 2 * 0.92
                accent = 1.15 if i in (0, 4) else 1.0
                if section_outro:
                    accent *= max(0.1, 1 - (bar - 56) / 14)
                place(
                    bass,
                    bass_note(midi_to_hz(note), length, accent),
                    t0 + i * (BEAT / 2),
                    0.95,
                )

        # Pads (A minor: A C E / G C E)
        if bar % 4 == 0 and bar >= 4:
            if (bar // 4) % 2 == 0:
                freqs = [midi_to_hz(x) for x in (57, 60, 64)]  # A C E
            else:
                freqs = [midi_to_hz(x) for x in (55, 60, 64)]  # G C E
            g = 0.9
            if section_outro:
                g *= max(0.2, 1 - (bar - 56) / 16)
            place(pads, pad_chord(freqs, BAR * 4 * 0.98), t0, g)

        # Vocals — call & response from bar 16, spotlight in break, full in drop
        vocal_on = section_vocal or section_break or section_drop or (section_outro and bar < 64)
        if vocal_on:
            # Call on beats 1-2, response on 3-4 (every other bar for space)
            if bar % 2 == 0:
                # CALL — lead voice
                for i, m in enumerate(CHANT_MIDI[:4]):
                    v = VOWELS_CALL[i]
                    dur = BEAT * 0.85
                    # slight slide into note
                    note = formant_voice(midi_to_hz(m), dur, v, vibrato=5.0, breath=0.1)
                    place(vocals, note, t0 + i * (BEAT / 2), 1.05)
                # harmony a fifth above, quieter
                for i, m in enumerate(CHANT_MIDI[:4]):
                    v = VOWELS_CALL[i]
                    note = formant_voice(midi_to_hz(m + 7), BEAT * 0.8, v, vibrato=4.2, breath=0.12)
                    place(vocals, note, t0 + i * (BEAT / 2), 0.35)
            else:
                # RESPONSE — group / lower register
                for i, m in enumerate(CHANT_MIDI[4:]):
                    v = VOWELS_RESP[i]
                    note = formant_voice(midi_to_hz(m - 12), BEAT * 0.9, v, vibrato=3.8, breath=0.15)
                    place(vocals, note, t0 + i * (BEAT / 2), 0.95)
                # octave double
                for i, m in enumerate(CHANT_MIDI[4:]):
                    v = VOWELS_RESP[i]
                    note = formant_voice(midi_to_hz(m), BEAT * 0.85, v, vibrato=4.0, breath=0.1)
                    place(vocals, note, t0 + i * (BEAT / 2), 0.4)

            # Ad-lib "ah" swell on break bars
            if section_break and bar % 2 == 0:
                long = formant_voice(midi_to_hz(64), BAR * 1.5, "ah", vibrato=5.5, breath=0.18)
                place(vocals, long, t0 + BEAT, 0.55)

    # Stereo mix: kick/bass center, congas & hats wider, vocals slightly wide
    delay = int(0.012 * SR)  # Haas ~12ms
    perc_r = np.zeros_like(perc)
    perc_r[delay:] = perc[:-delay]
    voc_r = np.zeros_like(vocals)
    voc_r[delay:] = vocals[:-delay] * 0.92
    pad_r = pads * 0.85

    left = drums * 1.0 + perc * 1.0 + bass * 0.95 + vocals * 0.9 + pads * 1.05
    right = drums * 1.0 + perc_r * 0.95 + bass * 0.95 + voc_r * 0.88 + pad_r * 1.0

    left = soft_clip(left, 1.05)
    right = soft_clip(right, 1.05)
    peak = max(np.max(np.abs(left)), np.max(np.abs(right)), 1e-12)
    norm = min(1.0, 0.95 / peak)
    left *= norm
    right *= norm

    fade_n = int(2 * BAR * SR)
    if fade_n < len(left):
        fade = np.linspace(1, 0, fade_n)
        left[-fade_n:] *= fade
        right[-fade_n:] *= fade

    end = int(bars * BAR * SR) + int(0.5 * SR)
    stereo = np.stack([left[:end], right[:end]], axis=1)
    return stereo


def write_wav(path: Path, audio: np.ndarray) -> None:
    """Write mono (n,) or stereo (n, 2) float audio as 16-bit WAV."""
    if audio.ndim == 1:
        channels = 1
        frames = np.int16(np.clip(audio, -1, 1) * 32767)
        raw = frames.tobytes()
    else:
        channels = audio.shape[1]
        frames = np.int16(np.clip(audio, -1, 1) * 32767)
        raw = frames.reshape(-1).tobytes()
    with wave.open(str(path), "w") as w:
        w.setnchannels(channels)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(raw)


def main() -> None:
    np.random.seed(7)
    print(f"Generating Afro House @ {BPM} BPM…")
    audio = build_track(bars=72)  # ~2:15
    out_wav = SAMPLE_DIR / "afro_house_128bpm.wav"
    write_wav(out_wav, audio)
    dur = len(audio) / SR
    print(f"Wrote {out_wav} ({dur:.1f}s, {BPM} BPM, stereo)")

    # Also write a short preview (first 32 bars ≈ 1:00)
    preview = audio[: int(32 * BAR * SR)]
    prev_path = SAMPLE_DIR / "afro_house_128bpm_preview.wav"
    write_wav(prev_path, preview)
    print(f"Wrote {prev_path} ({len(preview)/SR:.1f}s)")


if __name__ == "__main__":
    main()

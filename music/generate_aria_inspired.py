#!/usr/bin/env python3
"""
Melodic House & Techno generator — inspired by the *feel* of Argy & Omnya
"Aria" (Afterlife): 122 BPM, heavy bass, cool atmosphere, soaring aria vocal.

Original composition — not a copy of Aria's melody or arrangement.
"""

from __future__ import annotations

import math
import wave
from pathlib import Path

import numpy as np

SR = 44100
BPM = 122
BEAT = 60.0 / BPM
BAR = BEAT * 4
SAMPLE_DIR = Path(__file__).resolve().parent
RNG = np.random.default_rng(122)


def clamp(x: np.ndarray, peak: float = 0.97) -> np.ndarray:
    m = float(np.max(np.abs(x))) + 1e-12
    return x * min(1.0, peak / m)


def soft_clip(x: np.ndarray, drive: float = 1.15) -> np.ndarray:
    return np.tanh(x * drive)


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
    h = max(0, n - a - d - r) if hold is None else max(0, int(hold * SR))
    e = np.zeros(max(n, a + d + h + r), dtype=np.float64)
    e[:a] = np.linspace(0, 1, a, endpoint=False)
    e[a : a + d] = np.linspace(1, sustain, d, endpoint=False)
    e[a + d : a + d + h] = sustain
    e[a + d + h : a + d + h + r] = np.linspace(sustain, 0, r, endpoint=False)
    return e[:n]


def one_pole_lp(x: np.ndarray, cutoff: float) -> np.ndarray:
    """Fast one-pole low-pass."""
    if len(x) == 0:
        return x
    a = math.exp(-2.0 * math.pi * cutoff / SR)
    y = np.empty_like(x)
    y[0] = x[0] * (1 - a)
    for i in range(1, len(x)):
        y[i] = (1 - a) * x[i] + a * y[i - 1]
    return y


def one_pole_hp(x: np.ndarray, cutoff: float) -> np.ndarray:
    if len(x) == 0:
        return x
    a = math.exp(-2.0 * math.pi * cutoff / SR)
    y = np.empty_like(x)
    y[0] = x[0]
    for i in range(1, len(x)):
        y[i] = a * (y[i - 1] + x[i] - x[i - 1])
    return y


def midi_hz(m: float) -> float:
    return 440.0 * (2.0 ** ((m - 69.0) / 12.0))


def place(buf: np.ndarray, sound: np.ndarray, t: float, gain: float = 1.0) -> None:
    s = int(t * SR)
    if s >= len(buf):
        return
    chunk = sound
    if s + len(chunk) > len(buf):
        chunk = chunk[: len(buf) - s]
    buf[s : s + len(chunk)] += chunk * gain


def delay_echo(x: np.ndarray, delay_beats: float, feedback: float, mix: float) -> np.ndarray:
    d = int(delay_beats * BEAT * SR)
    if d <= 0 or d >= len(x):
        return x
    out = x.copy()
    # 3 taps
    for tap, fb in ((1, feedback), (2, feedback**2), (3, feedback**3)):
        td = d * tap
        if td >= len(x):
            break
        out[td:] += x[:-td] * mix * fb
    return out


# --- Drums -----------------------------------------------------------------

def make_kick() -> np.ndarray:
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    # Deep Afterlife-style kick: long sub + soft click
    phase = 2 * math.pi * (55 * np.exp(-t * 18) + 42) * t
    body = np.sin(phase) * env_adsr(n, 0.001, 0.12, 0.45, 0.35)
    click = one_pole_hp(RNG.uniform(-1, 1, n), 2500) * env_adsr(n, 0.0004, 0.006, 0.0, 0.012) * 0.22
    sub = np.sin(2 * math.pi * 40 * t) * env_adsr(n, 0.002, 0.15, 0.5, 0.3) * 0.7
    return soft_clip(body * 0.85 + click + sub, 1.05)


def make_clap() -> np.ndarray:
    n = int(0.35 * SR)
    base = one_pole_hp(RNG.uniform(-1, 1, n), 900)
    e = np.zeros(n)
    for ms, amp in ((0, 1.0), (11, 0.7), (22, 0.4), (36, 0.22)):
        d = int(ms * SR / 1000)
        e[d:] += env_adsr(n - d, 0.0004, 0.025, 0.12, 0.18) * amp
    return clamp(base * e) * 0.45


def make_hat(open_: bool = False) -> np.ndarray:
    length = 0.32 if open_ else 0.055
    n = int(length * SR)
    nse = one_pole_hp(RNG.uniform(-1, 1, n), 6000 if open_ else 8000)
    if open_:
        e = env_adsr(n, 0.0005, 0.05, 0.2, 0.22)
        return nse * e * 0.14
    return nse * env_adsr(n, 0.0003, 0.012, 0.04, 0.025) * 0.16


def make_rim() -> np.ndarray:
    n = int(0.08 * SR)
    t = np.arange(n) / SR
    tone = np.sin(2 * math.pi * 780 * t) * env_adsr(n, 0.0003, 0.015, 0.05, 0.04)
    click = one_pole_hp(RNG.uniform(-1, 1, n), 4000) * env_adsr(n, 0.0002, 0.008, 0.0, 0.02) * 0.5
    return (tone * 0.4 + click) * 0.28


# --- Bass / pad / lead -----------------------------------------------------

def bass_note(freq: float, length: float, accent: float = 1.0) -> np.ndarray:
    n = int(length * SR)
    t = np.arange(n) / SR
    # Heavy sine + slight saturation (Aria-like bass weight)
    wave_ = np.sin(2 * math.pi * freq * t)
    wave_ += 0.35 * np.sin(2 * math.pi * freq * 2 * t)
    wave_ += 0.08 * np.sin(2 * math.pi * freq * 3 * t)
    # subtle filter-ish amp shape
    e = env_adsr(n, 0.008, 0.06, 0.78, 0.06, hold=max(0.0, length - 0.14))
    return soft_clip(wave_ * e * 0.62 * accent, 1.25)


def pad_chord(freqs: list[float], length: float) -> np.ndarray:
    n = int(length * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for i, f in enumerate(freqs):
        det = 1.0 + (0.002 if i % 2 == 0 else -0.002)
        out += np.sin(2 * math.pi * f * det * t)
        out += 0.25 * np.sin(2 * math.pi * f * 2.0 * t + 0.3)
    e = env_adsr(n, 1.2, 0.8, 0.65, 1.4, hold=max(0.0, length - 3.4))
    # slow tremolo for atmosphere
    trem = 0.85 + 0.15 * np.sin(2 * math.pi * 0.12 * t)
    return (out / max(len(freqs), 1)) * e * trem * 0.11


def arp_pluck(freq: float, length: float = 0.35) -> np.ndarray:
    n = int(length * SR)
    t = np.arange(n) / SR
    # soft pluck for melodic techno texture
    sig = np.sin(2 * math.pi * freq * t)
    sig += 0.4 * np.sin(2 * math.pi * freq * 2.01 * t)
    e = env_adsr(n, 0.002, 0.08, 0.25, 0.2)
    return sig * e * 0.18


# --- Aria vocal (soaring melodic, Omnya-like character via formants) --------

FORMANTS = {
    "ah": (800, 1150, 2800),
    "oh": (500, 850, 2500),
    "oo": (400, 800, 2300),
    "eh": (550, 1800, 2500),
    "ee": (350, 2100, 2700),
}


def aria_vowel(freq: float, length: float, vowel: str = "ah", breath: float = 0.06) -> np.ndarray:
    """Legato female-ish singing voice for melodic aria phrases."""
    n = int(length * SR)
    t = np.arange(n) / SR
    # gentle vibrato + slight portamento feel via vibrato depth
    vib = 1.0 + 0.008 * np.sin(2 * math.pi * 5.2 * t)
    phase = 2 * math.pi * freq * vib * t
    # softer spectrum than chant — more "sung"
    source = (
        0.7 * np.sin(phase)
        + 0.22 * np.sin(2 * phase)
        + 0.1 * np.sin(3 * phase)
        + 0.04 * np.sin(4 * phase)
    )
    source += breath * RNG.normal(0, 0.05, n)

    f1, f2, f3 = FORMANTS.get(vowel, FORMANTS["ah"])
    voiced = np.zeros(n)
    for fc, g in ((f1, 1.0), (f2, 0.45), (f3, 0.2)):
        voiced += g * np.sin(2 * math.pi * fc * t) * (0.4 + 0.6 * np.abs(source))
    mix = 0.5 * voiced + 0.5 * source
    # long soft attack for aria legato
    e = env_adsr(n, 0.08, 0.12, 0.8, 0.25, hold=max(0.0, length - 0.45))
    return clamp(mix * e) * 0.38


# Melodic phrase in C major (original — not Aria's melody)
# Soaring contour: E4 → G4 → A4 → G4 → E4 → D4 → C4 → E4
ARIA_PHRASE_A = [
    (64, 1.5, "ah"),  # E4
    (67, 1.5, "oh"),  # G4
    (69, 2.0, "ah"),  # A4
    (67, 1.0, "oh"),  # G4
    (64, 1.0, "eh"),  # E4
    (62, 1.0, "oo"),  # D4
    (60, 2.0, "ah"),  # C4
    (64, 2.0, "oh"),  # E4
]
# Answer phrase higher
ARIA_PHRASE_B = [
    (67, 1.0, "ah"),  # G4
    (69, 1.0, "eh"),  # A4
    (71, 2.0, "ah"),  # B4
    (72, 2.0, "oh"),  # C5
    (71, 1.0, "eh"),  # B4
    (69, 1.0, "oo"),  # A4
    (67, 2.0, "ah"),  # G4
    (64, 2.0, "oh"),  # E4
]


def render_phrase(phrase: list[tuple[int, float, str]], start_beat_dur: bool = True) -> np.ndarray:
    """Render a phrase; durations are in beats."""
    total_beats = sum(d for _, d, _ in phrase)
    n = int(total_beats * BEAT * SR) + int(0.5 * SR)
    buf = np.zeros(n)
    t = 0.0
    for midi, beats, vow in phrase:
        dur = beats * BEAT * 0.95
        note = aria_vowel(midi_hz(midi), dur, vow, breath=0.07)
        # quiet harmony a third above
        harm = aria_vowel(midi_hz(midi + 4), dur * 0.9, vow, breath=0.1) * 0.28
        place(buf, note, t, 1.0)
        place(buf, harm, t, 0.55)
        t += beats * BEAT
    return buf


def build_track(bars: int = 80) -> np.ndarray:
    n = int(bars * BAR * SR) + SR
    drums = np.zeros(n)
    bass = np.zeros(n)
    pads = np.zeros(n)
    arp = np.zeros(n)
    vocals = np.zeros(n)
    fx = np.zeros(n)

    kick = make_kick()
    clap = make_clap()
    ch = make_hat(False)
    oh = make_hat(True)
    rim = make_rim()

    # Bass: C major — C2 / G1 / A1 / F2 rolling pattern (heavy)
    # MIDI: C2=36, G1=31, A1=33, F2=41
    bass_loop = [36, 36, 31, 36, 33, 36, 41, 36]

    phrase_a = render_phrase(ARIA_PHRASE_A)
    phrase_b = render_phrase(ARIA_PHRASE_B)

    for bar in range(bars):
        t0 = bar * BAR
        intro = bar < 8
        groove = 8 <= bar < 16
        vocal_in = 16 <= bar < 32
        break_ = 32 <= bar < 40
        drop = 40 <= bar < 64
        outro = bar >= 64

        # Kick 4-on-floor — muted early intro & soft break
        if not intro or bar >= 4:
            if not (break_ and bar < 36):
                g = 0.55 if intro else 1.0
                if outro:
                    g *= max(0.1, 1 - (bar - 64) / 16)
                for b in range(4):
                    place(drums, kick, t0 + b * BEAT, g)

        # Clap on 2 & 4
        if bar >= 8 and not (break_ and bar < 36):
            g = 0.85
            if outro:
                g *= max(0.1, 1 - (bar - 64) / 14)
            place(drums, clap, t0 + BEAT, g * 0.85)
            place(drums, clap, t0 + 3 * BEAT, g)

        # Offbeat open hats + sparse closed
        if bar >= 6 and not break_:
            for b in range(4):
                place(drums, oh, t0 + b * BEAT + BEAT / 2, 0.75 if bar >= 12 else 0.4)
            if bar >= 12:
                for s in (1, 3, 5, 7, 9, 11, 13, 15):
                    place(drums, ch, t0 + s * (BEAT / 4), 0.45 if s % 4 else 0.7)

        # Subtle rim groove (melodic techno, not tribal)
        if groove or vocal_in or drop:
            place(drums, rim, t0 + 1.5 * BEAT, 0.5)
            place(drums, rim, t0 + 3.75 * BEAT, 0.35)

        # Heavy bass
        if bar >= 8 and not (32 <= bar < 36):
            for i, note in enumerate(bass_loop):
                length = BEAT / 2 * 0.9
                acc = 1.2 if i in (0, 4) else 1.0
                if outro:
                    acc *= max(0.1, 1 - (bar - 64) / 14)
                place(bass, bass_note(midi_hz(note), length, acc), t0 + i * (BEAT / 2), 1.0)

        # Atmospheric pads — Cmaj / Am / F / G
        if bar % 4 == 0:
            cycle = (bar // 4) % 4
            chords = [
                [60, 64, 67],      # C
                [57, 60, 64],      # Am
                [53, 57, 60],      # F
                [55, 59, 62],      # G
            ]
            g = 0.7 if intro else 1.0
            if outro:
                g *= max(0.15, 1 - (bar - 64) / 16)
            place(pads, pad_chord([midi_hz(m) for m in chords[cycle]], BAR * 4 * 0.98), t0, g)

        # Soft arp in drop / vocal sections
        if (vocal_in or drop) and not break_:
            arp_notes = [72, 76, 79, 76, 74, 72, 67, 72]  # C5 motif
            for i, m in enumerate(arp_notes):
                place(arp, arp_pluck(midi_hz(m), BEAT / 2 * 0.85), t0 + i * (BEAT / 2), 0.7)

        # Aria vocals
        if vocal_in or break_ or drop or (outro and bar < 72):
            if bar % 8 == 0:
                place(vocals, phrase_a, t0, 1.05 if break_ else 0.9)
            elif bar % 8 == 4:
                place(vocals, phrase_b, t0, 1.0 if break_ else 0.85)

        # Risers / noise washes into drops
        if bar in (15, 31, 39):
            rn = int(BAR * SR)
            rise = one_pole_hp(RNG.uniform(-1, 1, rn), 2000)
            rise *= np.linspace(0, 1, rn) ** 2 * 0.12
            place(fx, rise, t0, 1.0)

    # Vocal space — dotted-8th delay (melodic house hallmark)
    vocals = delay_echo(vocals, 0.75, feedback=0.45, mix=0.55)
    vocals = delay_echo(vocals, 1.5, feedback=0.25, mix=0.25)
    arp = delay_echo(arp, 0.5, feedback=0.3, mix=0.35)

    # Stereo mix
    delay = int(0.014 * SR)
    pads_r = np.zeros_like(pads)
    pads_r[delay:] = pads[:-delay] * 0.9
    voc_r = np.zeros_like(vocals)
    voc_r[delay:] = vocals[:-delay] * 0.95
    arp_r = np.zeros_like(arp)
    arp_r[int(0.02 * SR) :] = arp[: -int(0.02 * SR)] * 0.85

    left = drums * 1.0 + bass * 1.05 + pads * 1.0 + arp * 0.85 + vocals * 0.95 + fx * 0.8
    right = drums * 1.0 + bass * 1.05 + pads_r * 1.0 + arp_r * 0.85 + voc_r * 0.95 + fx * 0.8

    left = soft_clip(left, 1.08)
    right = soft_clip(right, 1.08)
    peak = max(float(np.max(np.abs(left))), float(np.max(np.abs(right))), 1e-12)
    norm = min(1.0, 0.94 / peak)
    left *= norm
    right *= norm

    fade_n = int(3 * BAR * SR)
    if fade_n < len(left):
        fade = np.linspace(1, 0, fade_n)
        left[-fade_n:] *= fade
        right[-fade_n:] *= fade

    end = int(bars * BAR * SR) + int(0.4 * SR)
    return np.stack([left[:end], right[:end]], axis=1)


def write_wav(path: Path, audio: np.ndarray) -> None:
    frames = np.int16(np.clip(audio, -1, 1) * 32767)
    with wave.open(str(path), "w") as w:
        w.setnchannels(2 if audio.ndim > 1 else 1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(frames.reshape(-1).tobytes())


def main() -> None:
    print(f"Generating Melodic House (Aria-inspired) @ {BPM} BPM…")
    audio = build_track(bars=80)  # ~2:37
    out = SAMPLE_DIR / "aria_inspired_122bpm.wav"
    write_wav(out, audio)
    print(f"Wrote {out} ({len(audio)/SR:.1f}s)")

    preview = audio[: int(32 * BAR * SR)]
    prev = SAMPLE_DIR / "aria_inspired_122bpm_preview.wav"
    write_wav(prev, preview)
    print(f"Wrote {prev} ({len(preview)/SR:.1f}s)")


if __name__ == "__main__":
    main()

# Music — Kastoria FM

## Veil (new) — Melodic House, Aria-inspired

Original track inspired by the *feel* of **Argy & Omnya — Aria** (Afterlife): 122 BPM, heavy bass, cool atmosphere, soaring aria vocal.

| File | Description |
|------|-------------|
| `aria_inspired_122bpm.mp3` | Full track (~2:38) |
| `aria_inspired_122bpm_preview.mp3` | ~63s preview |
| `generate_aria_inspired.py` | Regenerator |
| `player.html` | Local player |

**Not a cover** — original melody and arrangement.

### Specs
- **Tempo:** 122 BPM
- **Key:** C major
- **Style:** Melodic House & Techno
- **Vocal:** Legato aria (formant synth), delayed / spacious

### Regenerate
```bash
python3 music/generate_aria_inspired.py
ffmpeg -y -i music/aria_inspired_122bpm.wav -codec:a libmp3lame -qscale:a 2 music/aria_inspired_122bpm.mp3
ffmpeg -y -i music/aria_inspired_122bpm_preview.wav -codec:a libmp3lame -qscale:a 2 music/aria_inspired_122bpm_preview.mp3
```

### Download
- Full: https://github.com/tomopoulost-alt/Kastoriafm/raw/cursor/afro-house-track-ebfe/music/aria_inspired_122bpm.mp3
- Preview: https://github.com/tomopoulost-alt/Kastoriafm/raw/cursor/afro-house-track-ebfe/music/aria_inspired_122bpm_preview.mp3

---

## Earlier experiment (Afro House 128)

Previous tribal/afro chant version kept for reference: `afro_house_128bpm.mp3`.

# Afro House — 128 BPM

Original afro house track with African-inspired call-and-response vocals, deep kick, syncopated congas, and rolling bass.

| File | Description |
|------|-------------|
| `afro_house_128bpm.mp3` | Full track (~2:15) |
| `afro_house_128bpm_preview.mp3` | 60s preview |
| `generate_afro_house.py` | Regenerator (Python + NumPy) |
| `player.html` | Local listening page |

## Specs

- **Tempo:** 128 BPM
- **Key:** A minor (pentatonic vocal melody)
- **Structure:** Intro → groove → vocals → break → drop → outro
- **Vocals:** Formant-synth call & response (ah / eh / oh vowels)
- **Percussion:** Four-on-floor kick, claps, shakers, conga patterns

## Regenerate

```bash
python3 music/generate_afro_house.py
ffmpeg -y -i music/afro_house_128bpm.wav -codec:a libmp3lame -qscale:a 2 music/afro_house_128bpm.mp3
ffmpeg -y -i music/afro_house_128bpm_preview.wav -codec:a libmp3lame -qscale:a 2 music/afro_house_128bpm_preview.mp3
```

Open `player.html` in a browser to listen.

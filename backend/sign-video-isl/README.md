# ISL (Indian Sign Language) sign video – free local

This server uses the open-source **IIITB VirtualISLInterpreter** ([GitHub](https://github.com/krishnshyam/VirtualISLInterpreter)) to turn English text into **Indian Sign Language (ISL)** gloss and then into a short video (gloss on screen). No API key.

## Quick start

```bash
cd backend/sign-video-isl
pip install -r requirements.txt
python setup_isl.py
python server.py
```

Video is generated with **imageio** (no MoviePy). If video creation fails, ensure `imageio-ffmpeg` is installed: `pip install -r requirements.txt`.

Leave the server running. In `backend/.env` set:

```env
SIGN_VIDEO_PROVIDER=isl
```

Restart the BrightWords backend. The **"AI signing video"** button will appear on Sign Language → Convert; generated videos show the **ISL gloss** (and use IIITB’s English→ISL translation).

## What it does

1. **Translation:** Uses IIITB’s rule-based English→ISL gloss (from their `spacy_rules` + spaCy + NLTK).
2. **Video:** Builds a short MP4 that displays the gloss text (placeholder). You can add real ISL sign clips later (see below).

## Options

- `SIGN_VIDEO_ISL_PORT` – port (default `5001`)
- `SIGN_VIDEO_ISL_HOST` – bind address (default `127.0.0.1`)
- `SIGN_VIDEO_ISL_BASE_URL` – base URL returned to the app (default `http://127.0.0.1:5001`)

## Requirements

- Python 3.9+
- First run: `setup_isl.py` downloads the IIITB translate module and installs the spaCy model + NLTK data.

## Credits

Translation logic: [VirtualISLInterpreter](https://github.com/krishnshyam/VirtualISLInterpreter) by IIIT Bangalore (Cognitive Computing CoE).

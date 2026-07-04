"""
ISL (Indian Sign Language) sign video server using IIITB VirtualISLInterpreter.
English text -> ISL gloss (via their spacy_rules) -> video (placeholder with gloss text).
No API key. Run: pip install -r requirements.txt && python setup_isl.py && python server.py
"""
import os
import re
import uuid
from pathlib import Path

from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__)

@app.after_request
def cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return resp

BASE = Path(__file__).resolve().parent
OUT_DIR = BASE / "out"
OUT_DIR.mkdir(exist_ok=True)
HOST = os.environ.get("SIGN_VIDEO_ISL_HOST", "127.0.0.1")
# Use 5002 by default so we don't conflict with any other local services on 5001.
PORT = int(os.environ.get("SIGN_VIDEO_ISL_PORT", "5002"))
BASE_URL = os.environ.get("SIGN_VIDEO_ISL_BASE_URL", f"http://{HOST}:{PORT}")


def get_gloss(text):
    """
    Very lightweight ISL-style gloss approximation.
    - Uppercases content words.
    - Drops common English articles/auxiliaries.
    This avoids heavy external dependencies that were causing MoviePy errors.
    """
    tokens = re.findall(r"[A-Za-z']+", text)
    if not tokens:
        return text

    drop = {
        "a", "an", "the", "is", "am", "are", "was", "were",
        "be", "been", "being", "do", "does", "did",
        "of", "for", "to", "from", "in", "on", "at", "by",
        "and", "or", "but",
    }
    gloss_tokens = []
    for tok in tokens:
        if tok.lower() in drop:
            continue
        gloss_tokens.append(tok.upper())
    return " ".join(gloss_tokens) or text.upper()


def make_gloss_video(gloss, out_path):
    """Create a short video showing the ISL gloss text (placeholder). Uses imageio only (no MoviePy)."""
    import numpy as np
    from PIL import Image, ImageDraw, ImageFont
    import imageio.v3 as iio

    w, h = 640, 368
    img = Image.new("RGB", (w, h), color=(30, 30, 40))
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default()
    for name in ("arial.ttf", "Arial.ttf", "DejaVuSans.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        try:
            font = ImageFont.truetype(name, 28)
            break
        except Exception:
            pass
    # Wrap gloss into lines
    words = gloss.split()
    lines = []
    line = ""
    for word in words:
        if line and len(line) + len(word) + 1 > 35:
            lines.append(line)
            line = word
        else:
            line = (line + " " + word).strip() if line else word
    if line:
        lines.append(line)
    title = "ISL (Indian Sign Language)"
    y = 40
    draw.text((20, y), title, fill=(200, 220, 255), font=font)
    y += 45
    for ln in lines[:6]:
        draw.text((20, y), ln, fill=(255, 255, 255), font=font)
        y += 38
    frame = np.array(img)
    fps = 10
    duration_sec = 3
    n_frames = fps * duration_sec
    frames = np.repeat(frame[np.newaxis, ...], n_frames, axis=0)
    iio.imwrite(str(out_path), frames, fps=fps, codec="libx264")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "provider": "isl"})

@app.route("/translate", methods=["POST", "OPTIONS"])
def translate():
    if request.method == "OPTIONS":
        return "", 204
    data = request.get_json() or {}
    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"error": "Missing text"}), 400
    text = text[:500]
    try:
        gloss = get_gloss(text)
        name = f"{uuid.uuid4().hex}.mp4"
        path = OUT_DIR / name
        make_gloss_video(gloss, path)
        video_url = f"{BASE_URL.rstrip('/')}/out/{name}"
        return jsonify({"videoUrl": video_url, "gloss": gloss})
    except Exception as e:
        # Log full traceback on the server, but return a clean error to the client.
        import traceback
        tb = traceback.format_exc()
        print("[ISL-SERVER-ERROR]", tb)
        return jsonify({"error": f"ISL server error: {e}"}), 500

@app.route("/out/<path:filename>")
def serve_out(filename):
    return send_from_directory(OUT_DIR, filename, mimetype="video/mp4")

if __name__ == "__main__":
    print(f"ISL sign video server: {BASE_URL}")
    print("Set SIGN_VIDEO_PROVIDER=isl in backend .env")
    app.run(host=HOST, port=PORT, threaded=True)

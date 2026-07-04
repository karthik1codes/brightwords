"""
Setup ISL (Indian Sign Language) translation: download IIITB VirtualISLInterpreter
and copy their translate module here so server.py can run it.
Run once: pip install -r requirements.txt && python setup_isl.py
"""
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path
from urllib.request import urlopen

BASE = Path(__file__).resolve().parent
TRANSLATE_DIR = BASE / "translate"
ZIP_URL = "https://github.com/krishnshyam/VirtualISLInterpreter/archive/refs/heads/main.zip"

def main():
    if TRANSLATE_DIR.exists() and (TRANSLATE_DIR / "spacy_rules.py").exists():
        print("translate/ already present. Run server.py.")
        return
    print("Downloading VirtualISLInterpreter...")
    zip_path = BASE / "_isl_main.zip"
    with urlopen(ZIP_URL) as r:
        zip_path.write_bytes(r.read())
    with zipfile.ZipFile(zip_path, "r") as z:
        for name in z.namelist():
            if name.startswith("VirtualISLInterpreter-main/src/translate/"):
                z.extract(name, BASE)
    extracted = BASE / "VirtualISLInterpreter-main" / "src" / "translate"
    if not extracted.exists():
        print("Error: translate folder not found in archive")
        sys.exit(1)
    shutil.move(str(extracted), str(TRANSLATE_DIR))
    shutil.rmtree(BASE / "VirtualISLInterpreter-main", ignore_errors=True)
    zip_path.unlink(missing_ok=True)
    print("Installing spacy model en_core_web_sm...")
    subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"], check=True)
    print("Downloading NLTK wordnet...")
    import nltk
    nltk.download("wordnet", quiet=True)
    nltk.download("omw-1.4", quiet=True)
    print("Done. Run: python server.py")

if __name__ == "__main__":
    main()

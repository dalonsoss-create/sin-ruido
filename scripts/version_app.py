"""Identificador estable de la versión de la aplicación Sin Ruido.

Las noticias cambian constantemente; solo la interfaz, su lógica y catálogos
afectan a app_version. No se usan marcas de tiempo ni el SHA del commit.
"""
import hashlib
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DOCS=ROOT/"docs"

def app_version():
    files=[DOCS/x for x in ("index.html","portada.css","manifest.webmanifest","suscripciones.json")]
    files.extend(sorted(DOCS.glob("*.js")))
    digest=hashlib.sha256()
    for path in files:
        if not path.is_file():
            continue
        digest.update(path.relative_to(ROOT).as_posix().encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    html=(DOCS/"index.html").read_text(encoding="utf-8")
    scripts=[m.group(1) for m in re.finditer(
        r"<script\b[^>]*>([\s\S]*?)</script\s*>",html,re.I
    ) if m.group(1).strip()]
    if not scripts or "(function(){" not in scripts[-1]:
        raise ValueError("No se encontró el script principal de Sin Ruido")
    script_hash=hashlib.sha256(scripts[-1].encode("utf-8")).hexdigest()
    return {"app_version":digest.hexdigest()[:24],"app_script_sha256":script_hash}

if __name__=="__main__":
    import json
    print(json.dumps(app_version(),ensure_ascii=False))

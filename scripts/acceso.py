"""Señales explícitas de suscripción para los artículos RSS de Sin Ruido.

No inferimos que todo un periódico sea de pago. La ausencia de una señal
no demuestra acceso gratuito.
"""
import re
from urllib.parse import urlsplit, unquote
import unicodedata

PAY_SECTION = re.compile(
    r"(?i)(?:^|/)(?:premium|de-pago|contenido-de-pago|contenido-premium|"
    r"solo-suscriptores|solo-para-suscriptores|para-suscriptores|"
    r"suscriptores|subscribers-only|members-only|paywall)(?:/|$)"
)
PAY_TAG = re.compile(
    r"(?i)^(?:premium|suscriptores|solo para suscriptores|"
    r"contenido de pago|contenido premium|acceso de pago|articulo de pago|"
    r"solo suscriptores|subscriber only|subscribers only|paywall|paid content)$"
)
# No interpretar "premium" si forma parte de una noticia sobre gasolina,
# ni "suscripciones" en la URL de un artículo sobre Netflix.


def _normal(value):
    return "".join(
        c for c in unicodedata.normalize("NFD", str(value or "").lower())
        if unicodedata.category(c) != "Mn"
    ).strip()


def paid_from_url(url):
    try:
        path = unquote(urlsplit(str(url)).path)
    except ValueError:
        return False
    return bool(PAY_SECTION.search(path))


def detect_access(url, item=None, tags=()):
    """Devuelve 'subscription' solo con indicios editoriales explícitos.

    No se hacen peticiones a artículos, ni se extraen textos protegidos.
    """
    if paid_from_url(url):
        return "subscription", "url"
    for tag in tags:
        if PAY_TAG.fullmatch(_normal(tag)):
            return "subscription", "rss"
    if item is not None:
        for node in item.iter():
            tagname = node.tag.rsplit("}", 1)[-1].lower()
            value = _normal(node.text)
            if tagname in ("accessrights", "access", "paywall", "contenttier"):
                if value in ("paid", "premium", "restricted", "subscription",
                             "subscriber", "subscribers only", "solo suscriptores",
                             "de pago", "para suscriptores"):
                    return "subscription", "rss"
            if tagname == "isaccessibleforfree" and value in ("false", "0"):
                return "subscription", "rss"
            if tagname == "link" and node.attrib.get("rel", "").lower() in ("payment", "subscription"):
                return "subscription", "rss"
    return "unknown", ""


if __name__ == "__main__":
    import xml.etree.ElementTree as ET
    tests = [
        ("https://medio.es/premium/articulo", (), "subscription"),
        ("https://medio.es/para-suscriptores/articulo", (), "subscription"),
        ("https://medio.es/2026/11/precio-gasolina-premium-en-madrid", (), "unknown"),
        ("https://medio.es/2026/11/como-cancelar-suscripciones-netflix", (), "unknown"),
        ("https://medio.es/2026/11/normal", ("premium",), "subscription"),
        ("https://medio.es/2026/11/normal", ("tecnología",), "unknown"),
    ]
    for url, tags, expected in tests:
        got, _ = detect_access(url, tags=tags)
        assert got == expected, f"{url}: {got} en vez de {expected}"
    node = ET.fromstring('<item xmlns:dc="http://purl.org/dc/terms/"><dc:accessRights>paid</dc:accessRights></item>')
    assert detect_access("https://medio.es/normal", node)[0] == "subscription"
    print("Detección prudente de acceso verificada:", len(tests) + 1, "pruebas.")

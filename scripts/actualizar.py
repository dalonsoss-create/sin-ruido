#!/usr/bin/env python3
"""Sin Ruido: recopilación de feeds RSS en un JSON para la web estática."""
import concurrent.futures
import datetime as dt
import email.utils
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from zoneinfo import ZoneInfo
from urllib.parse import urlsplit
from clasificar import classify
from editorial import COVER_FEEDS, enrich
from acceso import detect_access

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"docs"/"noticias.json"
CONFIG=ROOT/"docs"/"fuentes.json"
ATOM="{http://www.w3.org/2005/Atom}"
MEDIA="{http://search.yahoo.com/mrss/}"
DC="{http://purl.org/dc/elements/1.1/}"
BAD=re.compile(r"^(publicidad|contenido patrocinado|podcast|v[ií]deo)[: ]",re.I)
MEDICAL=re.compile(r"(m[eé]dic|farmac|ensayo cl[ií]nico|vacuna|c[aá]ncer|alzheimer|gen[eé]tic|paciente|enfermedad|hospital)",re.I)
NATURE=re.compile(r"(biodiversidad|animales|medio ambiente|bosques|clima|conservaci[oó]n|especies|ecosistema)",re.I)

def text(node,*tags):
    for tag in tags:
        item=node.find(tag)
        if item is not None and item.text and item.text.strip():
            return item.text.strip()
    return ""

def date_iso(raw):
    if not raw:return None  # No inventamos la fecha de una noticia sin pubDate
    try:d=email.utils.parsedate_to_datetime(raw)
    except (ValueError,TypeError):
        try:d=dt.datetime.fromisoformat(raw.replace("Z","+00:00"))
        except ValueError:return None  # No publicamos como nueva una noticia mal fechada
    if d.tzinfo is None:d=d.replace(tzinfo=dt.timezone.utc)
    return d.astimezone(dt.timezone.utc).isoformat()

def image_in_rss(node):
    """Solo metadatos RSS; no rastrea páginas de periódicos ni descarga fotografías."""
    for item in node.iter():
        tag=item.tag.rsplit("}",1)[-1].lower()
        if tag in ("thumbnail","content","enclosure"):
            url=item.attrib.get("url","").strip()
            mime=item.attrib.get("type","").lower()
            medium=item.attrib.get("medium","").lower()
            if tag=="content" and medium not in ("image","") and not mime.startswith("image/"):continue
            if tag=="enclosure" and not mime.startswith("image/"):continue
            if urlsplit(url).scheme=="https" and urlsplit(url).netloc and not url.lower().endswith(".svg"):
                return url
    return None

def collect(feed):
    url=feed["url"]
    req=urllib.request.Request(url,headers={
        "User-Agent":"SinRuidoPersonalRSSReader/0.2 (noncommercial)",
        "Accept":"application/rss+xml, application/atom+xml, application/xml, text/xml, */*"})
    with urllib.request.urlopen(req,timeout=20) as resp:
        raw=resp.read(1700000)
    root=ET.fromstring(raw)
    channel=root.find("channel")
    atom=channel is None
    nodes=root.findall(ATOM+"entry") if atom else channel.findall("item")
    articles=[]
    for item in nodes[:60]:
        if atom:
            title=text(item,ATOM+"title")
            link=next((n.get("href") for n in item.findall(ATOM+"link")
                if n.get("rel","alternate")=="alternate" and n.get("href")),"")
            published=text(item,ATOM+"published",ATOM+"updated")
        else:
            title=text(item,"title")
            link=text(item,"link")
            published=text(item,"pubDate",DC+"date")
        article_date=date_iso(published)
        if not article_date:continue
        title=re.sub(r"\s+"," ",title).strip()
        if len(title)<16 or BAD.search(title):continue
        link=link.strip()
        if urlsplit(link).scheme!="https" or not urlsplit(link).netloc:continue
        rss_tags=[c.text for c in item.findall("category") if c.text]
        rss_tags.extend(c.get("term") for c in item.findall(ATOM+"category") if c.get("term"))
        rss_tags.extend(c.text for c in item.findall(DC+"subject") if c.text)
        category=classify(title,link,feed["category"],rss_tags,feed["name"])
        access_status, access_evidence=detect_access(link,item,rss_tags,feed["name"])
        article={
            "title":title[:260],"link":link,"date":article_date,
            "source":feed["name"],"source_id":feed["id"],"category":category,
            "place":feed.get("place",""),
            "classification_version":6,
            "access_status":access_status,
            "editorial_portadas":[COVER_FEEDS[feed["id"]]] if feed["id"] in COVER_FEEDS else []}
        # La imagen se almacena SOLO si se ha comprobado permiso explícito.
        if feed.get("images_allowed") is True:
            img=image_in_rss(item)
            if img:
                article["image"]=img
                article["image_license_ok"]=True
        if access_evidence:article["access_evidence"]=access_evidence
        articles.append(article)
    return articles

def select_balanced(items, limit=900, minimum_per_source=5):
    """Reserva titulares recientes de cada medio, luego llena por actualidad.

    Sin esta reserva, medios locales con pocos titulares desaparecen al
    superar el corte global de 900 artículos de periódicos grandes.
    Los artículos ya están depurados y limitados a las últimas 72 horas.
    """
    if len(items) <= limit:
        return items
    quotas={}
    chosen=set()
    for index, article in enumerate(items):
        source=article.get("source_id") or article.get("source") or ""
        if quotas.get(source, 0) < minimum_per_source:
            chosen.add(index)
            quotas[source]=quotas.get(source, 0)+1
    if len(chosen)>limit:
        chosen=set(sorted(chosen)[:limit])
    for index in range(len(items)):
        if len(chosen)>=limit:
            break
        chosen.add(index)
    return [a for index,a in enumerate(items) if index in chosen]


def main():
    now=dt.datetime.now(dt.timezone.utc)
    feed_list=json.loads(CONFIG.read_text(encoding="utf-8")).get("feeds",[])
    feed_list=[f for f in feed_list if f.get("id") and f.get("url","").startswith("https://")]
    try:old=json.loads(OUT.read_text(encoding="utf-8")).get("articles",[])
    except (FileNotFoundError,ValueError):old=[]
    successes=0
    articles=[]
    statuses=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        future_map={pool.submit(collect,f):f for f in feed_list}
        for future in concurrent.futures.as_completed(future_map):
            feed=future_map[future]
            status={"id":feed["id"],"ok":False,"count":0}
            try:
                batch=future.result()
                articles.extend(batch)
                status.update({"ok":True,"count":len(batch)})
                successes+=1
                print(f"[OK] {feed['name']} / {feed['category']}: {len(batch)}")
            except Exception as exc:
                print(f"[AVISO] {feed['name']}: {exc}",file=sys.stderr)
            statuses.append(status)
    # Reetiquetar titulares antiguos: también se corrigen las secciones al desplegar.
    fmap={f["id"]:f for f in feed_list}
    for a in old:
        if a.get("classification_version")!=6:
            origin=fmap.get(a.get("source_id"),{})
            a["category"]=classify(a.get("title",""),a.get("link",""),origin.get("category",a.get("category","Sociedad")),(),a.get("source",""))
            a["classification_version"]=6
            a["place"]=origin.get("place",a.get("place",""))
    # Verificar acceso de los anteriores sin volver a rastrear los sitios.
    # Un enlace de tipo premium/suscriptores sigue siendo reconocible, y
    # conservamos las señales RSS ya confirmadas en ediciones anteriores.
    for a in old:
        if a.get("access_status") not in ("subscription","free"):
            access, evidence=detect_access(a.get("link",""),source=a.get("source",""))
            a["access_status"]=access
            if evidence:a["access_evidence"]=evidence
    # Retener noticias recientes si alguna fuente falla temporalmente.
    articles+=old
    active_ids={f["id"] for f in feed_list}
    fresh=[]
    seen={}
    for a in sorted(articles,key=lambda x:x.get("date",""),reverse=True):
        try:
            when=dt.datetime.fromisoformat(a["date"].replace("Z","+00:00"))
        except (KeyError,ValueError,TypeError):continue
        if when.tzinfo is None:when=when.replace(tzinfo=dt.timezone.utc)
        if now-when>dt.timedelta(hours=72) or when-now>dt.timedelta(hours=4):continue
        if a.get("source_id") and a["source_id"] not in active_ids:continue
        titlekey=re.sub(r"\W+","",a.get("title","").casefold())
        urlkey=a.get("link","").split("?")[0]
        if not titlekey or not urlkey:continue
        if titlekey in seen or urlkey in seen:
            original=seen.get(titlekey) or seen.get(urlkey)
            if original:
                original["editorial_portadas"]=sorted(set(
                    original.get("editorial_portadas",[])+
                    a.get("editorial_portadas",[])+
                    ([COVER_FEEDS[a["source_id"]]] if a.get("source_id") in COVER_FEEDS else [])
                ))
            continue
        seen[titlekey]=a
        seen[urlkey]=a
        fresh.append(a)
    if not fresh:
        print("[ERROR] Sin noticias recientes; conservamos el fichero anterior",file=sys.stderr)
        sys.exit(1)
    # Las cabeceras de referencia y coincidencias ayudan a detectar relevancia.
    # El resto de noticias se mantiene: no filtramos por apertura ni suscripción.
    fresh=enrich(select_balanced(fresh, limit=900, minimum_per_source=5))
    # Métrica real en la zona del lector, para detectar ediciones sin noticias
    # del día después de medianoche (la programación de GitHub puede retrasarse).
    madrid=ZoneInfo("Europe/Madrid")
    madrid_day=now.astimezone(madrid).date()
    today_count=sum(
        dt.datetime.fromisoformat(a["date"].replace("Z","+00:00")).astimezone(madrid).date()==madrid_day
        for a in fresh
    )
    print(f"[EDICIÓN] Madrid: {madrid_day.isoformat()}, noticias de hoy: {today_count}")
    OUT.write_text(json.dumps({
        "updated":now.isoformat(),"edition_date_madrid":madrid_day.isoformat(),
        "articles_today_madrid":today_count,
        "sources_ok":successes,"classification_version":6,
        "feed_count":len(feed_list),
        "sources_status":sorted(statuses,key=lambda x:x["id"]),
        "articles":fresh[:900]},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Guardados {min(len(fresh),900)} titulares; {successes} fuentes consultadas.")

if __name__=="__main__":main()

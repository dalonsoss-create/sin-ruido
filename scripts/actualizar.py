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
from mapas_publicos import discover as discover_sitemaps

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

def local_day(iso, tz=ZoneInfo("Europe/Madrid")):
    d=dt.datetime.fromisoformat(iso.replace("Z","+00:00"))
    if d.tzinfo is None:d=d.replace(tzinfo=dt.timezone.utc)
    return d.astimezone(tz).date().isoformat()

def parse_feed(payload, feed):
    """Usar exclusivamente fechas de publicación RSS, nunca la hora de recogida."""
    root=ET.fromstring(payload)
    channel=root.find("channel")
    atom=channel is None
    nodes=root.findall(ATOM+"entry") if atom else channel.findall("item")
    articles=[]
    for item in nodes[:110]:
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
            "publication_date_madrid":local_day(article_date),
            "date_source":"rss_published",
            "source":feed["name"],"source_id":feed["id"],"category":category,
            "place":feed.get("place",""),
            "classification_version":6,
            "access_status":access_status,
            "editorial_portadas":[COVER_FEEDS[feed["id"]]] if feed["id"] in COVER_FEEDS else []}
        if feed.get("images_allowed") is True:
            img=image_in_rss(item)
            if img:
                article["image"]=img
                article["image_license_ok"]=True
        if access_evidence:article["access_evidence"]=access_evidence
        articles.append(article)
    return articles

def collect(feed):
    """RSS principal y suplementos públicos con el MISMO ID de fuente del lector."""
    urls=[feed["url"]]+[
        u for u in feed.get("extra_urls",[])[:3]
        if isinstance(u,str) and urlsplit(u).scheme=="https"]
    articles=[]
    failures=[]
    succeeded=False
    for url in urls:
        try:
            req=urllib.request.Request(url,headers={
                "User-Agent":"SinRuidoPersonalRSSReader/0.3 (noncommercial)",
                "Accept":"application/rss+xml, application/atom+xml, application/xml, text/xml, */*"})
            with urllib.request.urlopen(req,timeout=18) as resp:
                raw=resp.read(2200000)
            batch=parse_feed(raw,feed)
            articles.extend(batch)
            succeeded=True
        except Exception as exc:
            failures.append(f"{url}: {exc}")
    if not succeeded:raise RuntimeError("No responde ningún RSS: "+"; ".join(failures)[:300])
    if failures:print("[AVISO RSS adicional] "+"; ".join(failures)[:300],file=sys.stderr)
    # Duplicaciones entre canales del mismo periódico no se publican.
    unique={}
    for article in articles:
        unique.setdefault(article["link"].split("?")[0],article)
    return list(unique.values())

def collect_sitemap(feed, all_feeds):
    """No visita artículos, no usa API privada, no inventa fechas de edición.

    Los sitemaps de noticias solamente se leen si están listados en robots.txt
    y el lector tiene permitido acceder a su XML. Si no se valida, devuelve [].
    """
    base=feed.get("sitemap_base","")
    if not base:return []
    news=discover_sitemaps(base,limit=130)
    publisher_feeds=[f for f in all_feeds if f["name"]==feed["name"]]
    by_category={f["category"]:f for f in publisher_feeds}
    articles=[]
    for title,link,published in news:
        date=date_iso(published)
        if not date:continue
        title=re.sub(r"\s+"," ",title).strip()
        if BAD.search(title):continue
        category=classify(title,link,"Sociedad",(),feed["name"])
        # Se respeta el mismo selector de fuentes ya guardado en cada navegador.
        # Si no hay RSS asociado a esta sección, NO se inventa otro source_id.
        origin=by_category.get(category)
        if origin is None:continue
        access_status,access_evidence=detect_access(link,source=feed["name"])
        article={
            "title":title[:260],"link":link,"date":date,
            "publication_date_madrid":local_day(date),
            "date_source":"news_sitemap_publication_date",
            "source":origin["name"],"source_id":origin["id"],
            "category":category,"place":origin.get("place",""),
            "classification_version":6,"access_status":access_status,
            "editorial_portadas":[COVER_FEEDS[origin["id"]]] if origin["id"] in COVER_FEEDS else []}
        if access_evidence:article["access_evidence"]=access_evidence
        articles.append(article)
    return articles

def select_balanced(items, limit=900, minimum_per_source=5, max_per_publisher=95, now=None):
    """Priorizar las noticias de HOY y equilibrar cabeceras y RSS de cada una.

    Antes, Infobae podía ocupar >50 % de 900 plazas. Ningún periódico podrá
    superar max_per_publisher, aunque tenga muchas secciones o RSS.
    No cambia el orden mostrado al lector: solo conserva mejor el inventario.
    """
    now=now or dt.datetime.now(dt.timezone.utc)
    today=now.astimezone(ZoneInfo("Europe/Madrid")).date().isoformat()
    ordered=sorted(items,key=lambda a:a.get("date",""),reverse=True)
    current=[a for a in ordered if local_day(a["date"])==today]
    history=[a for a in ordered if local_day(a["date"])!=today]
    count_per_publisher={}
    selected=[]
    from collections import defaultdict, deque
    for cohort in (current,history):
        # Un turno por cabecera, alternando sus secciones para que las portadas
        # generales no desplacen a Ciencia, Tecnología o Internacional.
        groups={}
        for a in cohort:
            publisher=a.get("source") or a.get("source_id") or "Otro"
            feed=a.get("source_id") or publisher
            groups.setdefault(publisher,defaultdict(deque))[feed].append(a)
        names=list(groups)
        turn=0
        while names and len(selected)<limit:
            next_names=[]
            for publisher in names:
                count=count_per_publisher.get(publisher,0)
                if count>=max_per_publisher:continue
                feeds=groups[publisher]
                available=[name for name,queue in feeds.items() if queue]
                if not available:continue
                feed_name=available[turn%len(available)]
                selected.append(feeds[feed_name].popleft())
                count_per_publisher[publisher]=count+1
                if any(feeds.values()) and count+1<max_per_publisher:
                    next_names.append(publisher)
                if len(selected)>=limit:break
            names=next_names
            turn+=1
        if len(selected)>=limit:break
    selected.sort(key=lambda a:a.get("date",""),reverse=True)
    return selected

def main():
    now=dt.datetime.now(dt.timezone.utc)
    feed_list=json.loads(CONFIG.read_text(encoding="utf-8")).get("feeds",[])
    feed_list=[f for f in feed_list if f.get("id") and f.get("url","").startswith("https://")]
    try:old=json.loads(OUT.read_text(encoding="utf-8")).get("articles",[])
    except (FileNotFoundError,ValueError):old=[]
    successes=0
    articles=[]
    statuses=[]
    sitemap_stats=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        future_map={pool.submit(collect,f):("rss",f) for f in feed_list}
        future_map.update({
            pool.submit(collect_sitemap,f,feed_list):("sitemap",f)
            for f in feed_list if f.get("sitemap_base")
        })
        for future in concurrent.futures.as_completed(future_map):
            kind,feed=future_map[future]
            status={"id":feed["id"],"ok":False,"count":0}
            try:
                batch=future.result()
                articles.extend(batch)
                status.update({"ok":True,"count":len(batch)})
                if kind=="rss":
                    successes+=1
                print(f"[OK {kind.upper()}] {feed['name']} / {feed['category']}: {len(batch)}")
            except Exception as exc:
                print(f"[AVISO {kind.upper()}] {feed['name']}: {exc}",file=sys.stderr)
            if kind=="rss":statuses.append(status)
            else:sitemap_stats.append(status)
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
    available_before_balance=len(fresh)
    fresh=enrich(select_balanced(fresh, limit=900, max_per_publisher=95, now=now))
    kept_by_publisher={}
    for a in fresh:
        name=a.get("source","?")
        kept_by_publisher[name]=kept_by_publisher.get(name,0)+1
    print("[BALANCE] "+str(sorted(kept_by_publisher.items(),key=lambda x:-x[1])[:12]))
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
        "collected_before_balance":available_before_balance,
        "balance_max_per_publisher":95,
        "publisher_counts":dict(sorted(kept_by_publisher.items())),
        "public_sitemaps_status":sorted(sitemap_stats,key=lambda x:x["id"]),
        "sources_ok":successes,"classification_version":6,
        "feed_count":len(feed_list),
        "sources_status":sorted(statuses,key=lambda x:x["id"]),
        "articles":fresh[:900]},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Guardados {min(len(fresh),900)} titulares; {successes} fuentes consultadas.")

if __name__=="__main__":main()

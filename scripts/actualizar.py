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
from urllib.parse import urlsplit
from clasificar import classify

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
    if not raw:return dt.datetime.now(dt.timezone.utc).isoformat()
    try:d=email.utils.parsedate_to_datetime(raw)
    except (ValueError,TypeError):
        try:d=dt.datetime.fromisoformat(raw.replace("Z","+00:00"))
        except ValueError:return dt.datetime.now(dt.timezone.utc).isoformat()
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
        title=re.sub(r"\s+"," ",title).strip()
        if len(title)<16 or BAD.search(title):continue
        link=link.strip()
        if urlsplit(link).scheme!="https" or not urlsplit(link).netloc:continue
        rss_tags=[c.text for c in item.findall("category") if c.text]
        rss_tags.extend(c.get("term") for c in item.findall(ATOM+"category") if c.get("term"))
        rss_tags.extend(c.text for c in item.findall(DC+"subject") if c.text)
        category=classify(title,link,feed["category"],rss_tags,feed["name"])
        article={
            "title":title[:260],"link":link,"date":date_iso(published),
            "source":feed["name"],"source_id":feed["id"],"category":category,
            "classification_version":4}
        # La imagen se almacena SOLO si se ha comprobado permiso explícito.
        if feed.get("images_allowed") is True:
            img=image_in_rss(item)
            if img:article["image"]=img
        articles.append(article)
    return articles

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
        if a.get("classification_version")!=4:
            origin=fmap.get(a.get("source_id"),{})
            a["category"]=classify(a.get("title",""),a.get("link",""),origin.get("category",a.get("category","Sociedad")),(),a.get("source",""))
            a["classification_version"]=3
    # Retener noticias recientes si alguna fuente falla temporalmente.
    articles+=old
    active_ids={f["id"] for f in feed_list}
    fresh=[]
    seen=set()
    for a in sorted(articles,key=lambda x:x.get("date",""),reverse=True):
        try:
            when=dt.datetime.fromisoformat(a["date"].replace("Z","+00:00"))
        except (KeyError,ValueError,TypeError):continue
        if when.tzinfo is None:when=when.replace(tzinfo=dt.timezone.utc)
        if now-when>dt.timedelta(hours=72) or when-now>dt.timedelta(hours=4):continue
        if a.get("source_id") and a["source_id"] not in active_ids:continue
        titlekey=re.sub(r"\W+","",a.get("title","").casefold())
        urlkey=a.get("link","").split("?")[0]
        if not titlekey or not urlkey or titlekey in seen or urlkey in seen:continue
        seen.update((titlekey,urlkey))
        fresh.append(a)
    if not fresh:
        print("[ERROR] Sin noticias recientes; conservamos el fichero anterior",file=sys.stderr)
        sys.exit(1)
    OUT.write_text(json.dumps({
        "updated":now.isoformat(),"sources_ok":successes,
        "sources_status":sorted(statuses,key=lambda x:x["id"]),
        "articles":fresh[:900]},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Guardados {min(len(fresh),900)} titulares; {successes} fuentes consultadas.")

if __name__=="__main__":main()

#!/usr/bin/env python3
"""Obtiene titulares y enlaces de feeds RSS, sin descargar los artículos."""
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

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"docs"/"noticias.json"
FEEDS=[
 ("EL PAÍS","Tecnología","https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/tecnologia/portada"),
 ("EL PAÍS","Ciencia","https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/ciencia/portada"),
 ("EL PAÍS","Economía","https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/economia/portada"),
 ("EL PAÍS","Naturaleza","https://feeds.elpais.com/mrss-s/list/ep/site/elpais.com/section/clima-y-medio-ambiente"),
 ("EL PAÍS","Internacional","https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/internacional/portada"),
 ("EL PAÍS","Deportes","https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/deportes/portada"),
 ("Cinco Días","Economía","https://feeds.elpais.com/mrss-s/list/ep/site/cincodias.elpais.com/section/economia"),
 ("Xataka","Tecnología","https://www.xataka.com/index.xml"),
 ("El Mundo","Ciencia","https://e00-elmundo.uecdn.es/elmundo/rss/ciencia.xml"),
 ("El Mundo","Salud","https://e00-elmundo.uecdn.es/elmundo/rss/salud.xml"),
]
BAD=re.compile(r"^(publicidad|contenido patrocinado|podcast|v[ií]deo)[: ]",re.I)
MEDICAL=re.compile(r"(m[eé]dic|farmac|ensayo cl[ií]nico|vacuna|c[aá]ncer|alzheimer|gen[eé]tic|paciente|enfermedad|hospital)",re.I)
def get_text(node,*tags):
    for tag in tags:
        e=node.find(tag)
        if e is not None and e.text and e.text.strip(): return e.text.strip()
    return ""
def parse_date(raw):
    if not raw:return dt.datetime.now(dt.timezone.utc).isoformat()
    try:d=email.utils.parsedate_to_datetime(raw)
    except (ValueError,TypeError):
        try:d=dt.datetime.fromisoformat(raw.replace("Z","+00:00"))
        except ValueError:return dt.datetime.now(dt.timezone.utc).isoformat()
    if d.tzinfo is None:d=d.replace(tzinfo=dt.timezone.utc)
    return d.astimezone(dt.timezone.utc).isoformat()
def collect(feed):
    source,category,url=feed
    req=urllib.request.Request(url,headers={"User-Agent":"SinRuidoPersonalRSSReader/0.1 (noncommercial)","Accept":"application/rss+xml, application/atom+xml, application/xml, text/xml, */*"})
    with urllib.request.urlopen(req,timeout=18) as response:raw=response.read(1700000)
    root=ET.fromstring(raw)
    channel=root.find("channel")
    is_atom=channel is None
    nodes=root.findall("{http://www.w3.org/2005/Atom}entry") if is_atom else channel.findall("item")
    result=[]
    for node in nodes[:55]:
        if is_atom:
            title=get_text(node,"{http://www.w3.org/2005/Atom}title")
            link=next((l.get("href") for l in node.findall("{http://www.w3.org/2005/Atom}link") if l.get("rel","alternate")=="alternate" and l.get("href")),"")
            date=get_text(node,"{http://www.w3.org/2005/Atom}published","{http://www.w3.org/2005/Atom}updated")
        else:
            title=get_text(node,"title")
            link=get_text(node,"link")
            date=get_text(node,"pubDate","{http://purl.org/dc/elements/1.1/}date")
        title=re.sub(r"\s+"," ",title).strip()
        if len(title)<16 or BAD.search(title):continue
        link=link.strip()
        if urlsplit(link).scheme!="https" or not urlsplit(link).netloc:continue
        cat="Salud" if category=="Ciencia" and MEDICAL.search(title) else category
        result.append({"title":title[:260],"link":link,"date":parse_date(date),"source":source,"category":cat})
    return result
def main():
    now=dt.datetime.now(dt.timezone.utc)
    try:old=json.loads(OUT.read_text(encoding="utf-8")).get("articles",[])
    except (FileNotFoundError,ValueError):old=[]
    articles=[];success=0
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        futures={pool.submit(collect,feed):feed for feed in FEEDS}
        for future in concurrent.futures.as_completed(futures):
            f=futures[future]
            try:
                batch=future.result();articles+=batch
                if batch:success+=1
                print(f"[OK] {f[0]} / {f[1]}: {len(batch)}")
            except Exception as exc:print(f"[AVISO] {f[0]} / {f[1]}: {exc}",file=sys.stderr)
    articles+=old
    fresh=[];seen=set()
    for article in sorted(articles,key=lambda a:a.get("date",""),reverse=True):
        try:when=dt.datetime.fromisoformat(article["date"].replace("Z","+00:00"))
        except (KeyError,ValueError,TypeError):continue
        if when.tzinfo is None:when=when.replace(tzinfo=dt.timezone.utc)
        if now-when>dt.timedelta(hours=72) or when-now>dt.timedelta(hours=4):continue
        titlekey=re.sub(r"\W+","",article.get("title","").casefold())
        urlkey=article.get("link","").split("?")[0]
        if not titlekey or not urlkey or titlekey in seen or urlkey in seen:continue
        seen.update((titlekey,urlkey));fresh.append(article)
    if not fresh:
        print("[ERROR] No hay artículos nuevos y recientes; se conserva archivo anterior",file=sys.stderr)
        sys.exit(1)
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps({"updated":now.isoformat(),"sources_ok":success,"articles":fresh[:500]},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Guardados {min(len(fresh),500)} titulares")
if __name__=="__main__":main()

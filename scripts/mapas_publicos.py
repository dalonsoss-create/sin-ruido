#!/usr/bin/env python3
"""Sin Ruido: detecta *solo* sitemaps de noticias declarados públicamente.

No visita artículos, no lee contenido premium, no adivina direcciones.
Si robots.txt no es accesible, no enumera sitemaps. El lector puede seguir
funcionando exclusivamente con RSS.
"""
import re
import urllib.request
import urllib.robotparser
import xml.etree.ElementTree as ET
from urllib.parse import urlsplit

UA="SinRuidoPersonalRSSReader/0.3"
NEWS="{http://www.google.com/schemas/sitemap-news/0.9}"
SITEMAP="{http://www.sitemaps.org/schemas/sitemap/0.9}"
MAX_ROBOTS=150000
MAX_XML=2400000

def same_host(url, base):
    a,b=urlsplit(url),urlsplit(base)
    return a.scheme=="https" and a.hostname==b.hostname and a.port in (None,443)

def news_entries(payload, base, limit=130):
    """Solo news:title + news:publication_date. lastmod NO es publicación."""
    root=ET.fromstring(payload)
    output=[]
    for item in root.findall(SITEMAP+"url"):
        link=item.findtext(SITEMAP+"loc","").strip()
        if not same_host(link,base):
            continue
        for story in item.findall(NEWS+"news"):
            title=(story.findtext(NEWS+"title","") or "").strip()
            published=(story.findtext(NEWS+"publication_date","") or "").strip()
            if len(title)>=16 and published:
                output.append((title,link,published))
                break
        if len(output)>=limit:break
    return output

def sitemap_children(payload, base, limit=5):
    root=ET.fromstring(payload)
    if root.tag!=SITEMAP+"sitemapindex":return []
    urls=[]
    for item in root.findall(SITEMAP+"sitemap"):
        url=(item.findtext(SITEMAP+"loc","") or "").strip()
        if same_host(url,base) and re.search(r"(?:news|noticias|actualidad)",url,re.I):
            urls.append(url)
        if len(urls)>=limit:break
    return urls

def get(url, max_bytes):
    request=urllib.request.Request(url,headers={
        "User-Agent":UA,
        "Accept":"application/xml,text/xml,text/plain,*/*"})
    with urllib.request.urlopen(request,timeout=9) as response:
        if not same_host(response.url,url):raise ValueError("Redirección entre dominios")
        return response.read(max_bytes+1)[:max_bytes]

def discover(base, limit=120):
    """Solo declaración explícita Sitemap: de robots y news metadata pública."""
    parsed=urlsplit(base)
    if parsed.scheme!="https" or not parsed.hostname or parsed.path not in ("","/"):
        return []
    robots=base.rstrip("/")+"/robots.txt"
    try:
        body=get(robots,MAX_ROBOTS).decode("utf-8","replace")
        robot=urllib.robotparser.RobotFileParser()
        robot.parse(body.splitlines())
        listed=[line.split(":",1)[1].strip() for line in body.splitlines()
                if line.lower().startswith("sitemap:")]
        if not listed:return []
        seen=set()
        result=[]
        # Tres indices públicos como máximo. No crawling de páginas HTML.
        for sitemap in listed[:3]:
            if not same_host(sitemap,base) or not robot.can_fetch(UA,sitemap):
                continue
            try:
                xml=get(sitemap,MAX_XML)
                candidates=news_entries(xml,base,limit-len(result))
                if not candidates:
                    for child in sitemap_children(xml,base,limit=3):
                        if not robot.can_fetch(UA,child):continue
                        try:candidates.extend(news_entries(get(child,MAX_XML),base,limit-len(result)))
                        except (ET.ParseError,ValueError,OSError):continue
                for title,link,published in candidates:
                    if link not in seen:
                        result.append((title,link,published))
                        seen.add(link)
                    if len(result)>=limit:return result
            except (ET.ParseError,ValueError,OSError):continue
        return result
    except (ValueError,OSError):
        return []

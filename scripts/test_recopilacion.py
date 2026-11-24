#!/usr/bin/env python3
"""Regresiones del recopilador (sin acceder a Internet y sin alterar la portada)."""
import datetime as dt
from zoneinfo import ZoneInfo
import actualizar
from mapas_publicos import news_entries, sitemap_children, same_host

UTC=dt.timezone.utc
madrid=ZoneInfo("Europe/Madrid")
today=dt.datetime(2026,11,24,10,0,tzinfo=UTC)
def item(source,feed,number,day="2026-11-24",category="Ciencia"):
    return {"title":f"{source} noticia {number}",
            "link":f"https://example.com/{source}/{number}",
            "source":source,"source_id":feed,
            "date":f"{day}T09:{number%60:02}:00+00:00",
            "category":category}
def check(cond,msg):
    if not cond:raise AssertionError(msg)

check(actualizar.local_day("2026-11-23T23:45:00+00:00")=="2026-11-24",
      "El cambio de día debe ocurrir en Madrid, no en UTC")
check(actualizar.local_day("2026-11-23T22:45:00+00:00")=="2026-11-23",
      "No declarar de hoy una publicación de ayer en Madrid")

rss=b'''<rss><channel>
  <item><title>Nuevo hallazgo en un laboratorio europeo</title>
    <link>https://example.com/ciencia/hallazgo</link>
    <pubDate>Tue, 24 Nov 2026 09:20:00 GMT</pubDate></item>
  <item><title>Noticia sin fecha real que nunca debe inventarse</title>
    <link>https://example.com/ciencia/sin-fecha</link></item>
</channel></rss>'''
feed={"id":"medio-ciencia","name":"Medio","category":"Ciencia"}
parsed=actualizar.parse_feed(rss,feed)
check(len(parsed)==1,"Se debe descartar un RSS sin pubDate")
check(parsed[0]["date"]=="2026-11-24T09:20:00+00:00","No modificar publicación real")
check(parsed[0]["publication_date_madrid"]=="2026-11-24",
      "Guardar fecha española de publicación")
check(parsed[0]["source_id"]=="medio-ciencia","No inventar fuente para el lector")

items=([item("Infobae","infobae-portada",i) for i in range(420)]+
       [item("El Mundo","elmundo-ciencia",i) for i in range(50)]+
       [item("El Mundo","elmundo-internacional",i+100) for i in range(50)]+
       [item("EL PAÍS","elpais-ciencia",i) for i in range(45)]+
       [item("Xataka","xataka-general",i) for i in range(45)]+
       [item("La Vanguardia","lavanguardia-portada",i) for i in range(45)]+
       [item("ABC","abc-portada",i) for i in range(45)]+
       [item("20minutos","20minutos-portada",i) for i in range(45)])
result=actualizar.select_balanced(items,limit=275,max_per_publisher=55,now=today)
counts={name:sum(a["source"]==name for a in result)
        for name in {a["source"] for a in result}}
check(len(result)==275,"Mantener 275 titulares si hay variedad suficiente")
check(all(n<=55 for n in counts.values()),"Un periódico no puede dominar el inventario")
check(counts.get("Infobae")==55,"La cuota máxima debe ser por cabecera")
check(counts.get("El Mundo")==55,"Sus dos RSS comparten la misma cuota")
check(any(a["source_id"]=="elmundo-ciencia" for a in result)
      and any(a["source_id"]=="elmundo-internacional" for a in result),
      "Representar también secciones diferentes del mismo periódico")
check(all(result[i]["date"]>=result[i+1]["date"]
          for i in range(len(result)-1)),"Inventario ordenado por publicación")

older=[item("El Mundo","elmundo-ciencia",i,"2026-11-23") for i in range(25)]
priority=actualizar.select_balanced(
    older+[item("El Mundo","elmundo-ciencia",i+100) for i in range(25)],
    limit=10,max_per_publisher=30,now=today)
check(all(a["date"].startswith("2026-11-24") for a in priority),
      "Cuando falta espacio, las noticias de hoy ganan a las de ayer")

xml=b'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
 xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
 <url><loc>https://www.elmundo.es/ciencia/2026/11/24/abc.html</loc>
 <news:news><news:title>Cientificos descubren un nuevo exoplaneta en el universo</news:title>
 <news:publication_date>2026-11-24T08:00:00+01:00</news:publication_date>
 </news:news></url>
 <url><loc>https://www.elmundo.es/ciencia/2026/11/24/falsa.html</loc>
 <lastmod>2026-11-24T08:00:00+01:00</lastmod></url>
 <url><loc>https://otro-sitio.es/ciencia/2026/11/24/falsa.html</loc>
 <news:news><news:title>Noticia de un dominio ajeno que no debemos usar</news:title>
 <news:publication_date>2026-11-24T08:00:00+01:00</news:publication_date>
 </news:news></url>
 </urlset>'''
entries=news_entries(xml,"https://www.elmundo.es")
check(len(entries)==1,"Solo news:publication_date explícito y el dominio del medio")
check(same_host("https://www.elmundo.es/ciencia/abc","https://www.elmundo.es"),
      "Dominio oficial aceptado")
check(not same_host("https://elsewhere.es/","https://www.elmundo.es"),
      "Nunca seguir a dominios ajenos")
original=actualizar.discover_sitemaps
try:
    actualizar.discover_sitemaps=lambda base,limit:entries
    mapping=[{"name":"El Mundo","id":"elmundo-portada","category":"Sociedad",
              "sitemap_base":"https://www.elmundo.es"},
             {"name":"El Mundo","id":"elmundo-ciencia","category":"Ciencia"}]
    mapped=actualizar.collect_sitemap(mapping[0],mapping)
    check(len(mapped)==1,"Noticia pública declarada en sitemap")
    check(mapped[0]["source_id"]=="elmundo-ciencia",
          "Mantener las preferencias de Ciencia del medio")
    check(mapped[0]["date"]=="2026-11-24T07:00:00+00:00",
          "Conservar fecha real, no fecha de recogida ni lastmod")
finally:
    actualizar.discover_sitemaps=original
print("OK: equilibrio entre cabeceras, RSS, fechas de Madrid, sitemaps y filtros de fuentes.")

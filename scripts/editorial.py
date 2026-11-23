"""Señales editoriales transparentes para Sin Ruido (sin API de pago).

Cinco canales RSS de portada se utilizan como señal complementaria:
El Mundo, ABC, La Vanguardia, El Español y El Confidencial.
La inclusión en un RSS no equivale a posición/jerarquía de la portada web.
"""
import re
import unicodedata
from collections import defaultdict

COVER_FEEDS={
    "elmundo-portada": "El Mundo",
    "abc-portada": "ABC",
    "lavanguardia-portada": "La Vanguardia",
    "elespanol-portada": "El Español",
    "elconfidencial-portada": "El Confidencial",
}
STOP={
    "sobre","desde","hasta","donde","quienes","quien","cuando","como","para","entre",
    "tras","este","esta","estos","estas","aquel","aquella","porque","mismo","sigue",
    "ahora","nuevo","nueva","nuevos","nuevas","todos","todas","tambien","segun",
    "varios","otras","otros","menos","muchos","tiene","tienen","puede","pueden",
    "hace","anuncia","dice","cuenta","explica","desvela","habla","hablan",
    "noticia","noticias","espana","madrid","mundo","europa","espanol","euros",
    "anos","miles","millones","primero","primera","despues","antes","frente",
    "durante","contra","pese","medio","grandes","gran","este","cada",
}

def tokens(title):
    cleaned="".join(c for c in unicodedata.normalize("NFD",str(title or "").lower())
        if unicodedata.category(c)!="Mn")
    return {s for s in re.findall(r"[a-z0-9]{5,}",cleaned)
            if s not in STOP and not s.isdigit()}

def same_event(a,b):
    if a.get("source")==b.get("source") or a.get("category")!=b.get("category"):
        return False
    left,right=tokens(a.get("title")),tokens(b.get("title"))
    if min(len(left),len(right))<4:
        return False
    common=len(left&right)
    if common<3:return False
    # Umbral alto: no decir que dos artículos tratan lo mismo por palabras genéricas.
    return common/max(len(left),len(right))>=0.5 and common/min(len(left),len(right))>=0.67

def enrich(articles):
    # El artículo ya puede conservar varias portadas si lo recoge más de un RSS.
    for a in articles:
        covers=a.get("editorial_portadas",[])
        if not isinstance(covers,list):covers=[]
        if a.get("source_id") in COVER_FEEDS:
            covers.append(COVER_FEEDS[a["source_id"]])
        a["editorial_portadas"]=sorted(set(covers))
        a["editorial_coincidencias"]=0
    # La coincidencia entre medios independientes es una señal, no una prueba de verdad.
    groups=defaultdict(list)
    for i,a in enumerate(articles):
        groups[a.get("category","Sociedad")].append(i)
    for indices in groups.values():
        for k,i in enumerate(indices):
            a=articles[i]
            matched=set()
            for j in indices[k+1:]:
                b=articles[j]
                if same_event(a,b):
                    matched.add(b.get("source",""))
                    b["editorial_coincidencias"]+=1
            a["editorial_coincidencias"]+=len(matched)
    return articles

if __name__=="__main__":
    a={"title":"La sonda BepiColombo llega a Mercurio y entra en órbita", "source":"Medio A","category":"Ciencia"}
    b={"title":"BepiColombo llega a Mercurio: la sonda ya está en órbita","source":"Medio B","category":"Ciencia"}
    c={"title":"Nuevo contrato para los servidores de inteligencia artificial","source":"Medio C","category":"Tecnología"}
    assert same_event(a,b), "Dos informaciones sobre BepiColombo no coinciden"
    assert not same_event(a,c), "No confundir noticias de temas distintos"
    d={"title":"El Gobierno debate el presupuesto nacional para 2027","source":"Medio D","category":"Política nacional"}
    e={"title":"El Gobierno decide contratar una empresa en 2027","source":"Medio E","category":"Política nacional"}
    assert not same_event(d,e), "No basta repetir gobierno y 2027"
    items=[dict(a,source_id="elmundo-portada"),dict(b,source_id="elmundo-ciencia")]
    enrich(items)
    assert items[0]["editorial_portadas"]==["El Mundo"]
    assert items[0]["editorial_coincidencias"]==1
    print("Contraste editorial RSS comprobado")

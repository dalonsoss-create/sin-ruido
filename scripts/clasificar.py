"""Clasificación editorial explicable de Sin Ruido, sin IA ni coste externo.

Prioridad:
  1. sección explícita del medio/URL y especialidad de la fuente,
  2. evidencias inequívocas del titular,
  3. categoría de origen del RSS,
  4. Sociedad (portadas genéricas).
No se clasifica por la palabra "descubrimiento" aislada ni por "internacional"
cuando el artículo trata realmente de deportes, salud, ciencia, etc.
"""
import re
import unicodedata
from urllib.parse import urlsplit, unquote

CATEGORIES={
    "Política nacional","Internacional","Conflictos","Sucesos","Economía","Empresas",
    "Ciencia","Tecnología","IA","Salud","Naturaleza","Medio ambiente","Sociedad",
    "Cultura","Educación","Historia","Viajes","Gastronomía","Deportes","Fútbol","Tenis","Motor"
}
def norm(value):
    text=unicodedata.normalize("NFD",str(value or "").lower())
    return "".join(c for c in text if unicodedata.category(c)!="Mn")

def has(value,pattern):
    return bool(re.search(pattern,value))

PATHS=[
    ("Tenis",r"/(?:tenis|tennis|atp|wta|wimbledon|roland-garros)(?:/|$)"),
    ("Fútbol",r"/(?:futbol|football|laliga|champions|primera-division)(?:/|$)"),
    ("Motor",r"/(?:motor|formula-1|formula1|motogp|motociclismo|f1)(?:/|$)"),
    ("Deportes",r"/(?:deportes|sports|baloncesto|basketball|ciclismo|atletismo|golf)(?:/|$)"),
    ("Gastronomía",r"/(?:gastronomia|recetas|cocina|comer|food|restaurantes)(?:/|$)"),
    ("Viajes",r"/(?:viajes|travel|turismo|escapadas|destinos)(?:/|$)"),
    ("Historia",r"/(?:historia|arqueologia|arqueology|antiguedad)(?:/|$)"),
    ("Educación",r"/(?:educacion|universidades|ensenanza|escuelas)(?:/|$)"),
    ("Salud",r"/(?:salud|medicina|health|sanidad|medicina-y-salud)(?:/|$)"),
    ("IA",r"/(?:inteligencia-artificial|artificial-intelligence|ia)(?:/|$)"),
    ("Tecnología",r"/(?:tecnologia|tecnolog[iy]|tech|internet|software|moviles|informatica|gadget)(?:/|$)"),
    ("Ciencia",r"/(?:ciencia|science|astronomia|espacio)(?:/|$)"),
    ("Medio ambiente",r"/(?:medio-ambiente|clima|cambio-climatico|climate|ecologia)(?:/|$)"),
    ("Naturaleza",r"/(?:naturaleza|animales|fauna|biodiversidad|oceanos)(?:/|$)"),
    ("Cultura",r"/(?:cultura|cine|musica|libros|literatura|arte|television|series)(?:/|$)"),
    ("Conflictos",r"/(?:guerra|guerras|conflictos|defensa|militar|ukrania|ucrania|oriente-proximo)(?:/|$)"),
    ("Sucesos",r"/(?:sucesos|tribunales|policia|police|justicia|crime|crimen)(?:/|$)"),
    ("Empresas",r"/(?:empresas|companias|negocios|emprendedores|startups)(?:/|$)"),
    ("Economía",r"/(?:economia|mercados|finanzas|bolsa|economy)(?:/|$)"),
    ("Política nacional",r"/(?:espana|politica|nacional|elecciones-generales|congreso)(?:/|$)"),
    ("Internacional",r"/(?:internacional|mundo|world|international|global|europa)(?:/|$)"),
]
SPORT=r"\b(?:tenis|tenista|atp|wta|wimbledon|roland garros|us open|australian open|open de australia|masters 1000|alcaraz|sinner|djokovic|nadal|zverev|fils|federer|futbol|futbolista|partido de liga|laliga|premier league|champions league|real madrid|atletico de madrid|fc barcelona|fifa|uefa|baloncesto|nba|euroliga|ciclismo|ciclista|tour de francia|vuelta a espana|motogp|formula 1|formula uno|gran premio|verstappen|marquez|moto gp|circuito de)\b"
TENNIS=r"\b(?:tenis|tenista|atp|wta|wimbledon|roland garros|us open|australian open|open de australia|masters 1000|alcaraz|sinner|djokovic|nadal|zverev|federer|copa davis)\b"
FOOTBALL=r"\b(?:futbol|futbolista|laliga|premier league|champions league|real madrid|atletico de madrid|fc barcelona|fifa|uefa|balon de oro|copa del rey|sevilla fc|real betis|real sociedad|rayo vallecano)\b"
MOTOR=r"\b(?:formula 1|formula uno|formula e|f1|f2|motogp|moto gp|motor|piloto de carreras|gran premio|verstappen|marc marquez|moto2|moto3)\b"
CONFLICT=r"\b(?:guerra|invasion|bombarde|bombas?|drones? (?:militares?|de ataque)|misiles?|ataques? aereos?|ofensiva militar|soldados|ejercito|tropas|rehenes|alto el fuego|armisticio|otan|nato|hamas|hezbola|combates? armados?|ataque militar|conflicto armado|ucrania|ucranianos?|ucranianas?|gaza)\b"
EVENTS=r"\b(?:accidente|atropello|choque mortal|asesinat|homicidio|crimen|detenido|detienen|sucesos|policia|policial|herido|fallec|incendio|desaparecid|secuestro|robo|violacion|juicio|condenan|tribunal|sentencia|juez|jueza)\b"
HEALTH=r"\b(?:salud|medicina|medico|medica|paciente|enfermedad|terapia|tratamiento|vacuna|cancer|oncolog|alzheimer|hospital|farmaco|diagnostic|cirugia|sindrome|cardiolog|diabetes|enfermer|obesidad|mortalidad|trastorno|genetic|trasplante|inmunolog)\b"
SCIENCE=r"\b(?:cientific|investigacion cientifica|experimento|laboratorio|fisica cuantica|quimica|astronom|astrofisic|nasa|esa|espacial|exoplaneta|planeta|galaxia|universo|agujero negro|paleontolog|fosil|regolito|misiones? lunar|hallazgo cientifico|investigadores? descubren)\b"
TECH=r"\b(?:tecnolog|smartphone|movil(?:es)?|iphone|ipad|android|ordenador|software|hardware|chip|procesador|robot(?:ica)?|ciberseguridad|aplicacion|apps?|internet|digital|internet|informatic|computacion|consola|videojuego|gadget)\b"
AI=r"\b(?:inteligencia artificial|machine learning|aprendizaje automatico|modelo de lenguaje|chatgpt|openai|gemini|claude|gpt[- ]?[456]|ia generativa|red neuronal|agentes? de ia)\b"
NATURE=r"\b(?:fauna|flora|biodiversidad|especies?|bosques?|selva|ecosistemas?|marino|ocean|ballenas?|tiburones?|lobos?|osos?|osas?|jabal[ií]es?|elefantes?|aves|pinguinos?|corales?|parque natural|jaguares?|cordilleras?|geologia|geologico|glaciares?|animales? salvajes?|caza furtiva|vida silvestre)\b"
CLIMATE=r"\b(?:cambio climatico|cumbre del clima|el tiempo de la semana|pronostico del tiempo|calentamiento global|emisiones de co2|emisiones de carbono|contaminacion atmosferica|descarboniz|sequias?|fenomenos meteorologicos|inundac|energias? renovables|medio ambiente|climatico|climatica|cop3[012])\b"
ECON=r"\b(?:inflacion|pib|euribor|tipos de interes|tipos del bce|economia|economico|economica|mercado bursatil|bolsa de|cotizacion|salarios?|hipotecas?|fiscalidad|recaudacion|presupuestos?|inversiones?|crisis financiera|subida de precios|deuda publica)\b"
BIZ=r"\b(?:empresa|empresas|companias|multinacional|ceo|startups?|emprendedor|empresari|plantilla|empleo|trabajadores|contratacion|despidos|fusion|adquisicion|financiacion|facturacion|beneficios empresariales)\b"
POLITICS=r"\b(?:psoe|partido popular|podemos|sumar|vox|moncloa|feijoo|sanchez|congreso de los diputados|senado espanol|parlamento espanol|elecciones generales|gobierno espanol|gobierno de espana|presidente del gobierno|oposicion parlamentaria|ministros? de espana)\b"
CULTURE=r"\b(?:cine|pelicula|series? de television|actor|actriz|director de cine|festival de cine|museo|exposicion|teatro|artista|musica|concierto|literatura|novela|escritor|escritora|premios goya)\b"
HISTORY=r"\b(?:arqueolog\w*|civilizaciones?|edad del hierro|edad del bronce|edad media|imperio romano|restos historicos|momia|yacimientos?|prehistoria|medieval|dinastia|egipto antiguo)\b"
EDUCATION=r"\b(?:colegio|universidad|estudiantes|educacion|profesores|profesoras|escuela|estudiar|aulas|becas escolares|curriculo escolar)\b"
FOOD=r"\b(?:receta|cocina|gastronomia|restaurante|chefs?|comida|gastronomic|cocinar|plato tradicional)\b"
TRAVEL=r"\b(?:turismo|turist|hotel|viajar|destino vacacional|aerolinea|aeropuerto|vacaciones|escapada|crucero|alojamiento|viajes de placer|viajes de negocios)\b"

def classify(title,link,default="Sociedad",tags=(),source=""):
    t=norm(title)
    p=norm(unquote(urlsplit(link).path))
    labels=" ".join(norm(v) for v in tags if v)[:900]
    src=norm(source)
    default=default if default in CATEGORIES else "Sociedad"
    # Categorías estructurales: dominio deportivo y sección dedicada tienen preferencia.
    sport_source=src in ("as","marca","mundo deportivo","sport")
    if has(t,TENNIS) or has(p,r"/tenis(?:/|$)") or has(labels,r"\btenis\b"):
        return "Tenis"
    if has(t,MOTOR) or has(p,r"/(?:motor|formula-1|motogp|motociclismo)(?:/|$)"):
        if sport_source or default in ("Motor","Deportes") or has(t,r"\b(?:motogp|formula 1|f1|gran premio|verstappen|marquez)\b"):
            return "Motor"
    if has(t,FOOTBALL) or has(p,r"/(?:futbol|football|laliga)(?:/|$)") or has(labels,r"\bfutbol\b"):
        return "Fútbol"
    if sport_source or default in ("Deportes","Tenis","Fútbol") or has(p,r"/(?:deportes|sports|baloncesto|ciclismo|atletismo|golf)(?:/|$)") or has(t,SPORT):
        return "Deportes"
    # Fauna y conservación: un oso abatido no es un descubrimiento científico,
    # aunque EL MUNDO publique la pieza dentro de su sección de Ciencia.
    if has(t,NATURE) and (
        has(t,r"\b(?:abatid[oa]s?|avistad[oa]s?|cazad[oa]s?|capturad[oa]s?|rescatad[oa]s?|muere|mueren|muerto|muerta|matan|conservacion|proteccion|parques? nacionales?|ejemplar|poblacion|especies?|ecosistema|salvaje|fauna|jabalies|caza furtiva)\b")
        or default in ("Ciencia","Naturaleza","Medio ambiente")
        or has(p,r"/(?:fauna|naturaleza|animales|especies|medio-ambiente)(?:/|$)")
    ) and not has(t,r"\b(?:comercio|negociaciones? comerciales?|diversificar la inversion|mercados? financieros?|acuerdo comercial)\b"):
        return "Naturaleza"
    # El conflicto militar prevalece sobre la política internacional genérica.
    if has(t,CONFLICT) or has(p,r"/(?:guerras?|conflictos|defensa-militar)(?:/|$)") or default=="Conflictos":
        if not has(t,r"\b(?:guerra comercial|guerra de precios|guerra de ofertas)\b"):
            return "Conflictos"
    # Titulares de accidentes y tribunales no van en Internacional solo por país.
    if has(p,r"/(?:sucesos|crime|policia|tribunales)(?:/|$)") or default=="Sucesos" or has(t,EVENTS):
        return "Sucesos"
    # Ciencia, salud e IA con prioridad temática, no por frases genéricas.
    if has(t,HEALTH) or default=="Salud" or has(p,r"/(?:medicina|salud|health)(?:/|$)"):
        return "Salud"
    if has(t,HISTORY) or default=="Historia" or has(p,r"/(?:historia|arqueologia)(?:/|$)"):
        return "Historia"
    if has(t,AI) or default=="IA" or has(p,r"/(?:inteligencia-artificial|artificial-intelligence)(?:/|$)"):
        return "IA"
    if has(t,CLIMATE) or default=="Medio ambiente" or has(p,r"/(?:medio-ambiente|cambio-climatico|climate)(?:/|$)"):
        return "Medio ambiente"
    if has(t,SCIENCE) or default=="Ciencia" or has(p,r"/(?:ciencia|science|astronomia|espacio)(?:/|$)"):
        return "Ciencia"
    if (has(t,NATURE) and not has(t,r"\b(?:comercio|comercial|negocios|inversion(?:es)?|mercados? financieros?|politica exterior|acuerdo economico)\b")) or (default=="Naturaleza" and not has(t,r"\b(?:amigo|relacion personal|mi relacion|negociaciones politicas|cumbre|compra|venta|precio|inversion)\b")) or has(p,r"/(?:naturaleza|animales|biodiversidad)(?:/|$)"):
        return "Naturaleza"
    if has(t,EDUCATION) or default=="Educación" or has(p,r"/(?:educacion|universidades)(?:/|$)"):
        return "Educación"
    if has(t,FOOD) or default=="Gastronomía" or has(p,r"/(?:gastronomia|recetas|cocina)(?:/|$)"):
        return "Gastronomía"
    if has(t,TRAVEL) or default=="Viajes" or has(p,r"/(?:turismo|viajes|travel)(?:/|$)"):
        return "Viajes"
    if has(t,CULTURE) or default=="Cultura" or has(p,r"/(?:cultura|cine|musica|libros|literatura)(?:/|$)"):
        return "Cultura"
    # La política nacional se define con pistas españolas; otros países van a Internacional.
    if has(t,POLITICS) or has(p,r"/(?:politica|elecciones-generales)(?:/|$)") or (default=="Política nacional" and has(t,r"\b(?:gobierno|ministerio|ministra|ministro|partido|parlamento|senado|congreso|diputados|oposicion|eleccion|candidato|alcalde)\b")):
        return "Política nacional"
    if has(t,BIZ) or default=="Empresas" or has(p,r"/(?:empresas|companias|negocios|emprendedores)(?:/|$)"):
        return "Empresas"
    if has(t,ECON) or default=="Economía" or has(p,r"/(?:economia|mercados|finanzas|bolsa)(?:/|$)"):
        return "Economía"
    if has(t,TECH) or default=="Tecnología" or has(p,r"/(?:tecnologia|internet|software|moviles|informatica)(?:/|$)"):
        return "Tecnología"
    if default=="Internacional" or has(p,r"/(?:internacional|mundo|world)(?:/|$)") or has(labels,r"\b(?:international|internacional|mundo)\b"):
        return "Internacional"
    return default

if __name__=="__main__":
    examples=[
        ("Alcaraz gana un partido de tenis en Londres", "https://ejemplo.com/internacional/alcaraz-final", "Internacional", "Tenis"),
        ("Una sorpresa científica: descubren una nueva galaxia", "https://ejemplo.com/tecnologia/galaxia", "Tecnología", "Ciencia"),
        ("Ucrania denuncia un ataque con drones sobre Kiev", "https://ejemplo.com/mundo/ucrania", "Internacional", "Conflictos"),
        ("Mueren tres personas en un accidente de autobús", "https://ejemplo.com/mundo/accidente", "Internacional", "Sucesos"),
        ("El PSOE y el PP debaten sobre los presupuestos", "https://ejemplo.com/espana/elecciones", "Política nacional", "Política nacional"),
        ("Un tratamiento contra el cáncer logra nuevos avances", "https://ejemplo.com/tecnologia/medicina", "Tecnología", "Salud"),
        ("Carlos Alcaraz se impone a Sinner en el Masters 1000", "https://ejemplo.com/internacional/tenis", "Internacional", "Tenis"),
        ("Investigadores descubren restos de la antigua Roma", "https://ejemplo.com/tecnologia/arqueologia", "Tecnología", "Historia"),
        ("Durante las excavaciones arqueológicas en la Duna de Pilat, estos científicos descubrieron restos que datan de la Edad del Hierro", "https://www.genbeta.com/actualidad/durante-excavaciones-arqueologicas-duna-pilat-estos-cientificos-descubrieron-restos-que-datan-edad-hierro", "Tecnología", "Historia"),
        ("Nuevas tendencias de la inteligencia artificial en 2026", "https://ejemplo.com/tecnologia/ia", "Tecnología", "IA"),
        ("El GP de Portugal coronará al campeón de MotoGP", "https://ejemplo.com/motor/motogp", "Deportes", "Motor"),
        ("Muere abatido un ejemplar de oso pardo durante un control de jabalíes en Picos de Europa", "https://www.elmundo.es/ciencia/2026/11/22/6b02c39fe85ece873e8b458c.html", "Ciencia", "Naturaleza"),
        ("Un lobo es avistado en los Picos de Europa", "https://ejemplo.com/ciencia/lobo", "Ciencia", "Naturaleza"),
        ("La biodiversidad de los océanos preocupa a los científicos", "https://ejemplo.com/ciencia/fauna", "Ciencia", "Naturaleza"),
        ("De osos panda a hospitales inteligentes: Sheinbaum quiere diversificar el comercio y la inversión", "https://elpais.com/mexico/economia/2026/11/21/osos-panda-hospitales.html", "Economía", "Economía")
    ]
    errors=[]
    for title,url,default,expected in examples:
        got=classify(title,url,default)
        if got!=expected:errors.append(f"{title} => {got}, esperado {expected}")
    if errors:raise SystemExit("\n".join(errors))
    print("Clasificación validada con",len(examples),"titulares")

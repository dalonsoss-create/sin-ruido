/* Fotografías ilustrativas libres: Wikimedia Commons. Validar licencia POR ARCHIVO,
   nunca asumir que una foto de un RSS es reutilizable ni que Commons significa CC0.
   La búsqueda es contextual, se almacena en el navegador y sólo se inicia
   al acercarse la tarjeta a pantalla. Si hay duda o fallo, queda el SVG propio. */
(function(){
"use strict";
const API="https://commons.wikimedia.org/w/api.php";
const CACHE="sinruido-commons-fotos-v3-";
const TTL=6*86400000;
const DISALLOWED=/\b(?:asesinat\w*|homicid\w*|violaci[oó]n|abusos?\s+sexual\w*|victim\w*|muert\w*|matanza|masacre|accidente|atropell\w*|herid\w*|fallec\w*|suicid\w*|incendio|bombarde\w*|explosion|terroris\w*|guerra|rehenes|genocidio|violencia\s+de\s+g[eé]nero|denuncia|acusad\w*|condena\w*|delitos?|estafas?|fraudes?|prision|trata\s+de\s+personas|migrantes?|detenid\w*|detienen|detiene|agresi[oó]n|desaparecid\w*)\b/;
const TOPICS=[
[/\b(?:pozuelo(?:\s+de\s+alarcon)?|monte\s+alina)\b/,"Pozuelo de Alarcon Madrid city photo","Pozuelo de Alarcón"],
[/\b(?:oso\s+pardo|osos\s+pardos)\b/,"brown bear animal nature photograph","oso pardo"],
[/\b(?:lobos?|lobo\s+iberico)\b/,"iberian wolf wild animal photograph","lobo ibérico"],
[/\b(?:elefantes?)\b/,"african elephant wild animal photograph","elefante"],
[/\b(?:tiburones?)\b/,"shark underwater animal photo","tiburón"],
[/\b(?:ballenas?|delfines?)\b/,"whale dolphin marine animal underwater","fauna marina"],
[/\b(?:pinguinos?|ping[uü]inos?)\b/,"penguin Antarctica wildlife photo","pingüino"],
[/\b(?:biodiversidad|fauna|ecosistemas?|bosques?|selvas?)\b/,"green forest biodiversity nature photograph","bosque"],
[/\b(?:solar|fotovoltaic\w*|placas?\s+solares?)\b/,"solar panels renewable energy photograph","paneles solares"],
[/\b(?:eolica|aerogenerad\w*|vientos?\s+renovables?)\b/,"wind turbines wind farm photograph","aerogeneradores"],
[/\b(?:glaciares?|hielo\s+polar)\b/,"glacier ice landscape photograph","glaciar"],
[/\b(?:contaminaci[oó]n|emisiones?|cambio\s+climatico|co2)\b/,"industrial smokestacks air pollution photograph","emisiones industriales"],
[/\b(?:cohetes?|misiones?\s+espaciales|nasa|astronautas?|luna\s+espacial)\b/,"NASA rocket space launch photograph","cohete espacial"],
[/\b(?:galaxias?|estrellas?|exoplanetas?|agujero\s+negro|universo)\b/,"Hubble galaxy nebula photograph","galaxia"],
[/\b(?:microscopi\w*|laboratorio|investigadores?|investigacion\s+cientifica)\b/,"laboratory microscope research photo","microscopio de laboratorio"],
[/\b(?:genetica|adn|dna|genoma|biomedicina)\b/,"DNA double helix laboratory photograph","investigación genética"],
[/\b(?:hospitales?|sanidad|medicin\w*|terapi\w*|tratamiento)\b/,"hospital medical equipment photograph","equipamiento médico"],
[/\b(?:vacunas?|vacunacion)\b/,"medical vaccine syringe photograph","vacunación"],
[/\b(?:coraz[oó]n|cardiolog\w*|cardiovascular)\b/,"stethoscope medical heart photograph","estetoscopio"],
[/\b(?:ordenadores?|servidores?|centros?\s+de\s+datos|nube\s+digital|inteligencia\s+artificial|chatgpt|modelos?\s+de\s+lenguaje)\b/,"data center server racks photograph","centro de datos"],
[/\b(?:robots?|robotica)\b/,"industrial robot arm manufacturing photograph","robot industrial"],
[/\b(?:chips?|semiconductores?|procesadores?)\b/,"computer processor microchip photograph","microchip"],
[/\b(?:ciberseguridad|hackers?|ciberataque)\b/,"computer network equipment photograph","equipos informáticos"],
[/\b(?:moviles?|smartphones?|iphone|telefonos?\s+inteligentes?)\b/,"smartphone mobile phone photograph","teléfono móvil"],
[/\b(?:hipotecas?|vivienda|alquileres?|inmobiliaria)\b/,"apartment building residential housing photograph","viviendas"],
[/\b(?:bolsa|ibex|bursatil|acciones|wall\s+street)\b/,"stock exchange trading floor photograph","mercados financieros"],
[/\b(?:euros?|inflacion|precios|salarios?|pension)\b/,"euro currency banknotes photograph","billetes de euro"],
[/\b(?:empresas?|oficinas?|trabajo|empleos?)\b/,"office workplace building photograph","oficina"],
[/\b(?:congreso|diputados|parlamento|gobierno\s+espanol)\b/,"Congreso de los Diputados Madrid building photo","Congreso de los Diputados"],
[/\b(?:elecciones?|votaciones?|urnas?)\b/,"ballot box voting polling station photograph","urna electoral"],
[/\b(?:museos?|exposiciones?|pintura|arte)\b/,"art museum gallery photograph","sala de museo"],
[/\b(?:teatro|musicales?|opera)\b/,"theatre stage auditorium photograph","teatro"],
[/\b(?:cine|peliculas?|rodaje)\b/,"cinema movie camera filmmaking photo","cámara de cine"],
[/\b(?:libros?|novela|literatura|lectura)\b/,"library bookshelves photograph","biblioteca"],
[/\b(?:gastronomia|recetas?|restaurantes?|cocineros?|chef)\b/,"professional chef cooking kitchen photograph","cocina profesional"],
[/\b(?:hoteles?|turismo|vacaciones|viajes?)\b/,"hotel reception lobby photograph","hotel"],
[/\b(?:aviones?|aeropuertos?|aerolineas?)\b/,"airplane at airport photograph","avión comercial"],
[/\b(?:montana|montañas|senderismo|trekking)\b/,"mountain hiking landscape photograph","montaña"],
[/\b(?:futbol|liga|champions|real\s+madrid|barcelona|atletico)\b/,"football stadium pitch photograph","estadio de fútbol"],
[/\b(?:tenis|alcaraz|sinner|wimbledon)\b/,"tennis court stadium photograph","pista de tenis"],
[/\b(?:formula\s*1|motogp|circuito|gran\s+premio)\b/,"motor racing circuit track photograph","circuito de velocidad"]
];
const FALLBACK={
"Ciencia":["research science laboratory microscope photograph","laboratorio científico"],
"IA":["data center computer server racks photograph","centro de datos"],
"Tecnología":["computer hardware electronics photograph","equipos informáticos"],
"Salud":["modern hospital medical equipment photo","equipamiento hospitalario"],
"Naturaleza":["forest green landscape nature photo","bosque"],
"Medio ambiente":["renewable energy landscape photograph","energías renovables"],
"Economía":["euro currency coins photograph","monedas de euro"],
"Empresas":["modern office building photograph","oficina"],
"Política nacional":["Spanish congress parliament building photograph","Congreso de los Diputados"],
"Cultura":["museum gallery art interior photograph","museo"],
"Historia":["Roman ancient ruins archaeological site photograph","ruinas históricas"],
"Educación":["school classroom education photo","aula"],
"Viajes":["landscape travel mountains photograph","paisaje"],
"Gastronomía":["restaurant chef cooking food photograph","cocina"],
"Deportes":["sports stadium field photograph","estadio"],
"Fútbol":["football stadium pitch photograph","campo de fútbol"],
"Tenis":["tennis racket tennis court photograph","pista de tenis"],
"Motor":["race car motorsport track photograph","circuito de velocidad"]
};
// Evitar resultados ajenos al concepto: la foto es de archivo, nunca del suceso.
function norm(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
function choice(article){
  const title=norm(article?.title);
  if(DISALLOWED.test(title)||["Sucesos","Conflictos"].includes(article?.category))return null;
  for(const [pattern,query,subject] of TOPICS){if(pattern.test(title))return {query,subject}}
  const fallback=FALLBACK[article?.category];
  return fallback?{query:fallback[0],subject:fallback[1]}:null;
}
function plain(html){
  if(typeof document!=="undefined"){
    const el=document.createElement("span");el.innerHTML=String(html||"");return (el.textContent||"").replace(/\s+/g," ").trim();
  }
  return String(html||"").replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim();
}
function meta(obj,k){return plain(obj?.[k]?.value||"")}
function correctLicense(metaObj){
  const name=meta(metaObj,"LicenseShortName").trim();
  const license=String(metaObj?.LicenseUrl?.value||"").replace(/^http:\/\/creativecommons\.org\//i,"https://creativecommons.org/");
  // Licencias admitidas explícitamente; nunca tratar CC BY-SA como CC BY.
  if(!(/^(?:CC0(?:\s|$)|CC BY [1-4]\.0$)/i.test(name)))return null;
  if(!/^https:\/\/creativecommons\.org\/(?:publicdomain\/zero\/1\.0|licenses\/by\/[1-4]\.0)\/?$/i.test(license))return null;
  if(meta(metaObj,"Restrictions"))return null;
  return {name,url:license};
}
function parseResults(data,subject){
  const pages=Object.values(data?.query?.pages||{}).sort((a,b)=>(a.index||100)-(b.index||100));
  const out=[];
  for(const p of pages){
    const info=p.imageinfo?.[0],ext=info?.extmetadata;
    if(!info||!ext||!/^image\/(?:jpeg|png|webp)$/.test(info.mime||""))continue;
    if((info.width||0)<600||(info.height||0)<360)continue;
    if(/\b(?:logo|flag|crest|map|diagram|poster|icon|screenshot|chart|graph|watermark|stamp)\b/i.test(p.title||""))continue;
    const licensed=correctLicense(ext);
    if(!licensed)continue;
    const creator=meta(ext,"Artist").replace(/^\s*(?:Photo|Photograph|Image)\s*:\s*/i,"").slice(0,100);
    if(!creator&&!/^CC0\b/i.test(licensed.name))continue;
    const src=info.thumburl||info.url;
    if(!/^https:\/\/(?:upload\.wikimedia\.org|thumb\.wikimedia\.org)\//.test(src||""))continue;
    const page="https://commons.wikimedia.org/wiki/"+encodeURIComponent(p.title.replace(/ /g,"_")).replace(/%3A/gi,":");
    out.push({src,alt:"Fotografía ilustrativa de archivo: "+subject,credit:creator||"Wikimedia Commons",
      license:licensed.name,licenseUrl:licensed.url,attribution:page,type:"illustrative"});
    if(out.length>=6)break;
  }
  return out;
}
const promises=new Map();
let active=0;
const queue=[];
function schedule(work){
  return new Promise(resolve=>{
    queue.push(async()=>{
      active++;
      try{resolve(await work())}catch(e){resolve([])}
      finally{active--;while(active<3&&queue.length)queue.shift()()}
    });
    while(active<3&&queue.length)queue.shift()();
  });
}
function cached(key){
  try{
    const x=JSON.parse(localStorage.getItem(CACHE+key)||"null");
    return x&&Date.now()-x.time<TTL&&Array.isArray(x.photos)?x.photos:null;
  }catch(e){return null}
}
async function lookup(query,subject){
  const key=query.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,70);
  const previous=cached(key);if(previous)return previous;
  if(promises.has(key))return promises.get(key);
  const promise=schedule(async()=>{
    const params=new URLSearchParams({
      action:"query",format:"json",origin:"*",generator:"search",
      gsrsearch:query,gsrnamespace:"6",gsrlimit:"15",
      prop:"imageinfo",iiprop:"url|size|mime|extmetadata",iiurlwidth:"960"
    });
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
    try{
      const response=await fetch(API+"?"+params.toString(),{signal:controller.signal,mode:"cors"});
      if(!response.ok)throw Error("commons-unavailable");
      const photos=parseResults(await response.json(),subject);
      try{localStorage.setItem(CACHE+key,JSON.stringify({time:Date.now(),photos}))}catch(e){}
      return photos;
    }catch(e){return []}
    finally{clearTimeout(timer)}
  });
  promises.set(key,promise);
  promise.finally(()=>promises.delete(key));
  return promise;
}
function hash(value){let v=2166136261;for(const c of String(value)){v=Math.imul(v^c.charCodeAt(0),16777619)}return v>>>0}
async function resolve(article){
  // Imagen real del medio SOLO con autorización confirmada en el RSS.
  if(article?.image_license_ok===true&&typeof article.image==="string"&&/^https:\/\//.test(article.image))
    return {src:article.image,alt:"Imagen autorizada del medio",credit:article.source||"Medio de origen",
      license:"Autorizada",licenseUrl:"",attribution:article.link,type:"editorial"};
  const selected=choice(article);if(!selected)return null;
  const photos=await lookup(selected.query,selected.subject);
  return photos.length?photos[hash(article.title)%Math.min(photos.length,4)]:null;
}
window.SinRuidoFotos={resolve,choice,correctLicense,parseResults};
})();
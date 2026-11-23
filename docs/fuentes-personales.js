/* Fuentes propias por usuario: lector RSS público, sin credenciales ni scraping.
 * API externa de conversión RSS (rss2json.com); su disponibilidad no está garantizada.
 * Preferencias solo en el navegador. Nunca se suben datos personales a GitHub. */
(function(){
"use strict";
const KEY="sinruido-fuentes-propias-v1";
const API="https://api.rss2json.com/v1/api.json?rss_url=";
const MAX=15;
function safeUrl(raw){
  let str=String(raw||"").trim();
  if(!str)return null;
  if(!/^https?:\/\//i.test(str))str="https://"+str;
  let u;
  try{u=new URL(str)}catch(e){return null}
  if(u.protocol!=="https:"||!u.hostname||u.username||u.password)return null;
  const host=u.hostname.toLowerCase();
  // No enviamos IP locales ni URLs privadas a proveedores de terceros.
  if(host==="localhost"||host.endsWith(".local")||!host.includes(".")||
     /^(?:127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(?:1[6-9]|2[0-9]|3[01])\.)/.test(host)||
     /^\d+\.\d+\.\d+\.\d+$/.test(host)||host.includes(":"))return null;
  u.hash="";
  return u;
}
function looksLikeSite(text){
  const t=String(text||"").trim();
  return /^https?:\/\//i.test(t)||/^[^\s/]+\.[a-z]{2,}(?::\d+)?(?:\/[^\s]*)?$/i.test(t);
}
function candidates(website){
  const u=safeUrl(website);
  if(!u)return [];
  const base=u.origin;
  const isFeed=/(?:feed|rss|atom|\.xml)(?:\/|$|\?)/i.test(u.pathname);
  const urls=[...(isFeed?[u.href]:[]),base+"/feed/",base+"/rss/",base+"/feed.xml",base+"/rss.xml",base+"/index.xml",base+"/atom.xml"];
  return [...new Set(urls)];
}
function prettyName(site){
  return site.hostname.replace(/^www\./,"").replace(/\.(com|es|net|org|info|cat|eu|co\.uk)$/i,"").replace(/[-_]/g," ").replace(/\b\w/g,x=>x.toUpperCase()).slice(0,60);
}
function dateIso(raw){
  const s=String(raw||"").trim();
  if(!s)return null;
  const normalized=/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(s)?s.replace(" ","T")+"Z":s;
  const d=new Date(normalized);
  return Number.isFinite(d.getTime())?d.toISOString():null;
}
function articleList(feed,items){
  const seen=new Set(),out=[];
  for(const item of items||[]){
    const title=String(item.title||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
    let url;
    try{url=new URL(item.link)}catch(e){continue}
    const date=dateIso(item.pubDate||item.published);
    if(title.length<16||url.protocol!=="https:"||!date||seen.has(url.href))continue;
    const age=Date.now()-Date.parse(date);
    if(age>72*3600000||age < -4*3600000)continue;
    seen.add(url.href);
    out.push({
      title:title.slice(0,260),link:url.href,date,
      source:feed.name,source_id:feed.id,category:"Sociedad",
      place:feed.place||"",access_status:"unknown",editorial_portadas:[]
    });
  }
  return out.slice(0,40);
}
async function read(url){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),11000);
  try{
    const r=await fetch(API+encodeURIComponent(url),{signal:controller.signal,cache:"no-store"});
    if(!r.ok)throw Error("Servicio RSS temporalmente no disponible");
    const data=await r.json();
    if(data.status!=="ok"||!Array.isArray(data.items)||!data.items.length)throw Error("No hay artículos RSS accesibles");
    return {feedUrl:url,title:String(data.feed?.title||"").replace(/<[^>]*>/g,"").slice(0,80),items:data.items};
  }finally{clearTimeout(timeout)}
}
async function discover(raw){
  const u=safeUrl(raw);
  if(!u)throw Error("Introduce la dirección pública HTTPS del periódico (por ejemplo, elcorreodepozuelo.com).");
  const list=candidates(u.href);
  for(let n=0;n<list.length;n+=3){
    try{
      const result=await Promise.any(list.slice(n,n+3).map(url=>read(url)));
      return {...result,website:u.origin,name:result.title||prettyName(u)};
    }catch(e){}
  }
  throw Error("No hemos encontrado un RSS público accesible en esta web. Algunos medios bloquean la lectura automática.");
}
function load(){
  try{
    const rows=JSON.parse(localStorage.getItem(KEY)||"[]");
    return Array.isArray(rows)?rows.filter(x=>x&&typeof x.url==="string"&&typeof x.id==="string"&&safeUrl(x.url)).slice(0,MAX):[];
  }catch(e){return []}
}
function save(rows){
  localStorage.setItem(KEY,JSON.stringify(rows.slice(0,MAX)));
}
function createFromResult(res){
  const host=new URL(res.website).hostname;
  const id="personal-"+host.replace(/[^a-z0-9]/g,"-");
  return {id,name:res.name,category:"Sociedad",url:res.feedUrl,homepage:res.website,
    personal:true,place:"",images_allowed:false};
}
window.SinRuidoFuentesPersonales={KEY,MAX,looksLikeSite,safeUrl,candidates,articleList,read,discover,load,save,createFromResult};
})();

/* Sin Ruido: copia de seguridad portátil, exclusivamente local y sin cuenta.
 * El archivo JSON contiene preferencias e historial privado del lector.
 * No se transmite a GitHub, Cloudflare ni a otros servidores.
 */
(function(){
"use strict";
const VERSION=1,MAX_BYTES=2500000;
const KEYS={
 prefs:"sinruido-prefs-v1",
 opened:"sinruido-seen-v1",
 learning:"sinruido-learning-v1",
 reviewed:"sinruido-reviewed-v1",
 bookmarks:"sinruido-bookmarks-v1",
 feeds:"sinruido-fuentes-propias-v1"
};
const plain=o=>o!==null&&typeof o==="object"&&!Array.isArray(o);
const str=(s,max=250)=>typeof s==="string"?s.slice(0,max):"";
function array(a,max){return Array.isArray(a)?a.slice(-max):[]}
function boolMap(obj,max=350){
  const out=Object.create(null);
  if(!plain(obj))return out;
  for(const [key,val] of Object.entries(obj).slice(0,max)){
    if(typeof val==="boolean"&&key.length<=140&&key&&
      !["__proto__","constructor","prototype"].includes(key))out[key]=val;
  }
  return out;
}
function validUrl(s){
  if(typeof s!=="string"||s.length>2048||!/^https:\/\//i.test(s))return false;
  try{
    const u=new URL(s);
    return u.protocol==="https:"&&!!u.hostname&&!u.username&&!u.password&&
      u.hostname!=="localhost"&&!u.hostname.endsWith(".local");
  }catch(e){return false}
}
function normalizePrefs(p){
  if(!plain(p))throw Error("La copia no contiene una configuración válida.");
  return {
    topics:boolMap(p.topics,80),
    blocked:array(p.blocked,200).filter(x=>typeof x==="string").map(x=>x.slice(0,110)),
    hidden:array(p.hidden,1500).filter(x=>typeof x==="string").map(x=>x.slice(0,2048)),
    sources:boolMap(p.sources,350),
    proposals:[],
    positiveOnly:p.positiveOnly===true,
    interests:str(p.interests,750)
  };
}
function normalizeStory(a,reviewed){
  if(!plain(a)||!validUrl(a.link)||!str(a.title,260))return null;
  const item={
    title:str(a.title,260),link:a.link,source:str(a.source,120),
    source_id:str(a.source_id,140),category:str(a.category,90),
    date:str(a.date,64),place:str(a.place,120),
    access_status:["free","subscription","unknown"].includes(a.access_status)?a.access_status:"unknown",
    access_evidence:str(a.access_evidence,300)
  };
  if(reviewed){item.key=a.link;item.marked_at=Number.isFinite(a.marked_at)?a.marked_at:Date.now()}
  else item.saved_at=Number.isFinite(a.saved_at)?a.saved_at:Date.now();
  return item;
}
function normalizeData(d){
  if(!plain(d))throw Error("Esta copia no tiene el formato correcto.");
  const prefs=normalizePrefs(d.prefs);
  const opened=array(d.opened,800).filter(validUrl);
  const learning=array(d.learning,100).filter(x=>plain(x)&&typeof x.category==="string"&&Array.isArray(x.terms))
    .map(x=>({category:str(x.category,90),source_id:str(x.source_id,140),
      terms:array(x.terms,14).filter(y=>typeof y==="string").map(y=>y.slice(0,60)),
      at:Number.isFinite(x.at)?x.at:Date.now()}));
  const reviewed=array(d.reviewed,700).map(x=>normalizeStory(x,true)).filter(Boolean);
  const bookmarks=array(d.bookmarks,150).map(x=>normalizeStory(x,false)).filter(Boolean);
  const feeds=array(d.feeds,15).filter(x=>plain(x)&&validUrl(x.url)&&validUrl(x.homepage)&&typeof x.id==="string")
    .map(x=>({id:str(x.id,140),name:str(x.name,100),category:str(x.category,80)||"Sociedad",
      url:x.url,homepage:x.homepage,personal:true,place:str(x.place,120),images_allowed:false}));
  return {prefs,opened,learning,reviewed,bookmarks,feeds};
}
function readStored(storage,key,fallback){
  try{const raw=storage.getItem(key);return raw===null?fallback:JSON.parse(raw)}
  catch(e){return fallback}
}
function create(storage=localStorage){
  const data=normalizeData({
    prefs:readStored(storage,KEYS.prefs,{}),
    opened:readStored(storage,KEYS.opened,[]),
    learning:readStored(storage,KEYS.learning,[]),
    reviewed:readStored(storage,KEYS.reviewed,[]),
    bookmarks:readStored(storage,KEYS.bookmarks,[]),
    feeds:readStored(storage,KEYS.feeds,[])
  });
  return {app:"Sin Ruido",format:"sinruido-copia",version:VERSION,
    exported_at:new Date().toISOString(),data};
}
function parse(raw){
  if(typeof raw!=="string"||raw.length>MAX_BYTES)throw Error("El archivo es demasiado grande o no se puede leer.");
  let backup;
  try{backup=JSON.parse(raw)}catch(e){throw Error("El archivo no es un JSON válido.")}
  if(!plain(backup)||backup.format!=="sinruido-copia"||backup.app!=="Sin Ruido"||
    backup.version!==VERSION)throw Error("Este archivo no es una copia de Sin Ruido compatible.");
  return normalizeData(backup.data);
}
function count(data){
  return {sources:Object.keys(data.prefs.sources).length,privateFeeds:data.feeds.length,
    bookmarks:data.bookmarks.length,reviewed:data.reviewed.length,opened:data.opened.length};
}
function restore(data,storage=localStorage){
  const clean=normalizeData(data),previous=Object.create(null);
  for(const key of Object.values(KEYS))previous[key]=storage.getItem(key);
  try{
    for(const [name,key] of Object.entries(KEYS))storage.setItem(key,JSON.stringify(clean[name]));
  }catch(e){
    // Rollback parcial: no dejamos preferencias y listas de noticias mezcladas.
    for(const key of Object.values(KEYS)){
      try{if(previous[key]===null)storage.removeItem(key);else storage.setItem(key,previous[key])}catch(ignored){}
    }
    throw Error("No hay suficiente espacio para restaurar tu copia en este navegador.");
  }
  return count(clean);
}
window.SinRuidoCopia={KEYS,VERSION,MAX_BYTES,create,parse,restore,count};
})();
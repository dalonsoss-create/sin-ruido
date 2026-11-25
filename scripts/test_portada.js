#!/usr/bin/env node
/* Pruebas de regresión: las preferencias de cada lector son obligatorias
   y la portada contiene exclusivamente noticias de HOY, recientes primero. */
"use strict";
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const html=fs.readFileSync("docs/index.html","utf8");
const political=fs.readFileSync("docs/politica.js","utf8");
const interests=fs.readFileSync("docs/intereses.js","utf8");
const ctx={window:{},Date,Intl,Set,Map,Math,Number,String,Array,JSON};
vm.createContext(ctx);
vm.runInContext(political,ctx);
vm.runInContext(interests,ctx);
function extract(start,end){
  const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
  assert(a>=0&&b>a,"No se encuentra función de filtro: "+start);
  return html.slice(a,b);
}
const code=extract("function matchesReader(a){","function titleAnchor(a){");
vm.runInContext(code,ctx);
const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const localDay=raw=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Madrid",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(raw));
const NOW="2026-11-24T12:00:00Z";
const a=(title,category,source_id,date="2026-11-24T11:30:00Z")=>({title,category,source_id,source:source_id,link:"https://example.com/"+encodeURIComponent(title),date});
ctx.prefs={topics:{"Política nacional":false,"Sociedad":true,"Ciencia":true,"Salud":true,"Economía":true},sources:{"medio-a":true,"medio-b":true},hidden:[],blocked:[],positiveOnly:false,interests:""};
ctx.activeTopic="Todas";
ctx.el=()=>({value:""});
ctx.getInterestClauses=()=>ctx.window.SinRuidoIntereses.parse(ctx.prefs.interests);
ctx.normal=normalize;
ctx.storyId=x=>x.link;
ctx.allowedSource=x=>ctx.prefs.sources[x.source_id]!==false;
ctx.mood=()=> "neutral";
ctx.isReviewed=()=>false;
ctx.isToday=x=>localDay(x.date)===localDay(NOW);
const politics=a("El PSOE y el PP debaten sobre el Congreso","Política nacional","medio-a");
const disguised=a("Rufián reprocha al PP un acuerdo de vivienda","Sociedad","medio-a");
const science=a("Descubren un nuevo tratamiento científico contra el cáncer","Ciencia","medio-a");
const health=a("Los médicos logran un avance en salud","Salud","medio-b");
const old=a("Una noticia de ayer sobre un avance científico","Ciencia","medio-b","2026-11-23T16:00:00Z");
ctx.articles=[old,politics,science,disguised,health];
assert.equal(ctx.matchesReader(politics),false,"La categoría desmarcada se cuela");
assert.equal(ctx.matchesReader(disguised),false,"Política española mal etiquetada se cuela");
assert.equal(ctx.matchesReader(science),true,"Las noticias de otros temas deben pasar");
assert.equal(ctx.eligibleToday().length,2,"No deben verse noticias de ayer ni de política vetada");
ctx.prefs.topics["Política nacional"]=true;
assert.equal(ctx.matchesReader(politics),true,"Un lector que acepta política debe verla");
assert.equal(ctx.matchesReader(disguised),true,"Un lector que acepta política debe verla");
ctx.prefs.topics["Política nacional"]=false;
ctx.prefs.topics.Ciencia=false;
assert.equal(ctx.matchesReader(science),false,"Ciencia desactivada tiene que ocultarse");
ctx.prefs.interests="solo ciencia";
assert.equal(ctx.matchesReader(science),false,"Intereses escritos no pueden anular tema desactivado");
ctx.prefs.interests="";
ctx.prefs.topics.Ciencia=true;
ctx.prefs.sources["medio-a"]=false;
assert.equal(ctx.matchesReader(science),false,"Periódico desactivado debe quedar fuera");
ctx.prefs.sources["medio-a"]=true;
ctx.prefs.blocked=["tratamiento"];
assert.equal(ctx.matchesReader(science),false,"Veto textual debe tener prioridad");
ctx.prefs.blocked=[];
ctx.prefs.positiveOnly=true;
assert.equal(ctx.matchesReader(science),false,"Solo positivas debe ser vinculante");
ctx.prefs.positiveOnly=false;
const moreRecent=a("Una noticia científica reciente","Ciencia","medio-a","2026-11-24T11:55:00Z");
ctx.articles=[old,science,moreRecent,health];
const sorted=ctx.eligibleToday();
assert.equal(sorted.length,3,"La fecha de ayer nunca debe aparecer");
assert.equal(sorted[0].title,moreRecent.title,"La noticia más reciente debe ir primero");
assert.equal(sorted[1].title,science.title,"Las demás deben conservar el orden de publicación");
assert(!html.includes('id="mustread-panel"'),"No debe quedar un bloque de noticias de ayer");
assert(!html.includes('id="sort"'),"No debe quedar un selector que contradiga el orden cronológico");
// El diseño original no debe cambiar al actualizar criterios de actualidad.
assert(!html.includes('id="latest-panel"'),"Prohibido añadir un segundo bloque de tarjetas gigantes");
assert(html.includes('id="last-minute-panel"'),"Conservar la franja compacta de Última hora original");
assert(html.includes('id="last-minute-link"'),"La franja original no se convierte en tarjeta gigante");
assert(!html.includes('id="last-minute-body"'),"No usar el contenedor gigante que sustituyó al diseño original");
assert(html.includes('cover.append(makeCard(list[0],true))'),"Conservar tarjeta principal original");
assert(html.includes('for(const a of list.slice(1,visible))bottom.append(makeCard(a))'),"Conservar tarjetas compactas originales");
assert(html.includes('const list=eligibleForView().filter('),"Los temas deben consultar toda la edición disponible");
assert(html.includes('if(activeTopic==="Todas")return eligibleToday();'),"La portada general debe mantener exclusivamente noticias de hoy");
assert(html.includes('const PAGE_SIZE=20')||html.includes('const PAGE_SIZE=20,'),"Mantener páginas de 20 titulares");
assert(html.includes('shownCount+=PAGE_SIZE'),"El botón debe cargar 20 titulares adicionales");
assert(html.includes('activeTopic+" · Todas las disponibles'),"Indicar que el tema permite consultar noticias anteriores");
assert(html.includes('function makeCard(a,lead=false)'),"No modificar componente original de tarjetas");
assert(html.includes('const illustration=visual(a,lead)'),"Conservar ilustraciones de tarjetas");
const css=fs.readFileSync("docs/portada.css","utf8");
assert(css.includes('.news-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))'),"Conservar cuadrícula de tres columnas en escritorio");
assert(css.includes('.story.hero{display:grid;'),"Conservar tarjeta destacada original");
// La propia app debe actualizar su código, no solamente el JSON de titulares.
assert(html.includes('const runningAppHash=appHash(APP_SOURCE)'),"Falta huella del código cargado");
assert(html.includes('checkAppVersion(data);'),"Al recibir noticias debe comprobar también versión de la app");
assert(html.includes('function appIsBeingEdited()'),"No interrumpir personalización en curso");
assert(html.includes('url.searchParams.set("app_version",version)'),"Recargar HTML sin conservar caché antiguo");
assert(html.includes('setInterval(applyPendingAppUpdate,20000)'),"Reintentar cambio de versión pendiente");

assert(html.includes('async function checkLiveAppVersion(force=false)'),"Comprobar versión real de GitHub Pages en el móvil");
assert(html.includes('await checkLiveAppVersion(true)'),"El botón Actualizar debe comprobar también el software");
assert(html.includes('checkAppVersion(data);\n    if(Date.parse(data.updated)>lastEdition)'),"Verificar software aun sin titulares nuevos");
assert(html.includes('if(!data)throw new Error("No se pudo consultar la edición")'),"No reemplazar noticias si fallan ambas fuentes");
assert(html.includes('["https://raw.githubusercontent.com/dalonsoss-create/sin-ruido/main/docs/noticias.json"+query,')||
       html.includes('"https://raw.githubusercontent.com/dalonsoss-create/sin-ruido/main/docs/noticias.json"+query'),
       "Conservar el origen de noticias más actualizado");
assert(html.includes('"./noticias.json"+query'),"Tener alternativa local si GitHub Raw falla");
assert(html.includes('if(!document.hidden){refreshPublishedEdition();checkLiveAppVersion()}'),"Al regresar desde el móvil revisar código y titulares");
assert(html.includes('if(event.persisted){refreshPublishedEdition();checkLiveAppVersion()}'),"Volver desde caché bfcache debe revisar la aplicación");
assert(html.includes('appIsBeingEdited()'),"No interrumpir personalización durante actualización");
console.log("OK: filtros de usuario, fuentes, vetos, noticias de hoy y orden cronológico verificados.");

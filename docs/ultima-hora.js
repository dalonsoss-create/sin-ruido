/* Sin Ruido · franja de últimas noticias. Sin API externa ni inventar titulares.
 * La noticia debe estar en los RSS recogidos y pasar los filtros del lector.
 * "Última hora" solo ante señales editoriales reforzadas; en el resto, "Reciente".
 */
(function(){
"use strict";
const MINUTE=60000,MAX_AGE_MIN=180,RECENT_MIN=90;
function normal(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
const IMPACT=/\b(?:historico|historica|record|primera vez|nuevo tratamiento|descubrimiento|dimite|dimision|fallece|muere|anuncia|aprueba|aplica|archiva|archivan|cierra|extingue|amnistia|ratifica|revoca|deroga|acuerdo|suspende|decreta|prohibe|libera|rescata|condena|sentencia|crisis|emergencia|terremoto|se dispara|disparan|desploma|desploman|sube|cae|rebota|sorpresa|victoria|gana|campeon|rompe|logra)\b/;
const CONSEQUENCE=/\b(?:gobierno|presidente|congreso|union europea|europa|onu|oms|mercados|bolsa|acciones|banca|bancos|economia|empresas|energia|nvidia|apple|google|microsoft|inteligencia artificial|medicina|vacuna|cancer|ciencia|clima|elecciones|tribunal supremo|supremo|amnistia|proces|constitucional)\b/;
function details(a,now){
  if(!a||typeof a.title!=="string"||typeof a.link!=="string"||!/^https:\/\//i.test(a.link))return null;
  const stamp=Date.parse(a.date),age=(now-stamp)/MINUTE;
  if(!Number.isFinite(age)||age< -5||age>MAX_AGE_MIN)return null;
  const title=normal(a.title);
  if(title.length<17)return null;
  const covers=Array.isArray(a.editorial_portadas)?new Set(a.editorial_portadas).size:0;
  const cross=Math.min(3,Math.max(0,Number(a.editorial_coincidencias)||0));
  const action=IMPACT.test(title),impact=CONSEQUENCE.test(title);
  const measured=/\b\d+(?:[.,]\d+)?\s*(?:%|por ciento|millones|miles de millones)\b/.test(title);
  // La presencia en el RSS de portada NO es prueba de que estuviera
  // en lo alto de la portada real. Exigimos otra señal para "Última hora".
  // Dos cabeceras que repiten un titular trivial NO bastan para declararlo urgente.
  // Se exige un hecho relevante y al menos una señal editorial independiente.
  const breaking=action&&(
    (impact&&(covers>=2||cross>=2))||
    (covers>=1&&cross>=1)||
    (covers>=1&&impact&&measured)
  );
  const freshness=1-Math.max(0,age)/MAX_AGE_MIN;
  const score=covers*12+cross*11+(action?8:0)+(impact?5:0)+(measured?3:0)+freshness*12;
  return {article:a,ageMin:Math.max(0,age),score,breaking};
}
function choose(articles,now=Date.now()){
  if(!Array.isArray(articles))return null;
  const eligible=articles.map(a=>details(a,now)).filter(Boolean);
  const urgent=eligible.filter(x=>x.breaking);
  const pool=urgent.length?urgent:eligible.filter(x=>x.ageMin<=RECENT_MIN);
  if(!pool.length)return null;
  pool.sort((a,b)=>b.score-a.score || a.ageMin-b.ageMin);
  const top=pool[0];
  return {...top,kind:urgent.length?"breaking":"recent"};
}
window.SinRuidoUltimaHora={choose,details,MAX_AGE_MIN,RECENT_MIN};
})();
/* Sin Ruido: candado conservador de artículos de suscripción.
   Sin candado NO significa gratis: puede que no tengamos información.
   Las marcas añadidas manualmente se guardan solo en este navegador. */
(function(){
  "use strict";
  const KEY="sinruido-paywall-v1";
  const URL_SECTION=/(?:^|\/)(?:premium|de-pago|contenido-de-pago|contenido-premium|solo-suscriptores|solo-para-suscriptores|para-suscriptores|suscriptores|subscribers-only|members-only|paywall)(?:\/|$)/i;
  function explicitUrl(link){
    const match=String(link||"").match(/^https:\/\/[^/]+(\/[^?#]*)?/i);
    return !!match&&URL_SECTION.test(match[1]||"/");
  }
  function load(){
    try{
      const obj=JSON.parse(localStorage.getItem(KEY)||"{}");
      return obj&&typeof obj==="object"&&!Array.isArray(obj)?obj:{};
    }catch(e){return {}}
  }
  let userMarked=load();
  function auto(a){
    return !!a&&(a.access_status==="subscription"||explicitUrl(a.link));
  }
  function user(a){return !!a&&userMarked[a.link]===true}
  function locked(a){return auto(a)||user(a)}
  function evidence(a){return auto(a)?"medio":user(a)?"tu marca":""}
  function toggle(a){
    if(!a||!/^https:\/\//.test(a.link||"")||auto(a))return false;
    if(user(a))delete userMarked[a.link];
    else userMarked[a.link]=true;
    const entries=Object.entries(userMarked);
    if(entries.length>600)userMarked=Object.fromEntries(entries.slice(-600));
    try{localStorage.setItem(KEY,JSON.stringify(userMarked))}catch(e){return false}
    return true;
  }
  window.SinRuidoAcceso={auto,locked,user,evidence,toggle};
})();
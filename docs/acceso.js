/* Sin Ruido: informa solo cuando el acceso está expresamente declarado.
   Sin distintivo NO implica acceso gratis. Las antiguas marcas locales
   "Marcar 🔒" dejan de intervenir: no confirmaban el estado real. */
(function(){
  "use strict";
  const URL_SECTION=/(?:^|\/)(?:premium|de-pago|contenido-de-pago|contenido-premium|solo-suscriptores|solo-para-suscriptores|para-suscriptores|suscriptores|subscribers-only|members-only|paywall)(?:\/|$)/i;
  function explicitUrl(link){
    const match=String(link||"").match(/^https:\/\/[^/]+(\/[^?#]*)?/i);
    return !!match&&URL_SECTION.test(match[1]||"/");
  }
  function status(article){
    if(!article||typeof article!=="object")return "unknown";
    if(article.access_status==="subscription"||explicitUrl(article.link))return "subscription";
    if(article.access_status==="free")return "free";
    return "unknown";
  }
  // Alias por compatibilidad con código antiguo.
  function locked(a){return status(a)==="subscription"}
  window.SinRuidoAcceso={status,locked,auto:locked};
})();
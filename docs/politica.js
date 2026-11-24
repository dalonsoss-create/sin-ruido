/* Exclusión editorial de política española: respaldo independiente de
   la categoría declarada en el RSS. No interpreta "Sánchez Vicario"
   ni "Nadal" por sí solos como noticias políticas. */
(function(){
"use strict";
const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const PARTIES=/\b(?:psoe|pp|partido popular|vox|podemos|sumar|junts|erc|esquerra republicana|bildu|pnv|ciudadanos|coalicion canaria|bloque nacionalista galego|bng)\b/;
const POLITICIANS=/\b(?:pedro sanchez|feijoo|abascal|puigdemont|rufian|ayuso|miriam nogueras|ester munoz|gabriel rufian|salvador illa|alberto nunez feijoo|juanma moreno|patxi lopez|ortega smith|irene montero|yolanda diaz|felix bolanos|oscar puente|urtasun|albiol)\b/;
const INSTITUTIONS=/\b(?:moncloa|congreso de los diputados|senado espanol|parlament de cataluna|parlamento de cataluna|asamblea de madrid|gobierno de espana|gobierno espanol|presidente del gobierno|consejo de ministros|elecciones generales|debate electoral|investidura|mocion de censura|politica nacional|politica espanola|parlamento espanol)\b/;
const POLITICAL_ACTION=/\b(?:diputad[oa]s?|senador(?:es|as)?|portavoz|presidente|presidenta|ministro|ministr[ao]s?|consejer[oa]s?|alcald[ea]|gobierno|elecciones?|electoral|votacion|partidos?|coalicion|parlament|congreso|politic[ao]s?|oposicion|legislatura|amnistia|pacto de estado|rifi?rrafe|candidat[oa]|proyecto de ley|decreto)\b/;
function isSpanishPolitical(article){
  const title=normalize(article?.title);
  if(!title)return false;
  if(PARTIES.test(title)||POLITICIANS.test(title)||INSTITUTIONS.test(title))return true;
  const link=normalize(article?.link||"");
  // La sección política del medio es una pista adicional si el titular
  // realmente trata de decisiones o actores políticos españoles.
  if(POLITICAL_ACTION.test(title)&&
    /(?:\/(?:espana|politica-nacional|politica-espanola|politica|elecciones-generales)\/)/.test(link)&&
    /\b(?:espana|espanol|espanola|madrid|cataluna|generalitat|gobierno|parlament|congreso|senado|diputado|ministro|partido|eleccion|politic)\b/.test(title))
    return true;
  return false;
}
window.SinRuidoPolitica={isSpanishPolitical};
})();
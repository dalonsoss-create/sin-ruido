/* Sin Ruido: intérprete gratuito y local de intereses escritos en español.
   No envía texto a servicios externos. Funciona por categorías, lugares y expresiones. */
(function(){
  "use strict";
  const normalize=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const groups=[
    ["Política nacional",/\b(?:politic[ao]s?|gobierno|parlament|congreso|partidos? politicos?|elecciones?|diputados?|alcald[ei]s?|ministros?)\b/],
    ["Conflictos",/\b(?:conflictos?|guerras?|combates?|invasion|bombardeos?|misiles?|atentados? militares?|guerra de ucrania|oriente proximo)\b/],
    ["Sucesos",/\b(?:sucesos?|accidentes?|crimenes?|asesinatos?|robos?|policia|detencion(?:es)?|tribunales|homicidios?|incendios?|desapariciones?)\b/],
    ["Economía",/\b(?:economia|inflacion|precios?|bolsa|mercados?|finanzas?|tipos de interes|euribor|pensiones?|hipotecas?)\b/],
    ["Empresas",/\b(?:empresas?|negocios?|emprendedores?|startups?|empresariales?|multinacionales?)\b/],
    ["IA",/\b(?:inteligencia artificial|chatgpt|openai|modelos? de lenguaje|ia generativa|machine learning)\b/],
    ["Ciencia",/\b(?:ciencias?|cientific[ao]s?|descubrimientos? cientificos?|investigacion cientifica|astronomia|espacio exterior|fisica cuantica)\b/],
    ["Tecnología",/\b(?:tecnologias?|informatica|moviles?|gadgets?|software|hardware|ordenadores?|internet)\b/],
    ["Salud",/\b(?:salud|sanidad|medicina|enfermedades?|vacunas?|tratamientos?|cancer|bienestar)\b/],
    ["Medio ambiente",/\b(?:medio ambiente|cambio climatico|clima|calentamiento global|ecologia|contaminacion|renovables?)\b/],
    ["Naturaleza",/\b(?:naturaleza|animales?|fauna|flora|bosques?|montanas?|ecosistemas?|osos?|lobos?)\b/],
    ["Cultura",/\b(?:cultura|cine|peliculas?|teatro|literatura|libros?|musica|arte|exposiciones?)\b/],
    ["Historia",/\b(?:historia|arqueologia|historicos?|antiguedad|imperio romano|edad media)\b/],
    ["Educación",/\b(?:educacion|escuelas?|colegios?|universidades?|profesores?|estudiantes?)\b/],
    ["Viajes",/\b(?:viajes?|turismo|hoteles?|escapadas?|aerolineas?|destinos?|vacaciones?)\b/],
    ["Gastronomía",/\b(?:gastronomia|restaurantes?|recetas?|cocina|chefs?|comida)\b/],
    ["Tenis",/\b(?:tenis|tenistas?|atp|wta|alcaraz|sinner|djokovic|nadal)\b/],
    ["Fútbol",/\b(?:futbol|laliga|champions|liga de campeones|real madrid|fc barcelona|atletico de madrid)\b/],
    ["Motor",/\b(?:motogp|formula 1|f1|carreras? de coches?|motociclismo|automovilismo|coches de carreras)\b/],
    ["Deportes",/\b(?:deportes?|olimpiadas?|baloncesto|nba|ciclismo|atletismo|golf|padel|esqui)\b/],
    ["Internacional",/\b(?:internacional|politica mundial|politica exterior|relaciones internacionales|noticias del mundo|geopolitica)\b/],
    ["Sociedad",/\b(?:sociedad|vida cotidiana|sociales|comunidad)\b/]
  ];
  const places=[
    ["Cataluña",/\b(?:catalun[ay]|catalan[ao]s?|barcelona|generalitat|junts|esquerra republicana|erc|salvador illa|tarragona|girona|lerida|lleida)\b/],
    ["Madrid",/\b(?:madrid|madrilen[ao]s?|comunidad de madrid|asamblea de madrid|getafe|alcobendas|pozuelo|mostoles|alcorcon|fuenlabrada|alcal[aá] de henares)\b/],
    ["Andalucía",/\b(?:andaluci[ao]|andaluz[ae]s?|sevilla|malaga|granada|cadiz|cordoba|jaen|almeria|huelva)\b/],
    ["Valencia",/\b(?:valencia|valencian[ao]s?|comunitat valenciana|alicante|castellon)\b/],
    ["Galicia",/\b(?:galicia|galleg[ao]s?|vigo|coruna|santiago de compostela|ourense|pontevedra)\b/],
    ["País Vasco",/\b(?:pais vasco|vasc[ao]s?|euskadi|bilbao|donostia|san sebastian|vitoria|gasteiz)\b/],
    ["Ucrania",/\b(?:ucrania|ucranian[ao]s?|kyiv|kiev|zelenski)\b/],
    ["Gaza",/\b(?:gaza|franja de gaza|palestin[ao]s?|israel|israeli)\b/],
    ["Estados Unidos",/\b(?:estados unidos|eeuu|norteameric[ao]n[ao]s?|washington|casa blanca)\b/]
  ];
  const exceptions={
    "Cataluña":/\b(?:fc barcelona|barca|liga espanola)\b/,
    "Madrid":/\b(?:real madrid|atletico de madrid|real madrid cf)\b/
  };
  const filler=new Set(["solo","solamente","exclusivamente","unicamente","quiero","queremos","ver","leer","recibir","busco","buscar","noticia","noticias","titulares","informacion","actualidad","sobre","acerca","del","de","el","la","las","los","un","una","unos","unas","para","por","en","que","me","interesa","interesan","interes","interesado","interesada","actuales","recientes","todas","todos","hoy","ayer","ultimas","ultimos","reciente","ciudad","localidad","provincia","region","comunidad","espanola","espanol","sin","evita","evitar","excluye","quitar","quita","descarta","mostrar","no","nada","mas","pero","ademas","dame","ponme","filtra","y","o","favor","sean","sea","relacionadas","relacionado","relacionada","politica","politicos","politicas","nacional","local","regional"]);
  function parseLine(raw){
    const line=String(raw||"").trim().slice(0,260);
    if(!line)return null;
    const t=normalize(line);
    const exclude=/(?:^|\s)(?:no quiero|no me interesan|no deseo|sin noticias de|sin noticias sobre|sin informacion sobre|evita|evitar|excluye|quita|quitar|descarta|bloquea|no mostrar|no me muestres)(?:\s|$)/.test(t);
    const only=!exclude&&(/(?:^|\s)(?:solo|solamente|unicamente|exclusivamente)(?:\s|$)/.test(t)||/\bno quiero ver nada mas\b/.test(t));
    let foundCats=groups.filter(([,rx])=>rx.test(t)).map(([name])=>name);
    // 'Política catalana' es política nacional/regional; no una sección de deportes.
    if(/\bpolitic[ao]s?\b/.test(t)&&!foundCats.includes("Política nacional")&&!foundCats.includes("Internacional"))foundCats.unshift("Política nacional");
    const foundPlaces=places.filter(([name,rx])=>rx.test(t)&&!(exceptions[name]&&exceptions[name].test(t))).map(([name])=>name);
    // Algunos nombres regionales pueden estar dentro de la pregunta, no de la noticia.
    let residual=t;
    for(const [,rx] of [...groups,...places])residual=residual.replace(new RegExp(rx.source,"g")," ");
    const terms=[...new Set((residual.match(/[a-z0-9]{3,}/g)||[]).filter(w=>!filler.has(w)))].slice(0,9);
    // Un club, una persona o una marca concretos deben coincidir, no basta con la categoría.
    for(const entity of ["real madrid","fc barcelona","atletico de madrid","pedro sanchez","salvador illa","marc marquez"]){
      if(t.includes(entity)&&!terms.includes(entity))terms.unshift(entity);
    }
    return {raw:line,only,exclude,categories:foundCats,places:foundPlaces,terms,recognized:!!(foundCats.length||foundPlaces.length||terms.length)};
  }
  function parse(raw){
    return String(raw||"").replace(/,\s*(?:pero\s+)?sin\s+/gi,"\nsin ").split(/[\n;]+/).map(parseLine).filter(Boolean).slice(0,8);
  }
  function matchClause(a,clause){
    const cat=String(a.category||"");
    const title=normalize(a.title);
    const link=normalize(a.link);
    const searchable=title+" "+link+" "+normalize(a.place||"");
    if(clause.categories.length&&!clause.categories.includes(cat))return false;
    if(clause.places.length){
      const inArea=clause.places.some(name=>{
        const x=places.find(p=>p[0]===name);
        return x&&x[1].test(searchable);
      });
      if(!inArea)return false;
    }
    if(clause.terms.length){
      // Las expresiones desconocidas se buscan en título y enlace.
      // Exigimos al menos una palabra rara, o dos cuando la petición es más larga.
      const hits=clause.terms.filter(term=>searchable.includes(term)).length;
      if(hits<Math.min(2,clause.terms.length))return false;
    }
    return clause.recognized;
  }
  function matches(a,clauses){
    if(clauses.some(c=>c.exclude&&matchClause(a,c)))return false;
    const strict=clauses.filter(c=>c.only);
    if(!strict.length)return true;
    return strict.some(c=>matchClause(a,c));
  }
  function boost(a,clauses){
    const soft=clauses.filter(c=>!c.only&&!c.exclude);
    if(!soft.length)return 0;
    return soft.some(c=>matchClause(a,c))?20:0;
  }
  function describe(clauses){
    if(!clauses.length)return "Sin intereses escritos. Se utilizan los temas seleccionados.";
    return clauses.map(c=>{
      const parts=[...c.categories,...c.places];
      if(c.terms.length)parts.push('palabras: '+c.terms.join(", "));
      return (c.exclude?"Excluir: ":c.only?"Solo: ":"Priorizar: ")+(parts.join(" · ")||"Sin coincidencias claras");
    }).join(" | ");
  }
  window.SinRuidoIntereses={parse,matches,boost,describe,matchClause};
})();
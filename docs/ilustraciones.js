// Láminas originales. La misma noticia conserva su composición al volver a la portada.
function ilustracionEditorial(article) {
  const title = article.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const hash = Array.from(title).reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 7);
  const path = (d, fill, stroke = "none", width = 3) =>
    '<path d="' + d + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + width + '" stroke-linejoin="round" stroke-linecap="round"/>';
  const circle = (x, y, r, fill) => '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'"/>';
  const rect = (x,y,w,h,r,fill) => '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+r+'" fill="'+fill+'"/>';
  const ink="#233d49", milk="#fff4da", gold="#ffb137", coral="#eb7456", leaf="#467e67", blue="#649bc0";
  const line = d => path(d,"none",ink,4);
  const motifs = {
    chip: rect(-49,-41,98,82,15,ink)+rect(-36,-28,72,56,8,blue)+[-28,-10,10,28].map(x=>line('M'+x+' -44v-11 M'+x+' 44v11')).join('')+line("M-50 -20h-14 M-50 0h-14 M-50 20h-14 M50 -20h14 M50 0h14 M50 20h14")+path("M-23 17l13-32 13 32 M-18 5h15 M18 -15v32","none",milk,5),
    phone:rect(-28,-52,56,104,10,ink)+rect(-23,-42,46,77,5,blue)+rect(-15,-24,31,16,7,milk)+rect(-6,1,24,13,6,gold)+circle(0,43,3,milk),
    flask:path("M-16-46h32v9h-5v24l34 48q6 11-8 11h-74q-14 0-8-11l34-48v-24h-5z",milk,ink)+path("M-24 10q12-7 25 0t22 0l18 27h-83z",coral)+circle(0,24,5,milk)+circle(12,-4,4,blue)+circle(-7,-20,3,blue),
    planet:circle(0,0,38,coral)+path("M-31-21q32 21 66 19 M-34 5q26 14 54 18","none",gold,6)+path("M-36-1c-55 45 27 28 78-10q24-19-7-13","none",ink,7),
    heart:path("M0 45C-78-1-40-57-3-30L0-26C33-65 85-11 0 45Z",coral,ink)+path("M-36 2h19l8-15 12 31 9-20h22","none",milk,5),
    pill:'<g transform="rotate(32)">'+rect(-19,-47,38,94,19,milk)+path("M-19 0h38v26a19 19 0 01-38 0z",coral)+line("M-17 0h34")+'</g>',
    fish:path("M-38 0q32-55 79 0-39 50-79 0l-28 22v-46z",gold,ink)+path("M-4-24l12-13 11 17",coral)+circle(24,-3,4,ink)+path("M-14-15q9 15 0 29","none",coral,5),
    tree:path("M-12 42v-45h20v45z",ink)+circle(-18,-12,24,leaf)+circle(18,-13,26,leaf)+circle(0,-34,29,"#72a26d")+line("M0 35v-49 M0 4l-16-13 M0 13l16-19"),
    turbine:line("M0 42v-49")+path("M0-8l-5-44 10 8-2 33 40 17-12 4-30-16-31 31 3-13z",milk,ink,2)+circle(0,-8,5,gold),
    coins:[0,1,2,3].map(n=>rect(-35,24-n*13,70,15,7,gold)+path('M-30 '+(34-n*13)+'q30 10 60 0',"none","#bd792b",2)).join('')+circle(14,-25,22,gold)+circle(14,-25,16,"#e5932c")+path("M18-33q-18-5-14 10t15 3 M1-28h13 M1-23h11","none",milk,2),
    chart:rect(-40,15,20,25,3,blue)+rect(-12,-2,20,42,3,leaf)+rect(16,-23,20,63,3,leaf)+path("M-45 0q39-11 71-43l-13 1m13-1-1 13","none",coral,5),
    globe:circle(0,0,45,blue)+path("M-35-26l15-11 11 9-4 11-14 1-9 13-8-6z M-28 2l25 7 3 13-13 18-8-12z M7-36l20 4 14 23-12 7-9-8-10 4-13-9z M4 1l22 2 6 10-18 21-7-9z",leaf),
    ball:circle(0,0,43,milk)+path("M-14-9l14-10 16 10-6 18h-19z M-35-24l12-10 7 2-6 12z M36-21l6 15-8 4-7-12z M-33 21l13 4 2 12-12-6z M17 26l16-7-1 11-14 9z",ink)+line("M-14-9l-11-12 M15-8l15-8 M-8 10l-11 16 M9 10l10 16"),
    books:rect(-40,22,82,15,3,coral)+rect(-36,5,73,15,3,ink)+rect(-41,-11,75,15,3,gold)+path("M-24-16l16-35 14 7-16 34z",leaf),
    plane:path("M-52 9l37-13 23-44 10 1-9 37 32-8q19-1 14 7L11 7l-13 35-9 2 4-33-34 10z",milk,ink),
    boat:path("M-52 13h105L32 35h-62z",coral,ink)+path("M-8-45v52h-35z",milk,ink)+path("M0-35l31 40H0z",gold),
    building:path("M-50-14L0-43l50 29z",coral,ink)+rect(-45,30,90,10,2,ink)+[-33,-11,11,33].map(x=>rect(x-4,-11,8,40,1,milk)).join(''),
    lens:circle(-8,-8,30,ink)+circle(-8,-8,24,blue)+path("M14 15l27 29","none",ink,11)+path("M-23-12q0-13 13-14","none",milk,4),
    racket:circle(-6,-18,31,milk)+path("M-6-48v60 M-36-18h60 M-29-35q22 27 46 0 M-29-3q22-27 46 0","none",blue,3)+path("M11 6l40 53","none",ink,12)+path("M11 6l40 53","none",coral,5),
    car:path("M-48 15l12-26h67l14 26v21h-93z",coral,ink)+rect(-27,-5,44,17,4,blue)+circle(-27,36,11,ink)+circle(27,36,11,ink)+rect(-41,17,12,7,3,milk)+rect(29,17,12,7,3,milk),
    plate:circle(0,0,39,milk)+circle(0,0,30,"#f0b34d")+circle(0,0,24,milk)+path("M-55-45v90 M-63-45v25q8 12 16 0v-25 M55-45q-18 25-8 48h8v42","none",ink,6),
    briefcase:rect(-42,-26,84,68,9,gold)+path("M-19-29v-12h38v12 M-42 0q42 22 84 0 M-8 6h16","none",ink,6),
    shield:path("M0-52l45 18v40q-8 30-45 47-37-17-45-47v-40z",blue,ink)+path("M-22 0l16 18 30-38","none",milk,8),
    scroll:path("M-34-47h65v81q-16 20-33 8-16 12-32-4z",milk,ink)+path("M-23-21h43M-23-8h43M-23 5h31M-23 18h36","none",coral,4),
    trophy:path("M-28-35h56v18q0 30-25 36v12l17 4v6h-40v-6l17-4V19q-25-6-25-36z",gold,ink)+path("M-28-26h-16q0 29 22 27 M28-26h16q0 29-22 27","none",ink,4)
  };
  const themes = [
    [/\b(tenis|tenista|alcaraz|sinner|djokovic|wimbledon|roland garros|atp|wta)\b/,"racket"],
    [/\b(formula 1|f1|motogp|verstappen|marc marquez|motociclismo|circuito)\b/,"car"],
    [/\b(sucesos|policia|crimen|detenido|asesinato|robo|tribunal)\b/,"lens"],
    [/\b(guerra|conflicto armado|tropas|misil|bombardeo)\b/,"shield"],
    [/\b(gastronomia|restaurante|receta|cocina|chef)\b/,"plate"],
    [/\b(ia|chips?|algoritmos?|inteligencia artificial|computacion)\b/,"chip"],
    [/movil|whatsapp|iphone|android|telefon|redes sociales/,"phone"],
    [/vacuna|farmac|medicamento|terapia/,"pill"], [/salud|enfermedad|sanidad|cancer|hospital/,"heart"],
    [/peces|pez\b|marino|oceano|lubina|ballena/,"fish"], [/bosque|selva|arbol|forest|especie/,"tree"],
    [/eolic|renovable|turbina/,"turbine"], [/nave espacial|planeta|astronom|orbita|luna\b/,"planet"],
    [/precios|salar|inflat|inflacion|euros|pension|dinero/,"coins"], [/mercado|bolsa|inversi|financier/,"chart"],
    [/aerolinea|avion|aeropuerto/,"plane"], [/barco|naval|naufrag|buque/,"boat"],
    [/futbol|liga\b|bernabeu|balon|gol(es)?\b/,"ball"], [/medalla|mundial|campeon/,"trophy"],
    [/libros?|novela|literat|lectura/,"books"], [/gobierno|elecci|parlament|tribunal/,"building"],
    [/laboratorio|quimic|experimento/,"flask"]
  ];
  const groups = {
    "Política nacional":["building","scroll","#d8dee8"],"Internacional":["globe","building","#c9dfeb"],
    "Conflictos":["shield","globe","#d9dbdb"],"Sucesos":["lens","shield","#dbdfdf"],
    "Economía":["coins","chart","#f9dfac"],"Empresas":["briefcase","chart","#f2dfb6"],
    "Ciencia":["lens","flask","#c8dfe9"],"Tecnología":["chip","phone","#d8d7ed"],
    "IA":["chip","lens","#d9d0ed"],"Salud":["heart","pill","#f5d1c3"],
    "Naturaleza":["tree","fish","#c2ddcd"],"Medio ambiente":["turbine","tree","#c7e5c9"],
    "Sociedad":["globe","books","#e7dad3"],"Cultura":["books","scroll","#e7d4e2"],
    "Educación":["books","flask","#e2e1b9"],"Historia":["scroll","building","#eddac1"],
    "Viajes":["plane","boat","#c7e8df"],"Gastronomía":["plate","coins","#f9e1bc"],
    "Deportes":["trophy","ball","#dce4b9"],"Fútbol":["ball","trophy","#e1e9c7"],
    "Tenis":["racket","trophy","#e8e2bc"],"Motor":["car","trophy","#f6dbc1"]
  };
  const [first,second,paper]=groups[article.category] || groups.Ciencia;
  const matches=themes.filter(([rx])=>rx.test(title)).map(([,key])=>key);
  const hero=matches[0] || [first,second][hash%2];
  const accent=[...matches.slice(1),second,first].find(k=>k!==hero);
  const flip=(hash>>>4)%2;
  const put=(key,x,y,size,angle)=>'<g transform="translate('+x+' '+y+') rotate('+angle+') scale('+size+')">'+motifs[key]+'</g>';
  const dots=Array.from({length:65},(_,i)=>circle((i*73+hash%53)%402,(i*39+Math.floor(i/4)*7)%201,1,"#806d59")).join("");
  return '<svg aria-hidden="true" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">'+rect(0,0,400,200,0,paper)+
    circle(flip?95:304,53,73,"#fff4d9")+path("M-10 154q84-81 182-25t242-65v147H-10z","#fff7df")+
    path("M-5 183q106-62 202-26t209-20v72H-5z",paper)+
    '<g opacity=".23">'+dots+'</g>'+put(accent,flip?104:299,118,.82,flip?-9:9)+put(hero,flip?250:151,105,1.42,(hash%9)-4)+
    path(flip?"M307 48l7-11m1 20 13-5":"M83 54l-8-12m0 22-13-5","none","#d68c23",4)+'</svg>';
}

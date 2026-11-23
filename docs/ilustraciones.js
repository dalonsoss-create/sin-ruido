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

    /* Nuevos objetos dibujados por nosotros: todos vectoriales y sin imágenes externas. */
    dna:path("M-32-51C42-30-42 24 30 51 M31-51C-39-30 43 24-31 51","none",ink,7)+[-35,-15,7,28,45].map((y,i)=>path("M"+(i%2?-18:-11)+" "+y+"H"+(i%2?18:11),"none",i%2?coral:blue,7)).join(""),
    microscope:path("M-4-48l20 15-12 20-19-14z",blue,ink)+path("M6-15l-17 29 M-25-26l16 12 M-13 16q41 5 30-33","none",ink,9)+circle(13,8,8,gold)+rect(-37,28,76,11,5,ink)+rect(-8,12,38,9,3,coral),
    rocket:path("M0-50Q31-27 18 22L0 38-19 21Q-28-20 0-50Z",milk,ink)+circle(0,-12,10,blue)+path("M-18 15l-21 20 23-4 M18 15l21 20-23-4 M-10 38l10 20 10-20",coral,ink),
    satellite:rect(-18,-20,36,40,6,gold)+rect(-59,-25,35,50,3,blue)+rect(24,-25,35,50,3,blue)+line("M-24 0h-10 M24 0h10 M-52-10h21 M-52 10h21 M31-10h21 M31 10h21")+circle(0,-1,8,milk),
    house:path("M-52-4L0-47 52-4H41v43h-82V-4z",milk,ink)+rect(-12,11,24,28,3,coral)+rect(-33,2,15,15,2,blue)+rect(20,2,15,15,2,blue),
    scales:path("M0-46v81 M-35 35h70 M-32-20h64 M0-26l-29 9 29 9 30-9-30-9","none",ink,6)+path("M-35-20l-17 40h34z M35-20L17 20h35z",gold,ink),
    ballot:rect(-46,-7,92,57,7,blue)+rect(-21,-44,42,48,3,milk)+path("M-10-22l10 9 16-21","none",leaf,7)+path("M-29 9h58","none",ink,7),
    handshake:path("M-55-13l27-20 24 25 22-13 36 21-22 29-29-16-16 20-31-19z",gold,ink)+path("M-17 0l31 24 M-27 11l19 18 M13-3l23 16","none",milk,5),
    school:path("M-48-25l48-26 48 26v67h-96z",milk,ink)+rect(-15,1,30,41,2,blue)+[-34,27].map(x=>rect(x,-8,12,18,2,coral)).join("")+path("M-51-25h102 M-53 42h106","none",ink,6),
    hospital:rect(-43,-40,86,83,7,milk)+rect(-12,-47,24,19,4,coral)+path("M0-44v15 M-9-37h18","none",milk,5)+[-28,14].map(x=>rect(x,-16,14,16,2,blue)).join("")+rect(-13,13,26,30,3,leaf),
    film:rect(-45,-12,90,53,7,ink)+rect(-35,-3,70,34,3,blue)+path("M-45-35h90v20h-90z",milk,ink)+[-31,-1,27].map(x=>path("M"+x+"-34l12 17","none",coral,7)).join(""),
    guitar:path("M-17-3q-32 5-22 32t35 9Q11 23 0 10L36-27 24-41z",gold,ink)+circle(-17,20,8,milk)+path("M0 13l37-38 M8 15l35-35","none",ink,3),
    train:rect(-45,-38,90,75,12,blue)+rect(-32,-25,64,36,5,milk)+rect(-29,19,58,6,2,ink)+circle(-26,37,10,ink)+circle(26,37,10,ink)+path("M-52 50h104","none",ink,6),
    mountain:path("M-67 44l43-72L1 6 22-47 69 44z",leaf,ink)+path("M-24-28l12 21 9-12 M22-47l13 20-11-3","none",milk,8)+circle(49,-37,12,gold),
    camera:rect(-46,-28,92,66,9,ink)+rect(-27,-39,35,13,4,coral)+circle(6,5,25,blue)+circle(6,5,16,milk)+rect(29,-19,9,6,2,gold),
    paw:[[-28,-32,11],[-2,-42,11],[25,-30,11],[42,-6,9]].map(([x,y,r])=>circle(x,y,r,gold)).join("")+path("M-30 21Q-30-1-10-3Q4-21 19-4Q45 5 33 30Q17 45 2 36Q-13 48-30 21Z",gold,ink),
    hotel:rect(-47,-43,94,88,7,milk)+[-28,0,28].map(x=>[-25,-2].map(y=>rect(x-9,y,18,15,3,blue)).join("")).join("")+rect(-12,21,24,24,2,coral)+path("M-53 45h106","none",ink,5),
    medal:path("M-26-49h18L0-6l8-43h18L14 5-13 7z",blue,ink)+circle(0,23,25,gold)+path("M0 7l5 10 12 2-8 8 2 12-11-6-11 6 2-12-8-8 12-2z",milk,ink),
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
    [/\b(adn|genetic|genoma|biomedic|cromosoma|molecula)\b/,"dna"],
    [/\b(microscop|investigador|experimento|cientific|laboratorio)\b/,"microscope"],
    [/\b(cohete|nasa|esa\s|astronaut|despegue|mision espacial)\b/,"rocket"],
    [/\b(satelite|telecomunicacion|orbitas?)\b/,"satellite"],
    [/\b(vivienda|alquiler|hipoteca|inmueble|casas?|pisos?)\b/,"house"],
    [/\b(sentencia|justicia|juicio|juez|jueza|tribunal)\b/,"scales"],
    [/\b(voto|urna|eleccion|electoral)\b/,"ballot"],
    [/\b(cooperacion|acuerdo|alianza|pacto|negociacion)\b/,"handshake"],
    [/\b(colegio|universidad|educacion|profesor|estudiante|escuela)\b/,"school"],
    [/\b(hospital|sanidad|medico|medicina|clinica)\b/,"hospital"],
    [/\b(cine|pelicula|festival|rodaje|actor|actriz)\b/,"film"],
    [/\b(concierto|guitarra|musica|musical)\b/,"guitar"],
    [/\b(ferrocarril|tren|metro|rail|estacion)\b/,"train"],
    [/\b(sierra|montana|sendero|trekking|escalada|alpinismo)\b/,"mountain"],
    [/\b(foto|fotografia|camara|fotografo)\b/,"camera"],
    [/\b(perros?|gatos?|mascotas?)\b/,"paw"],
    [/\b(hotel|turismo|hospedaje|alojamiento|habitacion)\b/,"hotel"],
    [/\b(medalla|campeon|campeonato|premio|triunfo)\b/,"medal"],
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
    "Política nacional":["building","ballot","scales","scroll","#d8dee8"],
    "Internacional":["globe","handshake","train","building","#c9dfeb"],
    "Conflictos":["shield","globe","scales","scroll","#d9dbdb"],
    "Sucesos":["lens","scales","shield","scroll","#dbdfdf"],
    "Economía":["coins","chart","house","briefcase","#f9dfac"],
    "Empresas":["briefcase","handshake","chart","building","#f2dfb6"],
    "Ciencia":["microscope","flask","dna","rocket","#c8dfe9"],
    "Tecnología":["chip","phone","satellite","camera","#d8d7ed"],
    "IA":["chip","satellite","lens","microscope","#d9d0ed"],
    "Salud":["heart","hospital","pill","dna","#f5d1c3"],
    "Naturaleza":["tree","paw","fish","mountain","#c2ddcd"],
    "Medio ambiente":["turbine","tree","mountain","globe","#c7e5c9"],
    "Sociedad":["house","handshake","train","school","#e7dad3"],
    "Cultura":["film","guitar","books","camera","#e7d4e2"],
    "Educación":["school","books","microscope","scroll","#e2e1b9"],
    "Historia":["scroll","building","scales","mountain","#eddac1"],
    "Viajes":["plane","train","mountain","hotel","#c7e8df"],
    "Gastronomía":["plate","fish","hotel","books","#f9e1bc"],
    "Deportes":["medal","ball","trophy","racket","#dce4b9"],
    "Fútbol":["ball","trophy","medal","building","#e1e9c7"],
    "Tenis":["racket","medal","trophy","ball","#e8e2bc"],
    "Motor":["car","medal","trophy","shield","#f6dbc1"]
  };
  const selection=groups[article.category]||groups.Ciencia;
  const symbols=selection.slice(0,-1);
  const pastel=selection[selection.length-1];
  const matches=[...new Set(themes.filter(([rx])=>rx.test(title)).map(([,key])=>key))];
  const hero=matches[0]||symbols[hash%symbols.length];
  const accent=[...matches.slice(1),...symbols].filter(k=>k!==hero)[(hash>>>7)%Math.max(1,[...matches.slice(1),...symbols].filter(k=>k!==hero).length)]||"globe";
  const palettes=[
    ["#f5ead6","#c5e1ed","#f3be98"],
    ["#f2e3df","#d8dbf4","#b5d9cf"],
    ["#dfedea","#ffe4b8","#e9b3a8"],
    ["#d7e4ef","#f9e2c6","#b9d8c2"],
    ["#f2e5cb","#d5e8cd","#e5cbe0"],
    [pastel,"#fce7d8","#c4d7e7"]
  ];
  const [paper,wash,spot]=palettes[(hash>>>11)%palettes.length];
  const variant=(hash>>>3)%6;
  const flip=(hash>>>4)%2;
  const pos=flip?[[266,100],[112,117]]:[[143,109],[304,111]];
  const put=(key,x,y,size,angle)=>'<g transform="translate('+x+' '+y+') rotate('+angle+') scale('+size+')">'+motifs[key]+'</g>';
  const dots=Array.from({length:30},(_,i)=>circle((i*71+hash%37)%406,(i*43+Math.floor(i/3)*17)%201,1.5,"#89786f")).join("");
  const bg=[
    circle(77,65,80,wash)+circle(336,157,96,spot),
    path("M0 0h180l-90 200H0z",wash)+circle(360,60,80,spot),
    path("M0 137Q130 12 277 100T410 66V0H0Z",wash)+circle(319,175,84,spot),
    rect(0,0,400,60,0,wash)+path("M0 192L180 4 400 136v64H0Z",spot),
    circle(330,45,96,wash)+path("M0 0h73l123 200H0Z",spot),
    path("M0 160Q90 25 210 98T400 50v150H0Z",wash)+circle(55,46,52,spot)
  ][variant];
  const star=path("M0-14L4-4 15-1 5 5 8 17 0 11-9 17-6 5-16-1-4-4Z",gold);
  const highlights=Array.from({length:3},(_,i)=>
    '<g transform="translate('+((hash+91*i)%356+21)+' '+((hash>>>5+37*i)%140+25)+') scale(.42)">'+star+'</g>').join("");
  const shift=(hash>>>15)%12-6;
  return '<svg aria-hidden="true" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">'+
    rect(0,0,400,200,0,paper)+bg+
    '<g opacity=".13">'+dots+'</g><g opacity=".33">'+highlights+'</g>'+
    put(accent,pos[1][0],pos[1][1],.71+(hash%11)/100,flip?-11:11)+
    put(hero,pos[0][0]+shift,pos[0][1],1.24+(hash%9)/25,(hash%27)-13)+
    '<path d="M16 183Q200 '+(153+(hash%29))+' 385 183" stroke="#ffffff" stroke-width="5" fill="none" opacity=".42"/>'+
    '</svg>';
}

/* Sin Ruido - galería de fotografías ilustrativas CC0.
   No usar fotos de prensa sin permiso. Fotografías enlazadas a Wikimedia Commons,
   no representan el suceso ni a sus protagonistas. Diseño progresivo: si falla la
   carga, permanece la ilustración editorial original. */
(function(){
  "use strict";
  var gallery={
    pilat:{file:"Paragliding Dune de Pilat.jpg",src:"https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Paragliding_Dune_de_Pilat.jpg/720px-Paragliding_Dune_de_Pilat.jpg",credit:"Dennis Buntrock",subject:"Duna de Pilat, Francia"},
    server:{file:"Front of server racks at NERSC.jpg",src:"https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Front_of_server_racks_at_NERSC.jpg/720px-Front_of_server_racks_at_NERSC.jpg",credit:"Derrick Coetzee",subject:"centro de datos"},
    lab:{file:"Laboratory Microscope.jpg",src:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Laboratory_Microscope.jpg/720px-Laboratory_Microscope.jpg",credit:"Asamoah Daniel Kwame Oware",subject:"microscopio de laboratorio"},
    stocks:{file:"Stockmarket.jpg",src:"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Stockmarket.jpg/720px-Stockmarket.jpg",credit:"Pixabay",subject:"mercados bursátiles"},
    solar:{file:"Solar panels-4.jpg",src:"https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Solar_panels-4.jpg/720px-Solar_panels-4.jpg",credit:"Wikideas1",subject:"paneles fotovoltaicos"},
    mountains:{file:"Mountains Landscape.jpg",src:"https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Mountains_Landscape.jpg/720px-Mountains_Landscape.jpg",credit:"Wikimedia Commons",subject:"paisaje de montaña"},
    ruins:{file:"Old Rome ruins.jpg",src:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Old_Rome_ruins.jpg/720px-Old_Rome_ruins.jpg",credit:"Øyvind",subject:"ruinas romanas"},
    food:{file:"Party food dish 1.jpg",src:"https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Party_food_dish_1.jpg/720px-Party_food_dish_1.jpg",credit:"Tomwsulcer",subject:"plato preparado"},
    football:{file:"Turt Field.jpg",src:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Turt_Field.jpg/720px-Turt_Field.jpg",credit:"Daniel Barrows",subject:"campo de fútbol"}
  };
  function norm(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
  function photo(a){
    var t=norm(a&&a.title),cat=a&&a.category,code="";
    // Primero lugares y objetos que aparecen expresamente en el titular.
    if(/\b(?:duna|dune)\s+(?:de|du)\s+pilat\b|\bpyla\b/.test(t))code="pilat";
    else if(/\b(?:fotovoltaic\w*|paneles?\s+solares?|placas?\s+solares?|energia solar)\b/.test(t))code="solar";
    else if(/\b(?:centros?\s+de\s+datos|servidores?|superordenadores?|cloud|computacion\s+en\s+la\s+nube)\b/.test(t))code="server";
    else if(/\b(?:microscopios?|laboratorios?|ensayos?\s+clinicos?)\b/.test(t))code="lab";
    else if(/\b(?:bolsa|bursatil|acciones|ibex|wall street|mercados?\s+financieros?)\b/.test(t))code="stocks";
    else if(/\b(?:antigua\s+roma|imperio\s+romano|ruinas?\s+romanas?)\b/.test(t))code="ruins";
    else if(/\b(?:montanas?|cordilleras?|senderismo|montanismo|alta\s+montana)\b/.test(t))code="mountains";
    // Contextos genéricos: solo fotografías ilustrativas, nunca crímenes, guerra
    // ni políticos ni sucesos específicos: evitar sugerir que representan hechos.
    else if(cat==="IA"&&/\b(?:inteligencia artificial|modelo de lenguaje|ia generativa|computacion)\b/.test(t))code="server";
    else if((cat==="Ciencia"||cat==="Salud")&&/\b(?:investigadores?|estudio cientifico|analisis|biologia)\b/.test(t))code="lab";
    else if(cat==="Economía"&&/\b(?:mercados?|inversion|finanzas|economia)\b/.test(t))code="stocks";
    else if(cat==="Historia"&&/\b(?:roma|romano|arqueolog)\w*\b/.test(t))code="ruins";
    else if(cat==="Gastronomía"&&/\b(?:recetas?|gastronomia|cocina|platos?|chef)\b/.test(t))code="food";
    else if(cat==="Fútbol"&&/\b(?:futbol|liga|champions|partido|seleccion)\b/.test(t))code="football";
    if(!code)return null;
    var img=gallery[code];
    return {src:img.src,alt:"Fotografía ilustrativa: "+img.subject,
      credit:img.credit,license:"CC0 1.0",
      attribution:"https://commons.wikimedia.org/wiki/File:"+encodeURIComponent(img.file.replace(/ /g,"_")),
      type:"illustrative"};
  }
  function select(a){
    // Futuro: imágenes del RSS solo si el feed tiene autorización verificada.
    if(a&&typeof a.image==="string"&&/^https:\/\//.test(a.image)&&a.image.length<800&&a.image_license_ok===true){
      return {src:a.image,alt:"Fotografía proporcionada por "+(a.source||"el medio"),credit:a.source||"Medio de origen",
        license:"Autorizada",attribution:a.link,type:"editorial"};
    }
    return photo(a);
  }
  window.SinRuidoFotos={select:select};
})();
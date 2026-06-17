// Curated cinematic flight path waypoints with metadata
// Each waypoint: lng, lat, zoom, pitch, bearing, duration (relative weight), label
// ZOOM LEVELS: 20+ = street-level detail, 21+ = architectural close-up
export const flightWaypoints = [
  // === ACT 1: GRAND ENTRANCE ===
  {
    lng: -76.38600, lat: 8.26350, zoom: 17.0, pitch: 45, bearing: 10,
    duration: 1.5,
    label: '🛫 Vista Panorámica',
    narration: 'Bienvenidos al proyecto urbanístico San Pedro de Urabá. Desde esta vista aérea, contemplemos la extensión completa de esta parcelación que ofrece un hogar en armonía con la naturaleza.'
  },
  {
    lng: -76.38630, lat: 8.26400, zoom: 18.5, pitch: 65, bearing: -5,
    duration: 1.2,
    label: '📐 Entrada Principal',
    narration: 'Descendemos hacia la entrada principal del proyecto. Observe la distribución organizada de las manzanas y la red vial diseñada para la comodidad de los residentes.'
  },
  // === ACT 2: STREET-LEVEL TOUR - CLOSE UP ===
  {
    lng: -76.38647, lat: 8.26440, zoom: 20.5, pitch: 78, bearing: 15,
    duration: 1.5,
    label: '🛣️ Avenida Central',
    shortTour: true,
    narration: 'Ingresando por la avenida central, con calzadas amplias de seis metros, demarcación amarilla de seguridad y arborización nativa a ambos lados.'
  },
  {
    lng: -76.38621, lat: 8.26500, zoom: 21.0, pitch: 82, bearing: 8,
    duration: 1.3,
    label: '🏘️ Zona Residencial Sur',
    narration: null
  },
  // === ACT 3: LOT DETAIL SHOWCASE - MANZANA A ===
  {
    lng: -76.38614, lat: 8.26540, zoom: 21.5, pitch: 85, bearing: -50,
    duration: 2.4,
    label: '🏡 Lote Lt 1 - Manzana A',
    lotId: 1000,
    shortTour: true,
    narration: 'Giramos hacia la Manzana A. Cada lote de ocho por dieciséis metros incluye antejardín con árbol nativo, garaje pavimentado y conexión directa a la vía principal. Observe los acabados premium.',
    narrationFallback: 'Giramos hacia la Manzana A, una de las zonas iniciales y consolidadas del proyecto, con excelente acceso a las vías principales y servicios de la parcelación.'
  },
  {
    lng: -76.38660, lat: 8.26542, zoom: 22.0, pitch: 85, bearing: -90,
    duration: 2.0,
    label: '🌳 Lote Lt 2 - Detalle Arquitectónico',
    lotId: 1001,
    narration: 'Observe los modelos de vivienda campestre con techos a dos aguas, terrazas cubiertas y acabados premium en cada fachada. Una inversión con proyección de valorización inmediata.',
    narrationFallback: 'Observe la tipología arquitectónica sugerida para las viviendas campestres de la parcelación, diseñadas para el confort y la integración con el paisaje natural.'
  },
  {
    lng: -76.38715, lat: 8.26541, zoom: 21.8, pitch: 80, bearing: -120,
    duration: 1.8,
    label: '🔚 Lote Lt 3 - Vista Posterior',
    lotId: 1002,
    narration: null
  },
  // === ACT 4: LOOP & TRANSITION ===
  {
    lng: -76.38700, lat: 8.26580, zoom: 20.0, pitch: 72, bearing: -180,
    duration: 1.0,
    label: '↩️ Retorno',
    narration: 'De regreso por la vía principal. Las curvas de nivel en verde limón muestran el relieve suave y natural del terreno, ideal para construcción segura.'
  },
  {
    lng: -76.38650, lat: 8.26582, zoom: 20.5, pitch: 75, bearing: 100,
    duration: 0.8,
    label: '🔄 Cruce Central',
    narration: null
  },
  {
    lng: -76.38593, lat: 8.26590, zoom: 20.0, pitch: 75, bearing: 20,
    duration: 1.0,
    label: '🛤️ Vía Norte',
    narration: null
  },
  // === ACT 5: MANZANA B & NORTH - CLOSE UP ===
  {
    lng: -76.38560, lat: 8.26640, zoom: 21.5, pitch: 85, bearing: -55,
    duration: 2.0,
    label: '🏡 Lote Lt 24 - Manzana B',
    lotId: 1023,
    shortTour: true,
    narration: 'Entramos a la Manzana B, una zona privilegiada en la parte alta del proyecto. La brisa del Urabá y las vistas panorámicas al campo hacen de este sector el más exclusivo.',
    narrationFallback: 'Avanzamos hacia el sector central de la Manzana B, una zona privilegiada en la parte alta de la parcelación que goza de gran frescura y una espectacular vista natural.'
  },
  {
    lng: -76.38629, lat: 8.26648, zoom: 22.0, pitch: 88, bearing: -90,
    duration: 1.8,
    label: '🌿 Lote Lt 25 - Premium',
    lotId: 1024,
    shortTour: true,
    narration: 'Los lotes premium incluyen piscina, paneles solares y acabados de lujo. Una inversión con proyección de valorización inmediata.',
    narrationFallback: 'Esta sección intermedia ofrece predios de topografía privilegiada ideales para albergar viviendas de diseño moderno con amplias zonas verdes y piscina.'
  },
  {
    lng: -76.38664, lat: 8.26647, zoom: 21.5, pitch: 80, bearing: -135,
    duration: 1.5,
    label: '🔚 Lote Lt 26 - Detalle Final',
    lotId: 1025,
    narration: null
  },
  // === ACT 6: NORTH EXTENSION ===
  {
    lng: -76.38540, lat: 8.26750, zoom: 20.5, pitch: 75, bearing: 15,
    duration: 1.2,
    label: '🏞️ Lote Lt 39 - Sector Norte',
    lotId: 1038,
    narration: 'El sector norte ofrece lotes de mayor extensión, ideales para proyectos familiares amplios y zonas verdes privadas.',
    narrationFallback: 'El sector norte de la parcelación ofrece lotes de gran extensión rodeados de naturaleza, perfectos para quintas familiares amplias y huertas privadas.'
  },
  {
    lng: -76.38513, lat: 8.26850, zoom: 21.0, pitch: 78, bearing: 10,
    duration: 1.0,
    label: '🌄 Lote Lt 42 - Extremo Norte',
    lotId: 1041,
    narration: null
  },
  // === ACT 7: CINEMATIC ASCENT & PANORAMA ===
  {
    lng: -76.38580, lat: 8.26700, zoom: 19.0, pitch: 55, bearing: -60,
    duration: 1.5,
    label: '🎬 Ascenso Panorámico',
    narration: 'Ascendemos para una vista privilegiada del proyecto completo. San Pedro de Urabá: naturaleza, comodidad y futuro, en un solo lugar.'
  },
  {
    lng: -76.38620, lat: 8.26580, zoom: 17.5, pitch: 40, bearing: -165,
    duration: 2.0,
    label: '🌅 Cierre Cinematográfico',
    narration: 'Gracias por acompañarnos en este recorrido virtual. ¡El lugar ideal para construir el hogar de sus sueños le espera!'
  }
];

// Pre-calculate cumulative duration weights for variable-speed playback
export const getFlightTiming = () => {
  let totalWeight = 0;
  const cumulativeWeights = [];

  flightWaypoints.forEach(wp => {
    cumulativeWeights.push(totalWeight);
    totalWeight += (wp.duration || 1.0);
  });

  return { cumulativeWeights, totalWeight };
};

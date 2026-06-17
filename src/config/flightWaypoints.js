// Curated cinematic flight path waypoints with metadata
// Each waypoint: lng, lat, zoom, pitch, bearing, duration (relative weight), label
// ZOOM LEVELS: 20+ = street-level detail, 21+ = architectural close-up
export const flightWaypoints = [
  // === ACT 1: GRAND ENTRANCE — ASOMBRO (WONDER) ===
  {
    lng: -76.38600, lat: 8.26350, zoom: 17.0, pitch: 45, bearing: 10,
    duration: 1.5,
    label: '🛫 Vista Panorámica',
    narration: 'Imagine despertar cada mañana con este paisaje. La Urbanización Querube le da la bienvenida a un entorno donde la naturaleza y su hogar se integran en perfecta armonía.'
  },
  {
    lng: -76.38630, lat: 8.26400, zoom: 18.5, pitch: 65, bearing: -5,
    duration: 1.2,
    label: '📐 Entrada Principal',
    narration: 'Observe la majestuosidad de la topografía del Urabá. Un espacio exclusivo planificado meticulosamente para asegurar su tranquilidad y alta valorización.'
  },
  // === ACT 2: STREET-LEVEL TOUR — PERTENENCIA (BELONGING) ===
  {
    lng: -76.38647, lat: 8.26440, zoom: 20.5, pitch: 78, bearing: 15,
    duration: 1.5,
    label: '🛣️ Avenida Principal',
    shortTour: true,
    narration: 'Avanzamos por la avenida principal. Sus vecinos ya están construyendo y dando vida a sus sueños. La comunidad Querube está tomando forma, unida por valores compartidos y un entorno verde.'
  },
  {
    lng: -76.38621, lat: 8.26500, zoom: 21.0, pitch: 82, bearing: 8,
    duration: 1.3,
    label: '🏘️ Zona Residencial',
    narration: 'Calles amplias de seis metros y una red de servicios públicos en proceso de instalación. Aquí, la modernidad y la serenidad del campo conviven perfectamente.'
  },
  // === ACT 3: LOT DETAIL SHOWCASE — PROPIEDAD (OWNERSHIP) ===
  {
    lng: -76.38614, lat: 8.26540, zoom: 21.5, pitch: 85, bearing: -50,
    duration: 2.4,
    label: '🏡 Lote Lt 1 - Manzana A',
    lotId: 1000,
    shortTour: true,
    narration: 'Este podría ser su lote. Imagine diseñar su hogar campestre sobre este terreno de Manzana A, con la seguridad de contar con escritura pública independiente y servicios listos.',
    narrationFallback: 'Observe los lotes listos para entrega en la Manzana A. Topografía regular con excelente ubicación y cercanía a las vías de acceso principales.'
  },
  {
    lng: -76.38660, lat: 8.26542, zoom: 22.0, pitch: 85, bearing: -90,
    duration: 2.0,
    label: '🌳 Lote Lt 2 - Detalle',
    lotId: 1001,
    narration: 'Espacios pensados para el descanso de su familia, con antejardines sombreados por árboles nativos y espacio de parqueo privado para su total comodidad.',
    narrationFallback: 'Cada predio cuenta con linderos definidos y cotas medidas con precisión catastral para que construya con total tranquilidad técnica.'
  },
  {
    lng: -76.38715, lat: 8.26541, zoom: 21.8, pitch: 80, bearing: -120,
    duration: 1.8,
    label: '🔚 Lote Lt 3 - Vistas',
    lotId: 1002,
    narration: 'Vistas ininterrumpidas a la naturaleza circundante. La inversión inteligente que protege su capital y le regala a su familia el aire puro de Urabá.'
  },
  // === ACT 4: RETORNO Y EXCLUSIVIDAD ===
  {
    lng: -76.38700, lat: 8.26580, zoom: 20.0, pitch: 72, bearing: -180,
    duration: 1.0,
    label: '↩️ Vía de Retorno',
    narration: 'Retornamos por la vía circular. Querube es un proyecto cerrado diseñado para blindar su seguridad jurídica y financiera desde el primer día.'
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
  // === ACT 5: LOTES EXCLUSIVOS ===
  {
    lng: -76.38560, lat: 8.26640, zoom: 21.5, pitch: 85, bearing: -55,
    duration: 2.0,
    label: '🏡 Lote Lt 24 - Manzana B',
    lotId: 1023,
    shortTour: true,
    narration: 'En la Manzana B, los lotes de la zona alta disfrutan de una corriente de aire fresco continuo y una vista panorámica espectacular sobre todo el valle.',
    narrationFallback: 'Avanzamos hacia el sector central de la Manzana B, una zona privilegiada que goza de gran frescura y una espectacular vista natural.'
  },
  {
    lng: -76.38629, lat: 8.26648, zoom: 22.0, pitch: 88, bearing: -90,
    duration: 1.8,
    label: '🌿 Lote Lt 25 - Premium',
    lotId: 1024,
    shortTour: true,
    narration: 'Los lotes de esta zona son ideales para incorporar elementos sostenibles como paneles solares y piscinas privadas, maximizando el disfrute campestre.',
    narrationFallback: 'Esta sección intermedia ofrece predios de topografía privilegiada ideales para albergar viviendas de diseño moderno con amplias zonas verdes.'
  },
  {
    lng: -76.38664, lat: 8.26647, zoom: 21.5, pitch: 80, bearing: -135,
    duration: 1.5,
    label: '🔚 Lote Lt 26 - Cierre',
    lotId: 1025,
    narration: 'Tu inversión trabaja mientras tú duermes. San Pedro de Urabá es la región con mayor proyección de crecimiento agroindustrial y residencial en Urabá.'
  },
  // === ACT 6: VUELO DE RETORNO Y CIERRE ===
  {
    lng: -76.38580, lat: 8.26700, zoom: 19.0, pitch: 55, bearing: -60,
    duration: 1.5,
    label: '🎬 Ascenso Final',
    narration: 'Ascendemos para contemplar este proyecto en su totalidad. San Pedro de Urabá: un futuro verde y próspero para ti y tus seres queridos.'
  },
  {
    lng: -76.38620, lat: 8.26580, zoom: 17.5, pitch: 40, bearing: -165,
    duration: 2.0,
    label: '🌅 Cierre del Recorrido',
    narration: 'Gracias por acompañarnos. Tu lote ideal en la parcelación Querube te espera. Habla con un asesor en WhatsApp y hazlo tuyo hoy mismo.'
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

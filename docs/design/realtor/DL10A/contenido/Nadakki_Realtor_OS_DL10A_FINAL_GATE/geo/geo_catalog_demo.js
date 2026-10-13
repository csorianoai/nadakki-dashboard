/* Catálogo geográfico DEMO de Nadakki Realtor OS · versión geo-demo-2026.10-v1
   Estados: los 50 estados + DC, con códigos USPS y FIPS (ANSI/INCITS 38, US Census Bureau).
   Condados, ciudades y ZIP: subconjunto DEMO, nombres y códigos reales; coordenadas = centroide APROXIMADO (no son límites).
   Vecindarios: etiquetas DEMO internas, no son límites oficiales.
   El catálogo completo (Census Gazetteer 2024: counties, places, ZCTA; TIGER/Line para límites) queda PENDIENTE. */
window.NADAKKI_GEO = {
  version: 'geo-demo-2026.10-v1',
  sources: [
    { id: 'fips', name: 'US Census Bureau · códigos de estado ANSI/FIPS', vintage: '2024', scope: '50 estados + DC', status: 'cargado' },
    { id: 'gaz', name: 'US Census Bureau · Gazetteer 2024 (counties, places, ZCTA)', vintage: '2024', scope: 'subconjunto DEMO: FL (Miami-Dade, Broward) y TX (Travis)', status: 'parcial' },
    { id: 'tiger', name: 'US Census Bureau · TIGER/Line (límites)', vintage: '2024', scope: 'no cargado: el mapa no dibuja límites', status: 'pendiente' }
  ],
  states: [
    ['01','AL','Alabama'],['02','AK','Alaska'],['04','AZ','Arizona'],['05','AR','Arkansas'],['06','CA','California'],['08','CO','Colorado'],['09','CT','Connecticut'],['10','DE','Delaware'],['11','DC','District of Columbia'],['12','FL','Florida'],['13','GA','Georgia'],['15','HI','Hawaii'],['16','ID','Idaho'],['17','IL','Illinois'],['18','IN','Indiana'],['19','IA','Iowa'],['20','KS','Kansas'],['21','KY','Kentucky'],['22','LA','Louisiana'],['23','ME','Maine'],['24','MD','Maryland'],['25','MA','Massachusetts'],['26','MI','Michigan'],['27','MN','Minnesota'],['28','MS','Mississippi'],['29','MO','Missouri'],['30','MT','Montana'],['31','NE','Nebraska'],['32','NV','Nevada'],['33','NH','New Hampshire'],['34','NJ','New Jersey'],['35','NM','New Mexico'],['36','NY','New York'],['37','NC','North Carolina'],['38','ND','North Dakota'],['39','OH','Ohio'],['40','OK','Oklahoma'],['41','OR','Oregon'],['42','PA','Pennsylvania'],['44','RI','Rhode Island'],['45','SC','South Carolina'],['46','SD','South Dakota'],['47','TN','Tennessee'],['48','TX','Texas'],['49','UT','Utah'],['50','VT','Vermont'],['51','VA','Virginia'],['53','WA','Washington'],['54','WV','West Virginia'],['55','WI','Wisconsin'],['56','WY','Wyoming']
  ].map(([fips, usps, name]) => ({ fips, usps, name })),
  counties: [
    { fips: '12086', state: '12', name: 'Miami-Dade County' },
    { fips: '12011', state: '12', name: 'Broward County' },
    { fips: '48453', state: '48', name: 'Travis County' }
  ],
  places: [
    { id: 'sib', state: '12', county: '12086', name: 'Sunny Isles Beach', lat: 25.943, lng: -80.123 },
    { id: 'aventura', state: '12', county: '12086', name: 'Aventura', lat: 25.956, lng: -80.139 },
    { id: 'miamibeach', state: '12', county: '12086', name: 'Miami Beach', lat: 25.813, lng: -80.134 },
    { id: 'hallandale', state: '12', county: '12011', name: 'Hallandale Beach', lat: 25.981, lng: -80.148 },
    { id: 'austin', state: '48', county: '48453', name: 'Austin', lat: 30.267, lng: -97.743 }
  ],
  zips: [
    { zip: '33160', state: '12', county: '12086', place: 'sib', lat: 25.936, lng: -80.127 },
    { zip: '33180', state: '12', county: '12086', place: 'aventura', lat: 25.960, lng: -80.140 },
    { zip: '33139', state: '12', county: '12086', place: 'miamibeach', lat: 25.783, lng: -80.135 },
    { zip: '33140', state: '12', county: '12086', place: 'miamibeach', lat: 25.815, lng: -80.128 },
    { zip: '33009', state: '12', county: '12011', place: 'hallandale', lat: 25.985, lng: -80.150 },
    { zip: '78701', state: '48', county: '48453', place: 'austin', lat: 30.270, lng: -97.742 },
    { zip: '78704', state: '48', county: '48453', place: 'austin', lat: 30.243, lng: -97.765 }
  ],
  hoods: [
    { id: 'sib-cn', place: 'sib', name: 'Collins Ave norte' },
    { id: 'sib-cs', place: 'sib', name: 'Collins Ave sur' },
    { id: 'av-cc', place: 'aventura', name: 'Country Club Dr' },
    { id: 'av-bb', place: 'aventura', name: 'Biscayne Blvd' }
  ]
};

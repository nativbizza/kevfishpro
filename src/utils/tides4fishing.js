// Known SA fishing locations mapped to their tides4fishing URLs
// Using Haversine distance to find nearest location to user's GPS

export const T4F_LOCATIONS = [
  // Western Cape
  { name: 'Cape Town',       province: 'Western Cape', lat: -33.9249, lng: 18.4241, url: 'https://tides4fishing.com/za/western-cape/cape-town' },
  { name: 'Hout Bay',        province: 'Western Cape', lat: -34.0484, lng: 18.3562, url: 'https://tides4fishing.com/za/western-cape/hout-bay' },
  { name: 'Kalk Bay',        province: 'Western Cape', lat: -34.1282, lng: 18.4441, url: 'https://tides4fishing.com/za/western-cape/kalk-bay' },
  { name: 'Strand',          province: 'Western Cape', lat: -34.1167, lng: 18.8333, url: 'https://tides4fishing.com/za/western-cape/strand' },
  { name: 'Gordons Bay',     province: 'Western Cape', lat: -34.1667, lng: 18.8667, url: 'https://tides4fishing.com/za/western-cape/gordons-bay' },
  { name: 'Hermanus',        province: 'Western Cape', lat: -34.4187, lng: 19.2345, url: 'https://tides4fishing.com/za/western-cape/hermanus' },
  { name: 'Gansbaai',        province: 'Western Cape', lat: -34.5833, lng: 19.35,   url: 'https://tides4fishing.com/za/western-cape/gansbaai' },
  { name: "L'Agulhas",       province: 'Western Cape', lat: -34.8333, lng: 20.0,    url: 'https://tides4fishing.com/za/western-cape/cape-agulhas' },
  { name: 'Struisbaai',      province: 'Western Cape', lat: -34.7833, lng: 20.05,   url: 'https://tides4fishing.com/za/western-cape/struisbaai' },
  { name: 'Mossel Bay',      province: 'Western Cape', lat: -34.1833, lng: 22.1333, url: 'https://tides4fishing.com/za/western-cape/mossel-bay' },
  { name: 'Knysna',          province: 'Western Cape', lat: -34.0333, lng: 23.05,   url: 'https://tides4fishing.com/za/western-cape/knysna' },
  { name: 'Plettenberg Bay', province: 'Western Cape', lat: -34.05,   lng: 23.3667, url: 'https://tides4fishing.com/za/western-cape/plettenberg-bay' },
  { name: 'Langebaan',       province: 'Western Cape', lat: -33.1,    lng: 18.0333, url: 'https://tides4fishing.com/za/western-cape/langebaan' },
  { name: 'Paternoster',     province: 'Western Cape', lat: -32.8167, lng: 17.8833, url: 'https://tides4fishing.com/za/western-cape/paternoster' },
  { name: "Lambert's Bay",   province: 'Western Cape', lat: -32.0833, lng: 18.3,    url: 'https://tides4fishing.com/za/western-cape/lamberts-bay' },
  // Eastern Cape
  { name: 'Port Elizabeth',  province: 'Eastern Cape', lat: -33.9608, lng: 25.6022, url: 'https://tides4fishing.com/za/eastern-cape/port-elizabeth' },
  { name: 'East London',     province: 'Eastern Cape', lat: -33.0153, lng: 27.9116, url: 'https://tides4fishing.com/za/eastern-cape/east-london' },
  { name: 'Port St Johns',   province: 'Eastern Cape', lat: -31.6333, lng: 29.5333, url: 'https://tides4fishing.com/za/eastern-cape/port-st-johns' },
  // KwaZulu-Natal
  { name: 'Durban',          province: 'KwaZulu-Natal', lat: -29.8587, lng: 31.0218, url: 'https://tides4fishing.com/za/kwazulu-natal/durban' },
  { name: 'Ballito',         province: 'KwaZulu-Natal', lat: -29.5333, lng: 31.2167, url: 'https://tides4fishing.com/za/kwazulu-natal/ballito' },
  { name: 'Margate',         province: 'KwaZulu-Natal', lat: -30.8622, lng: 30.3706, url: 'https://tides4fishing.com/za/kwazulu-natal/margate' },
  { name: 'Sodwana Bay',     province: 'KwaZulu-Natal', lat: -27.5333, lng: 32.6833, url: 'https://tides4fishing.com/za/kwazulu-natal/sodwana-bay' },
]

export const PROVINCES = [...new Set(T4F_LOCATIONS.map((l) => l.province))]

export function locationsByProvince(province) {
  return T4F_LOCATIONS.filter((l) => l.province === province)
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function nearestT4FLocation(lat, lng) {
  let nearest = null
  let minDist = Infinity
  for (const loc of T4F_LOCATIONS) {
    const d = haversineKm(lat, lng, loc.lat, loc.lng)
    if (d < minDist) {
      minDist = d
      nearest = loc
    }
  }
  return { ...nearest, distanceKm: Math.round(minDist) }
}

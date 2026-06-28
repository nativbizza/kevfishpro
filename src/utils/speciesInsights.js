// SA species knowledge base — best conditions per species
export const SPECIES_PROFILES = {
  'Cob (Kob)': {
    icon: '🐟',
    bestTide: ['Incoming', 'High Slack'],
    bestMoonPhases: ['New Moon', 'Full Moon'],
    bestTime: 'Night & early morning',
    idealSwellMin: 0.3, idealSwellMax: 1.8,
    idealWindMax: 20,
    idealTempMin: 15, idealTempMax: 22,
    bestProvinces: ['Western Cape', 'Eastern Cape', 'KwaZulu-Natal'],
    summary: 'Prime target on incoming tide at night. Moon phase matters a lot.',
    tips: [
      'Most active 2 hours before and after high tide',
      'New and full moon nights are exceptional — plan sessions around them',
      'Prefer turbid, slightly coloured water — not crystal clear',
      'Listen for splashing in the shallows at night — they chase mullet',
      'Incoming tide over a sandy gutter near a rocky outcrop is the sweet spot',
      'Dawn and dusk are productive if you miss the night tide',
    ],
    bait: ['Sardine (Pilchard)', 'Bloodworm', 'Sandworm (Mudprawn)', 'White Mussel'],
    bestLocations: ['Kalk Bay', 'Strand', 'Gordons Bay', 'East London', 'Port Elizabeth'],
  },
  'Steenbras': {
    icon: '🐠',
    bestTide: ['Incoming', 'High Slack'],
    bestMoonPhases: ['Full Moon', 'New Moon', 'Waxing Gibbous'],
    bestTime: 'Early morning, dusk',
    idealSwellMin: 0.2, idealSwellMax: 1.5,
    idealWindMax: 15,
    idealTempMin: 14, idealTempMax: 21,
    bestProvinces: ['Western Cape'],
    summary: 'Calm, clear water with light swell. Prefers rocky reefs.',
    tips: [
      'Prefer calmer conditions — avoid fishing big swell for Steenbras',
      'Rocky reef structure with sandy patches nearby is ideal habitat',
      'White mussel is the premier bait on the Cape West Coast',
      'Patient fishing — bites can be slow but quality is high',
      'Closed season applies: check DAFF regulations before keeping',
    ],
    bait: ['White Mussel', 'Chokka (Squid)', 'Crab', 'Bloodworm'],
    bestLocations: ['Paternoster', "L'Agulhas", 'Struisbaai', 'Hermanus'],
  },
  'Rockcod': {
    icon: '🪨',
    bestTide: ['Incoming', 'Outgoing'],
    bestMoonPhases: ['Any'],
    bestTime: 'Any time',
    idealSwellMin: 0, idealSwellMax: 2.0,
    idealWindMax: 30,
    idealTempMin: 14, idealTempMax: 26,
    bestProvinces: ['Western Cape', 'Eastern Cape', 'KwaZulu-Natal'],
    summary: 'Reliable any time. Target rocky reefs and caves.',
    tips: [
      'Not strongly affected by tide — fish throughout',
      'Look for rocky structure, caves and overhangs',
      'Drop bait straight down next to the rocks — they rarely chase far',
      'Chokka is the go-to bait across the board',
      'Tougher to catch in very rough seas as they shelter deeper',
    ],
    bait: ['Chokka (Squid)', 'Sardine (Pilchard)', 'Crab', 'Prawn'],
    bestLocations: ['Hout Bay', 'Kalk Bay', 'Knysna', 'Sodwana Bay'],
  },
  'Shad (Elf)': {
    icon: '⚡',
    bestTide: ['Incoming', 'Outgoing'],
    bestMoonPhases: ['Full Moon', 'New Moon'],
    bestTime: 'Dawn, dusk, after dark',
    idealSwellMin: 0.5, idealSwellMax: 2.0,
    idealWindMax: 25,
    idealTempMin: 17, idealTempMax: 26,
    bestProvinces: ['KwaZulu-Natal', 'Eastern Cape'],
    summary: 'Aggressive feeders — active most conditions. Best at dawn/dusk.',
    tips: [
      'Very aggressive — will chase lures, spinners, and fresh bait',
      'Moves in large schools — where you catch one, there are many',
      'Watch for surface action (breaking fish, diving birds)',
      'Light swell and onshore wind can concentrate them near the shore',
      'Runs are seasonal — KZN gets early runs, Cape follows',
      'Lures: small metal spoons and Rapalas work well',
    ],
    bait: ['Sardine (Pilchard)', 'Lure (Hard)', 'Spoon', 'Lure (Soft)'],
    bestLocations: ['Margate', 'Durban', 'Ballito', 'East London'],
  },
  'Sharks': {
    icon: '🦈',
    bestTide: ['Incoming', 'High Slack'],
    bestMoonPhases: ['Full Moon', 'New Moon'],
    bestTime: 'Night',
    idealSwellMin: 0.3, idealSwellMax: 2.5,
    idealWindMax: 25,
    idealTempMin: 16, idealTempMax: 28,
    bestProvinces: ['KwaZulu-Natal', 'Eastern Cape', 'Western Cape'],
    summary: 'Night fishing on full/new moon with fresh bait. Safety first.',
    tips: [
      'Full and new moon nights produce the most activity',
      'Fresh whole sardine or mackerel on a running sinker rig',
      'Larger Bronze Whalers are common along the Cape coast',
      'Ragged-tooth (Raggie) sharks populate KZN reefs and are catch-and-release only',
      'Always fish with a partner at night for safety',
      'Check local regulations — some shark species are protected',
    ],
    bait: ['Sardine (Pilchard)', 'Mackerel', 'Livebait'],
    bestLocations: ['Strand', 'Gordons Bay', 'Margate', 'Sodwana Bay'],
  },
  'Blacktail (Dassie)': {
    icon: '🐡',
    bestTide: ['Any'],
    bestMoonPhases: ['Any'],
    bestTime: 'Any time',
    idealSwellMin: 0, idealSwellMax: 2.0,
    idealWindMax: 30,
    idealTempMin: 12, idealTempMax: 24,
    bestProvinces: ['Western Cape'],
    summary: 'Reliable and abundant. Great for beginners. Active all day.',
    tips: [
      'One of the most reliable catches on the Cape coast',
      'Rocky shorelines and harbour walls are productive',
      'Small hooks and light tackle work best',
      'White mussel and redbait are excellent baits',
      'Often found in large shoals around kelp beds',
    ],
    bait: ['White Mussel', 'Bloodworm', 'Prawn', 'Chokka (Squid)'],
    bestLocations: ['Kalk Bay', 'Hout Bay', 'Cape Town (Sea Point)', 'Hermanus'],
  },
  'Yellowtail': {
    icon: '🟡',
    bestTide: ['Any'],
    bestMoonPhases: ['Full Moon', 'Waxing Gibbous'],
    bestTime: 'Morning',
    idealSwellMin: 0.5, idealSwellMax: 2.5,
    idealWindMax: 20,
    idealTempMin: 14, idealTempMax: 20,
    bestProvinces: ['Western Cape'],
    summary: 'Pelagic and fast. Seasonal — follows cold upwelling. Lures or live bait.',
    tips: [
      'Highly seasonal — typically May to September on the Cape',
      'Follows cold upwelling events from the Benguela current',
      'Fast and powerful — use strong tackle, minimum 30lb line',
      'Livebait (Maasbanker or Mackerel) is most effective',
      'Watch for diving gannets — they mark schools of feeding Yellowtail',
      'Rock ledges and points near deep water are prime spots',
    ],
    bait: ['Livebait', 'Mackerel', 'Spoon', 'Lure (Hard)'],
    bestLocations: ['Hout Bay', 'Cape Town (Kalk Bay)', 'Hermanus', 'Gansbaai'],
  },
  'Cape Salmon (Geelbek)': {
    icon: '🥇',
    bestTide: ['Incoming', 'High Slack'],
    bestMoonPhases: ['Full Moon', 'New Moon'],
    bestTime: 'Dawn, dusk',
    idealSwellMin: 0.3, idealSwellMax: 1.5,
    idealWindMax: 15,
    idealTempMin: 14, idealTempMax: 20,
    bestProvinces: ['Western Cape', 'Eastern Cape'],
    summary: 'Highly prized. Dawn on incoming tide with calm sea.',
    tips: [
      'One of the most prized eating fish in SA',
      'Runs seasonally along the Cape and Transkei coasts',
      'Dawn on an incoming tide in calm conditions is prime time',
      'Lures work well — try slow-troll or cast-and-retrieve',
      'Catch-and-release encouraged — stocks are under pressure',
    ],
    bait: ['Sardine (Pilchard)', 'Livebait', 'Lure (Hard)', 'Spoon'],
    bestLocations: ["L'Agulhas", 'Struisbaai', 'Port St Johns', 'East London'],
  },
  'Galjoen': {
    icon: '🇿🇦',
    bestTide: ['Incoming', 'High Slack'],
    bestMoonPhases: ['New Moon', 'Full Moon'],
    bestTime: 'Morning, dusk',
    idealSwellMin: 0.5, idealSwellMax: 2.5,
    idealWindMax: 20,
    idealTempMin: 12, idealTempMax: 20,
    bestProvinces: ['Western Cape', 'Eastern Cape'],
    summary: "South Africa's national fish. Thrives in rough white-water surf.",
    tips: [
      "South Africa's national fish — treat with respect",
      'Actually prefers bigger, rougher surf — unlike most species',
      'White water around rocks and reef is prime habitat',
      'Redbait and white mussel are the traditional baits',
      'Incoming tide through rocky white water is the classic setup',
      'Restricted bag limits apply — check regulations',
    ],
    bait: ['White Mussel', 'Bloodworm', 'Crab'],
    bestLocations: ['Cape Town (Boulders)', 'Paternoster', 'Hermanus', 'Struisbaai'],
  },
}

export function getSpeciesInsights(marine, tideType, moonLabel, sessions = [], province = null) {
  const insights = []

  for (const [species, profile] of Object.entries(SPECIES_PROFILES)) {
    let score = 0
    const reasons = []

    // Location / province match
    const locationMatch = !province ||
      profile.bestProvinces?.includes('All') ||
      profile.bestProvinces?.includes(province)
    if (locationMatch && province) {
      score += 2
      reasons.push(`✅ Common in ${province}`)
    } else if (!locationMatch) {
      reasons.push(`⚠️ Less common in ${province} — typically found in ${profile.bestProvinces?.join(', ')}`)
    }

    // Tide match
    if (profile.bestTide.includes('Any') || profile.bestTide.includes(tideType)) {
      score += 2
      reasons.push(`✅ ${tideType || 'current'} tide suits ${species}`)
    } else {
      reasons.push(`⚠️ ${species} prefers ${profile.bestTide.join(' or ')} tide`)
    }

    // Swell match
    const wave = parseFloat(marine?.waveHeight)
    if (!isNaN(wave) && wave >= profile.idealSwellMin && wave <= profile.idealSwellMax) {
      score += 2
      reasons.push(`✅ ${wave}m swell is within ideal range`)
    } else if (!isNaN(wave)) {
      reasons.push(`⚠️ ${wave}m swell outside ideal range (${profile.idealSwellMin}–${profile.idealSwellMax}m)`)
    }

    // Wind match
    const wind = parseFloat(marine?.windSpeed)
    if (!isNaN(wind) && wind <= profile.idealWindMax) {
      score += 1
      reasons.push(`✅ Wind speed acceptable`)
    } else if (!isNaN(wind)) {
      reasons.push(`⚠️ Wind too strong for ${species}`)
    }

    // Water temp
    const temp = parseFloat(marine?.waterTemp)
    if (!isNaN(temp) && temp >= profile.idealTempMin && temp <= profile.idealTempMax) {
      score += 1
      reasons.push(`✅ Water temp ${temp}°C is ideal`)
    } else if (!isNaN(temp)) {
      reasons.push(`⚠️ Water temp ${temp}°C outside ideal range (${profile.idealTempMin}–${profile.idealTempMax}°C)`)
    }

    // Moon phase
    const moonMatch = profile.bestMoonPhases.includes('Any') ||
      profile.bestMoonPhases.some((p) => moonLabel?.includes(p.split(' ')[0]))
    if (moonMatch) {
      score += 1
      reasons.push(`✅ Moon phase favourable`)
    }

    const maxScore = province ? 9 : 7  // extra 2 points available when province is known
    const rating = Math.round((score / maxScore) * 5)

    insights.push({
      id: `species-${species}`,
      source: 'species',
      species,
      icon: profile.icon,
      title: species,
      summary: profile.summary,
      rating: Math.max(1, rating),
      score,
      maxScore,
      detail: `Best time: ${profile.bestTime}\nIdeal swell: ${profile.idealSwellMin}–${profile.idealSwellMax}m · Max wind: ${profile.idealWindMax} m/s\nWater temp: ${profile.idealTempMin}–${profile.idealTempMax}°C${profile.bestProvinces ? `\nTypically found in: ${profile.bestProvinces.join(', ')}` : ''}`,
      reasons,
      tips: profile.tips,
      bait: profile.bait,
      bestLocations: profile.bestLocations,
      bestTime: profile.bestTime,
    })
  }

  return insights.sort((a, b) => b.score - a.score)
}

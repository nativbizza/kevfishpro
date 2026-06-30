const releases = [
  {
    version: '1.1.0',
    date: '2026-06-29',
    label: 'Latest',
    highlights: [
      'Fixed location permission prompt on Android — app now properly requests access on first launch',
    ],
    platforms: [
      { name: 'Web', url: 'https://kevfishpro.web.app', available: true },
      { name: 'Android APK', url: 'https://github.com/nativbizza/kevfishpro/releases/download/v1.1.0/kevfishpro-v1.1.0.apk', available: true },
      { name: 'iOS', url: null, available: false, soon: true },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-06-29',
    label: 'Initial Release',
    highlights: [
      'Live fishing conditions — tides, swell, wind, water temp via Stormglass & tides4fishing',
      'Solunar activity ratings with major/minor feed windows',
      'Species score cards (Yellowfin Tuna, Snoek, Yellowtail, Geelbek & more)',
      'Smart insights combining tide, solunar, and marine data into an overall fishing score',
      'Log a fishing day — location, species, bait, rating, and notes',
      'Session history with edit and delete',
      'GPS location detection with manual province/location override',
      'Works offline — conditions are cached between sessions',
    ],
    platforms: [
      { name: 'Web', url: 'https://kevfishpro.web.app', available: true },
      { name: 'Android APK', url: 'https://github.com/nativbizza/kevfishpro/releases/download/v1.0.0/kevfishpro-v1.0.0.apk', available: true },
      { name: 'iOS', url: null, available: false, soon: true },
    ],
  },
]

function PlatformBadge({ platform }) {
  if (platform.available) {
    return (
      <a
        href={platform.url}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ocean-600 text-white text-xs font-medium hover:bg-ocean-700 transition"
      >
        <span>↗</span> {platform.name}
      </a>
    )
  }
  if (platform.soon) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ocean-100 text-ocean-700 text-xs font-medium border border-ocean-200">
        {platform.name} — coming soon
      </span>
    )
  }
  return null
}

export default function Releases() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ocean-900">Releases</h1>
        <p className="text-sm text-ocean-600 mt-1">KevFishPro — release history and downloads</p>
      </div>

      <div className="space-y-6">
        {releases.map((release, idx) => (
          <div key={release.version} className="bg-white rounded-2xl shadow-sm border border-ocean-100 p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-ocean-900">v{release.version}</span>
                  <span className="px-2 py-0.5 rounded-full bg-ocean-600 text-white text-xs font-semibold">
                    {release.label}
                  </span>
                </div>
                <p className="text-xs text-ocean-400 mt-0.5">{release.date}</p>
              </div>
            </div>

            <ul className="mt-4 space-y-2">
              {release.highlights.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-ocean-800">
                  <span className="text-ocean-400 mt-0.5 shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap gap-2">
              {release.platforms.map((p) => (
                <PlatformBadge
                  key={p.name}
                  platform={p.name === 'Android APK' && idx > 0 ? { ...p, available: false, soon: false } : p}
                />
              ))}
            </div>

            {idx === 0 && (
              <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
                <span className="font-semibold">Android install note:</span> After downloading, Android may show a "Blocked by Play Protect" warning. This is normal for apps installed outside the Play Store. Tap <span className="font-semibold">More details</span> then <span className="font-semibold">Install anyway</span> to proceed.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

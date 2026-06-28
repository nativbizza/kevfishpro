const SOURCE_STYLES = {
  solunar:    { label: 'Solunar',     bg: 'bg-indigo-100',  text: 'text-indigo-700'  },
  conditions: { label: 'Conditions',  bg: 'bg-sky-100',     text: 'text-sky-700'     },
  species:    { label: 'Species',     bg: 'bg-emerald-100', text: 'text-emerald-700' },
  myLogs:     { label: 'My Logs',     bg: 'bg-amber-100',   text: 'text-amber-700'   },
}

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <span key={i} className={`text-xs ${i <= rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
      ))}
    </div>
  )
}

export default function InsightCard({ insight, onClick }) {
  const style = SOURCE_STYLES[insight.source] ?? SOURCE_STYLES.conditions

  return (
    <button
      onClick={() => onClick(insight)}
      className="w-full text-left bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-gray-300 transition active:scale-[0.98]"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5 shrink-0">{insight.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>
              {style.label}
            </span>
            <Stars rating={insight.rating} />
          </div>
          <p className="font-semibold text-gray-800 text-sm leading-snug">{insight.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{insight.summary}</p>
        </div>
        <span className="text-gray-300 text-sm mt-1 shrink-0">›</span>
      </div>
    </button>
  )
}

export { Stars, SOURCE_STYLES }

export function TechnicalVisual({ label = 'Фотоматериалы готовятся' }: { label?: string }) {
  return (
    <div className="technical-visual" role="img" aria-label={label}>
      <svg viewBox="0 0 720 460" aria-hidden="true">
        <defs>
          <pattern id="smallGrid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M36 0H0V36" fill="none" stroke="currentColor" strokeOpacity=".08" />
          </pattern>
        </defs>
        <rect width="720" height="460" fill="url(#smallGrid)" />
        <path d="M78 334 214 104h430" fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="2" />
        <path d="M114 350 238 142h346" fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="2" />
        <circle cx="562" cy="102" r="48" fill="none" stroke="currentColor" strokeOpacity=".13" />
        <circle cx="562" cy="102" r="31" fill="none" stroke="currentColor" strokeOpacity=".18" />
        <g transform="translate(138 250) rotate(-8)">
          <path d="M34 0h420" stroke="currentColor" strokeOpacity=".2" strokeWidth="66" strokeLinecap="round" />
          <path d="M34 0h420" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M44 0h335" stroke="#e3ac32" strokeWidth="15" strokeLinecap="round" />
          <path d="M392-31v62M414-28v56M436-20v40" stroke="currentColor" strokeWidth="3" />
          <circle cx="34" r="44" fill="none" stroke="currentColor" strokeOpacity=".32" strokeWidth="2" />
        </g>
        <g fill="currentColor" opacity=".5" fontFamily="Onest, sans-serif" fontSize="12" letterSpacing="2">
          <text x="30" y="38">СХЕМА КРЕПЛЕНИЯ / 01</text>
          <text x="584" y="430">М 1:10</text>
        </g>
      </svg>
      <span>{label}</span>
    </div>
  )
}

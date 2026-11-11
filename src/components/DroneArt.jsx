export default function DroneArt({ variant = 'quad', accent = '#FFE500' }) {
  const frame = {
    quad: { arms: 4, span: 34 },
    'quad-pro': { arms: 4, span: 38 },
    mini: { arms: 4, span: 26 },
    fpv: { arms: 4, span: 32 },
    mapping: { arms: 4, span: 40 },
    'mapping-long': { arms: 4, span: 42 },
    edu: { arms: 4, span: 28 },
    inspect: { arms: 4, span: 30 },
  }[variant] ?? { arms: 4, span: 34 }

  const isFpv = variant === 'fpv'
  const isMapping = variant.startsWith('mapping')
  const isEdu = variant === 'edu'
  const isInspect = variant === 'inspect'

  return (
    <svg className="drone-art" viewBox="0 0 160 110" role="img" aria-hidden="true">
      <defs>
        <filter id={`drip-${variant}`} x="-10%" y="0" width="120%" height="140%">
          <feDropShadow dx="2" dy="3" stdDeviation="0" floodColor="#111" />
        </filter>
      </defs>
      <g filter={`url(#drip-${variant})`} stroke="#111" strokeWidth="3" strokeLinejoin="round">
        {[-1, 1].map((sx) =>
          [-1, 1].map((sy) => {
            const x = 80 + sx * frame.span
            const y = 52 + sy * 24
            return (
              <g key={`${sx}-${sy}`}>
                <line x1="80" y1="52" x2={x} y2={y} stroke={accent} strokeWidth="5" />
                <line x1="80" y1="52" x2={x} y2={y} stroke="#111" strokeWidth="2" />
                <circle cx={x} cy={y} r={isEdu ? 11 : 13} fill="#111" />
                <circle cx={x} cy={y} r={isEdu ? 8 : 9} fill={accent} />
                <circle cx={x} cy={y} r="3" fill="#111" />
              </g>
            )
          }),
        )}
        <rect
          x={isFpv ? 62 : 58}
          y={isMapping ? 40 : 42}
          width={isFpv ? 36 : 44}
          height={isMapping ? 28 : 22}
          rx="4"
          fill={accent}
        />
        {isFpv && <polygon points="70,48 90,52 70,56" fill="#111" />}
        {isMapping && <rect x="70" y="68" width="20" height="10" rx="1" fill="#111" />}
        {isInspect && <circle cx="80" cy="53" r="6" fill="#111" />}
        {!isFpv && !isInspect && <rect x="74" y="48" width="12" height="8" rx="1" fill="#111" />}
      </g>
    </svg>
  )
}

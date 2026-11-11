export default function Stars({ value }) {
  const full = Math.floor(value)
  const half = value - full >= 0.5
  return (
    <span className="stars" aria-label={`示例评分 ${value} 分（满分 5 分）`}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < full || (i === full && half)
        return (
          <span key={i} className={filled ? 'star is-on' : 'star'}>
            ★
          </span>
        )
      })}
      <span className="star-num">{value.toFixed(1)}</span>
    </span>
  )
}

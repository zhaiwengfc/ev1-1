import { Link } from 'react-router-dom'

export default function Wordmark({ size = 'header' }) {
  return (
    <Link to="/" className={`wordmark wordmark-${size}`} aria-label="EV1平台 首页">
      <span className="wordmark-ev1" aria-hidden="true">
        EV1
      </span>
      <span className="wordmark-cn" aria-hidden="true">
        平台
      </span>
    </Link>
  )
}

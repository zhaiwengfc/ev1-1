export default function SampleBadge({ children = '示例内容', className = '' }) {
  return <span className={`sample-badge ${className}`.trim()}>{children}</span>
}

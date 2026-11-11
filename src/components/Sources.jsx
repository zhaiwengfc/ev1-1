import { safeHttpUrl } from '../data/newsFeed.js'

export default function Sources({ sources }) {
  const list = (sources || [])
    .map((source) => ({ label: source?.label, url: safeHttpUrl(source?.url) }))
    .filter((source) => source.label && source.url)
  if (list.length === 0) return null

  return (
    <section className="source-list">
      <h2>来源</h2>
      <ul>
        {list.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

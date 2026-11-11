// Vite's base is "./" so asset URLs stay relative. A relative "./images/..."
// URL is resolved against the page path. On GitHub Pages that path is
// /ev1-1 with no trailing slash (https://host/ev1-1#/shop), so the browser
// looks for /images/... and the photo 404s. Build a root-absolute URL from
// the directory that actually holds index.html.
export function publicAssetUrl(assetPath, locationLike) {
  const clean = String(assetPath || '').trim().replace(/^\//, '')
  if (!clean || /^https?:/i.test(assetPath || '')) return ''
  const base = import.meta.env?.BASE_URL || './'
  if (base.startsWith('/')) {
    const prefix = base.endsWith('/') ? base : `${base}/`
    return `${prefix}${clean}`
  }
  const loc = locationLike || (typeof window !== 'undefined' ? window.location : null)
  if (!loc?.pathname) return `${base}${clean}`
  let dir = loc.pathname
  if (dir.endsWith('.html') || dir.endsWith('.htm')) {
    dir = dir.slice(0, dir.lastIndexOf('/') + 1)
  } else if (!dir.endsWith('/')) {
    dir = `${dir}/`
  }
  return `${dir}${clean}`
}

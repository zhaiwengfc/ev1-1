import { Navigate, useParams } from 'react-router-dom'
import { getLabItem } from '../data/content.js'

export default function LabRedirect() {
  const { id } = useParams()
  const item = id ? getLabItem(id) : null
  if (item?.type === 'review' && item.productId) {
    return <Navigate to={`/shop/${item.productId}`} replace />
  }
  if (item?.type === 'research') {
    return <Navigate to={`/shop/read/${item.id}`} replace />
  }
  return <Navigate to="/shop" replace />
}

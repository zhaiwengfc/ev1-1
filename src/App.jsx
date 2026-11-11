import { Navigate, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import News from './pages/News.jsx'
import NewsDetail from './pages/NewsDetail.jsx'
import Shop from './pages/Shop.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import LabDetail from './pages/LabDetail.jsx'
import LabRedirect from './pages/LabRedirect.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/read/:id" element={<LabDetail />} />
        <Route path="/shop/:id" element={<ProductDetail />} />
        <Route path="/lab" element={<Navigate to="/shop" replace />} />
        <Route path="/lab/:id" element={<LabRedirect />} />
      </Route>
    </Routes>
  )
}

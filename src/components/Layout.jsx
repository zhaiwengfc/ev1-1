import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import CartDrawer from './CartDrawer.jsx'

export default function Layout() {
  return (
    <div className="app-shell">
      <div className="wall-texture" aria-hidden="true" />
      <div className="spray-splats" aria-hidden="true" />
      <Header />
      <main className="page-main">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}

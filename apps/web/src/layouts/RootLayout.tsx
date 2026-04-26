import { NavLink, Outlet } from 'react-router'
import './RootLayout.css'

function RootLayout() {
  return (
    <>
      <nav id="nav">
        <span id="nav-brand">FST</span>
        <div id="nav-links">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/about">About</NavLink>
        </div>
      </nav>
      <Outlet />
    </>
  )
}

export default RootLayout

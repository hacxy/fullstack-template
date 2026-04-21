import { NavLink, Outlet } from 'react-router'
import './RootLayout.css'

function RootLayout() {
  return (
    <>
      <nav id="nav">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/about">About</NavLink>
      </nav>
      <Outlet />
    </>
  )
}

export default RootLayout

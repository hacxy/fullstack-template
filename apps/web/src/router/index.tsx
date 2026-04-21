import { createBrowserRouter } from 'react-router'
import RootLayout from '../layouts/RootLayout'
import About from '../pages/About'
import Home from '../pages/Home'
import NotFound from '../pages/NotFound'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
])

export default router

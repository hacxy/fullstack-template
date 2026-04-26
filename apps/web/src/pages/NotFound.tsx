import { Link } from 'react-router'
import './NotFound.css'

function NotFound() {
  return (
    <section id="center">
      <div id="notfound-content">
        <p id="notfound-code">404</p>
        <h1>Page not found</h1>
        <p id="notfound-hint">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-home">Back to Home</Link>
      </div>
    </section>
  )
}

export default NotFound

import { useEffect, useState } from 'react'
import { useUsersStore } from '../store'
import '../App.css'
import './Home.css'

const TECH_STACK = ['React 19', 'Elysia', 'Drizzle ORM', 'SQLite', 'Zustand', 'TypeScript']

function Home() {
  const { users, loading, fetchUsers, addUser } = useUsersStore()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim())
      return
    setSubmitting(true)
    await addUser(name.trim())
    setName('')
    setSubmitting(false)
  }

  return (
    <>
      <section id="center">
        <div id="hero-text">
          <h1>Fullstack Template</h1>
          <p id="hero-desc">
            Production-ready monorepo with typed APIs end-to-end.
          </p>
          <div id="hero-badges">
            {TECH_STACK.map(tech => (
              <span key={tech} className="tech-badge">{tech}</span>
            ))}
          </div>
        </div>

        <div id="demo-card">
          <div id="demo-header">
            <h2>Users Demo</h2>
            <code>GET · POST /api/users</code>
          </div>
          <form onSubmit={handleSubmit} id="user-form">
            <input
              className="text-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter a name..."
              disabled={submitting}
            />
            <button type="submit" disabled={submitting || !name.trim()} className="btn-primary">
              {submitting ? 'Adding…' : 'Add User'}
            </button>
          </form>
          <div id="user-list">
            {loading
              ? <p className="list-hint">Loading…</p>
              : users.length === 0
                ? <p className="list-hint">No users yet. Add one above.</p>
                : users.map(user => (
                    <div key={user.id} className="user-item">
                      <span className="user-name">{user.name}</span>
                      <span className="user-id">
                        #
                        {user.id}
                      </span>
                    </div>
                  ))}
          </div>
        </div>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Explore the API and framework docs</p>
          <ul>
            <li>
              <a href="http://localhost:3000/scalar" target="_blank">
                API Reference
              </a>
            </li>
            <li>
              <a href="https://elysiajs.com/" target="_blank">
                Learn Elysia
              </a>
            </li>
            <li>
              <a href="https://orm.drizzle.team/" target="_blank">
                Drizzle ORM
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Community</h2>
          <p>Connect with the open-source ecosystem</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default Home

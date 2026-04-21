import { useEffect, useState } from 'react'
import viteLogo from '../assets/vite.svg'
import { useUsersStore } from '../store'
import '../App.css'

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
        <div>
          <h1>Users</h1>
          <p>
            Data from
            {' '}
            <code>GET /api/users</code>
            {' '}
            — powered by Elysia + Prisma
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="User name"
            disabled={submitting}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #444', background: '#1a1a1a', color: 'inherit', fontSize: '1em' }}
          />
          <button type="submit" disabled={submitting || !name.trim()} className="counter">
            {submitting ? 'Adding...' : 'Add user'}
          </button>
        </form>

        {loading
          ? <p style={{ color: '#888' }}>Loading...</p>
          : users.length === 0
            ? <p style={{ color: '#888' }}>No users yet. Add one above.</p>
            : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, width: '100%', maxWidth: '400px' }}>
                  {users.map(user => (
                    <li
                      key={user.id}
                      style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #333' }}
                    >
                      <span>{user.name}</span>
                      <span style={{ color: '#888', fontSize: '0.85em' }}>
                        #{user.id}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="http://localhost:3000/scalar" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                API Docs
              </a>
            </li>
            <li>
              <a href="https://elysiajs.com/" target="_blank">
                Learn Elysia
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
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

import './About.css'

const STACK = [
  { name: 'React 19', desc: 'UI library with concurrent features', href: 'https://react.dev' },
  { name: 'Elysia 1.4', desc: 'Fast Bun HTTP framework', href: 'https://elysiajs.com' },
  { name: 'Drizzle ORM', desc: 'Type-safe SQL ORM', href: 'https://orm.drizzle.team' },
  { name: 'SQLite', desc: 'Embedded database via Bun', href: 'https://bun.sh/docs/api/sqlite' },
  { name: 'React Router 7', desc: 'Full-stack routing framework', href: 'https://reactrouter.com' },
  { name: 'Zustand 5', desc: 'Minimal state management', href: 'https://zustand.docs.pmnd.rs' },
  { name: 'Vite 8', desc: 'Next-generation frontend tooling', href: 'https://vite.dev' },
  { name: 'TypeScript', desc: 'Type-safe JavaScript', href: 'https://www.typescriptlang.org' },
]

function About() {
  return (
    <section id="center">
      <div id="about-header">
        <h1>About</h1>
        <p id="about-desc">
          A fullstack monorepo template with typed APIs, migrations, and E2E tests — ready to clone and ship.
        </p>
      </div>
      <div id="stack-grid">
        {STACK.map(item => (
          <a key={item.name} href={item.href} target="_blank" className="stack-card">
            <span className="stack-name">{item.name}</span>
            <span className="stack-desc">{item.desc}</span>
          </a>
        ))}
      </div>
    </section>
  )
}

export default About

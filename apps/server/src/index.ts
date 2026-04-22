import process from 'node:process'
import consola from 'consola'
import { app } from './app'

app.listen(Number(process.env.PORT) || 3000, ({ hostname, port }) => {
  consola.success(`Server running at http://${hostname}:${port}`)
})

export type App = typeof app

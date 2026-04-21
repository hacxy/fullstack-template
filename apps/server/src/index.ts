import consola from 'consola'
import { app } from './app'

app.listen(3000, ({ hostname, port }) => {
  consola.success(`Server running at http://${hostname}:${port}`)
})

export type App = typeof app

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { Database } from 'bun:sqlite'

const app = new Hono()
app.use('*', cors())

const db = new Database('data.sqlite')
db.run('CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0)')

app.get('/api/health', (c) => c.json({ ok: true }))
app.get('/api/todos', (c) => {
  const rows = db.query('SELECT id, title, done FROM todos ORDER BY id DESC').all()
  return c.json(rows)
})
app.post('/api/todos', async (c) => {
  const body = await c.req.json().catch(() => null)
  const title = body?.title?.toString().trim()
  if (!title) return c.json({ error: 'title required' }, 400)
  db.query('INSERT INTO todos (title, done) VALUES (?, 0)').run(title)
  return c.json({ ok: true }, 201)
})

export default app
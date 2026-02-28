const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const authMiddleware = require('./middlewares/auth')

const contentRoutes = require('./routes/contentRoutes')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

// attach auth (parses token and sets req.user when token present)
app.use(authMiddleware)

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/contents', contentRoutes)
app.use('/api/users', userRoutes)

// basic health
app.get('/health', (req, res) => res.json({ ok: true }))

// Admin init endpoint to add 'approved' column if not exists
app.post('/admin/init-db', async (req, res) => {
  try {
    const adminKey = req.body?.adminKey
    if (!adminKey) {
      return res.status(400).json({ success: false, message: 'Admin key required in request body' })
    }

    const { createClient } = require('@supabase/supabase-js')
    const adminClient = createClient(process.env.SUPABASE_URL, adminKey)
    
    // Try to add approved column to contents table
    // This is a simple approach - in production use migrations
    const { error } = await adminClient.rpc('exec_sql', {
      sql: `ALTER TABLE contents ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;`
    })
    
    if (error && !error.message?.includes('already exists')) {
      throw error
    }

    res.json({ success: true, message: 'Database initialized successfully' })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
})

// root için basit bilgi sayfası (tarayıcıda Cannot GET / yerine kullanıcı dostu mesaj)
app.get('/', (req, res) => {
	res.send('İçerik Yönetim Sistemi API. Sağlık: /health, API: /api/*')
})

module.exports = app

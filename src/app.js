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
console.log('DEBUG: authRoutes type=', typeof authRoutes, 'contentRoutes type=', typeof contentRoutes)
console.log('DEBUG: authRoutes keys=', authRoutes && Object.keys(authRoutes))
const authHandler = authRoutes && authRoutes.default ? authRoutes.default : authRoutes
const contentHandler = contentRoutes && contentRoutes.default ? contentRoutes.default : contentRoutes
const userHandler = userRoutes && userRoutes.default ? userRoutes.default : userRoutes
app.use('/api/auth', authHandler)
app.use('/api/contents', contentHandler)
app.use('/api/users', userHandler)

// basic health
app.get('/health', (req, res) => res.json({ ok: true }))

// root için basit bilgi sayfası (tarayıcıda Cannot GET / yerine kullanıcı dostu mesaj)
app.get('/', (req, res) => {
	res.send('İçerik Yönetim Sistemi API. Sağlık: /health, API: /api/*')
})

module.exports = app

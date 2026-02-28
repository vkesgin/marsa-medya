const express = require('express')
const router = express.Router()
const { listUsers } = require('../controllers/userController')

router.get('/', listUsers)

module.exports = router
module.exports.default = router

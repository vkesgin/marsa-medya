const express = require('express');
const router = express.Router();
const { login, registerUser, changePassword, changeUserPassword } = require('../controllers/authController')
const { requireAuth } = require('../middlewares/auth')

router.post('/login', login)
router.post('/register', registerUser)
router.post('/change-password', requireAuth, changePassword)
router.post('/admin/change-password', requireAuth, changeUserPassword)

module.exports = router
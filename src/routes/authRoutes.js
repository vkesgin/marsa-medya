const express = require('express');
const router = express.Router();
const { login, registerUser, changePassword, changeUserPassword, generateTemporaryPassword, sendPasswordResetEmail } = require('../controllers/authController')
const requireAuth = require('../middlewares/auth')

router.post('/login', login)
router.post('/register', registerUser)
router.post('/change-password', requireAuth, changePassword)
router.post('/admin/change-password', requireAuth, changeUserPassword)
router.post('/admin/generate-temp-password', requireAuth, generateTemporaryPassword)
router.post('/admin/send-password-reset', requireAuth, sendPasswordResetEmail)

module.exports = router
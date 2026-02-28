const express = require('express')
const router = express.Router()
const { listUsers, deleteUser, updateUserRole } = require('../controllers/userController')

router.get('/', listUsers)
router.delete('/:userId', deleteUser)
router.patch('/:userId/role', updateUserRole)

module.exports = router

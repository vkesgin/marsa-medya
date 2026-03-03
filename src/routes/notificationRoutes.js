const express = require('express')
const router = express.Router()
const {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../controllers/notificationController')

router.get('/', listNotifications)
router.patch('/:id/read', markNotificationRead)
router.patch('/read-all', markAllNotificationsRead)

module.exports = router

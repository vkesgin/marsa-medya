const express = require('express');
const router = express.Router();
const { createContent, getContents, updateContent } = require('../controllers/contentController')

// Eğer '/api/contents' adresine GET isteği gelirse listele, POST gelirse yeni ekle
router.route('/')
  .get(getContents)
  .post(createContent)

// içerik durumu güncelleme
router.patch('/:id', updateContent)

module.exports = router;
module.exports.default = router;
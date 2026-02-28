const express = require('express');
const router = express.Router();
const { createContent, getContents, updateContent, deleteContent } = require('../controllers/contentController')

// Eğer '/api/contents' adresine GET isteği gelirse listele, POST gelirse yeni ekle
router.route('/')
  .get(getContents)
  .post(createContent)

// içerik durumu güncelleme
router.patch('/:id', updateContent)
// İçerik silme
router.delete('/:id', deleteContent)
module.exports = router;
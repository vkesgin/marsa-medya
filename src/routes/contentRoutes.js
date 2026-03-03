const express = require('express');
const router = express.Router();
const {
  createContent,
  getContents,
  updateContent,
  deleteContent,
  getContentComments,
  addContentComment,
  updateContentComment,
  deleteContentComment
} = require('../controllers/contentController')

// Eğer '/api/contents' adresine GET isteği gelirse listele, POST gelirse yeni ekle
router.route('/')
  .get(getContents)
  .post(createContent)

// içerik yorumları
router.get('/comments', getContentComments)
router.post('/:id/comments', addContentComment)
router.patch('/:contentId/comments/:commentId', updateContentComment)
router.delete('/:contentId/comments/:commentId', deleteContentComment)

// içerik durumu güncelleme
router.patch('/:id', updateContent)
// İçerik silme
router.delete('/:id', deleteContent)
module.exports = router;
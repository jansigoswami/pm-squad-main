const express = require('express');
// mergeParams lets this router read :taskId from the parent mount path.
const router = express.Router({ mergeParams: true });

const {
  getComments,
  addComment,
  deleteComment,
} = require('../controllers/comment.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getComments);
router.post('/', addComment);
router.delete('/:commentId', deleteComment);

module.exports = router;

const express = require('express');
const router = express.Router();

const {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
} = require('../controllers/task.controller');
const { protect } = require('../middleware/auth');

// Every task route requires authentication.
router.use(protect);

router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;

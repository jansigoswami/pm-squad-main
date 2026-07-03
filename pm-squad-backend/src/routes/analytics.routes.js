const express = require('express');
const router = express.Router();

const {
  getSummary,
  getByUser,
  getTrend,
} = require('../controllers/analytics.controller');
const { protect, isBoss } = require('../middleware/auth');

// All analytics endpoints are boss-only.
router.use(protect, isBoss);

router.get('/summary', getSummary);
router.get('/by-user', getByUser);
router.get('/trend', getTrend);

module.exports = router;

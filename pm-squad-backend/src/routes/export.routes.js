const express = require('express');
const router = express.Router();

const { exportCSV, exportPDF } = require('../controllers/export.controller');
const { protect, isBoss } = require('../middleware/auth');

// All export endpoints are boss-only.
router.use(protect, isBoss);

router.get('/csv', exportCSV);
router.get('/pdf', exportPDF);

module.exports = router;

const router = require('express').Router();
const c = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.get('/summary', protect, authorize('officer', 'admin'), c.summary);

module.exports = router;

const router = require('express').Router();
const c = require('../controllers/grievanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/meta', c.meta);
router.route('/').get(c.list).post(authorize('complainant'), c.create);
router.get('/:id', c.getOne);
router.patch('/:id/status', authorize('officer', 'admin'), c.updateStatus);
router.post('/:id/remarks', authorize('officer', 'admin'), c.addRemark);
router.patch('/:id/assign', authorize('admin'), c.assign);

module.exports = router;

const router = require('express').Router();
const c = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', c.list);
router.post('/', authorize('admin'), c.create);
router.route('/:id').put(authorize('admin'), c.update).delete(authorize('admin'), c.remove);

module.exports = router;

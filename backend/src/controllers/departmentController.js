const Department = require('../models/Department');
const Grievance = require('../models/Grievance');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

exports.list = asyncHandler(async (req, res) => {
  const departments = await Department.find().sort({ name: 1 });
  res.json({ success: true, departments });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, description, categories } = req.body;
  const department = await Department.create({ name, description, categories });
  res.status(201).json({ success: true, department });
});

exports.update = asyncHandler(async (req, res) => {
  const { name, description, categories } = req.body;
  const department = await Department.findByIdAndUpdate(req.params.id, { name, description, categories }, { new: true, runValidators: true });
  if (!department) throw new AppError('Department not found', 404);
  res.json({ success: true, department });
});

exports.remove = asyncHandler(async (req, res) => {
  const [g, u] = await Promise.all([Grievance.countDocuments({ department: req.params.id }), User.countDocuments({ department: req.params.id })]);
  if (g || u) throw new AppError('Department is in use by grievances or officers and cannot be deleted', 409);
  const department = await Department.findByIdAndDelete(req.params.id);
  if (!department) throw new AppError('Department not found', 404);
  res.json({ success: true, message: 'Department deleted' });
});

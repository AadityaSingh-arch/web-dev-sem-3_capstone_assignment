const User = require('../models/User');
const Department = require('../models/Department');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../config/constants');

async function checkOfficerDept(role, department) {
  if (role === ROLES.OFFICER) {
    if (!department) throw new AppError('Officers must belong to a department', 400);
    if (!(await Department.exists({ _id: department }))) throw new AppError('Department not found', 404);
  }
}

// GET /api/users?role=officer
exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = String(req.query.role);
  const users = await User.find(filter).populate('department', 'name').sort({ createdAt: -1 });
  res.json({ success: true, users });
});

// POST /api/users  (admin creates officers / admins)
exports.create = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, userType } = req.body;
  if (!Object.values(ROLES).includes(role)) throw new AppError('Invalid role', 400);
  await checkOfficerDept(role, department);
  const user = await User.create({ name, email, password, role, userType, department: role === ROLES.OFFICER ? department : undefined });
  res.status(201).json({ success: true, user });
});

// PATCH /api/users/:id
exports.update = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  const { name, role, department, isActive } = req.body;
  if (String(user._id) === String(req.user._id) && (isActive === false || (role && role !== user.role))) {
    throw new AppError('You cannot deactivate or change the role of your own account', 400);
  }
  if (name !== undefined) user.name = name;
  if (role !== undefined) {
    if (!Object.values(ROLES).includes(role)) throw new AppError('Invalid role', 400);
    user.role = role;
  }
  if (department !== undefined) user.department = department || undefined;
  if (isActive !== undefined) user.isActive = Boolean(isActive);
  await checkOfficerDept(user.role, user.department);
  if (user.role !== ROLES.OFFICER) user.department = undefined;
  await user.save();
  res.json({ success: true, user });
});

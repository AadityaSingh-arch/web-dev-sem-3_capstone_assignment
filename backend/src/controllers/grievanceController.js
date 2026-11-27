const mongoose = require('mongoose');
const Grievance = require('../models/Grievance');
const Department = require('../models/Department');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const events = require('../utils/events');
const { CATEGORIES, PRIORITIES, STATUSES, TRANSITIONS } = require('../config/constants');

const LIST_POPULATE = [
  { path: 'complainant', select: 'name email userType' },
  { path: 'department', select: 'name' },
  { path: 'assignedOfficer', select: 'name email' },
];
const DETAIL_POPULATE = [
  ...LIST_POPULATE,
  { path: 'statusHistory.changedBy', select: 'name role' },
  { path: 'remarks.officer', select: 'name' },
];

const idOf = (x) => String((x && x._id) || x);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Auto-assignment: the active officer of the department with the fewest open grievances
async function pickOfficer(departmentId) {
  const officers = await User.find({ role: 'officer', department: departmentId, isActive: true }).select('_id');
  if (!officers.length) return null;
  const load = await Grievance.aggregate([
    { $match: { assignedOfficer: { $in: officers.map((o) => o._id) }, status: { $in: ['pending', 'in_progress'] } } },
    { $group: { _id: '$assignedOfficer', open: { $sum: 1 } } },
  ]);
  const map = new Map(load.map((l) => [String(l._id), l.open]));
  return officers.sort((a, b) => (map.get(String(a._id)) || 0) - (map.get(String(b._id)) || 0))[0]._id;
}

function assertAccess(user, g) {
  if (user.role === 'admin') return;
  if (user.role === 'complainant' && idOf(g.complainant) === idOf(user._id)) return;
  if (user.role === 'officer' && g.assignedOfficer && idOf(g.assignedOfficer) === idOf(user._id)) return;
  throw new AppError('You do not have access to this grievance', 403);
}

exports.meta = (req, res) => {
  res.json({ success: true, categories: CATEGORIES, priorities: PRIORITIES, statuses: STATUSES, transitions: TRANSITIONS });
};

// POST /api/grievances (complainant)
exports.create = asyncHandler(async (req, res) => {
  const { title, description, category, priority } = req.body;
  const department = await Department.findOne({ categories: category });
  const assignedOfficer = department ? await pickOfficer(department._id) : null;
  const grievance = await Grievance.create({
    title,
    description,
    category,
    priority,
    complainant: req.user._id,
    department: department && department._id,
    assignedOfficer,
    statusHistory: [{ status: 'pending', remarks: 'Grievance submitted', changedBy: req.user._id }],
  });
  events.emit('grievance:created', grievance);
  await grievance.populate(DETAIL_POPULATE);
  res.status(201).json({ success: true, grievance });
});

// GET /api/grievances  (scoped by role; filters + pagination)
exports.list = asyncHandler(async (req, res) => {
  const { status, priority, category, department, q } = req.query;
  const filter = {};
  if (req.user.role === 'complainant') filter.complainant = req.user._id;
  if (req.user.role === 'officer') filter.assignedOfficer = req.user._id;
  if (status) filter.status = String(status);
  if (priority) filter.priority = String(priority);
  if (category) filter.category = String(category);
  if (department && req.user.role === 'admin') filter.department = String(department);
  if (q) filter.$text = { $search: String(q) };

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
  const [data, total] = await Promise.all([
    Grievance.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate(LIST_POPULATE),
    Grievance.countDocuments(filter),
  ]);
  res.json({ success: true, data, page, limit, total, pages: Math.ceil(total / limit) || 1 });
});

// GET /api/grievances/:id
exports.getOne = asyncHandler(async (req, res) => {
  const grievance = await Grievance.findById(req.params.id).populate(DETAIL_POPULATE);
  if (!grievance) throw new AppError('Grievance not found', 404);
  assertAccess(req.user, grievance);
  res.json({ success: true, grievance });
});

// PATCH /api/grievances/:id/status (officer assigned / admin)
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;
  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) throw new AppError('Grievance not found', 404);
  assertAccess(req.user, grievance);
  if (!STATUSES.includes(status)) throw new AppError('Invalid status', 400);
  if (!TRANSITIONS[grievance.status].includes(status)) {
    throw new AppError(`Cannot change status from ${grievance.status} to ${status}`, 400);
  }
  if (['resolved', 'rejected'].includes(status) && !(remarks && remarks.trim())) {
    throw new AppError('Remarks are required when resolving or rejecting a grievance', 400);
  }
  grievance.status = status;
  if (status === 'resolved') grievance.resolvedAt = new Date();
  grievance.statusHistory.push({ status, remarks, changedBy: req.user._id });
  await grievance.save();
  events.emit('grievance:statusChanged', { grievance, remarks, by: req.user });
  await grievance.populate(DETAIL_POPULATE);
  res.json({ success: true, grievance });
});

// POST /api/grievances/:id/remarks (officer assigned / admin)
exports.addRemark = asyncHandler(async (req, res) => {
  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) throw new AppError('Grievance not found', 404);
  assertAccess(req.user, grievance);
  grievance.remarks.push({ officer: req.user._id, text: req.body.text });
  await grievance.save();
  events.emit('grievance:remarked', { grievance, by: req.user });
  await grievance.populate(DETAIL_POPULATE);
  res.status(201).json({ success: true, grievance });
});

// PATCH /api/grievances/:id/assign (admin) - manual (re)assignment
exports.assign = asyncHandler(async (req, res) => {
  const { officerId } = req.body;
  if (!mongoose.isValidObjectId(officerId)) throw new AppError('A valid officerId is required', 400);
  const officer = await User.findOne({ _id: officerId, role: 'officer', isActive: true });
  if (!officer) throw new AppError('Officer not found', 404);
  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) throw new AppError('Grievance not found', 404);
  grievance.assignedOfficer = officer._id;
  grievance.department = officer.department;
  await grievance.save();
  events.emit('grievance:assigned', grievance);
  await grievance.populate(DETAIL_POPULATE);
  res.json({ success: true, grievance });
});

const mongoose = require('mongoose');
const Grievance = require('../models/Grievance');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/reports/summary  (admin: everything, officer: own grievances)
// Aggregation pipeline: resolution time + pending counts per department, status and category breakdowns
exports.summary = asyncHandler(async (req, res) => {
  const match = req.user.role === 'officer' ? { assignedOfficer: new mongoose.Types.ObjectId(req.user._id) } : {};
  const openStatuses = ['pending', 'in_progress'];
  const hours = { $cond: [{ $eq: ['$status', 'resolved'] }, { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000] }, null] };

  const [result] = await Grievance.aggregate([
    { $match: match },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              pending: { $sum: { $cond: [{ $in: ['$status', openStatuses] }, 1, 0] } },
              resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
              rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
              avgResolutionHours: { $avg: hours },
            },
          },
        ],
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        byDepartment: [
          {
            $group: {
              _id: '$department',
              total: { $sum: 1 },
              pending: { $sum: { $cond: [{ $in: ['$status', openStatuses] }, 1, 0] } },
              resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
              avgResolutionHours: { $avg: hours },
            },
          },
          { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
          { $project: { _id: 0, department: { $ifNull: [{ $arrayElemAt: ['$dept.name', 0] }, 'Unassigned'] }, total: 1, pending: 1, resolved: 1, avgResolutionHours: { $round: ['$avgResolutionHours', 1] } } },
          { $sort: { total: -1 } },
        ],
      },
    },
  ]);

  const t = (result.totals[0]) || { total: 0, pending: 0, resolved: 0, rejected: 0, avgResolutionHours: null };
  delete t._id;
  if (t.avgResolutionHours != null) t.avgResolutionHours = Math.round(t.avgResolutionHours * 10) / 10;
  res.json({ success: true, totals: t, byStatus: result.byStatus, byCategory: result.byCategory, byDepartment: result.byDepartment });
});

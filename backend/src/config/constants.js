const ROLES = { COMPLAINANT: 'complainant', OFFICER: 'officer', ADMIN: 'admin' };
const CATEGORIES = ['Academic', 'Examination', 'Hostel', 'Mess & Food', 'Infrastructure', 'IT & Network', 'Library', 'Transport', 'Finance', 'Harassment', 'Other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['pending', 'in_progress', 'resolved', 'rejected'];
// allowed status flow
const TRANSITIONS = {
  pending: ['in_progress', 'resolved', 'rejected'],
  in_progress: ['resolved', 'rejected'],
  resolved: [],
  rejected: [],
};
module.exports = { ROLES, CATEGORIES, PRIORITIES, STATUSES, TRANSITIONS };

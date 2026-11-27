const mongoose = require('mongoose');
const crypto = require('crypto');
const { CATEGORIES, PRIORITIES, STATUSES } = require('../config/constants');

const { ObjectId } = mongoose.Schema.Types;

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    remarks: { type: String, trim: true, maxlength: 1000 },
    changedBy: { type: ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const remarkSchema = new mongoose.Schema(
  {
    officer: { type: ObjectId, ref: 'User', required: true },
    text: { type: String, required: [true, 'Remark text is required'], trim: true, maxlength: 1000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const grievanceSchema = new mongoose.Schema(
  {
    ticketId: { type: String, unique: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, minlength: 5, maxlength: 120 },
    description: { type: String, required: [true, 'Description is required'], trim: true, minlength: 10, maxlength: 3000 },
    category: { type: String, enum: { values: CATEGORIES, message: 'Invalid category' }, required: [true, 'Category is required'] },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    status: { type: String, enum: STATUSES, default: 'pending' },
    complainant: { type: ObjectId, ref: 'User', required: true },
    department: { type: ObjectId, ref: 'Department' },
    assignedOfficer: { type: ObjectId, ref: 'User' },
    statusHistory: [historySchema],
    remarks: [remarkSchema],
    resolvedAt: Date,
  },
  { timestamps: true }
);

grievanceSchema.pre('validate', function () {
  if (!this.ticketId) this.ticketId = `CV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
});

// Indexes (listing, officer workload, department reports, text search)
grievanceSchema.index({ complainant: 1, createdAt: -1 });
grievanceSchema.index({ assignedOfficer: 1, status: 1 });
grievanceSchema.index({ department: 1, status: 1 });
grievanceSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Grievance', grievanceSchema);

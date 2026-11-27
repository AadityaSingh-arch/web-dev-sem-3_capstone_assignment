const mongoose = require('mongoose');
const { CATEGORIES } = require('../config/constants');

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Department name is required'], unique: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300 },
    // grievance categories this department handles (used for auto-assignment)
    categories: [{ type: String, enum: CATEGORIES }],
  },
  { timestamps: true }
);

departmentSchema.index({ categories: 1 });

module.exports = mongoose.model('Department', departmentSchema);

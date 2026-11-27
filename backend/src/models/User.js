const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: { type: String, required: [true, 'Password is required'], minlength: [8, 'Password must be at least 8 characters'], select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.COMPLAINANT },
    userType: { type: String, enum: ['student', 'staff'], default: 'student' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }, // officers only
    isActive: { type: Boolean, default: true },
    refreshTokenHash: { type: String, select: false },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, department: 1 });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.refreshTokenHash;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);

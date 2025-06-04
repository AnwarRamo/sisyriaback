import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
}, { _id: false });

const loginHistorySchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: String,
  userAgent: String,
  success: Boolean
}, { _id: false });

const userSchema = new mongoose.Schema({
  // Authentication Basics
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, "is invalid"],
  },
  hashedPassword: {
    type: String,
    required: true,
    select: false,
  },

  // Security Features
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: Date,
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: Date,
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLockedUntil: Date,
  
  // Session Management
  tokenVersion: {
    type: Number,
    default: 0,
  },
  loginHistory: [loginHistorySchema],
  lastLogin: Date,
  preferredTripTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trip' }],
  registeredTrips: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trip' }]
,
  // Profile Information
  displayName: {
    type: String,
    trim: true,
    maxlength: 50,
  },
  avatar: String,
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  
  // Shopping Features
  cart: [cartItemSchema],

}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.hashedPassword;
      delete ret.__v;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.failedLoginAttempts;
      delete ret.accountLockedUntil;
      return ret;
    },
  },
});

// Pre-save hook for email changes
userSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.emailVerified = false;
    this.emailVerificationToken = undefined;
    this.emailVerificationExpires = undefined;
  }
  next();
});

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return this.accountLockedUntil && this.accountLockedUntil > Date.now();
});

export default mongoose.model("User", userSchema);
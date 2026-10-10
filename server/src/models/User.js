import mongoose from 'mongoose';

const { Schema } = mongoose;

// One entry per logged-in device/session. We keep only a hash of the token.
const refreshTokenSchema = new Schema(
  { tokenHash: { type: String, required: true }, expiresAt: { type: Date, required: true } },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // select: false means queries do NOT return this field unless asked with .select('+passwordHash')
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    timezone: { type: String, default: 'UTC' },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    refreshTokens: { type: [refreshTokenSchema], select: false, default: [] },
    lastLoginAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      // Runs whenever a user is sent as JSON: expose `id`, hide everything sensitive
      transform(doc, ret) {
        delete ret._id;
        delete ret.passwordHash;
        delete ret.emailVerificationTokenHash;
        delete ret.passwordResetTokenHash;
        delete ret.passwordResetExpires;
        delete ret.refreshTokens;
      },
    },
  }
);

userSchema.index({ 'refreshTokens.tokenHash': 1 });

export const User = mongoose.model('User', userSchema);
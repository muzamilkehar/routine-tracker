import mongoose from 'mongoose';

const { Schema } = mongoose;

const habitSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, trim: true, maxlength: 40, default: 'General' },
    timeOfDay: { type: String, enum: ['anytime', 'morning', 'afternoon', 'evening', 'night'], default: 'anytime' },
    // 'daily' = every day. 'custom' = only the weekdays listed in `days` (0 = Sunday ... 6 = Saturday)
    frequency: { type: String, enum: ['daily', 'custom'], default: 'daily' },
    days: { type: [Number], default: [] },
    startDate: { type: String, required: true }, // YYYY-MM-DD
    endDate: { type: String, default: null }, // set when archived
    isArchived: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false, transform: (doc, ret) => { delete ret._id; } },
  }
);

habitSchema.index({ user: 1, isArchived: 1 });

export const Habit = mongoose.model('Habit', habitSchema);
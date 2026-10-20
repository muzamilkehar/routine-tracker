import mongoose from 'mongoose';

const { Schema} = mongoose;

const habitLogSchema = new Schema(
    {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true},
    habit:{ type: Schema.Types.ObjectId, ref: 'Habit', required: true},
    date: { type: String, required: true}, // 2026-02-31
    status:{type: String, enum: ['done', 'missed', 'skipped'], required: true},
    note: { type: String, trim: true, maxLength: 300, default: ''}
    },

    { 
    timestamps: true,
    toJSON: {virtuals: true, versionKey: false, transform: (doc, ret) => { delete ret._id; }},
    }
);

habitLogSchema.index({ habit: 1, date: 1 }, { unique: true });
habitLogSchema.index({ user: 1, date: 1 });

export const HabitLog = mongoose.model('HabitLog', habitLogSchema);
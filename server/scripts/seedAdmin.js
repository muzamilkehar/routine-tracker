import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';

const { email, password, name } = env.admin;

if (!email || !password || password.length < 8) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters) in .env first.');
  process.exit(1);
}

await connectDB();

// Creates the admin if missing, or promotes/resets the existing account with that email
const admin = await User.findOneAndUpdate(
  { email: email.toLowerCase().trim() },
  {
    $set: {
      name,
      role: 'admin',
      status: 'active',
      isEmailVerified: true,
      passwordHash: await bcrypt.hash(password, 12),
    },
  },
  { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true }
);

console.log(`Admin ready: ${admin.email}`);
await mongoose.disconnect();
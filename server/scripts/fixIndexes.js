import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { HabitLog } from '../src/models/HabitLog.js';

await connectDB();

// Mongoose's syncIndexes() refuses to drop an index whose key is a prefix
// of another model-defined index (e.g. `habit_1` vs `habit_1_date_1`), so we
// drop stragglers explicitly by name before syncing.
const OBSOLETE = ['habit_1'];
for (const name of OBSOLETE) {
  try {
    await HabitLog.collection.dropIndex(name);
    console.log(`Dropped obsolete index: ${name}`);
  } catch (err) {
    if (err.codeName === 'IndexNotFound') console.log(`Skip (not present): ${name}`);
    else throw err;
  }
}

const dropped = await HabitLog.syncIndexes();
console.log('syncIndexes dropped:', dropped.length ? dropped : 'none');

for (const index of await HabitLog.collection.indexes()) {
  console.log(`  ${index.name}  ${JSON.stringify(index.key)}${index.unique ? '  UNIQUE' : ''}`);
}

await mongoose.disconnect();
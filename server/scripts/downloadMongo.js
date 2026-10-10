import { MongoBinary } from 'mongodb-memory-server';

// Downloads the MongoDB binary that the tests use. Safe to re-run: finished downloads are
// cached, and an interrupted download resumes where it stopped.
const binaryPath = await MongoBinary.getPath();
console.log(`MongoDB test binary ready: ${binaryPath}`);
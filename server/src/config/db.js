import mongoose from 'mongoose';
import {env} from './env.js';
import {logger} from "../utils/logger.js";

export async function connectDB() {
    mongoose.set('strictQuery', true);
    // Fail fast if Atlas cannot be reached (instead of hanging), and keep the pool small:
    // the free Atlas tier allows a limited number of connections shared by all running instances
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 10 });
    logger.info('MongoDB Connected Successfully'); 
}
import express from "express";
import mongoose from "mongoose";
import app from './src/app.js'
import { connectDB } from './src/config/db.js'
import { logger } from "./src/utils/logger.js";


let connecting  = null;
async function ensureDb() {
    if (mongoose.connection.readyState === 1) return;
    connecting ??= connectDB().finally(() => {
        connecting = null;
    });

    await connecting;
}

const handler = express();

handler.use(async (req, res, next) => {
    try {
        await ensureDb();
        next();
    }
    catch (err) {
        logger.error({err}, "Databse Connection Failed");
        res.status(503).json({message: 'Service temporary unavailable. Please try again.'});
    }
});

handler.use(app);

export default handler;
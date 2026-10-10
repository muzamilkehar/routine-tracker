import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import { notFound } from './middleware/notFound.middleware.js';
import { apiLimiter } from './middleware/rateLimit.middleware.js';
import routes from './routes/index.js';

const app = express();

// Behind a hosting proxy (Render) the real client IP arrives in X-Forwarded-For; rate limiting needs it
if (env.isProd) app.set('trust proxy', 1);

// ORDER MATTERS: middleware runs top to bottom for every request
app.use(helmet()); // secure headers
app.use(cors({ origin: env.clientUrl, credentials: true })); // only our frontend may call us
app.use(express.json({ limit: '10kb' })); // parse JSON bodies, reject huge ones
app.use(cookieParser()); // fills req.cookies
app.use('/api', apiLimiter);

app.use('/api/v1', routes);

app.use(notFound); // nothing matched -> 404
app.use(errorHandler); // must be last: catches every error

export default app;
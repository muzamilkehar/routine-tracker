import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
    level: env.nodeEnv === 'test' ? 'silent' : 'info',
    ...(env.nodeEnv === 'development' && {tranport : {target: 'pino-pretty'} })
});
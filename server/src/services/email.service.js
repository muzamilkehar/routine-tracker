import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Without SMTP settings we simply print emails to the log, which is perfect for development.
const transporter = env.smtp.host
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    })
  : null;

async function sendEmail({ to, subject, text }) {
  if (!transporter) {
    logger.info({ to, subject, text }, 'Email (SMTP not configured, printed instead of sent)');
    return;
  }
  await transporter.sendMail({ from: env.smtp.from, to, subject, text });
}

export const sendVerificationEmail = (user, token) =>
  sendEmail({
    to: user.email,
    subject: 'Verify your email',
    text: `Hi ${user.name},\n\nConfirm your email address:\n${env.clientUrl}/verify-email?token=${token}\n`,
  });

export const sendPasswordResetEmail = (user, token) =>
  sendEmail({
    to: user.email,
    subject: 'Reset your password',
    text: `Hi ${user.name},\n\nReset your password (link valid for 1 hour):\n${env.clientUrl}/reset-password?token=${token}\n\nIf you did not ask for this, ignore this email.\n`,
  });
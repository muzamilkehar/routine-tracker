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

// Anything a user typed (like their name) must be escaped before it goes into HTML
const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// One simple layout for every email. Inline styles because email apps ignore most stylesheets.
function renderHtml({ name, heading, intro, buttonLabel, url, outro }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#151b26;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e2e6ed;border-radius:12px;">
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 16px;font-size:20px;">${escapeHtml(heading)}</h1>
        <p style="margin:0 0 12px;font-size:15px;line-height:22px;">Hi ${escapeHtml(name)},</p>
        <p style="margin:0 0 24px;font-size:15px;line-height:22px;">${escapeHtml(intro)}</p>
        <a href="${escapeHtml(url)}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:12px 20px;border-radius:8px;">${escapeHtml(buttonLabel)}</a>
        <p style="margin:24px 0 0;font-size:13px;line-height:20px;color:#5a6477;">${escapeHtml(outro)}</p>
        <p style="margin:16px 0 0;font-size:12px;line-height:18px;color:#5a6477;word-break:break-all;">Button not working? Copy this link into your browser:<br>${escapeHtml(url)}</p>
      </td></tr>
    </table>
  </body>
</html>`;
}

async function sendEmail({ to, subject, text, html }) {
  if (!transporter) {
    logger.info({ to, subject, text }, 'Email (SMTP not configured, printed instead of sent)');
    return;
  }
  await transporter.sendMail({ from: env.smtp.from, to, subject, text, html });
}

export const sendVerificationEmail = (user, token) => {
  const url = `${env.clientUrl}/verify-email?token=${token}`;
  const intro = 'Please confirm your email address so we can keep your account safe.';
  const outro = 'If you did not create an account, you can ignore this email.';
  return sendEmail({
    to: user.email,
    subject: 'Verify your email',
    text: `Hi ${user.name},\n\n${intro}\n${url}\n\n${outro}\n`,
    html: renderHtml({ name: user.name, heading: 'Verify your email', intro, buttonLabel: 'Verify email', url, outro }),
  });
};

export const sendPasswordResetEmail = (user, token) => {
  const url = `${env.clientUrl}/reset-password?token=${token}`;
  const intro = 'We got a request to reset your password. This link works once and expires in 1 hour.';
  const outro = 'If you did not ask for this, ignore this email. Your password stays the same.';
  return sendEmail({
    to: user.email,
    subject: 'Reset your password',
    text: `Hi ${user.name},\n\n${intro}\n${url}\n\n${outro}\n`,
    html: renderHtml({ name: user.name, heading: 'Reset your password', intro, buttonLabel: 'Reset password', url, outro }),
  });
};
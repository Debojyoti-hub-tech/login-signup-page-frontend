import type { NextApiRequest, NextApiResponse } from 'next';
import { findUserByEmail } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const otpsFile = path.join(process.cwd(), 'data', 'otps.json');

async function readOtps() {
  try {
    const content = await fs.readFile(otpsFile, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      await fs.mkdir(path.dirname(otpsFile), { recursive: true });
      await fs.writeFile(otpsFile, '[]', 'utf8');
      return [];
    }
    throw err;
  }
}

async function writeOtps(otps: any[]) {
  await fs.writeFile(otpsFile, JSON.stringify(otps, null, 2), 'utf8');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, firstName, lastName, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const existing = await findUserByEmail(email);
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const passwordHash = await bcrypt.hash(password, 10);
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const otps = await readOtps();
    const filtered = otps.filter((o: any) => o.email.toLowerCase() !== email.toLowerCase());
    filtered.push({ email, code, expiresAt, firstName, lastName, passwordHash });
    await writeOtps(filtered);

    // Try to send email if SMTP configured
    const smtpHost = process.env.SMTP_HOST;
    if (smtpHost && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : (process.env.SMTP_SECURE === 'true' ? 465 : 587),
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        const from = process.env.SMTP_FROM || process.env.SMTP_USER;
        await transporter.sendMail({
          from,
          to: email,
          subject: 'Your verification code',
          text: `Your verification code is ${code}. It expires in 10 minutes.`,
          html: `<p>Your verification code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
        });
        const debug = process.env.NODE_ENV !== 'production' || process.env.DEV_SHOW_OTP === 'true';
        return res.status(200).json({ ok: true, sent: true, debug: debug ? { code } : undefined });
      } catch (err: any) {
        const debug = process.env.NODE_ENV !== 'production' || process.env.DEV_SHOW_OTP === 'true';
        return res.status(200).json({ ok: true, sent: false, debug: debug ? { code } : undefined });
      }
    }

    const debug = process.env.NODE_ENV !== 'production' || process.env.DEV_SHOW_OTP === 'true';
    res.status(200).json({ ok: true, sent: false, debug: debug ? { code } : undefined });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to request OTP' });
  }
}

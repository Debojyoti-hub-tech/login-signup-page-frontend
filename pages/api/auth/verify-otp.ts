import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { createUser, signToken, setTokenCookie } from '@/lib/auth';

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
  const { email, code } = req.body || {};
  if (!email || !code) return res.status(400).json({ error: 'Missing fields' });

  try {
    const otps = await readOtps();
    const idx = otps.findIndex((o: any) => o.email.toLowerCase() === email.toLowerCase() && o.code === String(code));
    if (idx === -1) return res.status(400).json({ error: 'Invalid or expired code' });
    const entry = otps[idx];
    if (Date.now() > entry.expiresAt) {
      const filtered = otps.filter((_, i) => i !== idx);
      await writeOtps(filtered);
      return res.status(400).json({ error: 'Code expired' });
    }

    // create user using stored hashed password to avoid double-hashing
    try {
      const user = await createUser({
        email: entry.email,
        firstName: entry.firstName,
        lastName: entry.lastName,
        passwordHash: entry.passwordHash,
      });

      const token = signToken({ sub: (user as any).id, email: user.email });
      setTokenCookie(res, token);

      // remove otp entry
      const filtered = otps.filter((_, i) => i !== idx);
      await writeOtps(filtered);

      return res.status(200).json({ ok: true, user });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to create user' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to verify OTP' });
  }
}

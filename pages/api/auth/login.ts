import type { NextApiRequest, NextApiResponse } from 'next';
import { findUserByEmail, verifyPassword, signToken, setTokenCookie } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const user: any = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await verifyPassword(user, password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ sub: user.id, email: user.email });
    setTokenCookie(res, token);
    // return public user
    const publicUser = { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName };
    res.status(200).json({ user: publicUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
}

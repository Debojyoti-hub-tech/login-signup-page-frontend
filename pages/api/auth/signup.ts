import type { NextApiRequest, NextApiResponse } from 'next';
import { createUser, signToken, setTokenCookie } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password, firstName, lastName } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const user = await createUser({ email, password, firstName, lastName });
    const token = signToken({ sub: (user as any).id, email: user.email });
    setTokenCookie(res, token);
    res.status(201).json({ user });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create user' });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';
import { getUserFromToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
    const token = cookies.token;
    if (!token) return res.status(200).json({ user: null });
    const user: any = await getUserFromToken(token);
    if (!user) return res.status(401).json({ user: null });
    const publicUser = { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName };
    res.status(200).json({ user: publicUser });
  } catch (err: any) {
    res.status(500).json({ user: null });
  }
}

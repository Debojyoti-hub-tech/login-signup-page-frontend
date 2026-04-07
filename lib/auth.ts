import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import cookie from 'cookie';

type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  passwordHash: string;
  createdAt: string;
};

const usersFile = path.join(process.cwd(), 'data', 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const TOKEN_EXPIRY = '7d';

async function readUsers(): Promise<User[]> {
  try {
    const content = await fs.readFile(usersFile, 'utf8');
    return JSON.parse(content || '[]') as User[];
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      await fs.mkdir(path.dirname(usersFile), { recursive: true });
      await fs.writeFile(usersFile, '[]', 'utf8');
      return [];
    }
    throw err;
  }
}

async function writeUsers(users: User[]) {
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf8');
}

export async function findUserByEmail(email: string) {
  const users = await readUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function findUserById(id: string) {
  const users = await readUsers();
  return users.find((u) => u.id === id);
}

export async function createUser({
  email,
  password,
  passwordHash,
  firstName,
  lastName,
}: {
  email: string;
  password?: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
}) {
  const existing = await findUserByEmail(email);
  if (existing) throw new Error('User already exists');
  const finalPasswordHash = passwordHash ? passwordHash : await bcrypt.hash(password || '', 10);
  const user: User = {
    id: randomUUID(),
    email,
    firstName,
    lastName,
    passwordHash: finalPasswordHash,
    createdAt: new Date().toISOString(),
  };
  const users = await readUsers();
  users.push(user);
  await writeUsers(users);
  // return public user
  return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, createdAt: user.createdAt };
}

export async function verifyPassword(user: User, password: string) {
  return bcrypt.compare(password, user.passwordHash);
}

export function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (err) {
    return null;
  }
}

export function setTokenCookie(res: any, token: string) {
  const serialized = cookie.serialize('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  res.setHeader('Set-Cookie', serialized);
}

export function clearTokenCookie(res: any) {
  const serialized = cookie.serialize('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  });
  res.setHeader('Set-Cookie', serialized);
}

export async function getUserFromToken(token: string) {
  const data = verifyToken(token);
  if (!data || typeof data === 'string') return null;
  const userId = (data as any).sub || (data as any).id || (data as any).userId;
  if (!userId) return null;
  return findUserById(userId);
}

export default {
  readUsers,
  writeUsers,
  findUserByEmail,
  findUserById,
  createUser,
  verifyPassword,
  signToken,
  verifyToken,
  setTokenCookie,
  clearTokenCookie,
  getUserFromToken,
};

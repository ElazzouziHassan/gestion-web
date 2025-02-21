// src/lib/auth.ts

import { NextRequest } from 'next/server';
import * as jose from 'jose';

export async function verifyAuth(request: NextRequest) {
  const token = request.headers.get('Authorization')?.split(' ')[1];

  if (!token) {
    return { success: false, error: 'No token provided' };
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    return { success: true, userId: payload.userId as string, role: payload.role as string };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { success: false, error: 'Invalid token' };
  }
}
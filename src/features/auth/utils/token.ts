import { Buffer } from 'buffer';
import type { JWTPayload, User } from '../types';

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  if (typeof atob === 'function') {
    return atob(padded);
  }
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    return JSON.parse(decodeBase64Url(payload)) as JWTPayload;
  } catch {
    return null;
  }
}

export function isTokenValid(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 > Date.now();
}

export function getUserFromToken(token: string): User | null {
  const payload = decodeToken(token);
  if (!payload) return null;
  return {
    id: Number(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']),
    email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
    name: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
    role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
  };
}

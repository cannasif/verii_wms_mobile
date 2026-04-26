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

function pickString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

function readNameFields(payload: JWTPayload): Pick<User, 'firstName' | 'lastName' | 'fullName'> {
  const raw = payload as unknown as Record<string, unknown>;
  const first =
    pickString(raw.firstName) ??
    pickString(raw.FirstName) ??
    pickString(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname']) ??
    pickString(payload.given_name);
  const last =
    pickString(raw.lastName) ??
    pickString(raw.LastName) ??
    pickString(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname']) ??
    pickString(payload.family_name);
  const full =
    pickString(raw.fullName) ?? pickString(raw.FullName) ?? pickString(payload.fullName);
  return { firstName: first, lastName: last, fullName: full };
}

export function getUserFromToken(token: string): User | null {
  const payload = decodeToken(token);
  if (!payload) return null;
  const names = readNameFields(payload);
  return {
    id: Number(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']),
    email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
    name: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
    role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
    ...names,
  };
}

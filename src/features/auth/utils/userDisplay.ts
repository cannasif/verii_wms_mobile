import type { User } from '../types';

/**
 * Panel ve header’da gösterilecek ad soyad: fullName → first+last → username (`name`).
 */
export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return '';
  const full = user.fullName?.trim();
  if (full) return full;
  const fromParts = [user.firstName, user.lastName].filter((s) => (s ?? '').trim().length > 0).join(' ').trim();
  if (fromParts) return fromParts;
  return (user.name ?? '').trim();
}

export function getUserInitialLetter(user: User | null | undefined): string {
  const display = getUserDisplayName(user);
  if (!display) return 'W';
  const first = display.trim()[0];
  return first ? first.toLocaleUpperCase() : 'W';
}

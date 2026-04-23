import type { TFunction } from 'i18next';
import { AppError } from '@/lib/errors';

export type LoginErrorFields = {
  root?: string;
  email?: string;
  password?: string;
  branchId?: string;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function isTechnicalOrInternalMessage(msg: string): boolean {
  const s = msg.trim();
  if (s.length > 400) {
    return true;
  }
  return /exception|jsonexception|donexception|property\s*['"]|doesn.t exist|does not exist|nullreference|stack trace| at \S+\(|system\.|microsoft\.|newtonsoft|deserialization|serialization failed|sql exception|inner exception/i.test(
    s,
  );
}

function userFacingOr(
  msg: string | null | undefined,
  t: TFunction,
  fallback: string,
): string {
  const m = msg?.trim();
  if (!m) {
    return fallback;
  }
  if (isTechnicalOrInternalMessage(m)) {
    return fallback;
  }
  return m;
}

function messageFromResponseBody(data: unknown): string | null {
  if (!isRecord(data)) return null;
  const o = data as Record<string, unknown>;
  if (typeof o.message === 'string' && o.message.trim()) {
    return o.message.trim();
  }
  if (typeof o.exceptionMessage === 'string' && o.exceptionMessage.trim()) {
    return o.exceptionMessage.trim();
  }
  const errs = o.errors;
  if (Array.isArray(errs) && errs.length) {
    const s = errs.filter((e): e is string => typeof e === 'string' && e.trim() !== '').join(' ');
    return s || null;
  }
  if (isRecord(errs)) {
    const parts: string[] = [];
    for (const v of Object.values(errs)) {
      if (Array.isArray(v) && typeof v[0] === 'string' && v[0].trim()) {
        parts.push(v[0]);
      } else if (typeof v === 'string' && v.trim()) {
        parts.push(v);
      }
    }
    if (parts.length) return parts.join(' ');
  }
  return null;
}

function fieldErrorsFromRecord(
  errorsObj: Record<string, unknown>,
  t: TFunction,
): Pick<LoginErrorFields, 'email' | 'password' | 'branchId'> {
  const out: { email?: string; password?: string; branchId?: string } = {};
  for (const [k, v] of Object.entries(errorsObj)) {
    const key = k.toLowerCase();
    const msg = Array.isArray(v) && typeof v[0] === 'string' ? v[0] : typeof v === 'string' ? v : null;
    if (!msg?.trim()) continue;
    const safe = (x: string) => userFacingOr(x, t, t('auth.invalidCredentials'));
    if (key === 'email' || key.includes('mail') || key.includes('e-posta') || key.includes('eposta')) {
      out.email = safe(msg);
    } else if (key === 'password' || key.includes('şifre') || key.includes('parola')) {
      out.password = safe(msg);
    } else if (key.includes('şube') || key.includes('branch') || key === 'branchid' || key === 'sube') {
      out.branchId = safe(msg);
    }
  }
  return out;
}

function fieldErrorsFromBody(data: unknown, t: TFunction): Pick<LoginErrorFields, 'email' | 'password' | 'branchId'> {
  if (!isRecord(data) || !('errors' in data)) {
    return {};
  }
  const o = (data as { errors: unknown }).errors;
  if (o && typeof o === 'object' && !Array.isArray(o)) {
    return fieldErrorsFromRecord(o as Record<string, unknown>, t);
  }
  return {};
}

export function parseLoginError(error: unknown, t: TFunction): LoginErrorFields {
  const app = error instanceof AppError ? error : null;
  const code = (error as { code?: string } | null)?.code;
  const status =
    app?.status ?? (error as { response?: { status?: number } } | null)?.response?.status;
  const details = app?.details;
  const raw = typeof (error as Error | null)?.message === 'string' ? (error as Error).message : app?.message ?? t('auth.loginFailed');

  if (code === 'ERR_NETWORK' || (typeof raw === 'string' && /network request failed|network error/i.test(raw))) {
    return { root: t('auth.networkError') };
  }
  if (code === 'ECONNABORTED' || (typeof raw === 'string' && /timeout|timed out|zaman aşımı/i.test(raw))) {
    return { root: t('auth.requestTimeout') };
  }

  const bodyMsg = details !== undefined ? messageFromResponseBody(details) : null;
  const fieldFromJson = details !== undefined ? fieldErrorsFromBody(details, t) : {};

  if (fieldFromJson.email || fieldFromJson.password || fieldFromJson.branchId) {
    return { ...fieldFromJson };
  }

  if (status && status >= 500) {
    const root = userFacingOr(bodyMsg, t, t('auth.serverError'));
    return { root };
  }

  const credFallback = t('auth.invalidCredentials');

  if (error instanceof Error && !(error instanceof AppError)) {
    const m = userFacingOr(error.message, t, credFallback);
    return { email: m, password: m, root: undefined };
  }

  if (status === 400 || status === 401) {
    const m = userFacingOr(bodyMsg, t, credFallback);
    return { email: m, password: m, root: undefined };
  }

  if (bodyMsg) {
    return { root: userFacingOr(bodyMsg, t, t('auth.loginFailed')) };
  }

  return { root: userFacingOr(raw, t, t('auth.loginFailed')) };
}

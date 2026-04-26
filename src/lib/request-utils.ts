import axios from 'axios';

export type ApiRequestOptions = {
  signal?: AbortSignal;
};

export function isRequestCanceled(error: unknown): boolean {
  if (axios.isCancel(error)) {
    return true;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: string }).name === 'AbortError'
  ) {
    return true;
  }

  if (error instanceof Error) {
    return error.name === 'CanceledError' || error.name === 'AbortError' || error.message === 'canceled';
  }

  return false;
}

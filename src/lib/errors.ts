export interface AppErrorShape {
  message: string;
  status?: number;
  code?: string;
  url?: string;
  method?: string;
  debugMessage?: string;
}

export class AppError extends Error {
  status?: number;
  code?: string;
  url?: string;
  method?: string;
  debugMessage?: string;

  constructor({ message, status, code, url, method, debugMessage }: AppErrorShape) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.url = url;
    this.method = method;
    this.debugMessage = debugMessage;
  }
}

export function normalizeError(error: unknown, fallbackMessage: string): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError({ message: error.message || fallbackMessage, debugMessage: error.stack });
  }

  return new AppError({ message: fallbackMessage });
}

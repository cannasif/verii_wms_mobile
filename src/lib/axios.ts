import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { APP_CONFIG, getApiBaseUrl } from '@/constants/config';
import { storage } from '@/lib/storage';
import { ACCESS_TOKEN_KEY, BRANCH_STORAGE_KEY, LANGUAGE_STORAGE_KEY } from '@/constants/storage';
import type { Branch } from '@/features/auth/types';
import { router } from 'expo-router';
import i18n from '@/locales';
import { useAuthStore } from '@/store/auth';
import { isRequestCanceled } from '@/lib/request-utils';
import { AppError } from '@/lib/errors';
import { addRequestDiagnostic, createRequestDiagnosticId } from '@/lib/requestDiagnostics';

type DiagnosticMeta = {
  startedAt: number;
  requestId: string;
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: APP_CONFIG.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.get<string>(ACCESS_TOKEN_KEY);
    const branchFromStore = useAuthStore.getState().branch;
    const branchFromStorage = await storage.get<Branch>(BRANCH_STORAGE_KEY);
    const branch = branchFromStore ?? branchFromStorage;
    const language = await storage.get<string>(LANGUAGE_STORAGE_KEY);

    config.baseURL = getApiBaseUrl();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['X-Language'] = language || 'tr';

    const branchCode = branch?.code;
    if (branchCode !== undefined && branchCode !== null && String(branchCode).trim() !== '') {
      const normalizedBranchCode = String(branchCode);
      config.headers['X-Branch-Code'] = normalizedBranchCode;
      config.headers.BranchCode = normalizedBranchCode;
    }

    const diagnosticMeta: DiagnosticMeta = {
      startedAt: Date.now(),
      requestId: createRequestDiagnosticId(),
    };
    (config as InternalAxiosRequestConfig & { metadata?: DiagnosticMeta }).metadata = diagnosticMeta;

    if (__DEV__) {
      console.log(`[WMS Mobile API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
        params: config.params,
        data: config.data,
        headers: {
          'X-Language': config.headers['X-Language'],
          'X-Branch-Code': config.headers['X-Branch-Code'],
          BranchCode: config.headers.BranchCode,
        },
      });
    }

    addRequestDiagnostic({
      id: diagnosticMeta.requestId,
      status: 'request',
      timestamp: new Date(diagnosticMeta.startedAt).toISOString(),
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
    });

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => {
    const metadata = (response.config as InternalAxiosRequestConfig & { metadata?: DiagnosticMeta }).metadata;
    const durationMs = metadata ? Date.now() - metadata.startedAt : undefined;

    if (__DEV__) {
      console.log(`[WMS Mobile API Response] ${response.config.method?.toUpperCase()} ${response.config.baseURL}${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    addRequestDiagnostic({
      id: metadata?.requestId ?? createRequestDiagnosticId(),
      status: 'response',
      timestamp: new Date().toISOString(),
      method: response.config.method?.toUpperCase(),
      url: `${response.config.baseURL}${response.config.url}`,
      statusCode: response.status,
      durationMs,
    });
    return response;
  },
  async (error: AxiosError<{ message?: string; exceptionMessage?: string; errors?: string[] }>) => {
    if (isRequestCanceled(error)) {
      return Promise.reject(error);
    }

    const requestUrl = error.config?.url || '';
    const metadata = (error.config as (InternalAxiosRequestConfig & { metadata?: DiagnosticMeta }) | undefined)?.metadata;

    if (error.response?.status === 401 && !requestUrl.includes('/api/auth/login')) {
      await useAuthStore.getState().clearAuth();
      router.replace('/(auth)/login');
    }

    let errorMessage = i18n.t('common.error');
    let debugMessage = '';

    if (error.response?.data) {
      const responseData = error.response.data;
      if (responseData.message) {
        errorMessage = responseData.message;
      } else if (responseData.exceptionMessage) {
        errorMessage = responseData.exceptionMessage;
      } else if (Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        errorMessage = responseData.errors.join(', ');
      }
      debugMessage = JSON.stringify(responseData);
    } else if (error.message) {
      errorMessage = error.message;
      debugMessage = error.message;
    }

    if (__DEV__) {
      console.log('[WMS Mobile API Error]', {
        url: `${error.config?.baseURL || getApiBaseUrl()}${requestUrl}`,
        method: error.config?.method?.toUpperCase(),
        status: error.response?.status,
        message: errorMessage,
        response: error.response?.data,
      });
    }

    addRequestDiagnostic({
      id: metadata?.requestId ?? createRequestDiagnosticId(),
      status: 'error',
      timestamp: new Date().toISOString(),
      method: error.config?.method?.toUpperCase(),
      url: `${error.config?.baseURL || getApiBaseUrl()}${requestUrl}`,
      statusCode: error.response?.status,
      durationMs: metadata ? Date.now() - metadata.startedAt : undefined,
      message: errorMessage,
    });

    return Promise.reject(
      new AppError({
        message: errorMessage,
        status: error.response?.status,
        code: error.code,
        url: `${error.config?.baseURL || getApiBaseUrl()}${requestUrl}`,
        method: error.config?.method?.toUpperCase(),
        debugMessage,
      }),
    );
  }
);

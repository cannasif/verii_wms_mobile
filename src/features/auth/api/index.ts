import i18next from 'i18next';
import { apiClient } from '@/lib/axios';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type {
  ApiResponse,
  Branch,
  BranchErp,
  BranchListResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  LoginRequest,
  LoginResponse,
  LoginResponseData,
  LoginResponsePayload,
  MyPermissionsDto
} from '../types';

const mapBranch = (branch: BranchErp): Branch => ({
  id: String(branch.subeKodu),
  code: String(branch.subeKodu),
  name: branch.unvan?.trim() ? branch.unvan : '-'
});

export const authApi = {
  async getBranches(options?: ApiRequestOptions): Promise<Branch[]> {
    const response = await apiClient.get<BranchListResponse>('/api/Erp/getBranches', options);
    if (!response.data.success) {
      throw new Error(response.data.message || i18next.t('auth.branchListFailed'));
    }
    return response.data.data.map(mapBranch);
  },
  async login(payload: LoginRequest): Promise<string> {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', payload);
    if (!response.data.success) {
      throw new Error(response.data.message || i18next.t('auth.invalidCredentials'));
    }

    const loginData = response.data.data;
    if (typeof loginData === 'string' && loginData.trim()) {
      return loginData;
    }

    if (isLoginResponseObject(loginData) && loginData.token.trim()) {
      return loginData.token;
    }

    throw new Error(i18next.t('auth.invalidToken'));
  },
  async getMyPermissions(): Promise<MyPermissionsDto> {
    const response = await apiClient.get<ApiResponse<MyPermissionsDto>>('/api/auth/me/permissions', {
      params: { platform: 'mobile' },
    });
    if (!response.data.success) {
      throw new Error(response.data.message || i18next.t('common.error'));
    }
    return response.data.data;
  },
  async requestPasswordReset(payload: ForgotPasswordRequest): Promise<string> {
    const response = await apiClient.post<ForgotPasswordResponse>('/api/auth/request-password-reset', payload);
    if (!response.data.success) {
      throw new Error(response.data.message || i18next.t('auth.forgotPassword.error'));
    }

    return response.data.message || i18next.t('auth.forgotPassword.success');
  },
  async resetPassword(payload: ResetPasswordRequest): Promise<string> {
    const response = await apiClient.post<ResetPasswordResponse>('/api/auth/reset-password', payload);
    if (!response.data.success) {
      throw new Error(response.data.message || i18next.t('auth.resetPassword.error'));
    }

    return response.data.message || i18next.t('auth.resetPassword.success');
  }
};

function isLoginResponseObject(value: LoginResponsePayload): value is LoginResponseData {
  return typeof value === 'object' && value !== null && 'token' in value;
}

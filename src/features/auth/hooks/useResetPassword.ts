import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api';
import type { ResetPasswordRequest } from '../types';

export function useResetPassword() {
  return useMutation({
    mutationFn: async (payload: ResetPasswordRequest) => authApi.resetPassword(payload),
  });
}

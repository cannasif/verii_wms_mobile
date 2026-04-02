import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api';
import type { ForgotPasswordRequest } from '../types';

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (payload: ForgotPasswordRequest) => authApi.requestPasswordReset(payload),
  });
}

import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api';
import { useAuthStore } from '@/store/auth';
import type { Branch, LoginRequest } from '../types';

interface LoginWithBranchRequest {
  loginData: LoginRequest;
  branch: Branch;
}

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const setBranch = useAuthStore((state) => state.setBranch);

  return useMutation({
    mutationFn: async ({ loginData }: LoginWithBranchRequest) => authApi.login(loginData),
    onSuccess: async (token, variables) => {
      await setAuth(token);
      await setBranch(variables.branch);
    }
  });
}

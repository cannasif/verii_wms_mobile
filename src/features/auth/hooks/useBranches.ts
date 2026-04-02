import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api';

export function useBranches() {
  return useQuery({
    queryKey: ['auth', 'branches'],
    queryFn: ({ signal }) => authApi.getBranches({ signal }),
    staleTime: 1000 * 60 * 5
  });
}

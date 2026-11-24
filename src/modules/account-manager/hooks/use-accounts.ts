import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllAccountsApi,
  createAccountApi,
  updateAccountApi,
  resetAccountPasswordApi,
  deleteAccountApi,
} from '../../auth/api';
import type { AccountPermissions, AccountRole, AppAccount } from '../../auth/types';

const ACCOUNTS_QUERY_KEY = ['app-accounts'];

export function useAccounts() {
  const queryClient = useQueryClient();

  const {
    data: accounts = [],
    isLoading,
    error,
    refetch,
  } = useQuery<AppAccount[]>({
    queryKey: ACCOUNTS_QUERY_KEY,
    queryFn: fetchAllAccountsApi,
  });

  const createMutation = useMutation({
    mutationFn: async (params: {
      username: string;
      display_name: string;
      password: string;
      role: AccountRole;
      permissions: AccountPermissions;
    }) => {
      const res = await createAccountApi(params);
      if (!res.success || !res.account) {
        throw new Error(res.error || 'Không thể tạo tài khoản.');
      }
      return res.account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (params: {
      id: string;
      display_name: string;
      role: AccountRole;
      is_locked: boolean;
      permissions: AccountPermissions;
    }) => {
      const res = await updateAccountApi(params);
      if (!res.success || !res.account) {
        throw new Error(res.error || 'Không thể cập nhật tài khoản.');
      }
      return res.account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      const res = await resetAccountPasswordApi(id, newPassword);
      if (!res.success) {
        throw new Error(res.error || 'Không thể đặt lại mật khẩu.');
      }
      return true;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteAccountApi(id);
      if (!res.success) {
        throw new Error(res.error || 'Không thể xóa tài khoản.');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
    },
  });

  return {
    accounts,
    isLoading,
    error,
    refetch,
    createAccount: createMutation.mutateAsync,
    updateAccount: updateMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    deleteAccount: deleteMutation.mutateAsync,
    isSaving: updateMutation.isPending || createMutation.isPending,
  };
}

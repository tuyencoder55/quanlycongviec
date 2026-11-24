import React, { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  ALL_PERMISSIONS,
  type AppAccount,
  type AccountPermissions,
  resolvePermissions,
} from '../modules/auth/types';
import { fetchAccountByIdApi, loginAccountApi } from '../modules/auth/api';
import type { UserRole } from '../types/database';

const SESSION_STORAGE_KEY = 'nexus_auth_session_v1';

interface AuthContextType {
  account: AppAccount | null;
  role: UserRole;
  isAdmin: boolean;
  permissions: AccountPermissions;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (
    username: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshAccount: () => Promise<void>;
  // Giữ tương thích nếu có component cũ gọi
  switchDemoRole: (newRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredSession(): AppAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      localStorage.getItem(SESSION_STORAGE_KEY) ||
      sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppAccount;
    if (parsed && parsed.id && parsed.username) {
      return {
        ...parsed,
        permissions: resolvePermissions(parsed.role, parsed.permissions),
      };
    }
  } catch {
    // Bỏ qua lỗi đọc session
  }
  return null;
}

function persistSession(account: AppAccount, rememberMe: boolean): void {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(account);
  if (rememberMe) {
    localStorage.setItem(SESSION_STORAGE_KEY, serialized);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } else {
    sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<AppAccount | null>(readStoredSession);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const syncAccountFromServer = async (current: AppAccount | null) => {
    if (!current) {
      setIsLoading(false);
      return;
    }

    try {
      const fresh = await fetchAccountByIdApi(current.id);
      if (!fresh || fresh.is_locked) {
        // Tài khoản đã bị xóa hoặc bị khóa → tự động đăng xuất ngay
        clearStoredSession();
        setAccount(null);
      } else {
        setAccount(fresh);
        const isRemembered = Boolean(localStorage.getItem(SESSION_STORAGE_KEY));
        persistSession(fresh, isRemembered);
      }
    } catch (err) {
      console.error('Lỗi đồng bộ phiên đăng nhập:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncAccountFromServer(account);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (username: string, password: string, rememberMe = true) => {
    const res = await loginAccountApi(username, password);
    if (!res.success || !res.account) {
      return { error: new Error(res.error || 'Sai tên đăng nhập hoặc mật khẩu.') };
    }
    setAccount(res.account);
    persistSession(res.account, rememberMe);
    return { error: null };
  };

  const signOut = async () => {
    clearStoredSession();
    setAccount(null);
  };

  const refreshAccount = async () => {
    await syncAccountFromServer(account);
  };

  const switchDemoRole = (newRole: UserRole) => {
    if (!account) return;
    const nextRole = newRole === 'admin' ? 'admin' : 'staff';
    const nextAccount: AppAccount = {
      ...account,
      role: nextRole,
      permissions: resolvePermissions(nextRole, account.permissions),
    };
    setAccount(nextAccount);
  };

  const isAdmin = account?.role === 'admin';
  const mappedRole: UserRole = isAdmin ? 'admin' : 'viewer';
  const permissions: AccountPermissions = account
    ? resolvePermissions(account.role, account.permissions)
    : { ...ALL_PERMISSIONS };

  return (
    <AuthContext.Provider
      value={{
        account,
        role: mappedRole,
        isAdmin,
        permissions,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signOut,
        refreshAccount,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
}

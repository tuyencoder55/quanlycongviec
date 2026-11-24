import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  ALL_PERMISSIONS,
  type AppAccount,
  type AccountRole,
  type AccountPermissions,
  resolvePermissions,
} from './types';

// Kho dự phòng cục bộ khi chưa chạy migration 0009_app_accounts.sql trên Supabase
const LOCAL_ACCOUNTS_KEY = 'nexus_local_app_accounts_v1';

interface LocalAccountRecord extends AppAccount {
  password: string;
}

function getDefaultLocalAccounts(): LocalAccountRecord[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'local-admin-001',
      username: 'admin',
      display_name: 'Admin',
      password: 'admin',
      role: 'admin',
      is_locked: false,
      permissions: { ...ALL_PERMISSIONS },
      created_at: now,
      updated_at: now,
    },
  ];
}

export function loadLocalAccounts(): LocalAccountRecord[] {
  if (typeof window === 'undefined') return getDefaultLocalAccounts();
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LocalAccountRecord[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Bỏ qua lỗi JSON
  }
  const initial = getDefaultLocalAccounts();
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(initial));
  return initial;
}

export function saveLocalAccounts(accounts: LocalAccountRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function stripPassword(rec: LocalAccountRecord): AppAccount {
  const { password: _password, ...account } = rec;
  return {
    ...account,
    permissions: resolvePermissions(account.role, account.permissions),
  };
}

function normalizeAccount(raw: AppAccount): AppAccount {
  return {
    ...raw,
    permissions: resolvePermissions(raw.role, raw.permissions),
  };
}

// ============================================================================
// 1. ĐĂNG NHẬP
// ============================================================================
export async function loginAccountApi(
  username: string,
  password: string
): Promise<{ success: boolean; account?: AppAccount; error?: string }> {
  const cleanUser = username.trim().toLowerCase();
  if (!cleanUser || !password) {
    return { success: false, error: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' };
  }

  if (isSupabaseConfigured) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('login_account', {
        p_username: cleanUser,
        p_password: password,
      });

      if (!error && data) {
        if (data.success && data.account) {
          return { success: true, account: normalizeAccount(data.account) };
        }
        return { success: false, error: data.error || 'Sai tên đăng nhập hoặc mật khẩu.' };
      }
      // Nếu lỗi PGRST202 (chưa chạy migration 0009 trên Supabase) → dùng bộ lưu dự phòng
      console.warn('Chưa tìm thấy RPC login_account trên Supabase, dùng bộ lưu cục bộ:', error?.message);
    } catch (err) {
      console.warn('Lỗi gọi login_account:', err);
    }
  }

  const list = loadLocalAccounts();
  const found = list.find((a) => a.username.toLowerCase() === cleanUser);
  if (!found || found.password !== password) {
    return { success: false, error: 'Sai tên đăng nhập hoặc mật khẩu.' };
  }
  if (found.is_locked) {
    return { success: false, error: 'Tài khoản này đã bị khóa. Vui lòng liên hệ Admin.' };
  }
  return { success: true, account: stripPassword(found) };
}

// ============================================================================
// 2. KIỂM TRA LẠI PHIÊN ĐĂNG NHẬP HIỆN TẠI (đồng bộ quyền / trạng thái khóa)
// ============================================================================
export async function fetchAccountByIdApi(id: string): Promise<AppAccount | null> {
  if (isSupabaseConfigured && !id.startsWith('local-')) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_app_account_by_id', {
        p_id: id,
      });
      if (!error && data) {
        return normalizeAccount(data as AppAccount);
      }
    } catch {
      // fallback bên dưới
    }
  }

  const found = loadLocalAccounts().find((a) => a.id === id);
  return found ? stripPassword(found) : null;
}

// ============================================================================
// 3. QUẢN LÝ DANH SÁCH TÀI KHOẢN (CHO ADMIN)
// ============================================================================
export async function fetchAllAccountsApi(): Promise<AppAccount[]> {
  if (isSupabaseConfigured) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('get_app_accounts');
      if (!error && Array.isArray(data)) {
        return (data as AppAccount[]).map(normalizeAccount);
      }
      console.warn('Chưa tìm thấy RPC get_app_accounts, dùng bộ lưu cục bộ:', error?.message);
    } catch {
      // fallback
    }
  }
  return loadLocalAccounts().map(stripPassword);
}

export async function createAccountApi(params: {
  username: string;
  display_name: string;
  password: string;
  role: AccountRole;
  permissions: AccountPermissions;
}): Promise<{ success: boolean; account?: AppAccount; error?: string }> {
  const cleanUsername = params.username.trim().toLowerCase();
  const cleanName = params.display_name.trim();
  const perms = resolvePermissions(params.role, params.permissions);

  if (cleanUsername.length < 2) {
    return { success: false, error: 'Tên đăng nhập phải có ít nhất 2 ký tự.' };
  }
  if (!cleanName) {
    return { success: false, error: 'Vui lòng nhập tên hiển thị.' };
  }
  if (params.password.length < 4) {
    return { success: false, error: 'Mật khẩu phải có ít nhất 4 ký tự.' };
  }

  if (isSupabaseConfigured) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('create_app_account', {
        p_username: cleanUsername,
        p_display_name: cleanName,
        p_password: params.password,
        p_role: params.role,
        p_permissions: perms,
      });
      if (!error && data) {
        if (data.success && data.account) {
          return { success: true, account: normalizeAccount(data.account) };
        }
        return { success: false, error: data.error || 'Không thể tạo tài khoản.' };
      }
    } catch {
      // fallback
    }
  }

  const list = loadLocalAccounts();
  if (list.some((a) => a.username.toLowerCase() === cleanUsername)) {
    return { success: false, error: 'Tên đăng nhập này đã tồn tại.' };
  }
  const now = new Date().toISOString();
  const newRec: LocalAccountRecord = {
    id: `local-acc-${Date.now()}`,
    username: cleanUsername,
    display_name: cleanName,
    password: params.password,
    role: params.role,
    is_locked: false,
    permissions: perms,
    created_at: now,
    updated_at: now,
  };
  saveLocalAccounts([...list, newRec]);
  return { success: true, account: stripPassword(newRec) };
}

export async function updateAccountApi(params: {
  id: string;
  display_name: string;
  role: AccountRole;
  is_locked: boolean;
  permissions: AccountPermissions;
}): Promise<{ success: boolean; account?: AppAccount; error?: string }> {
  const perms = resolvePermissions(params.role, params.permissions);

  if (isSupabaseConfigured && !params.id.startsWith('local-')) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('update_app_account', {
        p_id: params.id,
        p_display_name: params.display_name.trim(),
        p_role: params.role,
        p_is_locked: params.is_locked,
        p_permissions: perms,
      });
      if (!error && data) {
        if (data.success && data.account) {
          return { success: true, account: normalizeAccount(data.account) };
        }
        return { success: false, error: data.error || 'Không thể cập nhật tài khoản.' };
      }
    } catch {
      // fallback
    }
  }

  const list = loadLocalAccounts();
  const idx = list.findIndex((a) => a.id === params.id);
  if (idx === -1) {
    return { success: false, error: 'Không tìm thấy tài khoản.' };
  }
  const updated: LocalAccountRecord = {
    ...list[idx],
    display_name: params.display_name.trim(),
    role: params.role,
    is_locked: params.is_locked,
    permissions: perms,
    updated_at: new Date().toISOString(),
  };
  list[idx] = updated;
  saveLocalAccounts(list);
  return { success: true, account: stripPassword(updated) };
}

export async function resetAccountPasswordApi(
  id: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 4) {
    return { success: false, error: 'Mật khẩu mới phải có ít nhất 4 ký tự.' };
  }

  if (isSupabaseConfigured && !id.startsWith('local-')) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('reset_app_account_password', {
        p_id: id,
        p_new_password: newPassword,
      });
      if (!error && data) {
        return { success: Boolean(data.success), error: data.error };
      }
    } catch {
      // fallback
    }
  }

  const list = loadLocalAccounts();
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) {
    return { success: false, error: 'Không tìm thấy tài khoản.' };
  }
  list[idx] = {
    ...list[idx],
    password: newPassword,
    updated_at: new Date().toISOString(),
  };
  saveLocalAccounts(list);
  return { success: true };
}

export async function deleteAccountApi(id: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured && !id.startsWith('local-')) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('delete_app_account', {
        p_id: id,
      });
      if (!error && data) {
        return { success: Boolean(data.success), error: data.error };
      }
    } catch {
      // fallback
    }
  }

  const list = loadLocalAccounts().filter((a) => a.id !== id);
  saveLocalAccounts(list);
  return { success: true };
}

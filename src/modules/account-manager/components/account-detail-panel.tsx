import React, { useState, useEffect } from 'react';
import { X, Lock, Unlock, Check, KeyRound } from 'lucide-react';
import {
  DEFAULT_STAFF_PASSWORD,
  getAccountInitials,
  resolvePermissions,
  type AccountPermissions,
  type AccountRole,
  type AppAccount,
} from '../../auth/types';
import { PermissionSwitches } from './permission-switches';

interface AccountDetailPanelProps {
  account: AppAccount;
  isCurrentUser: boolean;
  onClose: () => void;
  onSave: (params: {
    id: string;
    display_name: string;
    role: AccountRole;
    is_locked: boolean;
    permissions: AccountPermissions;
  }) => Promise<void>;
  onResetPassword: (id: string, newPassword: string) => Promise<void>;
}

export const AccountDetailPanel: React.FC<AccountDetailPanelProps> = ({
  account,
  isCurrentUser,
  onClose,
  onSave,
  onResetPassword,
}) => {
  const [displayName, setDisplayName] = useState(account.display_name);
  const [role, setRole] = useState<AccountRole>(account.role);
  const [permissions, setPermissions] = useState<AccountPermissions>(() =>
    resolvePermissions(account.role, account.permissions)
  );
  const [isLocked, setIsLocked] = useState(account.is_locked);

  // Trạng thái đặt lại mật khẩu
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState(DEFAULT_STAFF_PASSWORD);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Trạng thái lưu
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(account.display_name);
    setRole(account.role);
    setPermissions(resolvePermissions(account.role, account.permissions));
    setIsLocked(account.is_locked);
    setIsResetOpen(false);
    setNewPassword(DEFAULT_STAFF_PASSWORD);
    setResetMessage(null);
    setSaveMessage(null);
    setErrorMsg(null);
  }, [account]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      setErrorMsg('Tên hiển thị không được để trống.');
      return;
    }
    setErrorMsg(null);
    setIsSaving(true);
    try {
      await onSave({
        id: account.id,
        display_name: displayName.trim(),
        role,
        is_locked: isLocked,
        permissions: resolvePermissions(role, permissions),
      });
      setSaveMessage('Đã lưu thay đổi');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi lưu thay đổi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleLock = async () => {
    if (isCurrentUser) return;
    const nextLocked = !isLocked;
    setIsLocked(nextLocked);
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await onSave({
        id: account.id,
        display_name: displayName.trim() || account.display_name,
        role,
        is_locked: nextLocked,
        permissions: resolvePermissions(role, permissions),
      });
    } catch (err) {
      setIsLocked(!nextLocked);
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái khóa.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmResetPassword = async () => {
    if (newPassword.length < 4) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 4 ký tự.');
      return;
    }
    setErrorMsg(null);
    try {
      await onResetPassword(account.id, newPassword);
      setResetMessage(`Đã đặt mật khẩu mới: ${newPassword}`);
      setIsResetOpen(false);
      setTimeout(() => setResetMessage(null), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi đặt lại mật khẩu.');
    }
  };

  const initials = getAccountInitials(displayName || account.display_name, account.username);

  return (
    <div className="bg-surface border border-[var(--border)] rounded-[12px] p-5 flex flex-col gap-4 h-fit">
      {/* Header tài khoản đang chọn */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-tag-board-bg text-tag-board-text flex items-center justify-center font-mono text-[13px] font-semibold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-text truncate">
              {displayName || account.display_name}
            </div>
            <div className="text-[12px] font-mono text-muted-text truncate">
              {account.username}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-subtle hover:text-text hover:bg-row-hover transition-colors shrink-0"
          title="Đóng bảng chi tiết"
        >
          <X className="w-4 h-4" strokeWidth={1.8} />
        </button>
      </div>

      {/* Tên hiển thị */}
      <div className="space-y-1.5">
        <label className="block text-[12px] font-medium text-text">
          Tên hiển thị
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full h-9 bg-bg border border-[var(--border)] hover:border-[var(--border-strong)] rounded-[10px] px-3 text-[13px] text-text focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface transition-colors"
        />
      </div>

      {/* Tên đăng nhập (chỉ đọc) */}
      <div className="space-y-1.5">
        <label className="block text-[12px] font-medium text-text">
          Tên đăng nhập
        </label>
        <input
          type="text"
          value={account.username}
          disabled
          className="w-full h-9 bg-track border border-[var(--border)] rounded-[10px] px-3 text-[13px] font-mono text-muted-text cursor-not-allowed"
        />
      </div>

      {/* Mật khẩu & Đặt lại mật khẩu */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-medium text-text">Mật khẩu</span>
          <button
            type="button"
            onClick={() => {
              setIsResetOpen((prev) => !prev);
              setNewPassword(DEFAULT_STAFF_PASSWORD);
            }}
            className="h-8 px-3 rounded-[8px] bg-surface border border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-row-hover text-[12px] font-medium text-text inline-flex items-center gap-1.5 transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-subtle" strokeWidth={1.8} />
            <span>Đặt lại mật khẩu</span>
          </button>
        </div>

        {isResetOpen && (
          <div className="p-3 rounded-[10px] bg-bg border border-[var(--border)] space-y-2">
            <div className="text-[11.5px] text-muted-text">
              Nhập mật khẩu mới (mặc định nhân viên: <span className="font-mono text-text">{DEFAULT_STAFF_PASSWORD}</span>)
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex-1 h-8 bg-surface border border-[var(--border)] rounded-[8px] px-2.5 text-[12.5px] font-mono text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleConfirmResetPassword}
                className="h-8 px-3 rounded-[8px] bg-primary text-on-primary text-[12px] font-medium inline-flex items-center gap-1 hover:brightness-110"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </button>
            </div>
          </div>
        )}

        {resetMessage && (
          <div className="text-[12px] text-dot-mold flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{resetMessage}</span>
          </div>
        )}
      </div>

      {/* Vai trò: Nhân viên / Admin */}
      <div className="space-y-1.5">
        <label className="block text-[12px] font-medium text-text">Vai trò</label>
        <div className="grid grid-cols-2 bg-track p-[3px] rounded-[10px] border border-[var(--border)]">
          <button
            type="button"
            disabled={isCurrentUser}
            onClick={() => setRole('staff')}
            className={`h-8 rounded-[7px] text-[13px] transition-colors ${
              role === 'staff'
                ? 'bg-selected text-selected-text font-medium shadow-xs'
                : 'text-muted-text hover:text-text'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Nhân viên
          </button>
          <button
            type="button"
            disabled={isCurrentUser}
            onClick={() => setRole('admin')}
            className={`h-8 rounded-[7px] text-[13px] transition-colors ${
              role === 'admin'
                ? 'bg-selected text-selected-text font-medium shadow-xs'
                : 'text-muted-text hover:text-text'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Admin
          </button>
        </div>
        <p className="text-[11.5px] text-muted-text leading-relaxed">
          Chọn Admin thì tài khoản có toàn quyền, không cần chọn quyền bên dưới.
        </p>
      </div>

      {/* 7 công tắc phân quyền chi tiết */}
      <div className="space-y-1.5 pt-1">
        <div className="text-[12.5px] font-semibold text-text">
          Quyền của nhân viên này
        </div>
        <PermissionSwitches
          permissions={permissions}
          disabled={role === 'admin'}
          onChange={setPermissions}
        />
      </div>

      {/* Thông báo lỗi / thành công */}
      {errorMsg && (
        <div className="p-2.5 rounded-[8px] bg-pdf-bg border border-pdf-border text-pdf-text text-[12px]">
          {errorMsg}
        </div>
      )}
      {saveMessage && (
        <div className="text-[12px] text-dot-mold flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Nút Khóa tài khoản & Lưu thay đổi */}
      <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-[var(--border)]">
        {!isCurrentUser ? (
          <button
            type="button"
            disabled={isSaving}
            onClick={handleToggleLock}
            className={`h-9 px-3 rounded-[10px] border text-[12.5px] font-medium inline-flex items-center gap-1.5 transition-colors ${
              isLocked
                ? 'border-dot-mold/40 text-dot-mold hover:bg-emerald-500/10'
                : 'border-pdf-border text-pdf-text hover:bg-pdf-bg'
            }`}
          >
            {isLocked ? (
              <>
                <Unlock className="w-3.5 h-3.5" strokeWidth={1.8} />
                <span>Mở khóa</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" strokeWidth={1.8} />
                <span>Khóa tài khoản</span>
              </>
            )}
          </button>
        ) : (
          <span className="text-[11.5px] text-subtle">Tài khoản đang dùng</span>
        )}

        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="h-9 px-4 rounded-[10px] bg-primary hover:brightness-110 text-on-primary text-[13px] font-semibold transition-all disabled:opacity-50"
        >
          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </div>
  );
};

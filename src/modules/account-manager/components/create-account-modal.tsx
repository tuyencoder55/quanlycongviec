import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import { Copy, Check, Eye, EyeOff, UserPlus } from 'lucide-react';
import {
  DEFAULT_STAFF_PASSWORD,
  DEFAULT_STAFF_PERMISSIONS,
  resolvePermissions,
  type AccountPermissions,
  type AccountRole,
} from '../../auth/types';
import { PermissionSwitches } from './permission-switches';

interface CreateAccountModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (params: {
    username: string;
    display_name: string;
    password: string;
    role: AccountRole;
    permissions: AccountPermissions;
  }) => Promise<void>;
}

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onOpenChange,
  onCreate,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(DEFAULT_STAFF_PASSWORD);
  const [showPassword, setShowPassword] = useState(true);
  const [role, setRole] = useState<AccountRole>('staff');
  const [permissions, setPermissions] = useState<AccountPermissions>({
    ...DEFAULT_STAFF_PERMISSIONS,
  });
  const [copiedPass, setCopiedPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setDisplayName('');
    setUsername('');
    setPassword(DEFAULT_STAFF_PASSWORD);
    setShowPassword(true);
    setRole('staff');
    setPermissions({ ...DEFAULT_STAFF_PERMISSIONS });
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!displayName.trim()) {
      setErrorMsg('Vui lòng nhập tên hiển thị (VD: Nhân viên 01).');
      return;
    }
    if (username.trim().length < 2) {
      setErrorMsg('Tên đăng nhập phải có ít nhất 2 ký tự (viết liền không dấu).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        username: username.trim().toLowerCase(),
        display_name: displayName.trim(),
        password,
        role,
        permissions: resolvePermissions(role, permissions),
      });
      resetForm();
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể tạo tài khoản.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 1500);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) resetForm();
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-[480px] bg-surface border-[var(--border)] rounded-[14px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-ai-bg border border-ai-border flex items-center justify-center text-ai-text">
              <UserPlus className="w-4 h-4" strokeWidth={1.8} />
            </div>
            <div>
              <DialogTitle className="text-[16px] font-bold text-text">
                Tạo tài khoản mới
              </DialogTitle>
              <DialogDescription className="text-[12px] text-muted-text">
                Cấp tài khoản cho nhân viên và chọn sẵn các quyền được phép dùng.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-text">
                Tên hiển thị *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="VD: Nhân viên 01"
                required
                className="w-full h-9 bg-bg border border-[var(--border)] rounded-[10px] px-3 text-[13px] text-text placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-text">
                Tên đăng nhập *
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                placeholder="VD: nv01"
                required
                className="w-full h-9 bg-bg border border-[var(--border)] rounded-[10px] px-3 text-[13px] font-mono text-text placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Mật khẩu mặc định 123456aA@ */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[12px] font-medium text-text">
                Mật khẩu mặc định
              </label>
              <span className="text-[11px] font-mono text-subtle">
                Mặc định: {DEFAULT_STAFF_PASSWORD}
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-9 bg-bg border border-[var(--border)] rounded-[10px] pl-3 pr-16 text-[13px] font-mono text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center text-subtle hover:text-text hover:bg-track"
                  title="Sao chép mật khẩu"
                >
                  {copiedPass ? (
                    <Check className="w-3.5 h-3.5 text-dot-mold" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center text-subtle hover:text-text hover:bg-track"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Chọn vai trò */}
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-text">Vai trò</label>
            <div className="grid grid-cols-2 bg-track p-[3px] rounded-[10px] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setRole('staff')}
                className={`h-8 rounded-[7px] text-[13px] transition-colors ${
                  role === 'staff'
                    ? 'bg-selected text-selected-text font-medium shadow-xs'
                    : 'text-muted-text hover:text-text'
                }`}
              >
                Nhân viên
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`h-8 rounded-[7px] text-[13px] transition-colors ${
                  role === 'admin'
                    ? 'bg-selected text-selected-text font-medium shadow-xs'
                    : 'text-muted-text hover:text-text'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* 7 công tắc phân quyền */}
          <div className="space-y-1">
            <div className="text-[12.5px] font-semibold text-text">
              Quyền của tài khoản này
            </div>
            <div className="p-3 rounded-[10px] bg-bg border border-[var(--border)]">
              <PermissionSwitches
                permissions={permissions}
                disabled={role === 'admin'}
                onChange={setPermissions}
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-[8px] bg-pdf-bg border border-pdf-border text-pdf-text text-[12px]">
              {errorMsg}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded-[10px] bg-surface border border-[var(--border)] hover:bg-row-hover text-[13px] font-medium text-text"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-4 rounded-[10px] bg-primary hover:brightness-110 text-on-primary text-[13px] font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

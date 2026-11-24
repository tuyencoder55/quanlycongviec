import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Pencil, Lock, Unlock, Trash2, Users } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import { useAccounts } from './hooks/use-accounts';
import {
  getAccountInitials,
  summarizePermissions,
  type AppAccount,
} from '../auth/types';
import { AccountDetailPanel } from './components/account-detail-panel';
import { CreateAccountModal } from './components/create-account-modal';

type AccountFilter = 'all' | 'admin' | 'staff' | 'locked';

export const AccountManager: React.FC = () => {
  const { account: currentAccount, refreshAccount } = useAuth();
  const {
    accounts,
    isLoading,
    createAccount,
    updateAccount,
    resetPassword,
    deleteAccount,
  } = useAccounts();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<AccountFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Tự chọn tài khoản đầu tiên khi tải xong
  useEffect(() => {
    if (!selectedId && accounts.length > 0) {
      const firstStaff = accounts.find((a) => a.role === 'staff');
      setSelectedId((firstStaff || accounts[0]).id);
    } else if (selectedId && !accounts.some((a) => a.id === selectedId)) {
      setSelectedId(accounts[0]?.id ?? null);
    }
  }, [accounts, selectedId]);

  const filteredAccounts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return accounts.filter((acc) => {
      if (q) {
        const match =
          acc.display_name.toLowerCase().includes(q) ||
          acc.username.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filter === 'admin') return acc.role === 'admin';
      if (filter === 'staff') return acc.role === 'staff';
      if (filter === 'locked') return acc.is_locked;
      return true;
    });
  }, [accounts, searchTerm, filter]);

  const selectedAccount: AppAccount | null =
    accounts.find((a) => a.id === selectedId) ?? null;

  const handleQuickToggleLock = async (e: React.MouseEvent, acc: AppAccount) => {
    e.stopPropagation();
    if (acc.id === currentAccount?.id) return;
    await updateAccount({
      id: acc.id,
      display_name: acc.display_name,
      role: acc.role,
      is_locked: !acc.is_locked,
      permissions: acc.permissions,
    });
  };

  const handleQuickDelete = async (e: React.MouseEvent, acc: AppAccount) => {
    e.stopPropagation();
    if (acc.id === currentAccount?.id) return;
    if (
      window.confirm(
        `Anh có chắc chắn muốn xóa vĩnh viễn tài khoản "${acc.display_name}" (${acc.username}) không?`
      )
    ) {
      await deleteAccount(acc.id);
      if (selectedId === acc.id) {
        setSelectedId(null);
      }
    }
  };

  return (
    <div className="flex flex-col h-full space-y-5 overflow-y-auto pr-0.5">
      {/* Header trang Quản lý tài khoản */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-[22px] font-bold text-text tracking-[-0.02em] leading-tight">
            Quản lý tài khoản
          </h1>
          <p className="text-[13px] text-muted-text mt-1">
            Admin có toàn quyền. Tạo tài khoản cho nhân viên và chọn việc mỗi người được làm.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="h-10 px-4 rounded-[10px] bg-primary hover:brightness-110 text-on-primary text-[13px] font-semibold inline-flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>Tạo tài khoản</span>
        </button>
      </div>

      {/* Bố cục 2 cột: Danh sách tài khoản (trái) + Chi tiết phân quyền (phải) */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
        {/* CỘT TRÁI: Thẻ danh sách tài khoản */}
        <div className="bg-surface border border-[var(--border)] rounded-[12px] overflow-hidden">
          {/* Thanh tìm kiếm & lọc trạng thái */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 border-b border-[var(--border)]">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              <div className="relative w-full sm:w-[240px]">
                <Search
                  className="w-[15px] h-[15px] absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
                  strokeWidth={1.8}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm tên hoặc tên đăng nhập"
                  className="w-full h-9 bg-bg border border-[var(--border)] hover:border-[var(--border-strong)] rounded-[10px] pl-9 pr-3 text-[13px] text-text placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="inline-flex items-center bg-track p-[3px] rounded-[10px] border border-[var(--border)]">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'admin', label: 'Admin' },
                  { id: 'staff', label: 'Nhân viên' },
                  { id: 'locked', label: 'Đã khóa' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilter(tab.id as AccountFilter)}
                    className={`h-8 px-3 rounded-[7px] text-[13px] transition-colors ${
                      filter === tab.id
                        ? 'bg-selected text-selected-text font-medium shadow-xs'
                        : 'text-muted-text hover:text-text'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[12px] font-mono text-muted-text px-1 shrink-0 tabular-nums">
              {filteredAccounts.length} tài khoản
            </div>
          </div>

          {/* Tiêu đề cột */}
          <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_110px_140px_104px] items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] text-[12px] text-subtle font-medium select-none">
            <span>Tài khoản</span>
            <span>Vai trò</span>
            <span>Trạng thái</span>
            <span />
          </div>

          {/* Danh sách các dòng tài khoản */}
          {isLoading ? (
            <div className="p-10 text-center text-[13px] text-muted-text">
              Đang tải danh sách tài khoản...
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Users className="w-8 h-8 text-faint mx-auto" strokeWidth={1.6} />
              <div className="text-[13px] font-medium text-text">
                Không tìm thấy tài khoản nào
              </div>
              <div className="text-[12px] text-muted-text">
                Thử đổi từ khóa lọc hoặc bấm "+ Tạo tài khoản" để thêm nhân viên mới.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {filteredAccounts.map((acc) => {
                const isMe = acc.id === currentAccount?.id;
                const isSelected = acc.id === selectedId;
                const initials = getAccountInitials(acc.display_name, acc.username);

                return (
                  <div
                    key={acc.id}
                    onClick={() => setSelectedId(acc.id)}
                    className={`grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_110px_140px_104px] items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary/[0.08]'
                        : 'bg-row hover:bg-row-hover'
                    }`}
                  >
                    {/* Cột 1: Avatar + Tên + Username & tóm tắt quyền */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-[12px] font-semibold shrink-0 ${
                          acc.role === 'admin'
                            ? 'bg-tag-board-bg text-tag-board-text'
                            : 'bg-track text-muted-text border border-[var(--border)]'
                        }`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-semibold text-text truncate">
                          {acc.display_name}
                          {isMe && (
                            <span className="font-normal text-muted-text"> (bạn)</span>
                          )}
                        </div>
                        <div className="text-[12px] text-muted-text truncate mt-0.5">
                          <span className="font-mono">{acc.username}</span>
                          <span className="mx-1.5 text-faint">·</span>
                          <span>{summarizePermissions(acc)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cột 2: Vai trò */}
                    <div className="flex items-center">
                      {acc.role === 'admin' ? (
                        <span className="px-2.5 py-0.5 rounded-[6px] text-[12px] font-medium bg-tag-board-bg text-tag-board-text">
                          Admin
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-[6px] text-[12px] font-medium bg-track text-text">
                          Nhân viên
                        </span>
                      )}
                    </div>

                    {/* Cột 3: Trạng thái */}
                    <div className="flex items-center gap-1.5 text-[12.5px]">
                      <span
                        className={`w-[7px] h-[7px] rounded-full shrink-0 ${
                          acc.is_locked ? 'bg-subtle' : 'bg-dot-mold'
                        }`}
                      />
                      <span
                        className={acc.is_locked ? 'text-muted-text' : 'text-text'}
                      >
                        {acc.is_locked ? 'Đã khóa' : 'Đang hoạt động'}
                      </span>
                    </div>

                    {/* Cột 4: Nút thao tác nhanh (Sửa, Khóa/Mở, Xóa) */}
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(acc.id);
                        }}
                        className="w-8 h-8 rounded-[8px] flex items-center justify-center text-subtle hover:text-text hover:bg-track transition-colors"
                        title="Chỉnh sửa & phân quyền"
                      >
                        <Pencil className="w-[15px] h-[15px]" strokeWidth={1.8} />
                      </button>

                      {!isMe && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleQuickToggleLock(e, acc)}
                            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-subtle hover:text-text hover:bg-track transition-colors"
                            title={acc.is_locked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          >
                            {acc.is_locked ? (
                              <Unlock className="w-[15px] h-[15px] text-dot-mold" strokeWidth={1.8} />
                            ) : (
                              <Lock className="w-[15px] h-[15px]" strokeWidth={1.8} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleQuickDelete(e, acc)}
                            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-subtle hover:text-pdf-text hover:bg-pdf-bg transition-colors"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-[15px] h-[15px]" strokeWidth={1.8} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CỘT PHẢI: Chi tiết & 7 công tắc phân quyền */}
        {selectedAccount && (
          <AccountDetailPanel
            account={selectedAccount}
            isCurrentUser={selectedAccount.id === currentAccount?.id}
            onClose={() => setSelectedId(null)}
            onSave={async (params) => {
              await updateAccount(params);
              if (params.id === currentAccount?.id) {
                await refreshAccount();
              }
            }}
            onResetPassword={async (id, newPassword) => {
              await resetPassword({ id, newPassword });
            }}
          />
        )}
      </div>

      {/* Modal tạo tài khoản mới */}
      <CreateAccountModal
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={async (params) => {
          const created = await createAccount(params);
          setSelectedId(created.id);
        }}
      />
    </div>
  );
};

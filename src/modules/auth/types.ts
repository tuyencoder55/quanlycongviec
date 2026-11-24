// Định nghĩa kiểu dữ liệu cho hệ thống tài khoản & phân quyền 7 chức năng

export type AccountRole = 'admin' | 'staff';

export interface AccountPermissions {
  // Luôn bật cho mọi tài khoản
  can_view: boolean;
  // Ghi nhận xuất: thêm bản ghi xuất mới
  can_create_export: boolean;
  // Thêm file và ảnh: tải PDF, ảnh đơn xuất lên, tạo thư mục
  can_upload_files: boolean;
  // AI Quét ảnh: đọc mã từ ảnh bằng AI
  can_ai_scan: boolean;
  // Sửa thông tin: sửa bản ghi đã có
  can_edit: boolean;
  // Xóa: xóa file, thư mục, bản ghi
  can_delete: boolean;
  // Xuất CSV: tải dữ liệu về máy
  can_export_csv: boolean;
}

export interface AppAccount {
  id: string;
  username: string;
  display_name: string;
  role: AccountRole;
  is_locked: boolean;
  permissions: AccountPermissions;
  created_at: string;
  updated_at: string;
}

export const ALL_PERMISSIONS: AccountPermissions = {
  can_view: true,
  can_create_export: true,
  can_upload_files: true,
  can_ai_scan: true,
  can_edit: true,
  can_delete: true,
  can_export_csv: true,
};

export const DEFAULT_STAFF_PERMISSIONS: AccountPermissions = {
  can_view: true,
  can_create_export: false,
  can_upload_files: false,
  can_ai_scan: false,
  can_edit: false,
  can_delete: false,
  can_export_csv: true,
};

// Mật khẩu mặc định khi Admin tạo tài khoản nhân viên mới
export const DEFAULT_STAFF_PASSWORD = '123456aA@';

export interface PermissionItemMeta {
  key: keyof AccountPermissions;
  label: string;
  description: string;
  alwaysOn?: boolean;
}

export const PERMISSION_ITEMS: PermissionItemMeta[] = [
  {
    key: 'can_view',
    label: 'Xem danh sách tra cứu',
    description: 'Luôn bật cho mọi tài khoản',
    alwaysOn: true,
  },
  {
    key: 'can_create_export',
    label: 'Ghi nhận xuất',
    description: 'Thêm bản ghi xuất mới',
  },
  {
    key: 'can_upload_files',
    label: 'Thêm file và ảnh',
    description: 'Tải PDF, ảnh đơn xuất lên',
  },
  {
    key: 'can_ai_scan',
    label: 'AI Quét ảnh',
    description: 'Đọc mã từ ảnh bằng AI',
  },
  {
    key: 'can_edit',
    label: 'Sửa thông tin',
    description: 'Sửa bản ghi đã có',
  },
  {
    key: 'can_delete',
    label: 'Xóa',
    description: 'Xóa file, thư mục, bản ghi',
  },
  {
    key: 'can_export_csv',
    label: 'Xuất CSV',
    description: 'Tải dữ liệu về máy',
  },
];

// Chuẩn hóa quyền (Admin luôn có toàn quyền; Nhân viên luôn có can_view = true)
export function resolvePermissions(
  role: AccountRole,
  raw?: Partial<AccountPermissions> | null
): AccountPermissions {
  if (role === 'admin') {
    return { ...ALL_PERMISSIONS };
  }
  return {
    can_view: true,
    can_create_export: Boolean(raw?.can_create_export),
    can_upload_files: Boolean(raw?.can_upload_files),
    can_ai_scan: Boolean(raw?.can_ai_scan),
    can_edit: Boolean(raw?.can_edit),
    can_delete: Boolean(raw?.can_delete),
    can_export_csv: Boolean(raw?.can_export_csv),
  };
}

// Tạo mô tả tóm tắt quyền hiển thị dưới tên tài khoản (VD: "Xem, ghi nhận xuất, thêm file")
export function summarizePermissions(account: AppAccount): string {
  if (account.role === 'admin') return 'Toàn quyền';

  const perms = resolvePermissions(account.role, account.permissions);
  const parts: string[] = ['Xem'];
  if (perms.can_create_export) parts.push('ghi nhận xuất');
  if (perms.can_upload_files) parts.push('thêm file');
  if (perms.can_ai_scan) parts.push('AI quét');
  if (perms.can_edit) parts.push('sửa');
  if (perms.can_delete) parts.push('xóa');

  if (parts.length === 1) return 'Chỉ xem';
  return parts.join(', ');
}

// Lấy 2 chữ cái viết tắt cho avatar tròn (VD: "Admin" -> "AD", "Nhân viên 01" -> "N1")
export function getAccountInitials(displayName: string, username: string): string {
  const words = displayName.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const first = words[0][0] || '';
    const last = words[words.length - 1];
    // Nếu từ cuối là số (VD: "01", "02") lấy chữ số cuối để ra N1, N2 giống thiết kế
    const lastChar = /^\d+$/.test(last) ? last.slice(-1) : last[0] || '';
    return (first + lastChar).toUpperCase();
  }
  return (displayName.slice(0, 2) || username.slice(0, 2) || 'US').toUpperCase();
}

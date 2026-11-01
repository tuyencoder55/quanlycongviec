/**
 * Cấu hình bật/tắt các module tính năng trong hệ thống (Feature Flags)
 * 
 * - Đổi thành true để hiển thị module
 * - Đổi thành false để ẩn module hoàn toàn trên mọi thiết bị
 * 
 * Toàn bộ code và logic của các module được bảo toàn nguyên vẹn 100%,
 * chỉ cần đổi giá trị tại đây là giao diện tự động đồng bộ trên tất cả máy tính & điện thoại.
 */
export const APP_FEATURES = {
  // Quản lý công việc (Bảng Kanban & Danh sách việc)
  showKanban: false,

  // Kho lưu trữ lịch sử công việc đã hoàn tất (Task hoàn thành)
  showCompleted: false,

  // Quản lý tra cứu xuất khuôn bảng
  showExports: true,

  // Trình quét ảnh thông minh AI & Thêm hàng loạt
  showBulkScanner: true,
} as const;

// Xác định Tab mặc định khi mở ứng dụng (Ưu tiên module đang bật)
export const DEFAULT_ACTIVE_TAB = APP_FEATURES.showKanban
  ? 'kanban'
  : APP_FEATURES.showExports
  ? 'search'
  : 'bulk';

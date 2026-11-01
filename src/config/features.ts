/**
 * Cấu hình bật/tắt các module tính năng trong hệ thống (Feature Flags)
 */

export interface FeatureConfig {
  showKanban: boolean;
  showCompleted: boolean;
  showBulkScanner: boolean;
}

export const STORAGE_KEY_FEATURES = 'nexus_features_config';

// Cấu hình mặc định: Ẩn Danh sách việc và Task hoàn thành
export const DEFAULT_FEATURES: FeatureConfig = {
  showKanban: false,
  showCompleted: false,
  showBulkScanner: true,
};

// Đọc cấu hình từ localStorage khi tải trang
export function getInitialFeatures(): FeatureConfig {
  if (typeof window === 'undefined') return DEFAULT_FEATURES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FEATURES);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        showKanban: typeof parsed.showKanban === 'boolean' ? parsed.showKanban : DEFAULT_FEATURES.showKanban,
        showCompleted: typeof parsed.showCompleted === 'boolean' ? parsed.showCompleted : DEFAULT_FEATURES.showCompleted,
        showBulkScanner: typeof parsed.showBulkScanner === 'boolean' ? parsed.showBulkScanner : DEFAULT_FEATURES.showBulkScanner,
      };
    }
  } catch (e) {
    console.error('Lỗi đọc cấu hình features:', e);
  }
  return DEFAULT_FEATURES;
}

// Lưu cấu hình vào localStorage
export function saveFeatures(features: FeatureConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_FEATURES, JSON.stringify(features));
  } catch (e) {
    console.error('Lỗi lưu cấu hình features:', e);
  }
}

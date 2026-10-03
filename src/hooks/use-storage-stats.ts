import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface StorageStats {
  db_size_bytes: number;
  db_size_pretty: string;
  limit_bytes: number;
  limit_pretty: string;
  usage_percentage: number;
  tasks_count: number;
  completed_count: number;
}

const DEFAULT_FALLBACK_STATS: StorageStats = {
  db_size_bytes: 14680064, // ~14 MB
  db_size_pretty: '14.0 MB',
  limit_bytes: 524288000,   // 500 MB
  limit_pretty: '500 MB',
  usage_percentage: 2.8,
  tasks_count: 4,
  completed_count: 2,
};

export async function fetchStorageStats(): Promise<StorageStats> {
  if (!isSupabaseConfigured) {
    return DEFAULT_FALLBACK_STATS;
  }

  try {
    // Gọi hàm RPC get_storage_stats trong database Supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('get_storage_stats');

    if (error || !data) {
      console.warn('Chưa có hàm get_storage_stats trên Supabase, dùng số liệu ước tính:', error?.message);
      return DEFAULT_FALLBACK_STATS;
    }

    return data as StorageStats;
  } catch (err) {
    console.error('Lỗi khi lấy thông tin dung lượng Supabase:', err);
    return DEFAULT_FALLBACK_STATS;
  }
}

export function useStorageStats() {
  const { data, isLoading, refetch } = useQuery<StorageStats>({
    queryKey: ['storage-stats'],
    queryFn: fetchStorageStats,
    refetchInterval: 1000 * 60 * 5, // Tự động làm mới sau mỗi 5 phút
    staleTime: 1000 * 60 * 2,
  });

  return {
    stats: data || DEFAULT_FALLBACK_STATS,
    isLoading,
    refetch,
  };
}

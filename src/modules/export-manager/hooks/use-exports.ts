import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchExportsApi,
  createExportApi,
  updateExportApi,
  deleteExportApi,
} from '../api';
import type { ExportItem, ExportFormData, ExportStats } from '../types';
import type { ExportRow } from '../../../types/database';

export function useExports() {
  const queryClient = useQueryClient();
  const queryKey = ['exports-list'];

  const { data: exportsList = [], isLoading, error, refetch } = useQuery<ExportItem[]>({
    queryKey,
    queryFn: fetchExportsApi,
    staleTime: 1000 * 60 * 2, // 2 phút
  });

  const createMutation = useMutation({
    mutationFn: async (formData: ExportFormData) => {
      return createExportApi(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ExportRow> }) => {
      return updateExportApi(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteExportApi(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Tính toán số liệu thống kê
  const stats: ExportStats = {
    total: exportsList.length,
    boardCount: new Set(exportsList.map((e) => e.board_code).filter(Boolean)).size,
    moldCount: new Set(exportsList.map((e) => e.mold_code).filter(Boolean)).size,
    poCount: exportsList.filter((e) => e.type === 'po' || e.ref_value).length,
  };

  // Hàm tiện ích kiểm tra xem một mã đã từng xuất xưởng chưa
  const checkIsExported = (boardCode?: string | null, moldCode?: string | null, poValue?: string | null) => {
    const isBoardExported = Boolean(
      boardCode && exportsList.some((e) => e.type === 'board' && e.board_code.toLowerCase() === boardCode.toLowerCase())
    );
    const isMoldExported = Boolean(
      moldCode && exportsList.some((e) => e.type === 'mold' && e.mold_code && e.mold_code.toLowerCase() === moldCode.toLowerCase())
    );
    const isPoExported = Boolean(
      boardCode && poValue && exportsList.some((e) => e.type === 'po' && e.board_code.toLowerCase() === boardCode.toLowerCase() && e.ref_value === poValue)
    );

    return {
      isBoardExported,
      isMoldExported,
      isPoExported,
    };
  };

  return {
    exportsList,
    stats,
    isLoading,
    error,
    refetch,
    createExport: createMutation.mutateAsync,
    updateExport: updateMutation.mutateAsync,
    deleteExport: deleteMutation.mutateAsync,
    checkIsExported,
  };
}

// Định nghĩa kiểu dữ liệu cơ sở dữ liệu Supabase

export type UserRole = 'admin' | 'viewer';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';
export type RefKind = 'po' | 'date';
export type ExportType = 'board' | 'mold' | 'po';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ColumnRow {
  id: string;
  title: string;
  position: number;
  created_at: string;
}

export interface TaskRow {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: PriorityLevel;
  labels: string[];
  position: number;
  done: boolean;
  archived: boolean;
  board_code: string | null;
  mold_code: string | null;
  ref_kind: RefKind | null;
  ref_value: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExportRow {
  id: string;
  type: ExportType;
  board_code: string;
  mold_code: string | null;
  ref_kind: RefKind | null;
  ref_value: string | null;
  full_name: string;
  exported_at: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          role?: UserRole;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string | null;
          updated_at?: string;
        };
      };
      columns: {
        Row: ColumnRow;
        Insert: {
          id?: string;
          title: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          position?: number;
        };
      };
      tasks: {
        Row: TaskRow;
        Insert: {
          id?: string;
          column_id: string;
          title: string;
          description?: string | null;
          due_date?: string | null;
          priority?: PriorityLevel;
          labels?: string[];
          position?: number;
          done?: boolean;
          archived?: boolean;
          board_code?: string | null;
          mold_code?: string | null;
          ref_kind?: RefKind | null;
          ref_value?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          column_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          priority?: PriorityLevel;
          labels?: string[];
          position?: number;
          done?: boolean;
          archived?: boolean;
          board_code?: string | null;
          mold_code?: string | null;
          ref_kind?: RefKind | null;
          ref_value?: string | null;
          updated_at?: string;
        };
      };
      exports: {
        Row: ExportRow;
        Insert: {
          id?: string;
          type: ExportType;
          board_code: string;
          mold_code?: string | null;
          ref_kind?: RefKind | null;
          ref_value?: string | null;
          full_name: string;
          exported_at?: string;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: ExportType;
          board_code?: string;
          mold_code?: string | null;
          ref_kind?: RefKind | null;
          ref_value?: string | null;
          full_name?: string;
          exported_at?: string;
          note?: string | null;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_storage_stats: {
        Args: Record<string, never>;
        Returns: Record<string, unknown>;
      };
    };
  };
}

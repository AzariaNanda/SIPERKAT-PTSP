export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      data_peminjaman: {
        Row: {
          asset_id: string
          butuh_supir: string | null
          catatan_admin: string | null
          created_at: string
          email: string
          id: string
          jam_mulai: string
          jam_selesai: string
          jenis_asset: Database["public"]["Enums"]["jenis_asset"]
          jumlah_peserta: number | null
          keperluan: string
          nama_pemohon: string
          nip: string
          status: Database["public"]["Enums"]["status_peminjaman"]
          tgl_mulai: string
          tgl_selesai: string
          timestamp: string
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id: string
          butuh_supir?: string | null
          catatan_admin?: string | null
          created_at?: string
          email: string
          id?: string
          jam_mulai: string
          jam_selesai: string
          jenis_asset: Database["public"]["Enums"]["jenis_asset"]
          jumlah_peserta?: number | null
          keperluan: string
          nama_pemohon: string
          nip: string
          status?: Database["public"]["Enums"]["status_peminjaman"]
          tgl_mulai: string
          tgl_selesai: string
          timestamp?: string
          unit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          butuh_supir?: string | null
          catatan_admin?: string | null
          created_at?: string
          email?: string
          id?: string
          jam_mulai?: string
          jam_selesai?: string
          jenis_asset?: Database["public"]["Enums"]["jenis_asset"]
          jumlah_peserta?: number | null
          keperluan?: string
          nama_pemohon?: string
          nip?: string
          status?: Database["public"]["Enums"]["status_peminjaman"]
          tgl_mulai?: string
          tgl_selesai?: string
          timestamp?: string
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      master_kendaraan: {
        Row: {
          created_at: string
          foto_url: string | null
          id: string
          nama_kendaraan: string
          no_polisi: string
          penempatan: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          foto_url?: string | null
          id?: string
          nama_kendaraan: string
          no_polisi: string
          penempatan: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          foto_url?: string | null
          id?: string
          nama_kendaraan?: string
          no_polisi?: string
          penempatan?: string
          updated_at?: string
        }
        Relationships: []
      }
      master_ruangan: {
        Row: {
          created_at: string
          foto_url: string | null
          id: string
          kapasitas: number
          lokasi: string
          nama_ruangan: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          foto_url?: string | null
          id?: string
          kapasitas?: number
          lokasi: string
          nama_ruangan: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          foto_url?: string | null
          id?: string
          kapasitas?: number
          lokasi?: string
          nama_ruangan?: string
          updated_at?: string
        }
        Relationships: []
      }
      pegawai_whitelist: {
        Row: {
          created_at: string
          email: string
          is_registered: boolean
          nama_pegawai: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          is_registered?: boolean
          nama_pegawai?: string | null
          role?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          is_registered?: boolean
          nama_pegawai?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      data_peminjaman_masked: {
        Row: {
          asset_id: string | null
          butuh_supir: string | null
          catatan_admin: string | null
          created_at: string | null
          email: string | null
          id: string | null
          jam_mulai: string | null
          jam_selesai: string | null
          jenis_asset: Database["public"]["Enums"]["jenis_asset"] | null
          jumlah_peserta: number | null
          keperluan: string | null
          nama_pemohon: string | null
          nip: string | null
          status: Database["public"]["Enums"]["status_peminjaman"] | null
          tgl_mulai: string | null
          tgl_selesai: string | null
          timestamp: string | null
          unit: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          asset_id?: string | null
          butuh_supir?: string | null
          catatan_admin?: string | null
          created_at?: string | null
          email?: never
          id?: string | null
          jam_mulai?: string | null
          jam_selesai?: string | null
          jenis_asset?: Database["public"]["Enums"]["jenis_asset"] | null
          jumlah_peserta?: number | null
          keperluan?: string | null
          nama_pemohon?: never
          nip?: never
          status?: Database["public"]["Enums"]["status_peminjaman"] | null
          tgl_mulai?: string | null
          tgl_selesai?: string | null
          timestamp?: string | null
          unit?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          asset_id?: string | null
          butuh_supir?: string | null
          catatan_admin?: string | null
          created_at?: string | null
          email?: never
          id?: string | null
          jam_mulai?: string | null
          jam_selesai?: string | null
          jenis_asset?: Database["public"]["Enums"]["jenis_asset"] | null
          jumlah_peserta?: number | null
          keperluan?: string | null
          nama_pemohon?: never
          nip?: never
          status?: Database["public"]["Enums"]["status_peminjaman"] | null
          tgl_mulai?: string | null
          tgl_selesai?: string | null
          timestamp?: string | null
          unit?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_whitelist_email: { Args: { _email: string }; Returns: boolean }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_email_registered: { Args: { _email: string }; Returns: boolean }
      mask_nip: { Args: { nip_text: string }; Returns: string }
      process_new_user_whitelist: {
        Args: { _email: string; _user_id: string }
        Returns: undefined
      }
      sync_role_by_email: {
        Args: { _email: string; _new_role: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      jenis_asset: "kendaraan" | "ruangan"
      status_peminjaman: "Pending" | "Disetujui" | "Ditolak" | "Konflik"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      jenis_asset: ["kendaraan", "ruangan"],
      status_peminjaman: ["Pending", "Disetujui", "Ditolak", "Konflik"],
    },
  },
} as const

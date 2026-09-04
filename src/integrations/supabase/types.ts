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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contabil_lancamentos: {
        Row: {
          aliquota_efetiva: number
          caixa: number
          created_at: string
          divida_financeira: number
          ebit: number
          ebitda: number
          ibm: string
          id: string
          lucro_liquido: number
          mes: string
          pl_final: number
          pl_inicial: number
          receita_liquida: number
          updated_at: string
          wacc: number
        }
        Insert: {
          aliquota_efetiva?: number
          caixa?: number
          created_at?: string
          divida_financeira?: number
          ebit?: number
          ebitda?: number
          ibm: string
          id?: string
          lucro_liquido?: number
          mes: string
          pl_final?: number
          pl_inicial?: number
          receita_liquida?: number
          updated_at?: string
          wacc?: number
        }
        Update: {
          aliquota_efetiva?: number
          caixa?: number
          created_at?: string
          divida_financeira?: number
          ebit?: number
          ebitda?: number
          ibm?: string
          id?: string
          lucro_liquido?: number
          mes?: string
          pl_final?: number
          pl_inicial?: number
          receita_liquida?: number
          updated_at?: string
          wacc?: number
        }
        Relationships: []
      }
      fzap_config: {
        Row: {
          base_url: string | null
          id: string
          instance_id: string | null
          instance_name: string | null
          last_test_at: string | null
          last_test_result: string | null
          updated_at: string
        }
        Insert: {
          base_url?: string | null
          id?: string
          instance_id?: string | null
          instance_name?: string | null
          last_test_at?: string | null
          last_test_result?: string | null
          updated_at?: string
        }
        Update: {
          base_url?: string | null
          id?: string
          instance_id?: string | null
          instance_name?: string | null
          last_test_at?: string | null
          last_test_result?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fzap_eventos: {
        Row: {
          error: string | null
          event_type: string | null
          from_me: boolean
          id: string
          instance_id: string | null
          message_id: string | null
          payload: Json | null
          phone: string | null
          received_at: string
          result: string
        }
        Insert: {
          error?: string | null
          event_type?: string | null
          from_me?: boolean
          id?: string
          instance_id?: string | null
          message_id?: string | null
          payload?: Json | null
          phone?: string | null
          received_at?: string
          result?: string
        }
        Update: {
          error?: string | null
          event_type?: string | null
          from_me?: boolean
          id?: string
          instance_id?: string | null
          message_id?: string | null
          payload?: Json | null
          phone?: string | null
          received_at?: string
          result?: string
        }
        Relationships: []
      }
      mia_contatos: {
        Row: {
          ativo: boolean
          created_at: string
          ibms: string[]
          limite_diario: number
          nome: string | null
          telefone: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          ibms?: string[]
          limite_diario?: number
          nome?: string | null
          telefone: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          ibms?: string[]
          limite_diario?: number
          nome?: string | null
          telefone?: string
        }
        Relationships: []
      }
      mia_mensagens: {
        Row: {
          created_at: string
          id: string
          papel: string
          telefone: string
          texto: string
        }
        Insert: {
          created_at?: string
          id?: string
          papel: string
          telefone: string
          texto: string
        }
        Update: {
          created_at?: string
          id?: string
          papel?: string
          telefone?: string
          texto?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

/**
 * Tipos do banco — GERADO a partir do schema real do projeto Supabase.
 *
 * Não edite à mão acima da seção "Atalhos usados pelo app". Para regerar:
 *
 *     npm run db:types
 *
 * (equivale a `supabase gen types typescript --linked`)
 */

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
      habito_registros: {
        Row: {
          criado_em: string
          data: string
          habito_id: string
          id: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          data?: string
          habito_id: string
          id?: string
          usuario_id: string
        }
        Update: {
          criado_em?: string
          data?: string
          habito_id?: string
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habito_registros_habito_id_fkey"
            columns: ["habito_id"]
            isOneToOne: false
            referencedRelation: "habitos"
            referencedColumns: ["id"]
          },
        ]
      }
      habitos: {
        Row: {
          agenda: boolean[]
          arquivado: boolean
          atualizado_em: string
          cor: Database["public"]["Enums"]["paleta"]
          criado_em: string
          emoji: string
          id: string
          nome: string
          ordem: number
          usuario_id: string
        }
        Insert: {
          agenda?: boolean[]
          arquivado?: boolean
          atualizado_em?: string
          cor?: Database["public"]["Enums"]["paleta"]
          criado_em?: string
          emoji?: string
          id?: string
          nome: string
          ordem?: number
          usuario_id: string
        }
        Update: {
          agenda?: boolean[]
          arquivado?: boolean
          atualizado_em?: string
          cor?: Database["public"]["Enums"]["paleta"]
          criado_em?: string
          emoji?: string
          id?: string
          nome?: string
          ordem?: number
          usuario_id?: string
        }
        Relationships: []
      }
      itens: {
        Row: {
          atualizado_em: string
          criado_em: string
          data: string
          feito: boolean
          id: string
          lista: Database["public"]["Enums"]["lista_tipo"]
          tag_id: string | null
          texto: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data?: string
          feito?: boolean
          id?: string
          lista: Database["public"]["Enums"]["lista_tipo"]
          tag_id?: string | null
          texto: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data?: string
          feito?: boolean
          id?: string
          lista?: Database["public"]["Enums"]["lista_tipo"]
          tag_id?: string | null
          texto?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          acento: string
          atualizado_em: string
          comemoracao: boolean
          criado_em: string
          id: string
          nome: string
          progresso_circular: boolean
        }
        Insert: {
          acento?: string
          atualizado_em?: string
          comemoracao?: boolean
          criado_em?: string
          id: string
          nome?: string
          progresso_circular?: boolean
        }
        Update: {
          acento?: string
          atualizado_em?: string
          comemoracao?: boolean
          criado_em?: string
          id?: string
          nome?: string
          progresso_circular?: boolean
        }
        Relationships: []
      }
      tags: {
        Row: {
          cor: Database["public"]["Enums"]["paleta"]
          criado_em: string
          id: string
          lista: Database["public"]["Enums"]["lista_tipo"]
          nome: string
          usuario_id: string
        }
        Insert: {
          cor?: Database["public"]["Enums"]["paleta"]
          criado_em?: string
          id?: string
          lista: Database["public"]["Enums"]["lista_tipo"]
          nome: string
          usuario_id: string
        }
        Update: {
          cor?: Database["public"]["Enums"]["paleta"]
          criado_em?: string
          id?: string
          lista?: Database["public"]["Enums"]["lista_tipo"]
          nome?: string
          usuario_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consistencia: {
        Args: { p_fim: string; p_inicio: string }
        Returns: {
          feitos: number
          id_habito: string
          meta: number
        }[]
      }
      pct_do_dia: { Args: { p_data?: string }; Returns: number }
      resumo_conquistas: {
        Args: never
        Returns: {
          dias_com_registro: number
          dias_completos: number
          total_conclusoes: number
        }[]
      }
      resumo_periodo: {
        Args: { p_fim: string; p_inicio: string }
        Returns: {
          dia: string
          pct: number
        }[]
      }
      streak_atual: { Args: never; Returns: number }
    }
    Enums: {
      lista_tipo: "estudos" | "tarefas"
      paleta:
        | "rosa"
        | "lilas"
        | "roxo"
        | "menta"
        | "pessego"
        | "ceu"
        | "amarelo"
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
      lista_tipo: ["estudos", "tarefas"],
      paleta: ["rosa", "lilas", "roxo", "menta", "pessego", "ceu", "amarelo"],
    },
  },
} as const

// ---------------------------------------------------------------------------
// Atalhos usados pelo app.
//
// Escritos à mão sobre os tipos gerados acima: sobrevivem a um `npm run db:types`
// se você recolar esta seção no fim do arquivo.
// ---------------------------------------------------------------------------

export type Paleta = Database['public']['Enums']['paleta'];
export type ListaTipo = Database['public']['Enums']['lista_tipo'];

type Tabelas = Database['public']['Tables'];

export type LinhaPerfil = Tabelas['perfis']['Row'];
export type LinhaHabito = Tabelas['habitos']['Row'];
export type LinhaRegistro = Tabelas['habito_registros']['Row'];
export type LinhaTag = Tabelas['tags']['Row'];
export type LinhaItem = Tabelas['itens']['Row'];

// =============================================================================
// OPTEK Database Types — Auto-generated from Supabase schema
// DO NOT EDIT MANUALLY. Regenerate with: node write_types.mjs
// Last generated: 2026-02-21T10:35:27.850Z
// =============================================================================

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
      api_usage_log: {
        Row: {
          cost_estimated_cents: number
          endpoint: string
          id: string
          model: string
          timestamp: string
          tokens_in: number
          tokens_out: number
          user_id: string | null
        }
        Insert: {
          cost_estimated_cents?: number
          endpoint: string
          id?: string
          model: string
          timestamp?: string
          tokens_in?: number
          tokens_out?: number
          user_id?: string | null
        }
        Update: {
          cost_estimated_cents?: number
          endpoint?: string
          id?: string
          model?: string
          timestamp?: string
          tokens_in?: number
          tokens_out?: number
          user_id?: string | null
        }
        Relationships: []
      }
      cambios_legislativos: {
        Row: {
          fecha_deteccion: string
          hash_anterior: string
          hash_nuevo: string
          id: string
          legislacion_id: string
          procesado: boolean
          texto_anterior: string
          texto_nuevo: string
          tipo_cambio: string
        }
        Insert: {
          fecha_deteccion?: string
          hash_anterior: string
          hash_nuevo: string
          id?: string
          legislacion_id: string
          procesado?: boolean
          texto_anterior: string
          texto_nuevo: string
          tipo_cambio: string
        }
        Update: {
          fecha_deteccion?: string
          hash_anterior?: string
          hash_nuevo?: string
          id?: string
          legislacion_id?: string
          procesado?: boolean
          texto_anterior?: string
          texto_nuevo?: string
          tipo_cambio?: string
        }
        Relationships: [
          {
            foreignKeyName: "cambios_legislativos_legislacion_id_fkey"
            columns: ["legislacion_id"]
            isOneToOne: false
            referencedRelation: "legislacion"
            referencedColumns: ["id"]
          },
        ]
      }
      compras: {
        Row: {
          amount_paid: number
          created_at: string
          id: string
          oposicion_id: string
          stripe_checkout_session_id: string
          tema_id: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          id?: string
          oposicion_id: string
          stripe_checkout_session_id: string
          tema_id?: string | null
          tipo: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          id?: string
          oposicion_id?: string
          stripe_checkout_session_id?: string
          tema_id?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      desarrollos: {
        Row: {
          citas_verificadas: Json | null
          created_at: string
          evaluacion: Json | null
          id: string
          prompt_version: string
          tema_id: string
          texto_usuario: string
          user_id: string
        }
        Insert: {
          citas_verificadas?: Json | null
          created_at?: string
          evaluacion?: Json | null
          id?: string
          prompt_version: string
          tema_id: string
          texto_usuario: string
          user_id: string
        }
        Update: {
          citas_verificadas?: Json | null
          created_at?: string
          evaluacion?: Json | null
          id?: string
          prompt_version?: string
          tema_id?: string
          texto_usuario?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "desarrollos_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "temas"
            referencedColumns: ["id"]
          },
        ]
      }
      examenes_oficiales: {
        Row: {
          anio: number
          convocatoria: string
          id: string
          oposicion_id: string
          preguntas: Json
        }
        Insert: {
          anio: number
          convocatoria: string
          id?: string
          oposicion_id: string
          preguntas?: Json
        }
        Update: {
          anio?: number
          convocatoria?: string
          id?: string
          oposicion_id?: string
          preguntas?: Json
        }
        Relationships: [
          {
            foreignKeyName: "examenes_oficiales_oposicion_id_fkey"
            columns: ["oposicion_id"]
            isOneToOne: false
            referencedRelation: "oposiciones"
            referencedColumns: ["id"]
          },
        ]
      }
      legislacion: {
        Row: {
          activo: boolean
          apartado: string | null
          articulo_numero: string
          created_at: string
          embedding: string | null
          fecha_ultima_verificacion: string
          hash_sha256: string
          id: string
          ley_codigo: string
          ley_nombre: string
          ley_nombre_completo: string
          tema_ids: string[]
          texto_integro: string
          titulo_capitulo: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          apartado?: string | null
          articulo_numero: string
          created_at?: string
          embedding?: string | null
          fecha_ultima_verificacion?: string
          hash_sha256: string
          id?: string
          ley_codigo: string
          ley_nombre: string
          ley_nombre_completo: string
          tema_ids?: string[]
          texto_integro: string
          titulo_capitulo: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          apartado?: string | null
          articulo_numero?: string
          created_at?: string
          embedding?: string | null
          fecha_ultima_verificacion?: string
          hash_sha256?: string
          id?: string
          ley_codigo?: string
          ley_nombre?: string
          ley_nombre_completo?: string
          tema_ids?: string[]
          texto_integro?: string
          titulo_capitulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      oposiciones: {
        Row: {
          activa: boolean
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          num_temas: number
          slug: string
        }
        Insert: {
          activa?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          num_temas?: number
          slug: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          num_temas?: number
          slug?: string
        }
        Relationships: []
      }
      preguntas_reportadas: {
        Row: {
          created_at: string
          estado: string
          id: string
          motivo: string
          pregunta_index: number
          test_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          motivo: string
          pregunta_index: number
          test_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          motivo?: string
          pregunta_index?: number
          test_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preguntas_reportadas_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests_generados"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          corrections_balance: number
          created_at: string
          email: string
          fecha_examen: string | null
          free_corrector_used: number
          free_tests_used: number
          full_name: string | null
          horas_diarias_estudio: number | null
          id: string
          oposicion_id: string | null
          updated_at: string
        }
        Insert: {
          corrections_balance?: number
          created_at?: string
          email: string
          fecha_examen?: string | null
          free_corrector_used?: number
          free_tests_used?: number
          full_name?: string | null
          horas_diarias_estudio?: number | null
          id: string
          oposicion_id?: string | null
          updated_at?: string
        }
        Update: {
          corrections_balance?: number
          created_at?: string
          email?: string
          fecha_examen?: string | null
          free_corrector_used?: number
          free_tests_used?: number
          full_name?: string | null
          horas_diarias_estudio?: number | null
          id?: string
          oposicion_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_oposicion_id_fkey"
            columns: ["oposicion_id"]
            isOneToOne: false
            referencedRelation: "oposiciones"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events_processed: {
        Row: {
          event_type: string
          id: string
          processed_at: string
          stripe_event_id: string
        }
        Insert: {
          event_type: string
          id?: string
          processed_at?: string
          stripe_event_id: string
        }
        Update: {
          event_type?: string
          id?: string
          processed_at?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
      suscripciones: {
        Row: {
          created_at: string
          estado: string
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          stripe_subscription_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estado: string
          fecha_fin?: string | null
          fecha_inicio: string
          id?: string
          stripe_subscription_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          stripe_subscription_id?: string
          user_id?: string
        }
        Relationships: []
      }
      temas: {
        Row: {
          descripcion: string | null
          id: string
          numero: number
          oposicion_id: string
          titulo: string
        }
        Insert: {
          descripcion?: string | null
          id?: string
          numero: number
          oposicion_id: string
          titulo: string
        }
        Update: {
          descripcion?: string | null
          id?: string
          numero?: number
          oposicion_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "temas_oposicion_id_fkey"
            columns: ["oposicion_id"]
            isOneToOne: false
            referencedRelation: "oposiciones"
            referencedColumns: ["id"]
          },
        ]
      }
      tests_generados: {
        Row: {
          completado: boolean
          created_at: string
          id: string
          preguntas: Json
          prompt_version: string
          puntuacion: number | null
          respuestas_usuario: Json | null
          tema_id: string | null
          tiempo_segundos: number | null
          tipo: string
          user_id: string
        }
        Insert: {
          completado?: boolean
          created_at?: string
          id?: string
          preguntas?: Json
          prompt_version: string
          puntuacion?: number | null
          respuestas_usuario?: Json | null
          tema_id?: string | null
          tiempo_segundos?: number | null
          tipo: string
          user_id: string
        }
        Update: {
          completado?: boolean
          created_at?: string
          id?: string
          preguntas?: Json
          prompt_version?: string
          puntuacion?: number | null
          respuestas_usuario?: Json | null
          tema_id?: string | null
          tiempo_segundos?: number | null
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_generados_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "temas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_stats: {
        Args: { p_user_id: string }
        Returns: {
          desarrollos_enviados: number
          media_puntuacion: number
          racha_dias: number
          temas_cubiertos: number
          tests_completados: number
        }[]
      }
      grant_corrections: {
        Args: { p_user_id: string; p_amount: number }
        Returns: undefined
      }
      increment_free_corrector: {
        Args: { p_max?: number; p_user_id: string }
        Returns: boolean
      }
      increment_free_tests: {
        Args: { p_max?: number; p_user_id: string }
        Returns: boolean
      }
      match_legislacion: {
        Args: {
          filter_oposicion?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          apartado: string
          articulo_numero: string
          id: string
          ley_codigo: string
          ley_nombre: string
          similarity: number
          texto_integro: string
          titulo_capitulo: string
        }[]
      }
      search_legislacion: {
        Args: { match_count?: number; query_text: string }
        Returns: {
          apartado: string
          articulo_numero: string
          id: string
          ley_codigo: string
          ley_nombre: string
          rank: number
          texto_integro: string
          titulo_capitulo: string
        }[]
      }
      use_correction: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      use_free_correction: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      use_free_test: {
        Args: { p_user_id: string }
        Returns: boolean
      }
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
    Enums: {},
  },
} as const

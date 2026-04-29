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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string
          id: string
          user_id: string
          user_name: string
          user_unit: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          user_id: string
          user_name: string
          user_unit: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          user_id?: string
          user_name?: string
          user_unit?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          competence: string
          created_at: string
          file_url: string | null
          hours: number
          id: string
          reviewer_note: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          competence?: string
          created_at?: string
          file_url?: string | null
          hours?: number
          id?: string
          reviewer_note?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          competence?: string
          created_at?: string
          file_url?: string | null
          hours?: number
          id?: string
          reviewer_note?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      compliance_badges: {
        Row: {
          code: string
          color: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          required_count: number | null
          rule_type: string
          rule_value: string | null
        }
        Insert: {
          code: string
          color?: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          name: string
          required_count?: number | null
          rule_type: string
          rule_value?: string | null
        }
        Update: {
          code?: string
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          required_count?: number | null
          rule_type?: string
          rule_value?: string | null
        }
        Relationships: []
      }
      course_evaluations: {
        Row: {
          certificate_id: string | null
          comment: string | null
          course_id: string | null
          created_at: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          certificate_id?: string | null
          comment?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          certificate_id?: string | null
          comment?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_evaluations_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_evaluations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          active: boolean
          campaign_month: number | null
          competence: string
          compliance_category: string | null
          created_at: string
          description: string | null
          external_url: string
          hours: number
          id: string
          image_url: string | null
          is_compliance: boolean
          provider: string | null
          title: string
        }
        Insert: {
          active?: boolean
          campaign_month?: number | null
          competence?: string
          compliance_category?: string | null
          created_at?: string
          description?: string | null
          external_url?: string
          hours?: number
          id?: string
          image_url?: string | null
          is_compliance?: boolean
          provider?: string | null
          title: string
        }
        Update: {
          active?: boolean
          campaign_month?: number | null
          competence?: string
          compliance_category?: string | null
          created_at?: string
          description?: string | null
          external_url?: string
          hours?: number
          id?: string
          image_url?: string | null
          is_compliance?: boolean
          provider?: string | null
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          area: string
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          manager_id: string | null
          must_change_password: boolean
          name: string
          total_hours: number
          unit: string
          visible_in_ranking: boolean
        }
        Insert: {
          area?: string
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          manager_id?: string | null
          must_change_password?: boolean
          name: string
          total_hours?: number
          unit?: string
          visible_in_ranking?: boolean
        }
        Update: {
          area?: string
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          manager_id?: string | null
          must_change_password?: boolean
          name?: string
          total_hours?: number
          unit?: string
          visible_in_ranking?: boolean
        }
        Relationships: []
      }
      team_tasks: {
        Row: {
          assigned_by: string
          assigned_to: string
          created_at: string
          description: string | null
          due_date: string | null
          evidence_note: string | null
          evidence_url: string | null
          id: string
          status: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          evidence_note?: string | null
          evidence_url?: string | null
          id?: string
          status?: string
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          evidence_note?: string | null
          evidence_url?: string | null
          id?: string
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      unit_goals: {
        Row: {
          goal_hours: number
          id: string
          unit: string
          updated_at: string
        }
        Insert: {
          goal_hours?: number
          id?: string
          unit: string
          updated_at?: string
        }
        Update: {
          goal_hours?: number
          id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_compliance_badges: {
        Row: {
          badge_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_compliance_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "compliance_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "gestor"
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
      app_role: ["admin", "user", "gestor"],
    },
  },
} as const

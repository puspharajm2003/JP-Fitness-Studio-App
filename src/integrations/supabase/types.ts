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
      attendance: {
        Row: {
          check_in: string
          date: string
          id: string
          user_id: string
        }
        Insert: {
          check_in?: string
          date?: string
          id?: string
          user_id: string
        }
        Update: {
          check_in?: string
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      diet_plans: {
        Row: {
          assigned_date: string
          created_at: string
          file_url: string | null
          id: string
          notes: string | null
          title: string
          user_id: string
        }
        Insert: {
          assigned_date?: string
          created_at?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          title: string
          user_id: string
        }
        Update: {
          assigned_date?: string
          created_at?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      food_logs: {
        Row: {
          carbs_g: number | null
          created_at: string
          date: string
          fat_g: number | null
          id: string
          kcal: number | null
          meal_time: string | null
          minerals: string[] | null
          name: string
          protein_g: number | null
          user_id: string
          vitamins: string[] | null
        }
        Insert: {
          carbs_g?: number | null
          created_at?: string
          date?: string
          fat_g?: number | null
          id?: string
          kcal?: number | null
          meal_time?: string | null
          minerals?: string[] | null
          name: string
          protein_g?: number | null
          user_id: string
          vitamins?: string[] | null
        }
        Update: {
          carbs_g?: number | null
          created_at?: string
          date?: string
          fat_g?: number | null
          id?: string
          kcal?: number | null
          meal_time?: string | null
          minerals?: string[] | null
          name?: string
          protein_g?: number | null
          user_id?: string
          vitamins?: string[] | null
        }
        Relationships: []
      }
      measurement_logs: {
        Row: {
          arms_in: number | null
          chest_in: number | null
          created_at: string
          date: string
          hips_in: number | null
          id: string
          thighs_in: number | null
          user_id: string
          waist_in: number | null
        }
        Insert: {
          arms_in?: number | null
          chest_in?: number | null
          created_at?: string
          date?: string
          hips_in?: number | null
          id?: string
          thighs_in?: number | null
          user_id: string
          waist_in?: number | null
        }
        Update: {
          arms_in?: number | null
          chest_in?: number | null
          created_at?: string
          date?: string
          hips_in?: number | null
          id?: string
          thighs_in?: number | null
          user_id?: string
          waist_in?: number | null
        }
        Relationships: []
      }
      medication_logs: {
        Row: {
          id: string
          medication_id: string | null
          status: string
          taken_at: string
          user_id: string
        }
        Insert: {
          id?: string
          medication_id?: string | null
          status?: string
          taken_at?: string
          user_id: string
        }
        Update: {
          id?: string
          medication_id?: string | null
          status?: string
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean | null
          created_at: string
          dose: string | null
          id: string
          name: string
          schedule_times: string[] | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          dose?: string | null
          id?: string
          name: string
          schedule_times?: string[] | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          dose?: string | null
          id?: string
          name?: string
          schedule_times?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          price: number
          start_date: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          name: string
          price?: number
          start_date?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          price?: number
          start_date?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coach_phone: string | null
          created_at: string
          daily_calorie_goal: number | null
          daily_step_goal: number | null
          daily_water_goal_ml: number | null
          dob: string | null
          full_name: string | null
          gender: string | null
          goal: string | null
          height_cm: number | null
          id: string
          loyalty_points: number | null
          phone: string | null
          sleep_goal_hr: number | null
          target_weight_kg: number | null
          theme: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          coach_phone?: string | null
          created_at?: string
          daily_calorie_goal?: number | null
          daily_step_goal?: number | null
          daily_water_goal_ml?: number | null
          dob?: string | null
          full_name?: string | null
          gender?: string | null
          goal?: string | null
          height_cm?: number | null
          id: string
          loyalty_points?: number | null
          phone?: string | null
          sleep_goal_hr?: number | null
          target_weight_kg?: number | null
          theme?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          coach_phone?: string | null
          created_at?: string
          daily_calorie_goal?: number | null
          daily_step_goal?: number | null
          daily_water_goal_ml?: number | null
          dob?: string | null
          full_name?: string | null
          gender?: string | null
          goal?: string | null
          height_cm?: number | null
          id?: string
          loyalty_points?: number | null
          phone?: string | null
          sleep_goal_hr?: number | null
          target_weight_kg?: number | null
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          id: string
          points_cost: number
          redeemed_at: string
          reward_name: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          points_cost: number
          redeemed_at?: string
          reward_name: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          points_cost?: number
          redeemed_at?: string
          reward_name?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      sleep_logs: {
        Row: {
          date: string
          hours: number
          id: string
          quality: string | null
          user_id: string
        }
        Insert: {
          date?: string
          hours: number
          id?: string
          quality?: string | null
          user_id: string
        }
        Update: {
          date?: string
          hours?: number
          id?: string
          quality?: string | null
          user_id?: string
        }
        Relationships: []
      }
      step_logs: {
        Row: {
          date: string
          id: string
          steps: number
          user_id: string
        }
        Insert: {
          date?: string
          id?: string
          steps: number
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          steps?: number
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      water_logs: {
        Row: {
          amount_ml: number
          date: string
          id: string
          logged_at: string
          user_id: string
        }
        Insert: {
          amount_ml?: number
          date?: string
          id?: string
          logged_at?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          date?: string
          id?: string
          logged_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          calories: number | null
          created_at: string
          date: string
          duration_min: number | null
          id: string
          muscle_groups: string[] | null
          name: string
          user_id: string
        }
        Insert: {
          calories?: number | null
          created_at?: string
          date?: string
          duration_min?: number | null
          id?: string
          muscle_groups?: string[] | null
          name: string
          user_id: string
        }
        Update: {
          calories?: number | null
          created_at?: string
          date?: string
          duration_min?: number | null
          id?: string
          muscle_groups?: string[] | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          created_at: string
          day_of_week: string | null
          exercises: Json | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week?: string | null
          exercises?: Json | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: string | null
          exercises?: Json | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_point_logs: {
        Row: {
          id: string
          user_id: string
          points_change: number
          reason: string
          related_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          points_change?: number
          reason?: string
          related_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          points_change?: number
          reason?: string
          related_id?: string | null
          created_at?: string
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
      redeem_reward: {
        Args: { _points_cost: number; _reward_name: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "member" | "coach" | "admin"
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
      app_role: ["member", "coach", "admin"],
    },
  },
} as const

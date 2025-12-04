export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      player_quest_branches: {
        Row: {
          created_at: string
          id: string
          player_id: string
          player_quest_id: string
          quest_branch_id: string
          quest_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          player_quest_id: string
          quest_branch_id: string
          quest_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          player_quest_id?: string
          quest_branch_id?: string
          quest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_quest_branches_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_quest_branches_player_quest_id_fkey"
            columns: ["player_quest_id"]
            isOneToOne: false
            referencedRelation: "player_quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_quest_branches_quest_branch_id_fkey"
            columns: ["quest_branch_id"]
            isOneToOne: false
            referencedRelation: "quest_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_quest_branches_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      player_quests: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          in_progressed_at: string | null
          player_id: string
          quest_id: string
          status: Database["public"]["Enums"]["player_quest_status"]
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          in_progressed_at?: string | null
          player_id: string
          quest_id: string
          status?: Database["public"]["Enums"]["player_quest_status"]
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          in_progressed_at?: string | null
          player_id?: string
          quest_id?: string
          status?: Database["public"]["Enums"]["player_quest_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_quests_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          appearance: number
          avatar: string | null
          bio: string | null
          charm: number
          created_at: string
          deleted_at: string | null
          health: number
          id: string
          intelligence: number
          name: string
          refinement: number
          stamina: number
          strength: number
          stress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          appearance?: number
          avatar?: string | null
          bio?: string | null
          charm?: number
          created_at?: string
          deleted_at?: string | null
          health?: number
          id?: string
          intelligence?: number
          name: string
          refinement?: number
          stamina?: number
          strength?: number
          stress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          appearance?: number
          avatar?: string | null
          bio?: string | null
          charm?: number
          created_at?: string
          deleted_at?: string | null
          health?: number
          id?: string
          intelligence?: number
          name?: string
          refinement?: number
          stamina?: number
          strength?: number
          stress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quest_branches: {
        Row: {
          created_at: string
          display_order: number
          id: string
          parent_quest_branch_id: string | null
          quest_id: string
          title: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          parent_quest_branch_id?: string | null
          quest_id: string
          title?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          parent_quest_branch_id?: string | null
          quest_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_branches_parent_quest_branch_id_fkey"
            columns: ["parent_quest_branch_id"]
            isOneToOne: false
            referencedRelation: "quest_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_branches_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_triggers: {
        Row: {
          created_at: string
          id: string
          quest_id: string
          type: Database["public"]["Enums"]["quest_trigger_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          quest_id: string
          type: Database["public"]["Enums"]["quest_trigger_type"]
        }
        Update: {
          created_at?: string
          id?: string
          quest_id?: string
          type?: Database["public"]["Enums"]["quest_trigger_type"]
        }
        Relationships: [
          {
            foreignKeyName: "quest_triggers_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          priority: number
          status: Database["public"]["Enums"]["quest_status"]
          title: string
          type: Database["public"]["Enums"]["quest_type"]
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          priority?: number
          status?: Database["public"]["Enums"]["quest_status"]
          title: string
          type?: Database["public"]["Enums"]["quest_type"]
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          priority?: number
          status?: Database["public"]["Enums"]["quest_status"]
          title?: string
          type?: Database["public"]["Enums"]["quest_type"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          type: Database["public"]["Enums"]["user_role_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          type: Database["public"]["Enums"]["user_role_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          type?: Database["public"]["Enums"]["user_role_type"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_me: { Args: { check_user_id: string }; Returns: boolean }
      is_my_player: { Args: { check_player_id: string }; Returns: boolean }
    }
    Enums: {
      player_quest_status: "available" | "in_progress" | "completed"
      quest_status: "draft" | "published"
      quest_trigger_type: "todo_complete"
      quest_type: "primary" | "secondary"
      user_role_type: "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      player_quest_status: ["available", "in_progress", "completed"],
      quest_status: ["draft", "published"],
      quest_trigger_type: ["todo_complete"],
      quest_type: ["primary", "secondary"],
      user_role_type: ["admin"],
    },
  },
} as const


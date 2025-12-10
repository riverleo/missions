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
      chapters: {
        Row: {
          created_at: string
          id: string
          order: number
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          order: number
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          order?: number
          title?: string
        }
        Relationships: []
      }
      dice: {
        Row: {
          created_at: string
          faces: number
          id: string
          is_default: boolean
          title: string
        }
        Insert: {
          created_at?: string
          faces: number
          id?: string
          is_default?: boolean
          title: string
        }
        Update: {
          created_at?: string
          faces?: number
          id?: string
          is_default?: boolean
          title?: string
        }
        Relationships: []
      }
      dice_roll: {
        Row: {
          created_at: string
          difficulty_class: number
          failure_action: Database["public"]["Enums"]["dice_roll_action"]
          failure_narrative_node_id: string | null
          id: string
          success_action: Database["public"]["Enums"]["dice_roll_action"]
          success_narrative_node_id: string | null
        }
        Insert: {
          created_at?: string
          difficulty_class: number
          failure_action: Database["public"]["Enums"]["dice_roll_action"]
          failure_narrative_node_id?: string | null
          id?: string
          success_action: Database["public"]["Enums"]["dice_roll_action"]
          success_narrative_node_id?: string | null
        }
        Update: {
          created_at?: string
          difficulty_class?: number
          failure_action?: Database["public"]["Enums"]["dice_roll_action"]
          failure_narrative_node_id?: string | null
          id?: string
          success_action?: Database["public"]["Enums"]["dice_roll_action"]
          success_narrative_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dice_roll_failure_narrative_node_id_fkey"
            columns: ["failure_narrative_node_id"]
            isOneToOne: false
            referencedRelation: "narrative_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dice_roll_success_narrative_node_id_fkey"
            columns: ["success_narrative_node_id"]
            isOneToOne: false
            referencedRelation: "narrative_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_node_choices: {
        Row: {
          created_at: string
          description: string
          dice_roll_id: string
          display_order: number
          id: string
          narrative_node_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          dice_roll_id: string
          display_order?: number
          id?: string
          narrative_node_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          dice_roll_id?: string
          display_order?: number
          id?: string
          narrative_node_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "narrative_node_choices_dice_roll_id_fkey"
            columns: ["dice_roll_id"]
            isOneToOne: false
            referencedRelation: "dice_roll"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "narrative_node_choices_narrative_node_id_fkey"
            columns: ["narrative_node_id"]
            isOneToOne: false
            referencedRelation: "narrative_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_nodes: {
        Row: {
          created_at: string
          description: string
          dice_roll_id: string
          id: string
          narrative_id: string
          root: boolean
          title: string
          type: Database["public"]["Enums"]["narrative_node_type"]
        }
        Insert: {
          created_at?: string
          description: string
          dice_roll_id: string
          id?: string
          narrative_id: string
          root?: boolean
          title: string
          type: Database["public"]["Enums"]["narrative_node_type"]
        }
        Update: {
          created_at?: string
          description?: string
          dice_roll_id?: string
          id?: string
          narrative_id?: string
          root?: boolean
          title?: string
          type?: Database["public"]["Enums"]["narrative_node_type"]
        }
        Relationships: [
          {
            foreignKeyName: "narrative_nodes_dice_roll_id_fkey"
            columns: ["dice_roll_id"]
            isOneToOne: false
            referencedRelation: "dice_roll"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "narrative_nodes_narrative_id_fkey"
            columns: ["narrative_id"]
            isOneToOne: false
            referencedRelation: "narratives"
            referencedColumns: ["id"]
          },
        ]
      }
      narratives: {
        Row: {
          created_at: string
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      player_chapters: {
        Row: {
          chapter_id: string
          created_at: string
          id: string
          player_id: string
          status: Database["public"]["Enums"]["player_chapter_status"]
          user_id: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          id?: string
          player_id: string
          status?: Database["public"]["Enums"]["player_chapter_status"]
          user_id: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          id?: string
          player_id?: string
          status?: Database["public"]["Enums"]["player_chapter_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_chapters_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_chapters_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_dice_rolleds: {
        Row: {
          created_at: string
          dice_id: string | null
          dice_roll_id: string
          id: string
          narrative_id: string
          narrative_node_choice_id: string | null
          narrative_node_id: string
          player_id: string
          player_quest_branch_id: string | null
          player_quest_id: string | null
          quest_branch_id: string | null
          quest_id: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          created_at?: string
          dice_id?: string | null
          dice_roll_id: string
          id?: string
          narrative_id: string
          narrative_node_choice_id?: string | null
          narrative_node_id: string
          player_id: string
          player_quest_branch_id?: string | null
          player_quest_id?: string | null
          quest_branch_id?: string | null
          quest_id?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          created_at?: string
          dice_id?: string | null
          dice_roll_id?: string
          id?: string
          narrative_id?: string
          narrative_node_choice_id?: string | null
          narrative_node_id?: string
          player_id?: string
          player_quest_branch_id?: string | null
          player_quest_id?: string | null
          quest_branch_id?: string | null
          quest_id?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_dice_rolleds_dice_id_fkey"
            columns: ["dice_id"]
            isOneToOne: false
            referencedRelation: "dice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_dice_rolleds_dice_roll_id_fkey"
            columns: ["dice_roll_id"]
            isOneToOne: false
            referencedRelation: "dice_roll"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_dice_rolleds_narrative_id_fkey"
            columns: ["narrative_id"]
            isOneToOne: false
            referencedRelation: "narratives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_dice_rolleds_narrative_node_choice_id_fkey"
            columns: ["narrative_node_choice_id"]
            isOneToOne: false
            referencedRelation: "narrative_node_choices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_dice_rolleds_narrative_node_id_fkey"
            columns: ["narrative_node_id"]
            isOneToOne: false
            referencedRelation: "narrative_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_dice_rolleds_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_dice_rolleds_player_quest_branch_id_fkey"
            columns: ["player_quest_branch_id"]
            isOneToOne: false
            referencedRelation: "player_quest_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_dice_rolleds_player_quest_id_fkey"
            columns: ["player_quest_id"]
            isOneToOne: false
            referencedRelation: "player_quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_dice_rolleds_quest_branch_id_fkey"
            columns: ["quest_branch_id"]
            isOneToOne: false
            referencedRelation: "quest_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_dice_rolleds_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
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
          created_at: string
          id: string
          player_id: string
          quest_id: string
          status: Database["public"]["Enums"]["player_quest_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          quest_id: string
          status?: Database["public"]["Enums"]["player_quest_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
      quests: {
        Row: {
          chapter_id: string | null
          created_at: string
          id: string
          order_in_chapter: number
          status: Database["public"]["Enums"]["quest_status"]
          title: string
          type: Database["public"]["Enums"]["quest_type"]
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          id?: string
          order_in_chapter?: number
          status?: Database["public"]["Enums"]["quest_status"]
          title: string
          type?: Database["public"]["Enums"]["quest_type"]
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          id?: string
          order_in_chapter?: number
          status?: Database["public"]["Enums"]["quest_status"]
          title?: string
          type?: Database["public"]["Enums"]["quest_type"]
        }
        Relationships: [
          {
            foreignKeyName: "quests_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
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
      is_me: { Args: { target_user_id: string }; Returns: boolean }
      is_own_player: {
        Args: { target_player_id: string; target_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      dice_roll_action:
        | "narrative_node"
        | "narrative_node_done"
        | "chapter_done"
      narrative_node_type: "text" | "choice"
      player_chapter_status: "in_progress" | "completed"
      player_quest_status: "in_progress" | "completed" | "abandoned"
      quest_status: "draft" | "published"
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
      dice_roll_action: [
        "narrative_node",
        "narrative_node_done",
        "chapter_done",
      ],
      narrative_node_type: ["text", "choice"],
      player_chapter_status: ["in_progress", "completed"],
      player_quest_status: ["in_progress", "completed", "abandoned"],
      quest_status: ["draft", "published"],
      quest_type: ["primary", "secondary"],
      user_role_type: ["admin"],
    },
  },
} as const


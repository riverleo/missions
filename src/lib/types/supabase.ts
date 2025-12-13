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
      dices: {
        Row: {
          created_at: string
          created_by: string | null
          faces: number
          id: string
          is_default: boolean
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          faces: number
          id?: string
          is_default?: boolean
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          faces?: number
          id?: string
          is_default?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "dices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_dice_rolls: {
        Row: {
          created_at: string
          created_by: string | null
          difficulty_class: number
          failure_action: Database["public"]["Enums"]["dice_roll_action"]
          failure_narrative_node_id: string | null
          id: string
          narrative_id: string
          success_action: Database["public"]["Enums"]["dice_roll_action"]
          success_narrative_node_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          difficulty_class?: number
          failure_action?: Database["public"]["Enums"]["dice_roll_action"]
          failure_narrative_node_id?: string | null
          id?: string
          narrative_id: string
          success_action?: Database["public"]["Enums"]["dice_roll_action"]
          success_narrative_node_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          difficulty_class?: number
          failure_action?: Database["public"]["Enums"]["dice_roll_action"]
          failure_narrative_node_id?: string | null
          id?: string
          narrative_id?: string
          success_action?: Database["public"]["Enums"]["dice_roll_action"]
          success_narrative_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "narrative_dice_rolls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "narrative_dice_rolls_failure_narrative_node_id_fkey"
            columns: ["failure_narrative_node_id"]
            isOneToOne: false
            referencedRelation: "narrative_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "narrative_dice_rolls_narrative_id_fkey"
            columns: ["narrative_id"]
            isOneToOne: false
            referencedRelation: "narratives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "narrative_dice_rolls_success_narrative_node_id_fkey"
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
          created_user_id: string | null
          description: string
          id: string
          narrative_dice_roll_id: string | null
          narrative_node_id: string
          order_in_narrative_node: number
          title: string
        }
        Insert: {
          created_at?: string
          created_user_id?: string | null
          description?: string
          id?: string
          narrative_dice_roll_id?: string | null
          narrative_node_id: string
          order_in_narrative_node?: number
          title?: string
        }
        Update: {
          created_at?: string
          created_user_id?: string | null
          description?: string
          id?: string
          narrative_dice_roll_id?: string | null
          narrative_node_id?: string
          order_in_narrative_node?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "narrative_node_choices_narrative_dice_roll_id_fkey"
            columns: ["narrative_dice_roll_id"]
            isOneToOne: false
            referencedRelation: "narrative_dice_rolls"
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
          created_user_id: string | null
          description: string
          id: string
          narrative_dice_roll_id: string | null
          narrative_id: string
          root: boolean
          title: string
          type: Database["public"]["Enums"]["narrative_node_type"]
        }
        Insert: {
          created_at?: string
          created_user_id?: string | null
          description?: string
          id?: string
          narrative_dice_roll_id?: string | null
          narrative_id: string
          root?: boolean
          title?: string
          type: Database["public"]["Enums"]["narrative_node_type"]
        }
        Update: {
          created_at?: string
          created_user_id?: string | null
          description?: string
          id?: string
          narrative_dice_roll_id?: string | null
          narrative_id?: string
          root?: boolean
          title?: string
          type?: Database["public"]["Enums"]["narrative_node_type"]
        }
        Relationships: [
          {
            foreignKeyName: "narrative_nodes_narrative_dice_roll_id_fkey"
            columns: ["narrative_dice_roll_id"]
            isOneToOne: false
            referencedRelation: "narrative_dice_rolls"
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
          created_by: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "narratives_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_rolled_dices: {
        Row: {
          created_at: string
          dice_id: string | null
          id: string
          narrative_dice_roll_id: string
          narrative_id: string
          narrative_node_choice_id: string | null
          narrative_node_id: string
          player_id: string
          player_scenario_quest_branch_id: string | null
          player_scenario_quest_id: string | null
          scenario_id: string | null
          scenario_quest_branch_id: string | null
          scenario_quest_id: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          created_at?: string
          dice_id?: string | null
          id?: string
          narrative_dice_roll_id: string
          narrative_id: string
          narrative_node_choice_id?: string | null
          narrative_node_id: string
          player_id: string
          player_scenario_quest_branch_id?: string | null
          player_scenario_quest_id?: string | null
          scenario_id?: string | null
          scenario_quest_branch_id?: string | null
          scenario_quest_id?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          created_at?: string
          dice_id?: string | null
          id?: string
          narrative_dice_roll_id?: string
          narrative_id?: string
          narrative_node_choice_id?: string | null
          narrative_node_id?: string
          player_id?: string
          player_scenario_quest_branch_id?: string | null
          player_scenario_quest_id?: string | null
          scenario_id?: string | null
          scenario_quest_branch_id?: string | null
          scenario_quest_id?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_rolled_dices_dice_id_fkey"
            columns: ["dice_id"]
            isOneToOne: false
            referencedRelation: "dices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_rolled_dices_narrative_dice_roll_id_fkey"
            columns: ["narrative_dice_roll_id"]
            isOneToOne: false
            referencedRelation: "narrative_dice_rolls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_rolled_dices_narrative_id_fkey"
            columns: ["narrative_id"]
            isOneToOne: false
            referencedRelation: "narratives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_rolled_dices_narrative_node_choice_id_fkey"
            columns: ["narrative_node_choice_id"]
            isOneToOne: false
            referencedRelation: "narrative_node_choices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_rolled_dices_narrative_node_id_fkey"
            columns: ["narrative_node_id"]
            isOneToOne: false
            referencedRelation: "narrative_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_rolled_dices_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_rolled_dices_player_scenario_quest_branch_id_fkey"
            columns: ["player_scenario_quest_branch_id"]
            isOneToOne: false
            referencedRelation: "player_scenario_quest_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_rolled_dices_player_scenario_quest_id_fkey"
            columns: ["player_scenario_quest_id"]
            isOneToOne: false
            referencedRelation: "player_scenario_quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_rolled_dices_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_rolled_dices_scenario_quest_branch_id_fkey"
            columns: ["scenario_quest_branch_id"]
            isOneToOne: false
            referencedRelation: "scenario_quest_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_rolled_dices_scenario_quest_id_fkey"
            columns: ["scenario_quest_id"]
            isOneToOne: false
            referencedRelation: "scenario_quests"
            referencedColumns: ["id"]
          },
        ]
      }
      player_scenario_chapters: {
        Row: {
          created_at: string
          id: string
          player_id: string
          scenario_chapter_id: string
          scenario_id: string
          status: Database["public"]["Enums"]["player_scenario_chapter_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          scenario_chapter_id: string
          scenario_id: string
          status?: Database["public"]["Enums"]["player_scenario_chapter_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          scenario_chapter_id?: string
          scenario_id?: string
          status?: Database["public"]["Enums"]["player_scenario_chapter_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_scenario_chapters_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_scenario_chapters_scenario_chapter_id_fkey"
            columns: ["scenario_chapter_id"]
            isOneToOne: false
            referencedRelation: "scenario_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_scenario_chapters_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      player_scenario_quest_branches: {
        Row: {
          created_at: string
          id: string
          player_id: string
          player_scenario_quest_id: string
          scenario_id: string
          scenario_quest_branch_id: string
          scenario_quest_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          player_scenario_quest_id: string
          scenario_id: string
          scenario_quest_branch_id: string
          scenario_quest_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          player_scenario_quest_id?: string
          scenario_id?: string
          scenario_quest_branch_id?: string
          scenario_quest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_scenario_quest_branches_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_scenario_quest_branches_player_scenario_quest_id_fkey"
            columns: ["player_scenario_quest_id"]
            isOneToOne: false
            referencedRelation: "player_scenario_quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_scenario_quest_branches_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_scenario_quest_branches_scenario_quest_branch_id_fkey"
            columns: ["scenario_quest_branch_id"]
            isOneToOne: false
            referencedRelation: "scenario_quest_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_scenario_quest_branches_scenario_quest_id_fkey"
            columns: ["scenario_quest_id"]
            isOneToOne: false
            referencedRelation: "scenario_quests"
            referencedColumns: ["id"]
          },
        ]
      }
      player_scenario_quests: {
        Row: {
          created_at: string
          id: string
          player_id: string
          scenario_id: string
          scenario_quest_id: string
          status: Database["public"]["Enums"]["player_scenario_quest_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          scenario_id: string
          scenario_quest_id: string
          status?: Database["public"]["Enums"]["player_scenario_quest_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          scenario_id?: string
          scenario_quest_id?: string
          status?: Database["public"]["Enums"]["player_scenario_quest_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_scenario_quests_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_scenario_quests_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_scenario_quests_scenario_quest_id_fkey"
            columns: ["scenario_quest_id"]
            isOneToOne: false
            referencedRelation: "scenario_quests"
            referencedColumns: ["id"]
          },
        ]
      }
      player_scenarios: {
        Row: {
          created_at: string
          id: string
          player_id: string
          scenario_id: string
          status: Database["public"]["Enums"]["player_scenario_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          scenario_id: string
          status?: Database["public"]["Enums"]["player_scenario_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          scenario_id?: string
          status?: Database["public"]["Enums"]["player_scenario_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_scenarios_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_scenarios_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
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
      scenario_chapters: {
        Row: {
          created_at: string
          created_by: string | null
          display_order_in_scenario: number
          id: string
          parent_scenario_chapter_id: string | null
          scenario_id: string
          status: Database["public"]["Enums"]["publish_status"]
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order_in_scenario?: number
          id?: string
          parent_scenario_chapter_id?: string | null
          scenario_id: string
          status?: Database["public"]["Enums"]["publish_status"]
          title?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order_in_scenario?: number
          id?: string
          parent_scenario_chapter_id?: string | null
          scenario_id?: string
          status?: Database["public"]["Enums"]["publish_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_chapters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_chapters_parent_scenario_chapter_id_fkey"
            columns: ["parent_scenario_chapter_id"]
            isOneToOne: false
            referencedRelation: "scenario_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_chapters_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_quest_branches: {
        Row: {
          created_at: string
          created_by: string | null
          display_order_in_scenario_quest: number
          id: string
          parent_scenario_quest_branch_id: string | null
          scenario_quest_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order_in_scenario_quest?: number
          id?: string
          parent_scenario_quest_branch_id?: string | null
          scenario_quest_id: string
          title?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order_in_scenario_quest?: number
          id?: string
          parent_scenario_quest_branch_id?: string | null
          scenario_quest_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_quest_branches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_quest_branches_parent_scenario_quest_branch_id_fkey"
            columns: ["parent_scenario_quest_branch_id"]
            isOneToOne: false
            referencedRelation: "scenario_quest_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_quest_branches_scenario_quest_id_fkey"
            columns: ["scenario_quest_id"]
            isOneToOne: false
            referencedRelation: "scenario_quests"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_quests: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          order_in_chapter: number
          scenario_chapter_id: string | null
          scenario_id: string
          status: Database["public"]["Enums"]["publish_status"]
          title: string
          type: Database["public"]["Enums"]["scenario_quest_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          order_in_chapter?: number
          scenario_chapter_id?: string | null
          scenario_id: string
          status?: Database["public"]["Enums"]["publish_status"]
          title?: string
          type?: Database["public"]["Enums"]["scenario_quest_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          order_in_chapter?: number
          scenario_chapter_id?: string | null
          scenario_id?: string
          status?: Database["public"]["Enums"]["publish_status"]
          title?: string
          type?: Database["public"]["Enums"]["scenario_quest_type"]
        }
        Relationships: [
          {
            foreignKeyName: "scenario_quests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_quests_scenario_chapter_id_fkey"
            columns: ["scenario_chapter_id"]
            isOneToOne: false
            referencedRelation: "scenario_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_quests_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          id: string
          status: Database["public"]["Enums"]["publish_status"]
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          status?: Database["public"]["Enums"]["publish_status"]
          title?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          status?: Database["public"]["Enums"]["publish_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          display_name: string
          id: string
          type: Database["public"]["Enums"]["user_role_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          display_name?: string
          id?: string
          type: Database["public"]["Enums"]["user_role_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          display_name?: string
          id?: string
          type?: Database["public"]["Enums"]["user_role_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_roles_deleted_by"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_me: { Args: { target_user_id: string }; Returns: boolean }
      is_own_player: {
        Args: { target_player_id: string; target_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      dice_roll_action: "narrative_node_next" | "narrative_node_done"
      narrative_node_type: "text" | "choice"
      player_scenario_chapter_status: "in_progress" | "completed"
      player_scenario_quest_status: "in_progress" | "completed" | "abandoned"
      player_scenario_status: "in_progress" | "completed"
      publish_status: "draft" | "published"
      scenario_quest_type: "primary" | "secondary"
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
      dice_roll_action: ["narrative_node_next", "narrative_node_done"],
      narrative_node_type: ["text", "choice"],
      player_scenario_chapter_status: ["in_progress", "completed"],
      player_scenario_quest_status: ["in_progress", "completed", "abandoned"],
      player_scenario_status: ["in_progress", "completed"],
      publish_status: ["draft", "published"],
      scenario_quest_type: ["primary", "secondary"],
      user_role_type: ["admin"],
    },
  },
} as const


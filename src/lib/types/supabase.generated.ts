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
      behavior_priorities: {
        Row: {
          condition_behavior_id: string | null
          created_at: string
          created_by: string | null
          id: string
          need_behavior_id: string | null
          priority: number
          scenario_id: string
        }
        Insert: {
          condition_behavior_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          need_behavior_id?: string | null
          priority?: number
          scenario_id: string
        }
        Update: {
          condition_behavior_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          need_behavior_id?: string | null
          priority?: number
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavior_priorities_condition_behavior_id_fkey"
            columns: ["condition_behavior_id"]
            isOneToOne: true
            referencedRelation: "condition_behaviors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_priorities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_priorities_need_behavior_id_fkey"
            columns: ["need_behavior_id"]
            isOneToOne: true
            referencedRelation: "need_behaviors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavior_priorities_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      building_conditions: {
        Row: {
          building_id: string
          condition_id: string
          created_at: string
          created_by: string | null
          decrease_multiplier: number
          disabled_when_depleted: boolean
          id: string
          scenario_id: string
        }
        Insert: {
          building_id: string
          condition_id: string
          created_at?: string
          created_by?: string | null
          decrease_multiplier?: number
          disabled_when_depleted?: boolean
          id?: string
          scenario_id: string
        }
        Update: {
          building_id?: string
          condition_id?: string
          created_at?: string
          created_by?: string | null
          decrease_multiplier?: number
          disabled_when_depleted?: boolean
          id?: string
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "building_conditions_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_conditions_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_conditions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_conditions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      building_interaction_actions: {
        Row: {
          building_id: string | null
          building_interaction_id: string
          character_body_state_type: Database["public"]["Enums"]["character_body_state_type"]
          character_face_state_type: Database["public"]["Enums"]["character_face_state_type"]
          character_offset_x: number
          character_offset_y: number
          character_rotation: number
          character_scale: number
          created_at: string
          created_by: string | null
          duration_ticks: number
          id: string
          next_building_interaction_action_id: string | null
          root: boolean
          scenario_id: string
        }
        Insert: {
          building_id?: string | null
          building_interaction_id: string
          character_body_state_type?: Database["public"]["Enums"]["character_body_state_type"]
          character_face_state_type?: Database["public"]["Enums"]["character_face_state_type"]
          character_offset_x?: number
          character_offset_y?: number
          character_rotation?: number
          character_scale?: number
          created_at?: string
          created_by?: string | null
          duration_ticks?: number
          id?: string
          next_building_interaction_action_id?: string | null
          root?: boolean
          scenario_id: string
        }
        Update: {
          building_id?: string | null
          building_interaction_id?: string
          character_body_state_type?: Database["public"]["Enums"]["character_body_state_type"]
          character_face_state_type?: Database["public"]["Enums"]["character_face_state_type"]
          character_offset_x?: number
          character_offset_y?: number
          character_rotation?: number
          character_scale?: number
          created_at?: string
          created_by?: string | null
          duration_ticks?: number
          id?: string
          next_building_interaction_action_id?: string | null
          root?: boolean
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "building_interaction_actions_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_interaction_actions_building_interaction_id_fkey"
            columns: ["building_interaction_id"]
            isOneToOne: false
            referencedRelation: "building_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_interaction_actions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_interaction_actions_next_building_interaction_act_fkey"
            columns: ["next_building_interaction_action_id"]
            isOneToOne: false
            referencedRelation: "building_interaction_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_interaction_actions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      building_interactions: {
        Row: {
          building_id: string
          character_id: string | null
          created_at: string
          created_by: string | null
          fulfill_interaction_type:
            | Database["public"]["Enums"]["fulfill_interaction_type"]
            | null
          id: string
          once_interaction_type:
            | Database["public"]["Enums"]["once_interaction_type"]
            | null
          scenario_id: string
          system_interaction_type:
            | Database["public"]["Enums"]["system_interaction_type"]
            | null
          type: Database["public"]["Enums"]["interaction_type"]
        }
        Insert: {
          building_id: string
          character_id?: string | null
          created_at?: string
          created_by?: string | null
          fulfill_interaction_type?:
            | Database["public"]["Enums"]["fulfill_interaction_type"]
            | null
          id?: string
          once_interaction_type?:
            | Database["public"]["Enums"]["once_interaction_type"]
            | null
          scenario_id: string
          system_interaction_type?:
            | Database["public"]["Enums"]["system_interaction_type"]
            | null
          type: Database["public"]["Enums"]["interaction_type"]
        }
        Update: {
          building_id?: string
          character_id?: string | null
          created_at?: string
          created_by?: string | null
          fulfill_interaction_type?:
            | Database["public"]["Enums"]["fulfill_interaction_type"]
            | null
          id?: string
          once_interaction_type?:
            | Database["public"]["Enums"]["once_interaction_type"]
            | null
          scenario_id?: string
          system_interaction_type?:
            | Database["public"]["Enums"]["system_interaction_type"]
            | null
          type?: Database["public"]["Enums"]["interaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "building_interactions_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_interactions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_interactions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      building_items: {
        Row: {
          building_id: string
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          scenario_id: string
        }
        Insert: {
          building_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          scenario_id: string
        }
        Update: {
          building_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "building_items_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_items_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      building_states: {
        Row: {
          atlas_name: string
          building_id: string
          fps: number | null
          frame_from: number | null
          frame_to: number | null
          id: string
          loop: Database["public"]["Enums"]["loop_type"]
          type: Database["public"]["Enums"]["building_state_type"]
        }
        Insert: {
          atlas_name: string
          building_id: string
          fps?: number | null
          frame_from?: number | null
          frame_to?: number | null
          id?: string
          loop?: Database["public"]["Enums"]["loop_type"]
          type?: Database["public"]["Enums"]["building_state_type"]
        }
        Update: {
          atlas_name?: string
          building_id?: string
          fps?: number | null
          frame_from?: number | null
          frame_to?: number | null
          id?: string
          loop?: Database["public"]["Enums"]["loop_type"]
          type?: Database["public"]["Enums"]["building_state_type"]
        }
        Relationships: [
          {
            foreignKeyName: "building_states_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          cell_cols: number
          cell_rows: number
          collider_offset_x: number
          collider_offset_y: number
          created_at: string
          created_by: string | null
          id: string
          item_max_capacity: number
          name: string
          scale: number
          scenario_id: string
        }
        Insert: {
          cell_cols?: number
          cell_rows?: number
          collider_offset_x?: number
          collider_offset_y?: number
          created_at?: string
          created_by?: string | null
          id?: string
          item_max_capacity?: number
          name?: string
          scale?: number
          scenario_id: string
        }
        Update: {
          cell_cols?: number
          cell_rows?: number
          collider_offset_x?: number
          collider_offset_y?: number
          created_at?: string
          created_by?: string | null
          id?: string
          item_max_capacity?: number
          name?: string
          scale?: number
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buildings_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          created_at: string
          created_by: string | null
          display_order_in_scenario: number
          id: string
          parent_chapter_id: string | null
          scenario_id: string
          status: Database["public"]["Enums"]["publish_status"]
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order_in_scenario?: number
          id?: string
          parent_chapter_id?: string | null
          scenario_id: string
          status?: Database["public"]["Enums"]["publish_status"]
          title?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order_in_scenario?: number
          id?: string
          parent_chapter_id?: string | null
          scenario_id?: string
          status?: Database["public"]["Enums"]["publish_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapters_parent_chapter_id_fkey"
            columns: ["parent_chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapters_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      character_bodies: {
        Row: {
          collider_height: number
          collider_offset_x: number
          collider_offset_y: number
          collider_type: Database["public"]["Enums"]["collider_type"]
          collider_width: number
          created_at: string
          created_by: string | null
          id: string
          name: string
          scenario_id: string
        }
        Insert: {
          collider_height?: number
          collider_offset_x?: number
          collider_offset_y?: number
          collider_type?: Database["public"]["Enums"]["collider_type"]
          collider_width?: number
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          scenario_id: string
        }
        Update: {
          collider_height?: number
          collider_offset_x?: number
          collider_offset_y?: number
          collider_type?: Database["public"]["Enums"]["collider_type"]
          collider_width?: number
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_bodies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_bodies_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      character_body_states: {
        Row: {
          atlas_name: string
          body_id: string
          character_face_state:
            | Database["public"]["Enums"]["character_face_state_type"]
            | null
          fps: number | null
          frame_from: number | null
          frame_to: number | null
          id: string
          in_front: boolean
          loop: Database["public"]["Enums"]["loop_type"]
          type: Database["public"]["Enums"]["character_body_state_type"]
        }
        Insert: {
          atlas_name: string
          body_id: string
          character_face_state?:
            | Database["public"]["Enums"]["character_face_state_type"]
            | null
          fps?: number | null
          frame_from?: number | null
          frame_to?: number | null
          id?: string
          in_front?: boolean
          loop?: Database["public"]["Enums"]["loop_type"]
          type?: Database["public"]["Enums"]["character_body_state_type"]
        }
        Update: {
          atlas_name?: string
          body_id?: string
          character_face_state?:
            | Database["public"]["Enums"]["character_face_state_type"]
            | null
          fps?: number | null
          frame_from?: number | null
          frame_to?: number | null
          id?: string
          in_front?: boolean
          loop?: Database["public"]["Enums"]["loop_type"]
          type?: Database["public"]["Enums"]["character_body_state_type"]
        }
        Relationships: [
          {
            foreignKeyName: "character_body_states_body_id_fkey"
            columns: ["body_id"]
            isOneToOne: false
            referencedRelation: "character_bodies"
            referencedColumns: ["id"]
          },
        ]
      }
      character_face_states: {
        Row: {
          atlas_name: string
          character_id: string
          fps: number | null
          frame_from: number | null
          frame_to: number | null
          id: string
          loop: Database["public"]["Enums"]["loop_type"]
          offset_x: number
          offset_y: number
          type: Database["public"]["Enums"]["character_face_state_type"]
        }
        Insert: {
          atlas_name: string
          character_id: string
          fps?: number | null
          frame_from?: number | null
          frame_to?: number | null
          id?: string
          loop?: Database["public"]["Enums"]["loop_type"]
          offset_x?: number
          offset_y?: number
          type?: Database["public"]["Enums"]["character_face_state_type"]
        }
        Update: {
          atlas_name?: string
          character_id?: string
          fps?: number | null
          frame_from?: number | null
          frame_to?: number | null
          id?: string
          loop?: Database["public"]["Enums"]["loop_type"]
          offset_x?: number
          offset_y?: number
          type?: Database["public"]["Enums"]["character_face_state_type"]
        }
        Relationships: [
          {
            foreignKeyName: "character_face_states_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_interaction_actions: {
        Row: {
          character_body_state_type: Database["public"]["Enums"]["character_body_state_type"]
          character_face_state_type: Database["public"]["Enums"]["character_face_state_type"]
          character_id: string | null
          character_interaction_id: string
          created_at: string
          created_by: string | null
          duration_ticks: number
          id: string
          next_character_interaction_action_id: string | null
          root: boolean
          scenario_id: string
          target_character_body_state_type: Database["public"]["Enums"]["character_body_state_type"]
          target_character_face_state_type: Database["public"]["Enums"]["character_face_state_type"]
          target_character_id: string | null
          target_character_offset_x: number
          target_character_offset_y: number
          target_character_rotation: number
          target_character_scale: number
        }
        Insert: {
          character_body_state_type?: Database["public"]["Enums"]["character_body_state_type"]
          character_face_state_type?: Database["public"]["Enums"]["character_face_state_type"]
          character_id?: string | null
          character_interaction_id: string
          created_at?: string
          created_by?: string | null
          duration_ticks?: number
          id?: string
          next_character_interaction_action_id?: string | null
          root?: boolean
          scenario_id: string
          target_character_body_state_type?: Database["public"]["Enums"]["character_body_state_type"]
          target_character_face_state_type?: Database["public"]["Enums"]["character_face_state_type"]
          target_character_id?: string | null
          target_character_offset_x?: number
          target_character_offset_y?: number
          target_character_rotation?: number
          target_character_scale?: number
        }
        Update: {
          character_body_state_type?: Database["public"]["Enums"]["character_body_state_type"]
          character_face_state_type?: Database["public"]["Enums"]["character_face_state_type"]
          character_id?: string | null
          character_interaction_id?: string
          created_at?: string
          created_by?: string | null
          duration_ticks?: number
          id?: string
          next_character_interaction_action_id?: string | null
          root?: boolean
          scenario_id?: string
          target_character_body_state_type?: Database["public"]["Enums"]["character_body_state_type"]
          target_character_face_state_type?: Database["public"]["Enums"]["character_face_state_type"]
          target_character_id?: string | null
          target_character_offset_x?: number
          target_character_offset_y?: number
          target_character_rotation?: number
          target_character_scale?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_interaction_actions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_interaction_actions_character_interaction_id_fkey"
            columns: ["character_interaction_id"]
            isOneToOne: false
            referencedRelation: "character_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_interaction_actions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_interaction_actions_next_character_interaction_a_fkey"
            columns: ["next_character_interaction_action_id"]
            isOneToOne: false
            referencedRelation: "character_interaction_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_interaction_actions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_interaction_actions_target_character_id_fkey"
            columns: ["target_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_interactions: {
        Row: {
          character_id: string | null
          created_at: string
          created_by: string | null
          fulfill_interaction_type:
            | Database["public"]["Enums"]["fulfill_interaction_type"]
            | null
          id: string
          once_interaction_type:
            | Database["public"]["Enums"]["once_interaction_type"]
            | null
          scenario_id: string
          system_interaction_type:
            | Database["public"]["Enums"]["system_interaction_type"]
            | null
          target_character_id: string
          type: Database["public"]["Enums"]["interaction_type"]
        }
        Insert: {
          character_id?: string | null
          created_at?: string
          created_by?: string | null
          fulfill_interaction_type?:
            | Database["public"]["Enums"]["fulfill_interaction_type"]
            | null
          id?: string
          once_interaction_type?:
            | Database["public"]["Enums"]["once_interaction_type"]
            | null
          scenario_id: string
          system_interaction_type?:
            | Database["public"]["Enums"]["system_interaction_type"]
            | null
          target_character_id: string
          type: Database["public"]["Enums"]["interaction_type"]
        }
        Update: {
          character_id?: string | null
          created_at?: string
          created_by?: string | null
          fulfill_interaction_type?:
            | Database["public"]["Enums"]["fulfill_interaction_type"]
            | null
          id?: string
          once_interaction_type?:
            | Database["public"]["Enums"]["once_interaction_type"]
            | null
          scenario_id?: string
          system_interaction_type?:
            | Database["public"]["Enums"]["system_interaction_type"]
            | null
          target_character_id?: string
          type?: Database["public"]["Enums"]["interaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "character_interactions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_interactions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_interactions_target_character_id_fkey"
            columns: ["target_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_needs: {
        Row: {
          character_id: string
          created_at: string
          created_by: string | null
          decay_multiplier: number
          id: string
          need_id: string
          scenario_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          created_by?: string | null
          decay_multiplier?: number
          id?: string
          need_id: string
          scenario_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          created_by?: string | null
          decay_multiplier?: number
          id?: string
          need_id?: string
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_needs_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_needs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_needs_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "needs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_needs_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          character_body_id: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          scale: number
          scenario_id: string
        }
        Insert: {
          character_body_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          scale?: number
          scenario_id: string
        }
        Update: {
          character_body_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          scale?: number
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_character_body_id_fkey"
            columns: ["character_body_id"]
            isOneToOne: false
            referencedRelation: "character_bodies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      condition_behavior_actions: {
        Row: {
          building_interaction_id: string | null
          character_interaction_id: string | null
          condition_behavior_id: string
          condition_fulfillment_id: string | null
          condition_id: string
          id: string
          idle_duration_ticks: number
          item_interaction_id: string | null
          next_condition_behavior_action_id: string | null
          root: boolean
          scenario_id: string
          target_selection_method: Database["public"]["Enums"]["target_selection_method"]
          type: Database["public"]["Enums"]["behavior_action_type"]
        }
        Insert: {
          building_interaction_id?: string | null
          character_interaction_id?: string | null
          condition_behavior_id: string
          condition_fulfillment_id?: string | null
          condition_id: string
          id?: string
          idle_duration_ticks?: number
          item_interaction_id?: string | null
          next_condition_behavior_action_id?: string | null
          root?: boolean
          scenario_id: string
          target_selection_method?: Database["public"]["Enums"]["target_selection_method"]
          type?: Database["public"]["Enums"]["behavior_action_type"]
        }
        Update: {
          building_interaction_id?: string | null
          character_interaction_id?: string | null
          condition_behavior_id?: string
          condition_fulfillment_id?: string | null
          condition_id?: string
          id?: string
          idle_duration_ticks?: number
          item_interaction_id?: string | null
          next_condition_behavior_action_id?: string | null
          root?: boolean
          scenario_id?: string
          target_selection_method?: Database["public"]["Enums"]["target_selection_method"]
          type?: Database["public"]["Enums"]["behavior_action_type"]
        }
        Relationships: [
          {
            foreignKeyName: "condition_behavior_actions_building_interaction_id_fkey"
            columns: ["building_interaction_id"]
            isOneToOne: false
            referencedRelation: "building_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_behavior_actions_character_interaction_id_fkey"
            columns: ["character_interaction_id"]
            isOneToOne: false
            referencedRelation: "character_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_behavior_actions_condition_behavior_id_fkey"
            columns: ["condition_behavior_id"]
            isOneToOne: false
            referencedRelation: "condition_behaviors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_behavior_actions_condition_fulfillment_id_fkey"
            columns: ["condition_fulfillment_id"]
            isOneToOne: false
            referencedRelation: "condition_fulfillments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_behavior_actions_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_behavior_actions_item_interaction_id_fkey"
            columns: ["item_interaction_id"]
            isOneToOne: false
            referencedRelation: "item_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_behavior_actions_next_condition_behavior_action__fkey"
            columns: ["next_condition_behavior_action_id"]
            isOneToOne: false
            referencedRelation: "condition_behavior_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_behavior_actions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      condition_behaviors: {
        Row: {
          building_state_type: Database["public"]["Enums"]["building_state_type"]
          character_id: string | null
          condition_id: string
          condition_threshold: number
          created_at: string
          created_by: string | null
          id: string
          name: string
          scenario_id: string
        }
        Insert: {
          building_state_type?: Database["public"]["Enums"]["building_state_type"]
          character_id?: string | null
          condition_id: string
          condition_threshold?: number
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          scenario_id: string
        }
        Update: {
          building_state_type?: Database["public"]["Enums"]["building_state_type"]
          character_id?: string | null
          condition_id?: string
          condition_threshold?: number
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "condition_behaviors_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_behaviors_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_behaviors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_behaviors_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      condition_effects: {
        Row: {
          change_per_tick: number
          character_id: string | null
          condition_id: string
          created_at: string
          created_by: string | null
          id: string
          max_threshold: number
          min_threshold: number
          name: string
          need_id: string
          scenario_id: string
        }
        Insert: {
          change_per_tick?: number
          character_id?: string | null
          condition_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          max_threshold?: number
          min_threshold?: number
          name: string
          need_id: string
          scenario_id: string
        }
        Update: {
          change_per_tick?: number
          character_id?: string | null
          condition_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          max_threshold?: number
          min_threshold?: number
          name?: string
          need_id?: string
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "condition_effects_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_effects_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_effects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_effects_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "needs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_effects_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      condition_fulfillments: {
        Row: {
          building_interaction_id: string | null
          character_interaction_id: string | null
          condition_id: string
          created_at: string
          created_by: string | null
          fulfillment_type: Database["public"]["Enums"]["condition_fulfillment_type"]
          id: string
          increase_per_tick: number
          item_interaction_id: string | null
          scenario_id: string
        }
        Insert: {
          building_interaction_id?: string | null
          character_interaction_id?: string | null
          condition_id: string
          created_at?: string
          created_by?: string | null
          fulfillment_type: Database["public"]["Enums"]["condition_fulfillment_type"]
          id?: string
          increase_per_tick?: number
          item_interaction_id?: string | null
          scenario_id: string
        }
        Update: {
          building_interaction_id?: string | null
          character_interaction_id?: string | null
          condition_id?: string
          created_at?: string
          created_by?: string | null
          fulfillment_type?: Database["public"]["Enums"]["condition_fulfillment_type"]
          id?: string
          increase_per_tick?: number
          item_interaction_id?: string | null
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "condition_fulfillments_building_interaction_id_fkey"
            columns: ["building_interaction_id"]
            isOneToOne: false
            referencedRelation: "building_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_fulfillments_character_interaction_id_fkey"
            columns: ["character_interaction_id"]
            isOneToOne: false
            referencedRelation: "character_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_fulfillments_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_fulfillments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_fulfillments_item_interaction_id_fkey"
            columns: ["item_interaction_id"]
            isOneToOne: false
            referencedRelation: "item_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_fulfillments_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      conditions: {
        Row: {
          created_at: string
          created_by: string | null
          decrease_per_tick: number
          id: string
          initial_value: number
          max_value: number
          name: string
          scenario_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          decrease_per_tick?: number
          id?: string
          initial_value?: number
          max_value?: number
          name?: string
          scenario_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          decrease_per_tick?: number
          id?: string
          initial_value?: number
          max_value?: number
          name?: string
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conditions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conditions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
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
      item_interaction_actions: {
        Row: {
          character_body_state_type: Database["public"]["Enums"]["character_body_state_type"]
          character_face_state_type: Database["public"]["Enums"]["character_face_state_type"]
          created_at: string
          created_by: string | null
          duration_ticks: number
          id: string
          item_id: string | null
          item_interaction_id: string
          item_offset_x: number
          item_offset_y: number
          item_rotation: number
          item_scale: number
          next_item_interaction_action_id: string | null
          root: boolean
          scenario_id: string
        }
        Insert: {
          character_body_state_type?: Database["public"]["Enums"]["character_body_state_type"]
          character_face_state_type?: Database["public"]["Enums"]["character_face_state_type"]
          created_at?: string
          created_by?: string | null
          duration_ticks?: number
          id?: string
          item_id?: string | null
          item_interaction_id: string
          item_offset_x?: number
          item_offset_y?: number
          item_rotation?: number
          item_scale?: number
          next_item_interaction_action_id?: string | null
          root?: boolean
          scenario_id: string
        }
        Update: {
          character_body_state_type?: Database["public"]["Enums"]["character_body_state_type"]
          character_face_state_type?: Database["public"]["Enums"]["character_face_state_type"]
          created_at?: string
          created_by?: string | null
          duration_ticks?: number
          id?: string
          item_id?: string | null
          item_interaction_id?: string
          item_offset_x?: number
          item_offset_y?: number
          item_rotation?: number
          item_scale?: number
          next_item_interaction_action_id?: string | null
          root?: boolean
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_interaction_actions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_interaction_actions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_interaction_actions_item_interaction_id_fkey"
            columns: ["item_interaction_id"]
            isOneToOne: false
            referencedRelation: "item_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_interaction_actions_next_item_interaction_action_id_fkey"
            columns: ["next_item_interaction_action_id"]
            isOneToOne: false
            referencedRelation: "item_interaction_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_interaction_actions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      item_interactions: {
        Row: {
          character_id: string | null
          created_at: string
          created_by: string | null
          fulfill_interaction_type:
            | Database["public"]["Enums"]["fulfill_interaction_type"]
            | null
          id: string
          item_id: string
          once_interaction_type:
            | Database["public"]["Enums"]["once_interaction_type"]
            | null
          scenario_id: string
          system_interaction_type:
            | Database["public"]["Enums"]["system_interaction_type"]
            | null
          type: Database["public"]["Enums"]["interaction_type"]
        }
        Insert: {
          character_id?: string | null
          created_at?: string
          created_by?: string | null
          fulfill_interaction_type?:
            | Database["public"]["Enums"]["fulfill_interaction_type"]
            | null
          id?: string
          item_id: string
          once_interaction_type?:
            | Database["public"]["Enums"]["once_interaction_type"]
            | null
          scenario_id: string
          system_interaction_type?:
            | Database["public"]["Enums"]["system_interaction_type"]
            | null
          type: Database["public"]["Enums"]["interaction_type"]
        }
        Update: {
          character_id?: string | null
          created_at?: string
          created_by?: string | null
          fulfill_interaction_type?:
            | Database["public"]["Enums"]["fulfill_interaction_type"]
            | null
          id?: string
          item_id?: string
          once_interaction_type?:
            | Database["public"]["Enums"]["once_interaction_type"]
            | null
          scenario_id?: string
          system_interaction_type?:
            | Database["public"]["Enums"]["system_interaction_type"]
            | null
          type?: Database["public"]["Enums"]["interaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "item_interactions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_interactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_interactions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      item_states: {
        Row: {
          atlas_name: string
          fps: number | null
          frame_from: number | null
          frame_to: number | null
          id: string
          item_id: string
          loop: Database["public"]["Enums"]["loop_type"]
          max_durability: number
          min_durability: number
          type: Database["public"]["Enums"]["item_state_type"]
        }
        Insert: {
          atlas_name: string
          fps?: number | null
          frame_from?: number | null
          frame_to?: number | null
          id?: string
          item_id: string
          loop?: Database["public"]["Enums"]["loop_type"]
          max_durability?: number
          min_durability?: number
          type?: Database["public"]["Enums"]["item_state_type"]
        }
        Update: {
          atlas_name?: string
          fps?: number | null
          frame_from?: number | null
          frame_to?: number | null
          id?: string
          item_id?: string
          loop?: Database["public"]["Enums"]["loop_type"]
          max_durability?: number
          min_durability?: number
          type?: Database["public"]["Enums"]["item_state_type"]
        }
        Relationships: [
          {
            foreignKeyName: "item_states_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          collider_height: number
          collider_offset_x: number
          collider_offset_y: number
          collider_type: Database["public"]["Enums"]["collider_type"]
          collider_width: number
          created_at: string
          created_by: string | null
          id: string
          max_durability_ticks: number | null
          name: string
          scale: number
          scenario_id: string
        }
        Insert: {
          collider_height?: number
          collider_offset_x?: number
          collider_offset_y?: number
          collider_type?: Database["public"]["Enums"]["collider_type"]
          collider_width?: number
          created_at?: string
          created_by?: string | null
          id?: string
          max_durability_ticks?: number | null
          name?: string
          scale?: number
          scenario_id: string
        }
        Update: {
          collider_height?: number
          collider_offset_x?: number
          collider_offset_y?: number
          collider_type?: Database["public"]["Enums"]["collider_type"]
          collider_width?: number
          created_at?: string
          created_by?: string | null
          id?: string
          max_durability_ticks?: number | null
          name?: string
          scale?: number
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
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
          scenario_id: string
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
          scenario_id: string
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
          scenario_id?: string
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
            foreignKeyName: "narrative_dice_rolls_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
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
          scenario_id: string
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
          scenario_id: string
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
          scenario_id?: string
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
          {
            foreignKeyName: "narrative_node_choices_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
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
          scenario_id: string
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
          scenario_id: string
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
          scenario_id?: string
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
          {
            foreignKeyName: "narrative_nodes_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      narratives: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          scenario_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          scenario_id: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          scenario_id?: string
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
          {
            foreignKeyName: "narratives_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      need_behavior_actions: {
        Row: {
          building_interaction_id: string | null
          character_interaction_id: string | null
          id: string
          idle_duration_ticks: number
          item_interaction_id: string | null
          need_behavior_id: string
          need_fulfillment_id: string | null
          need_id: string
          next_need_behavior_action_id: string | null
          root: boolean
          scenario_id: string
          target_selection_method: Database["public"]["Enums"]["target_selection_method"]
          type: Database["public"]["Enums"]["behavior_action_type"]
        }
        Insert: {
          building_interaction_id?: string | null
          character_interaction_id?: string | null
          id?: string
          idle_duration_ticks?: number
          item_interaction_id?: string | null
          need_behavior_id: string
          need_fulfillment_id?: string | null
          need_id: string
          next_need_behavior_action_id?: string | null
          root?: boolean
          scenario_id: string
          target_selection_method?: Database["public"]["Enums"]["target_selection_method"]
          type?: Database["public"]["Enums"]["behavior_action_type"]
        }
        Update: {
          building_interaction_id?: string | null
          character_interaction_id?: string | null
          id?: string
          idle_duration_ticks?: number
          item_interaction_id?: string | null
          need_behavior_id?: string
          need_fulfillment_id?: string | null
          need_id?: string
          next_need_behavior_action_id?: string | null
          root?: boolean
          scenario_id?: string
          target_selection_method?: Database["public"]["Enums"]["target_selection_method"]
          type?: Database["public"]["Enums"]["behavior_action_type"]
        }
        Relationships: [
          {
            foreignKeyName: "need_behavior_actions_building_interaction_id_fkey"
            columns: ["building_interaction_id"]
            isOneToOne: false
            referencedRelation: "building_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_behavior_actions_character_interaction_id_fkey"
            columns: ["character_interaction_id"]
            isOneToOne: false
            referencedRelation: "character_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_behavior_actions_item_interaction_id_fkey"
            columns: ["item_interaction_id"]
            isOneToOne: false
            referencedRelation: "item_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_behavior_actions_need_behavior_id_fkey"
            columns: ["need_behavior_id"]
            isOneToOne: false
            referencedRelation: "need_behaviors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_behavior_actions_need_fulfillment_id_fkey"
            columns: ["need_fulfillment_id"]
            isOneToOne: false
            referencedRelation: "need_fulfillments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_behavior_actions_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "needs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_behavior_actions_next_need_behavior_action_id_fkey"
            columns: ["next_need_behavior_action_id"]
            isOneToOne: false
            referencedRelation: "need_behavior_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_behavior_actions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      need_behaviors: {
        Row: {
          character_face_state_type: Database["public"]["Enums"]["character_face_state_type"]
          character_id: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          need_id: string
          need_threshold: number
          scenario_id: string
        }
        Insert: {
          character_face_state_type?: Database["public"]["Enums"]["character_face_state_type"]
          character_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          need_id: string
          need_threshold?: number
          scenario_id: string
        }
        Update: {
          character_face_state_type?: Database["public"]["Enums"]["character_face_state_type"]
          character_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          need_id?: string
          need_threshold?: number
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "need_behaviors_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_behaviors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_behaviors_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "needs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_behaviors_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      need_fulfillments: {
        Row: {
          building_interaction_id: string | null
          character_interaction_id: string | null
          created_at: string
          created_by: string | null
          fulfillment_type: Database["public"]["Enums"]["need_fulfillment_type"]
          id: string
          increase_per_tick: number
          item_interaction_id: string | null
          need_id: string
          scenario_id: string
          task_condition:
            | Database["public"]["Enums"]["need_fulfillment_task_condition"]
            | null
          task_count: number
          task_duration_ticks: number
        }
        Insert: {
          building_interaction_id?: string | null
          character_interaction_id?: string | null
          created_at?: string
          created_by?: string | null
          fulfillment_type: Database["public"]["Enums"]["need_fulfillment_type"]
          id?: string
          increase_per_tick?: number
          item_interaction_id?: string | null
          need_id: string
          scenario_id: string
          task_condition?:
            | Database["public"]["Enums"]["need_fulfillment_task_condition"]
            | null
          task_count?: number
          task_duration_ticks?: number
        }
        Update: {
          building_interaction_id?: string | null
          character_interaction_id?: string | null
          created_at?: string
          created_by?: string | null
          fulfillment_type?: Database["public"]["Enums"]["need_fulfillment_type"]
          id?: string
          increase_per_tick?: number
          item_interaction_id?: string | null
          need_id?: string
          scenario_id?: string
          task_condition?:
            | Database["public"]["Enums"]["need_fulfillment_task_condition"]
            | null
          task_count?: number
          task_duration_ticks?: number
        }
        Relationships: [
          {
            foreignKeyName: "need_fulfillments_building_interaction_id_fkey"
            columns: ["building_interaction_id"]
            isOneToOne: false
            referencedRelation: "building_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_fulfillments_character_interaction_id_fkey"
            columns: ["character_interaction_id"]
            isOneToOne: false
            referencedRelation: "character_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_fulfillments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_fulfillments_item_interaction_id_fkey"
            columns: ["item_interaction_id"]
            isOneToOne: false
            referencedRelation: "item_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_fulfillments_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "needs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_fulfillments_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      needs: {
        Row: {
          created_at: string
          created_by: string | null
          decrease_per_tick: number
          id: string
          initial_value: number
          max_value: number
          name: string
          scenario_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          decrease_per_tick?: number
          id?: string
          initial_value?: number
          max_value?: number
          name: string
          scenario_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          decrease_per_tick?: number
          id?: string
          initial_value?: number
          max_value?: number
          name?: string
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "needs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "needs_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      player_chapters: {
        Row: {
          chapter_id: string
          created_at: string
          id: string
          player_id: string
          scenario_id: string
          status: Database["public"]["Enums"]["player_chapter_status"]
          user_id: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          id?: string
          player_id: string
          scenario_id: string
          status?: Database["public"]["Enums"]["player_chapter_status"]
          user_id?: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          id?: string
          player_id?: string
          scenario_id?: string
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
          {
            foreignKeyName: "player_chapters_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
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
          scenario_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          player_quest_id: string
          quest_branch_id: string
          quest_id: string
          scenario_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          player_quest_id?: string
          quest_branch_id?: string
          quest_id?: string
          scenario_id?: string
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
          {
            foreignKeyName: "player_quest_branches_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
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
          scenario_id: string
          status: Database["public"]["Enums"]["player_quest_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          quest_id: string
          scenario_id: string
          status?: Database["public"]["Enums"]["player_quest_status"]
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          quest_id?: string
          scenario_id?: string
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
          {
            foreignKeyName: "player_quests_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
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
          player_quest_branch_id: string | null
          player_quest_id: string | null
          quest_branch_id: string | null
          quest_id: string | null
          scenario_id: string | null
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
          player_quest_branch_id?: string | null
          player_quest_id?: string | null
          quest_branch_id?: string | null
          quest_id?: string | null
          scenario_id?: string | null
          user_id?: string
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
          player_quest_branch_id?: string | null
          player_quest_id?: string | null
          quest_branch_id?: string | null
          quest_id?: string | null
          scenario_id?: string | null
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
            foreignKeyName: "player_rolled_dices_player_quest_branch_id_fkey"
            columns: ["player_quest_branch_id"]
            isOneToOne: false
            referencedRelation: "player_quest_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_rolled_dices_player_quest_id_fkey"
            columns: ["player_quest_id"]
            isOneToOne: false
            referencedRelation: "player_quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_rolled_dices_quest_branch_id_fkey"
            columns: ["quest_branch_id"]
            isOneToOne: false
            referencedRelation: "quest_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_rolled_dices_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_rolled_dices_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      player_scenarios: {
        Row: {
          created_at: string
          current_tick: number
          id: string
          player_id: string
          scenario_id: string
          scenario_snapshot_id: string
          status: Database["public"]["Enums"]["player_scenario_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          current_tick?: number
          id?: string
          player_id: string
          scenario_id: string
          scenario_snapshot_id: string
          status?: Database["public"]["Enums"]["player_scenario_status"]
          user_id?: string
        }
        Update: {
          created_at?: string
          current_tick?: number
          id?: string
          player_id?: string
          scenario_id?: string
          scenario_snapshot_id?: string
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
          {
            foreignKeyName: "player_scenarios_scenario_snapshot_id_fkey"
            columns: ["scenario_snapshot_id"]
            isOneToOne: false
            referencedRelation: "scenario_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          avatar: string | null
          bio: string | null
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quest_branches: {
        Row: {
          created_at: string
          created_by: string | null
          display_order_in_quest: number
          id: string
          parent_quest_branch_id: string | null
          quest_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order_in_quest?: number
          id?: string
          parent_quest_branch_id?: string | null
          quest_id: string
          title?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order_in_quest?: number
          id?: string
          parent_quest_branch_id?: string | null
          quest_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_branches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
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
          created_by: string | null
          id: string
          order_in_chapter: number
          scenario_id: string
          status: Database["public"]["Enums"]["publish_status"]
          title: string
          type: Database["public"]["Enums"]["quest_type"]
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          order_in_chapter?: number
          scenario_id: string
          status?: Database["public"]["Enums"]["publish_status"]
          title?: string
          type?: Database["public"]["Enums"]["quest_type"]
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          order_in_chapter?: number
          scenario_id?: string
          status?: Database["public"]["Enums"]["publish_status"]
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
          {
            foreignKeyName: "quests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quests_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_snapshots: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          description: string
          id: string
          name: string
          scenario_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json
          description?: string
          id?: string
          name: string
          scenario_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          description?: string
          id?: string
          name?: string
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_snapshots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenario_snapshots_scenario_id_fkey"
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
      terrains: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          game_asset: string | null
          height: number
          id: string
          respawn_x: number | null
          respawn_y: number | null
          scenario_id: string
          title: string
          width: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          game_asset?: string | null
          height?: number
          id?: string
          respawn_x?: number | null
          respawn_y?: number | null
          scenario_id: string
          title?: string
          width?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          game_asset?: string | null
          height?: number
          id?: string
          respawn_x?: number | null
          respawn_y?: number | null
          scenario_id?: string
          title?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "terrains_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terrains_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      terrains_tiles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          max_cluster_size: number
          min_cluster_size: number
          scenario_id: string
          spawn_weight: number
          terrain_id: string
          tile_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          max_cluster_size?: number
          min_cluster_size?: number
          scenario_id: string
          spawn_weight?: number
          terrain_id: string
          tile_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          max_cluster_size?: number
          min_cluster_size?: number
          scenario_id?: string
          spawn_weight?: number
          terrain_id?: string
          tile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "terrains_tiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terrains_tiles_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terrains_tiles_terrain_id_fkey"
            columns: ["terrain_id"]
            isOneToOne: false
            referencedRelation: "terrains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terrains_tiles_tile_id_fkey"
            columns: ["tile_id"]
            isOneToOne: false
            referencedRelation: "tiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tile_states: {
        Row: {
          atlas_name: string
          created_at: string
          created_by: string | null
          fps: number | null
          frame_from: number | null
          frame_to: number | null
          id: string
          loop: Database["public"]["Enums"]["loop_type"]
          max_durability: number
          min_durability: number
          scenario_id: string
          tile_id: string
          type: Database["public"]["Enums"]["tile_state_type"]
        }
        Insert: {
          atlas_name: string
          created_at?: string
          created_by?: string | null
          fps?: number | null
          frame_from?: number | null
          frame_to?: number | null
          id?: string
          loop?: Database["public"]["Enums"]["loop_type"]
          max_durability?: number
          min_durability?: number
          scenario_id: string
          tile_id: string
          type?: Database["public"]["Enums"]["tile_state_type"]
        }
        Update: {
          atlas_name?: string
          created_at?: string
          created_by?: string | null
          fps?: number | null
          frame_from?: number | null
          frame_to?: number | null
          id?: string
          loop?: Database["public"]["Enums"]["loop_type"]
          max_durability?: number
          min_durability?: number
          scenario_id?: string
          tile_id?: string
          type?: Database["public"]["Enums"]["tile_state_type"]
        }
        Relationships: [
          {
            foreignKeyName: "tile_states_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tile_states_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tile_states_tile_id_fkey"
            columns: ["tile_id"]
            isOneToOne: false
            referencedRelation: "tiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tiles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          max_durability: number
          name: string
          scenario_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          max_durability?: number
          name?: string
          scenario_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          max_durability?: number
          name?: string
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiles_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
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
          user_id?: string
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
      world_building_conditions: {
        Row: {
          building_condition_id: string
          building_id: string
          condition_id: string
          created_at: string
          deleted_at: string | null
          id: string
          player_id: string
          scenario_id: string
          user_id: string
          value: number
          world_building_id: string
          world_id: string
        }
        Insert: {
          building_condition_id: string
          building_id: string
          condition_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          player_id: string
          scenario_id: string
          user_id?: string
          value?: number
          world_building_id: string
          world_id: string
        }
        Update: {
          building_condition_id?: string
          building_id?: string
          condition_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          player_id?: string
          scenario_id?: string
          user_id?: string
          value?: number
          world_building_id?: string
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_building_conditions_building_condition_id_fkey"
            columns: ["building_condition_id"]
            isOneToOne: false
            referencedRelation: "building_conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_building_conditions_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_building_conditions_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_building_conditions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_building_conditions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_building_conditions_world_building_id_fkey"
            columns: ["world_building_id"]
            isOneToOne: false
            referencedRelation: "world_buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_building_conditions_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      world_buildings: {
        Row: {
          building_id: string
          cell_x: number
          cell_y: number
          created_at: string
          created_at_tick: number
          deleted_at: string | null
          id: string
          player_id: string
          scenario_id: string
          user_id: string
          world_id: string
        }
        Insert: {
          building_id: string
          cell_x?: number
          cell_y?: number
          created_at?: string
          created_at_tick?: number
          deleted_at?: string | null
          id?: string
          player_id: string
          scenario_id: string
          user_id?: string
          world_id: string
        }
        Update: {
          building_id?: string
          cell_x?: number
          cell_y?: number
          created_at?: string
          created_at_tick?: number
          deleted_at?: string | null
          id?: string
          player_id?: string
          scenario_id?: string
          user_id?: string
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_buildings_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_buildings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_buildings_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_buildings_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      world_character_needs: {
        Row: {
          character_id: string
          deleted_at: string | null
          id: string
          need_id: string
          player_id: string
          scenario_id: string
          user_id: string
          value: number
          world_character_id: string
          world_id: string
        }
        Insert: {
          character_id: string
          deleted_at?: string | null
          id?: string
          need_id: string
          player_id: string
          scenario_id: string
          user_id?: string
          value: number
          world_character_id: string
          world_id: string
        }
        Update: {
          character_id?: string
          deleted_at?: string | null
          id?: string
          need_id?: string
          player_id?: string
          scenario_id?: string
          user_id?: string
          value?: number
          world_character_id?: string
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_character_needs_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_character_needs_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "needs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_character_needs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_character_needs_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_character_needs_world_character_id_fkey"
            columns: ["world_character_id"]
            isOneToOne: false
            referencedRelation: "world_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_character_needs_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      world_characters: {
        Row: {
          character_id: string
          created_at: string
          created_at_tick: number
          deleted_at: string | null
          id: string
          player_id: string
          scenario_id: string
          user_id: string
          world_id: string
          x: number
          y: number
        }
        Insert: {
          character_id: string
          created_at?: string
          created_at_tick?: number
          deleted_at?: string | null
          id?: string
          player_id: string
          scenario_id: string
          user_id?: string
          world_id: string
          x?: number
          y?: number
        }
        Update: {
          character_id?: string
          created_at?: string
          created_at_tick?: number
          deleted_at?: string | null
          id?: string
          player_id?: string
          scenario_id?: string
          user_id?: string
          world_id?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "world_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_characters_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_characters_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_characters_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      world_items: {
        Row: {
          created_at: string
          created_at_tick: number
          deleted_at: string | null
          durability_ticks: number | null
          id: string
          item_id: string
          player_id: string
          rotation: number
          scenario_id: string
          user_id: string
          world_building_id: string | null
          world_character_id: string | null
          world_id: string
          x: number
          y: number
        }
        Insert: {
          created_at?: string
          created_at_tick?: number
          deleted_at?: string | null
          durability_ticks?: number | null
          id?: string
          item_id: string
          player_id: string
          rotation?: number
          scenario_id: string
          user_id?: string
          world_building_id?: string | null
          world_character_id?: string | null
          world_id: string
          x?: number
          y?: number
        }
        Update: {
          created_at?: string
          created_at_tick?: number
          deleted_at?: string | null
          durability_ticks?: number | null
          id?: string
          item_id?: string
          player_id?: string
          rotation?: number
          scenario_id?: string
          user_id?: string
          world_building_id?: string | null
          world_character_id?: string | null
          world_id?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "world_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_items_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_items_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_items_world_building_id_fkey"
            columns: ["world_building_id"]
            isOneToOne: false
            referencedRelation: "world_buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_items_world_character_id_fkey"
            columns: ["world_character_id"]
            isOneToOne: false
            referencedRelation: "world_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_items_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      world_tile_maps: {
        Row: {
          created_at: string
          data: Json
          deleted_at: string | null
          id: string
          player_id: string
          scenario_id: string
          terrain_id: string
          user_id: string
          world_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          deleted_at?: string | null
          id?: string
          player_id: string
          scenario_id: string
          terrain_id: string
          user_id: string
          world_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          deleted_at?: string | null
          id?: string
          player_id?: string
          scenario_id?: string
          terrain_id?: string
          user_id?: string
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_tile_maps_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_tile_maps_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_tile_maps_terrain_id_fkey"
            columns: ["terrain_id"]
            isOneToOne: false
            referencedRelation: "terrains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "world_tile_maps_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: true
            referencedRelation: "worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      worlds: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          player_id: string
          scenario_id: string
          terrain_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          player_id: string
          scenario_id: string
          terrain_id?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          player_id?: string
          scenario_id?: string
          terrain_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worlds_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worlds_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worlds_terrain_id_fkey"
            columns: ["terrain_id"]
            isOneToOne: false
            referencedRelation: "terrains"
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
      is_world_owner: { Args: { wid: string }; Returns: boolean }
    }
    Enums: {
      behavior_action_type: "once" | "fulfill" | "idle"
      building_state_type: "idle" | "damaged" | "planning" | "constructing"
      character_body_state_type: "idle" | "walk" | "run" | "jump" | "pick"
      character_face_state_type: "idle" | "happy" | "sad" | "angry"
      collider_type: "circle" | "rectangle"
      condition_fulfillment_type: "building"
      dice_roll_action: "narrative_node_next" | "narrative_node_done"
      fulfill_interaction_type:
        | "building_repair"
        | "building_clean"
        | "character_hug"
        | "building_use"
      interaction_type: "once" | "fulfill" | "system"
      item_state_type: "idle" | "broken"
      loop_type: "loop" | "once" | "ping-pong" | "ping-pong-once"
      narrative_node_type: "text" | "choice"
      need_fulfillment_task_condition: "completed" | "created"
      need_fulfillment_type: "building" | "character" | "task" | "item"
      once_interaction_type:
        | "item_use"
        | "building_use"
        | "building_construct"
        | "building_demolish"
      player_chapter_status: "in_progress" | "completed"
      player_quest_status: "in_progress" | "completed" | "abandoned"
      player_scenario_status: "in_progress" | "completed"
      publish_status: "draft" | "published"
      quest_type: "primary" | "secondary"
      system_interaction_type: "item_pick"
      target_selection_method: "explicit" | "search"
      tile_state_type: "idle" | "damaged_1" | "damaged_2"
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
      behavior_action_type: ["once", "fulfill", "idle"],
      building_state_type: ["idle", "damaged", "planning", "constructing"],
      character_body_state_type: ["idle", "walk", "run", "jump", "pick"],
      character_face_state_type: ["idle", "happy", "sad", "angry"],
      collider_type: ["circle", "rectangle"],
      condition_fulfillment_type: ["building"],
      dice_roll_action: ["narrative_node_next", "narrative_node_done"],
      fulfill_interaction_type: [
        "building_repair",
        "building_clean",
        "character_hug",
        "building_use",
      ],
      interaction_type: ["once", "fulfill", "system"],
      item_state_type: ["idle", "broken"],
      loop_type: ["loop", "once", "ping-pong", "ping-pong-once"],
      narrative_node_type: ["text", "choice"],
      need_fulfillment_task_condition: ["completed", "created"],
      need_fulfillment_type: ["building", "character", "task", "item"],
      once_interaction_type: [
        "item_use",
        "building_use",
        "building_construct",
        "building_demolish",
      ],
      player_chapter_status: ["in_progress", "completed"],
      player_quest_status: ["in_progress", "completed", "abandoned"],
      player_scenario_status: ["in_progress", "completed"],
      publish_status: ["draft", "published"],
      quest_type: ["primary", "secondary"],
      system_interaction_type: ["item_pick"],
      target_selection_method: ["explicit", "search"],
      tile_state_type: ["idle", "damaged_1", "damaged_2"],
      user_role_type: ["admin"],
    },
  },
} as const


// Tabelas e colunas conferidas contra os tipos gerados pelo banco real em 09/10/2026 (após as migrations 20261009001027 e
// 20261009001210): mesmas 14 tabelas e colunas. Só as assinaturas das funções inbox_* são mantidas à mão (nomes de argumentos).
// Gerado com o Supabase MCP (generate_typescript_types) a partir do projeto Astarita Inbox (yappbzpayqejqpkfebho).
// Regerar com: npm run inbox:types. Nunca misturar com src/integrations/supabase/types.ts, que é do calendário.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      ai_suggestions: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          kind: string;
          model: string | null;
          provider: string | null;
          used: boolean;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          kind: string;
          model?: string | null;
          provider?: string | null;
          used?: boolean;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          kind?: string;
          model?: string | null;
          provider?: string | null;
          used?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_suggestions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_tags: {
        Row: {
          contact_id: string;
          tag_id: string;
        };
        Insert: {
          contact_id: string;
          tag_id: string;
        };
        Update: {
          contact_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contact_tags_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: {
          assigned_to: string | null;
          category: string;
          company: string | null;
          created_at: string;
          id: string;
          instagram: string | null;
          name: string;
          notes: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          category?: string;
          company?: string | null;
          created_at?: string;
          id?: string;
          instagram?: string | null;
          name: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          category?: string;
          company?: string | null;
          created_at?: string;
          id?: string;
          instagram?: string | null;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          assigned_to: string | null;
          contact_id: string;
          created_at: string;
          id: string;
          last_inbound_at: string | null;
          last_message_at: string | null;
          last_message_preview: string | null;
          status: string;
          unread_count: number;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          contact_id: string;
          created_at?: string;
          id?: string;
          last_inbound_at?: string | null;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          status?: string;
          unread_count?: number;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          contact_id?: string;
          created_at?: string;
          id?: string;
          last_inbound_at?: string | null;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          status?: string;
          unread_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: true;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
        ];
      };
      internal_notes: {
        Row: {
          body: string;
          contact_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
        };
        Insert: {
          body: string;
          contact_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
        };
        Update: {
          body?: string;
          contact_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "internal_notes_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "internal_notes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      knowledge_base: {
        Row: {
          content: string;
          id: string;
          section: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          content?: string;
          id?: string;
          section: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          content?: string;
          id?: string;
          section?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_base_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          body: string | null;
          client_token: string | null;
          conversation_id: string;
          created_at: string;
          direction: string;
          error_code: string | null;
          error_message: string | null;
          id: string;
          media_mime: string | null;
          media_path: string | null;
          reply_to_id: string | null;
          sent_by: string | null;
          status: string;
          status_updated_at: string | null;
          type: string;
          wa_media_id: string | null;
          wa_message_id: string | null;
        };
        Insert: {
          body?: string | null;
          client_token?: string | null;
          conversation_id: string;
          created_at?: string;
          direction: string;
          error_code?: string | null;
          error_message?: string | null;
          id?: string;
          media_mime?: string | null;
          media_path?: string | null;
          reply_to_id?: string | null;
          sent_by?: string | null;
          status?: string;
          status_updated_at?: string | null;
          type?: string;
          wa_media_id?: string | null;
          wa_message_id?: string | null;
        };
        Update: {
          body?: string | null;
          client_token?: string | null;
          conversation_id?: string;
          created_at?: string;
          direction?: string;
          error_code?: string | null;
          error_message?: string | null;
          id?: string;
          media_mime?: string | null;
          media_path?: string | null;
          reply_to_id?: string | null;
          sent_by?: string | null;
          status?: string;
          status_updated_at?: string | null;
          type?: string;
          wa_media_id?: string | null;
          wa_message_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey";
            columns: ["reply_to_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sent_by_fkey";
            columns: ["sent_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      opportunities: {
        Row: {
          assigned_to: string | null;
          contact_id: string;
          created_at: string;
          id: string;
          last_interaction_at: string | null;
          position: number;
          stage_id: string;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          contact_id: string;
          created_at?: string;
          id?: string;
          last_interaction_at?: string | null;
          position?: number;
          stage_id: string;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          contact_id?: string;
          created_at?: string;
          id?: string;
          last_interaction_at?: string | null;
          position?: number;
          stage_id?: string;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "opportunities_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunities_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunities_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "pipeline_stages";
            referencedColumns: ["id"];
          },
        ];
      };
      pipeline_stages: {
        Row: {
          id: string;
          is_lost: boolean;
          is_won: boolean;
          name: string;
          position: number;
          slug: string;
        };
        Insert: {
          id?: string;
          is_lost?: boolean;
          is_won?: boolean;
          name: string;
          position: number;
          slug: string;
        };
        Update: {
          id?: string;
          is_lost?: boolean;
          is_won?: boolean;
          name?: string;
          position?: number;
          slug?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          active: boolean;
          avatar_url: string | null;
          created_at: string;
          full_name: string;
          id: string;
          role: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          avatar_url?: string | null;
          created_at?: string;
          full_name: string;
          id: string;
          role?: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      quick_replies: {
        Row: {
          body: string;
          category: string;
          created_at: string;
          created_by: string | null;
          id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          body: string;
          category: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          category?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quick_replies_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reminders: {
        Row: {
          assigned_to: string | null;
          contact_id: string;
          created_at: string;
          created_by: string | null;
          description: string;
          due_at: string;
          id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          contact_id: string;
          created_at?: string;
          created_by?: string | null;
          description: string;
          due_at: string;
          id?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          contact_id?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          due_at?: string;
          id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reminders_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reminders_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reminders_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tags: {
        Row: {
          color: string;
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      webhook_events: {
        Row: {
          created_at: string;
          error: string | null;
          event_key: string | null;
          id: string;
          payload: Json;
          processed_at: string | null;
          provider: string;
          signature_valid: boolean;
        };
        Insert: {
          created_at?: string;
          error?: string | null;
          event_key?: string | null;
          id?: string;
          payload: Json;
          processed_at?: string | null;
          provider?: string;
          signature_valid: boolean;
        };
        Update: {
          created_at?: string;
          error?: string | null;
          event_key?: string | null;
          id?: string;
          payload?: Json;
          processed_at?: string | null;
          provider?: string;
          signature_valid?: boolean;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_inbox_member: { Args: never; Returns: boolean };
      // Funções do backend (migration inbox_whatsapp_notes, ainda não aplicada): só service_role executa.
      inbox_ingest_inbound: {
        Args: {
          p_wa_id: string;
          p_profile_name: string | null;
          p_wa_message_id: string;
          p_type: string;
          p_body: string | null;
          p_media_mime: string | null;
          p_wa_media_id: string | null;
          p_sent_at: string;
        };
        Returns: Json;
      };
      inbox_ingest_echo: {
        Args: {
          p_to_wa_id: string;
          p_wa_message_id: string;
          p_type: string;
          p_body: string | null;
          p_media_mime: string | null;
          p_wa_media_id: string | null;
          p_sent_at: string;
        };
        Returns: Json;
      };
      inbox_apply_status: {
        Args: {
          p_wa_message_id: string;
          p_status: string;
          p_at: string;
          p_error_code: string | null;
          p_error_message: string | null;
        };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

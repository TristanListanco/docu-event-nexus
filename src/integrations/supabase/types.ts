export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      big_events: {
        Row: {
          end_date: string
          id: string
          name: string
          start_date: string
          user_id: string
        }
        Insert: {
          end_date: string
          id?: string
          name: string
          start_date: string
          user_id: string
        }
        Update: {
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          big_event_id: string | null
          ccs_only_event: boolean
          created_at: string
          date: string
          end_date: string
          end_time: string
          id: string
          ignore_schedule_conflicts: boolean
          is_big_event: boolean
          location: string
          log_id: string
          name: string
          organizer: string | null
          start_time: string
          status: Database["public"]["Enums"]["event_status"]
          type: Database["public"]["Enums"]["event_type"]
          user_id: string
        }
        Insert: {
          big_event_id?: string | null
          ccs_only_event?: boolean
          created_at?: string
          date: string
          end_date: string
          end_time: string
          id?: string
          ignore_schedule_conflicts?: boolean
          is_big_event?: boolean
          location: string
          log_id: string
          name: string
          organizer?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["event_status"]
          type: Database["public"]["Enums"]["event_type"]
          user_id: string
        }
        Update: {
          big_event_id?: string | null
          ccs_only_event?: boolean
          created_at?: string
          date?: string
          end_date?: string
          end_time?: string
          id?: string
          ignore_schedule_conflicts?: boolean
          is_big_event?: boolean
          location?: string
          log_id?: string
          name?: string
          organizer?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["event_status"]
          type?: Database["public"]["Enums"]["event_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_big_event_id_fkey"
            columns: ["big_event_id"]
            isOneToOne: false
            referencedRelation: "big_events"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_dates: {
        Row: {
          created_at: string
          end_date: string
          id: string
          staff_id: string
          start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          staff_id: string
          start_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          staff_id?: string
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          event_id: string
          event_name: string
          id: string
          message: string
          read: boolean
          staff_id: string
          staff_name: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          event_name: string
          id?: string
          message: string
          read?: boolean
          staff_id: string
          staff_name: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          event_name?: string
          id?: string
          message?: string
          read?: boolean
          staff_id?: string
          staff_name?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      schedules: {
        Row: {
          day_of_week: number
          end_time: string
          id: string
          staff_id: string
          start_time: string
          subject_schedule_id: string | null
          user_id: string
        }
        Insert: {
          day_of_week: number
          end_time: string
          id?: string
          staff_id: string
          start_time: string
          subject_schedule_id?: string | null
          user_id: string
        }
        Update: {
          day_of_week?: number
          end_time?: string
          id?: string
          staff_id?: string
          start_time?: string
          subject_schedule_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_subject_schedule_id_fkey"
            columns: ["subject_schedule_id"]
            isOneToOne: false
            referencedRelation: "subject_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_assignments: {
        Row: {
          attendance_status: Database["public"]["Enums"]["attendance_status"]
          confirmation_status: string | null
          confirmation_token: string | null
          confirmation_token_expires_at: string | null
          confirmed_at: string | null
          declined_at: string | null
          event_id: string
          id: string
          last_invitation_sent_at: string | null
          manual_invitation_sent_at: string | null
          staff_id: string
          user_id: string
        }
        Insert: {
          attendance_status?: Database["public"]["Enums"]["attendance_status"]
          confirmation_status?: string | null
          confirmation_token?: string | null
          confirmation_token_expires_at?: string | null
          confirmed_at?: string | null
          declined_at?: string | null
          event_id: string
          id?: string
          last_invitation_sent_at?: string | null
          manual_invitation_sent_at?: string | null
          staff_id: string
          user_id: string
        }
        Update: {
          attendance_status?: Database["public"]["Enums"]["attendance_status"]
          confirmation_status?: string | null
          confirmation_token?: string | null
          confirmation_token_expires_at?: string | null
          confirmed_at?: string | null
          declined_at?: string | null
          event_id?: string
          id?: string
          last_invitation_sent_at?: string | null
          manual_invitation_sent_at?: string | null
          staff_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          photo_url: string | null
          position: Database["public"]["Enums"]["staff_position"] | null
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          photo_url?: string | null
          position?: Database["public"]["Enums"]["staff_position"] | null
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          position?: Database["public"]["Enums"]["staff_position"] | null
          role?: Database["public"]["Enums"]["staff_role"]
          user_id?: string
        }
        Relationships: []
      }
      staff_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["staff_role"]
          staff_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["staff_role"]
          staff_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          staff_id?: string
          user_id?: string
        }
        Relationships: []
      }
      subject_schedules: {
        Row: {
          created_at: string
          id: string
          staff_id: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          staff_id: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          staff_id?: string
          subject?: string
          user_id?: string
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
      attendance_status: "Pending" | "Completed" | "Absent" | "Excused"
      event_status: "Upcoming" | "Ongoing" | "Completed" | "Cancelled"
      event_type: "SPECOM" | "LITCOM" | "CUACOM" | "SPODACOM" | "General"
      staff_position:
        | "Chairperson"
        | "Co-Chairperson"
        | "Secretary"
        | "Undersecretary"
        | "Associate"
      staff_role: "Videographer" | "Photographer" | "Working Com"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attendance_status: ["Pending", "Completed", "Absent", "Excused"],
      event_status: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
      event_type: ["SPECOM", "LITCOM", "CUACOM", "SPODACOM", "General"],
      staff_position: [
        "Chairperson",
        "Co-Chairperson",
        "Secretary",
        "Undersecretary",
        "Associate",
      ],
      staff_role: ["Videographer", "Photographer", "Working Com"],
    },
  },
} as const

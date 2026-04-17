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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      authors: {
        Row: {
          created_at: string | null
          id: string
          name: string
          name_unaccent: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          name_unaccent?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          name_unaccent?: string | null
        }
        Relationships: []
      }
      book_authors: {
        Row: {
          author_id: string
          book_id: string
        }
        Insert: {
          author_id: string
          book_id: string
        }
        Update: {
          author_id?: string
          book_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_authors_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_authors_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors_with_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_authors_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author_id: string | null
          chosen_by: string
          end_date: string | null
          gender: string | null
          id: string
          image_url: string | null
          inserted_at: string | null
          is_reread: boolean
          pages: number
          planned_start_date: string | null
          readers: string[]
          search_vector: unknown
          start_date: string | null
          status: Database["public"]["Enums"]["book_status"]
          title: string
          title_unaccent: string | null
          user_id: string | null
        }
        Insert: {
          author_id?: string | null
          chosen_by: string
          end_date?: string | null
          gender?: string | null
          id?: string
          image_url?: string | null
          inserted_at?: string | null
          is_reread?: boolean
          pages: number
          planned_start_date?: string | null
          readers: string[]
          search_vector?: unknown
          start_date?: string | null
          status?: Database["public"]["Enums"]["book_status"]
          title: string
          title_unaccent?: string | null
          user_id?: string | null
        }
        Update: {
          author_id?: string | null
          chosen_by?: string
          end_date?: string | null
          gender?: string | null
          id?: string
          image_url?: string | null
          inserted_at?: string | null
          is_reread?: boolean
          pages?: number
          planned_start_date?: string | null
          readers?: string[]
          search_vector?: unknown
          start_date?: string | null
          status?: Database["public"]["Enums"]["book_status"]
          title?: string
          title_unaccent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "books_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors_with_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_chosen_by_fkey"
            columns: ["chosen_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_shelf_books: {
        Row: {
          book_id: string | null
          created_at: string | null
          id: string
          shelf_id: string | null
          sort_order: number
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          id?: string
          shelf_id?: string | null
          sort_order: number
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          id?: string
          shelf_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_shelf_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_shelf_books_shelf_id_fkey"
            columns: ["shelf_id"]
            isOneToOne: false
            referencedRelation: "custom_shelves"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_shelves: {
        Row: {
          created_at: string | null
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          book_id: string
          content: string
          created_at: string
          id: string
          page: number | null
          updated_at: string | null
        }
        Insert: {
          book_id: string
          content: string
          created_at?: string
          id?: string
          page?: number | null
          updated_at?: string | null
        }
        Update: {
          book_id?: string
          content?: string
          created_at?: string
          id?: string
          page?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule: {
        Row: {
          book_id: string
          chapters: string
          completed: boolean | null
          created_at: string | null
          date: string
          id: string
          owner: string | null
        }
        Insert: {
          book_id: string
          chapters: string
          completed?: boolean | null
          created_at?: string | null
          date: string
          id?: string
          owner?: string | null
        }
        Update: {
          book_id?: string
          chapters?: string
          completed?: boolean | null
          created_at?: string | null
          date?: string
          id?: string
          owner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      user_followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_followers_follower_fk"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_followers_following_fk"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          display_name: string
          email: string | null
          id: string
        }
        Insert: {
          display_name: string
          email?: string | null
          id: string
        }
        Update: {
          display_name?: string
          email?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      authors_with_counts: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
          total_books: number | null
        }
        Relationships: []
      }
      distinct_reading_years: {
        Row: {
          year: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_reader_collaboration_stats: {
        Args: { reader_input: string }
        Returns: {
          books_read: number
          reader_name: string
        }[]
      }
      get_reading_leaderboard: {
        Args: { year_input?: number }
        Returns: {
          books_read: number
          display_name: string
          reader_id: string
          total_pages: number
        }[]
      }
      get_reading_stats_by_reader: {
        Args: { reader_input: string }
        Returns: {
          avg_pages_per_book: number
          longest_book_pages: number
          longest_book_title: string
          most_productive_month: string
          most_read_author: string
          most_read_genre: string
          total_books: number
          total_pages: number
          year: number
        }[]
      }
      immutable_unaccent: { Args: { "": string }; Returns: string }
      reorder_custom_shelf_books: {
        Args: { p_book_ids: string[]; p_shelf_id: string }
        Returns: undefined
      }
      search_books: {
        Args: { query: string }
        Returns: {
          author_id: string | null
          chosen_by: string
          end_date: string | null
          gender: string | null
          id: string
          image_url: string | null
          inserted_at: string | null
          is_reread: boolean
          pages: number
          planned_start_date: string | null
          readers: string[]
          search_vector: unknown
          start_date: string | null
          status: Database["public"]["Enums"]["book_status"]
          title: string
          title_unaccent: string | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "books"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
      unaccent_immutable: { Args: { "": string }; Returns: string }
    }
    Enums: {
      book_status:
        | "not_started"
        | "planned"
        | "reading"
        | "paused"
        | "abandoned"
        | "finished"
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
      book_status: [
        "not_started",
        "planned",
        "reading",
        "paused",
        "abandoned",
        "finished",
      ],
    },
  },
} as const

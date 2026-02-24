export type UserRole = "trainer" | "client";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  preferred_language: string;
  theme: string;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: number;
  user_id: string;
  role: UserRole;
}

export interface Exercise {
  id: string;
  name: string;
  youtube_url: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          is_active: boolean;
          preferred_language: string;
          theme: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          is_active?: boolean;
          preferred_language?: string;
          theme?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          is_active?: boolean;
          preferred_language?: string;
          theme?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: number;
          user_id: string;
          role: UserRole;
        };
        Insert: {
          id?: number;
          user_id: string;
          role: UserRole;
        };
        Update: {
          id?: number;
          user_id?: string;
          role?: UserRole;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          youtube_url: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          youtube_url: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          youtube_url?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
    };
  };
}

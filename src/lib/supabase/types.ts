export type CallEndReason = 'completed' | 'left_early' | 'technical';
export type ReportCategory = 'hate_speech' | 'harassment' | 'sexual_content' | 'off_platform' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'actioned';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          photo_url: string | null;
          birth_year: number | null;
          city: string | null;
          phone: string | null;
          education: string | null;
          military_service: string | null;
          xp: number;
          level: number;
          avg_rating: number;
          reports_received: number;
          shadow_throttled: boolean;
          banned_until: string | null;
          consented_at: string | null;
          questionnaire_completed: boolean;
          hobbies: string[] | null;
          political_vector: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          photo_url?: string | null;
          birth_year?: number | null;
          city?: string | null;
          phone?: string | null;
          education?: string | null;
          military_service?: string | null;
          xp?: number;
          level?: number;
          avg_rating?: number;
          reports_received?: number;
          shadow_throttled?: boolean;
          banned_until?: string | null;
          consented_at?: string | null;
          questionnaire_completed?: boolean;
          hobbies?: string[] | null;
          political_vector?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          photo_url?: string | null;
          birth_year?: number | null;
          city?: string | null;
          phone?: string | null;
          education?: string | null;
          military_service?: string | null;
          xp?: number;
          level?: number;
          avg_rating?: number;
          reports_received?: number;
          shadow_throttled?: boolean;
          banned_until?: string | null;
          consented_at?: string | null;
          questionnaire_completed?: boolean;
          hobbies?: string[] | null;
          political_vector?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [];
      };
      questionnaires: {
        Row: {
          id: string;
          user_id: string;
          hobbies: string[];
          values_answers: Record<string, unknown>;
          politics_answers: Record<string, unknown> | null;
          political_vector: Record<string, unknown> | null;
          security_score: number | null;
          religion_score: number | null;
          economics_score: number | null;
          consented_at: string;
          updated_at: string | null;
          version: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          hobbies?: string[];
          values_answers?: Record<string, unknown>;
          politics_answers?: Record<string, unknown> | null;
          political_vector?: Record<string, unknown> | null;
          security_score?: number | null;
          religion_score?: number | null;
          economics_score?: number | null;
          consented_at?: string;
          updated_at?: string | null;
          version?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          hobbies?: string[];
          values_answers?: Record<string, unknown>;
          politics_answers?: Record<string, unknown> | null;
          political_vector?: Record<string, unknown> | null;
          security_score?: number | null;
          religion_score?: number | null;
          economics_score?: number | null;
          consented_at?: string;
          updated_at?: string | null;
          version?: number;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          user_a: string;
          user_b: string;
          level: number;
          started_at: string;
          ended_at: string | null;
          completed: boolean;
          end_reason: CallEndReason | null;
          prompt_used: string | null;
          hobby_overlap: string[] | null;
        };
        Insert: {
          id?: string;
          user_a: string;
          user_b: string;
          level?: number;
          started_at?: string;
          ended_at?: string | null;
          completed?: boolean;
          end_reason?: CallEndReason | null;
          prompt_used?: string | null;
          hobby_overlap?: string[] | null;
        };
        Update: {
          id?: string;
          user_a?: string;
          user_b?: string;
          level?: number;
          started_at?: string;
          ended_at?: string | null;
          completed?: boolean;
          end_reason?: CallEndReason | null;
          prompt_used?: string | null;
          hobby_overlap?: string[] | null;
        };
        Relationships: [];
      };
      ratings: {
        Row: {
          id: string;
          match_id: string;
          rater_id: string;
          ratee_id: string;
          stars: number;
          report_category: ReportCategory | null;
          report_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          rater_id: string;
          ratee_id: string;
          stars: number;
          report_category?: ReportCategory | null;
          report_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          rater_id?: string;
          ratee_id?: string;
          stars?: number;
          report_category?: ReportCategory | null;
          report_text?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      xp_events: {
        Row: {
          id: string;
          user_id: string;
          match_id: string | null;
          amount: number;
          reason: string;
          multipliers: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          match_id?: string | null;
          amount: number;
          reason: string;
          multipliers?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          match_id?: string | null;
          amount?: number;
          reason?: string;
          multipliers?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [];
      };
      streaks: {
        Row: {
          user_id: string;
          current_days: number;
          longest_days: number;
          last_active_date: string | null;
          calls_today: number;
        };
        Insert: {
          user_id: string;
          current_days?: number;
          longest_days?: number;
          last_active_date?: string | null;
          calls_today?: number;
        };
        Update: {
          user_id?: string;
          current_days?: number;
          longest_days?: number;
          last_active_date?: string | null;
          calls_today?: number;
        };
        Relationships: [];
      };
      achievements: {
        Row: {
          id: string;
          key: string;
          name_he: string;
          description_he: string;
          icon: string;
        };
        Insert: {
          id?: string;
          key: string;
          name_he: string;
          description_he: string;
          icon: string;
        };
        Update: {
          id?: string;
          key?: string;
          name_he?: string;
          description_he?: string;
          icon?: string;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
        };
        Update: {
          user_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
        };
        Relationships: [];
      };
      match_queue: {
        Row: {
          id: string;
          user_id: string;
          queued_at: string;
          level: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          queued_at?: string;
          level?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          queued_at?: string;
          level?: number;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_id: string;
          match_id: string | null;
          category: ReportCategory;
          notes: string | null;
          status: ReportStatus;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_id: string;
          match_id?: string | null;
          category: ReportCategory;
          notes?: string | null;
          status?: ReportStatus;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          target_id?: string;
          match_id?: string | null;
          category?: ReportCategory;
          notes?: string | null;
          status?: ReportStatus;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      bans: {
        Row: {
          user_id: string;
          reason: string | null;
          starts_at: string;
          ends_at: string | null;
        };
        Insert: {
          user_id: string;
          reason?: string | null;
          starts_at?: string;
          ends_at?: string | null;
        };
        Update: {
          user_id?: string;
          reason?: string | null;
          starts_at?: string;
          ends_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      call_end_reason: 'completed' | 'left_early' | 'technical';
      report_category: 'hate_speech' | 'harassment' | 'sexual_content' | 'off_platform' | 'other';
      report_status: 'pending' | 'reviewed' | 'dismissed' | 'actioned';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ModuleId = 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6' | 'M7'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          exam_date: string | null
          daily_goal_minutes: number
          streak: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          exam_date?: string | null
          daily_goal_minutes?: number
          streak?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          exam_date?: string | null
          daily_goal_minutes?: number
          streak?: number
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          user_id: string
          module_id: ModuleId
          title: string
          page_count: number
          storage_path: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_id: ModuleId
          title: string
          page_count?: number
          storage_path: string
          created_at?: string
        }
        Update: {
          title?: string
          page_count?: number
        }
        Relationships: []
      }
      course_pages: {
        Row: {
          id: string
          course_id: string
          page_number: number
          ocr_text: string
          storage_path: string
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          page_number: number
          ocr_text: string
          storage_path: string
          created_at?: string
        }
        Update: {
          ocr_text?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          id: string
          user_id: string
          course_id: string
          module_id: ModuleId
          concept: string
          definition: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          module_id: ModuleId
          concept: string
          definition: string
          created_at?: string
        }
        Update: {
          concept?: string
          definition?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          id: string
          user_id: string
          course_id: string
          module_id: ModuleId
          question: string
          choices: Json
          correct_index: number
          explanation: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          module_id: ModuleId
          question: string
          choices: Json
          correct_index: number
          explanation: string
          created_at?: string
        }
        Update: {
          question?: string
          choices?: Json
          correct_index?: number
          explanation?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          module_id: ModuleId
          question_id: string
          selected_index: number
          is_correct: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          module_id: ModuleId
          question_id: string
          selected_index: number
          is_correct: boolean
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      daily_sessions: {
        Row: {
          id: string
          user_id: string
          date: string
          minutes_studied: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          minutes_studied?: number
          created_at?: string
        }
        Update: {
          minutes_studied?: number
        }
        Relationships: []
      }
      flashcard_progress: {
        Row: {
          user_id: string
          flashcard_id: string
          status: 'known' | 'review'
          updated_at: string
        }
        Insert: {
          user_id: string
          flashcard_id: string
          status: 'known' | 'review'
          updated_at?: string
        }
        Update: {
          status?: 'known' | 'review'
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

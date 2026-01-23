export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: 'admin' | 'user'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          role?: 'admin' | 'user'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: 'admin' | 'user'
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string
          status: 'unassigned' | 'pending' | 'in_progress' | 'completed'
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          status?: 'unassigned' | 'pending' | 'in_progress' | 'completed'
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: 'unassigned' | 'pending' | 'in_progress' | 'completed'
          created_by?: string
          created_at?: string
        }
      }
      task_assignments: {
        Row: {
          id: string
          task_id: string
          user_id: string
          assigned_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          assigned_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          assigned_at?: string
        }
      }
      task_comments: {
        Row: {
          id: string
          task_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      assignment_requests: {
        Row: {
          id: string
          task_id: string
          user_id: string
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
        }
      }
      documentation_sections: {
        Row: {
          id: string
          title: string
          slug: string
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          order: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          order?: number
          created_at?: string
        }
      }
      documentation_pages: {
        Row: {
          id: string
          section_id: string
          title: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          section_id: string
          title: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          section_id?: string
          title?: string
          content?: string
          created_at?: string
        }
      }
      keep_alive: {
        Row: {
          id: string
          last_ping: string
        }
        Insert: {
          id?: string
          last_ping?: string
        }
        Update: {
          id?: string
          last_ping?: string
        }
      }
      task_links: {
        Row: {
          id: string
          task_id: string
          link_type: 'plugins' | 'documentacion' | 'tutoriales'
          name: string
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          link_type: 'plugins' | 'documentacion' | 'tutoriales'
          name: string
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          link_type?: 'plugins' | 'documentacion' | 'tutoriales'
          name?: string
          url?: string
          created_at?: string
        }
      }
    }
  }
}

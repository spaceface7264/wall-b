export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    company?: string;
    role?: string;
    avatar_url?: string;
  };
  created_at?: string;
}

export interface Message {
  id: string;
  user_id: string;
  user_email: string;
  message: string;
  created_at: string;
}


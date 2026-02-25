import type { User } from '@supabase/supabase-js';

// Standard type for our authenticated users (Real Supabase or Dev Bypass)
export type AuthUser = User | {
    devBypass: true;
    id: string;
    email: string;
    user_metadata?: { name?: string };
    app_metadata?: { role?: string };
};

export interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    signInWithDevBypass: (email?: string) => void;
    signOut: () => Promise<void>;
}

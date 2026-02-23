import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

// We extend the User type slightly or just use it as is.
// For the dev bypass, we'll create a fake User object.
export type AuthUser = User | { devBypass: true; id: string; email: string };

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    signInWithDevBypass: () => void;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
            }
            setLoading(false);
        });

        // Listen for changes on auth state (in case of sign in/out from other tabs)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithDevBypass = () => {
        // Create a dummy user for dev purposes
        const devUser: AuthUser = {
            devBypass: true,
            id: 'dev-bypass-user-id-123',
            email: 'john.doe@campaignlab.uk',
            app_metadata: {},
            user_metadata: { name: 'John Doe (Admin)' },
            aud: 'authenticated',
            created_at: new Date().toISOString()
        } as any; // Cast as any because we aren't filling all Supabase User fields

        setUser(devUser);
    };

    const signOut = async () => {
        if (user && 'devBypass' in user) {
            // Just clear local state if it's the bypass user
            setUser(null);
            return;
        }

        // Otherwise actually sign out from Supabase
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithDevBypass, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

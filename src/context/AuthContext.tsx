import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

// Standard type for our authenticated users (Real Supabase or Dev Bypass)
export type AuthUser = User | {
    devBypass: true;
    id: string;
    email: string;
    user_metadata?: { name?: string };
    app_metadata?: { role?: string };
};

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
        const verifyUser = async () => {
            // getUser() is more robust than getSession() as it checks the database
            // directly to see if the user has been deleted or changed.
            const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();

            if (supabaseUser) {
                if (supabaseUser.email_confirmed_at) {
                    setUser(supabaseUser);
                } else {
                    // Strictly block unverified users from the dashboard
                    console.warn('[Auth] Unverified user detected, clearing session.');
                    await supabase.auth.signOut();
                    setUser(null);
                }
            } else {
                if (error) console.log('[Auth] Initial session check:', error.message);
                setUser(null);
            }
            setLoading(false);
        };

        verifyUser();

        // Listen for changes on auth state
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth State Change:', event, !!session);

            if (session?.user) {
                if (session.user.email_confirmed_at) {
                    setUser(session.user);
                } else {
                    setUser(null);
                    // Force logout if they aren't on a verification route
                    const isAuthRoute = window.location.hash.includes('type=');
                    if (event === 'SIGNED_IN' && !isAuthRoute) {
                        await supabase.auth.signOut();
                    }
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithDevBypass = () => {
        if (import.meta.env.VITE_BYPASS_ENABLED === 'true') {
            // Create a dummy user for dev purposes
            const devUser: AuthUser = {
                devBypass: true,
                id: 'dev-bypass-user-id-123',
                email: 'john.doe@campaignlab.uk',
                user_metadata: { name: 'John Doe (Admin)' },
                aud: 'authenticated',
                created_at: new Date().toISOString()
            } as any;

            setUser(devUser);
        } else {
            console.error("Bypass login is disabled in this environment.");
        }
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

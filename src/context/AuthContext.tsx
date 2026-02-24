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
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                // If the email is confirmed, they are a full user
                if (session.user.email_confirmed_at) {
                    setUser(session.user);
                } else {
                    // We DO NOT call signOut here yet, because we need the session 
                    // to exist so the VerifyEmailPage can consume the token!
                    // We just keep the global 'user' state as null.
                    setUser(null);
                }
            }
            setLoading(false);
        });

        // Listen for changes on auth state
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth State Change:', event, !!session);

            if (session?.user) {
                if (session.user.email_confirmed_at) {
                    setUser(session.user);
                } else {
                    // Keep user null for the dashboard, but don't sign out yet
                    // so the auth flows can work their magic
                    setUser(null);

                    // Only force a logout if they aren't on a verification route
                    // and just tried a standard login
                    const isAuthRoute = window.location.hash.includes('type=');
                    if (event === 'SIGNED_IN' && !isAuthRoute) {
                        supabase.auth.signOut();
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
        if (import.meta.env.VITE_ALLOW_BYPASS === 'true') {
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

import React, { createContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AuthUser, AuthContextType } from '../types/auth';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyUser = async () => {
            console.log('[Auth] Initializing session check...');
            // getUser() is more robust than getSession() as it checks the database
            // directly to see if the user has been deleted or changed.
            const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();

            if (supabaseUser) {
                // Check if they are in an auth flow (Invite / Recovery)
                // We check both the live hash AND the captured initial hash to prevent 
                // race conditions where VerifyEmailPage already "consumed" the hash.
                const currentHash = window.location.hash;
                const initialHash = (window as any).__INITIAL_HASH__ || '';
                const isAuthRoute = currentHash.includes('type=') || initialHash.includes('type=');

                if (supabaseUser.email_confirmed_at || isAuthRoute) {
                    console.log('[Auth] Valid user session identified:', supabaseUser.email);
                    setUser(supabaseUser);
                } else {
                    // Strictly block unverified users from accessing the main dashboard
                    console.warn('[Auth] Unverified user detected not on an auth route, clearing session.');
                    await supabase.auth.signOut();
                    setUser(null);
                }
            } else {
                if (error) console.log('[Auth] No active session found:', error.message);
                setUser(null);
            }
            setLoading(false);
        };

        verifyUser();

        // Listen for changes on auth state
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[Auth] State Change Notify:', event, !!session);

            if (session?.user) {
                const currentHash = window.location.hash;
                const initialHash = (window as any).__INITIAL_HASH__ || '';
                const isAuthRoute = currentHash.includes('type=') || initialHash.includes('type=');

                if (session.user.email_confirmed_at || isAuthRoute) {
                    setUser(session.user);
                } else {
                    setUser(null);
                    // Force logout if they aren't on a verification route
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

    const signInWithDevBypass = (email?: string) => {
        if (import.meta.env.VITE_BYPASS_ENABLED === 'true') {
            const devUser: AuthUser = {
                devBypass: true,
                id: 'dev-bypass-' + (email ? 'invite' : 'admin'),
                email: email || 'john.doe@campaignlab.uk',
                app_metadata: {},
                user_metadata: {
                    name: email
                        ? `Simulated: ${email.split('@')[0]}`
                        : 'John Doe (Admin)'
                },
                aud: 'authenticated',
                created_at: new Date().toISOString()
            } as any;

            console.log('[Auth] Triggering Dev Bypass Login for:', devUser.email);
            setUser(devUser);
        } else {
            console.error("Security Breach: Bypass login code should not be reachable in production.");
        }
    };

    const signOut = async () => {
        if (user && 'devBypass' in user) {
            setUser(null);
            return;
        }
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithDevBypass, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

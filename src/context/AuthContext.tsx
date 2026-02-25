import React, { createContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AuthUser, AuthContextType } from '../types/auth';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyUser = async () => {
            console.log('[Auth] Initializing server-side session check...');

            // getUser() is the ONLY way to be sure the user hasn't been deleted in the dashboard.
            // getSession() only reads from local storage and might stay 'valid' even if user is gone.
            const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();

            if (supabaseUser) {
                const currentHash = window.location.hash;
                const initialHash = (window as any).__INITIAL_HASH__ || '';
                const isAuthRoute = currentHash.includes('type=') || initialHash.includes('type=');

                if (supabaseUser.email_confirmed_at || isAuthRoute) {
                    console.log('[Auth] Server verified user:', supabaseUser.email);
                    setUser(supabaseUser);
                } else {
                    console.warn('[Auth] Unverified user detected, clearing session.');
                    await supabase.auth.signOut();
                    setUser(null);
                }
            } else {
                if (error) {
                    console.log('[Auth] Verification failed (user might be deleted):', error.message);
                    // If we have an error but the browser thinks we have a session, 
                    // we MUST clear local storage to boot them out.
                    const { data: { session: localSession } } = await supabase.auth.getSession();
                    if (localSession) {
                        console.log('[Auth] Clearing stale local session.');
                        await supabase.auth.signOut();
                    }
                } else {
                    console.log('[Auth] No active session found.');
                }
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
                    if (event === 'SIGNED_IN' && !isAuthRoute) {
                        await supabase.auth.signOut();
                    }
                }
            } else {
                // If we get a SIGNED_OUT event, we clear the user immediately
                if (event === 'SIGNED_OUT') {
                    setUser(null);
                }
            }
            // Note: We don't set loading to false here on the initial fire 
            // to allow verifyUser (server check) to finish first.
            if (event !== 'INITIAL_SESSION') {
                setLoading(false);
            }
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

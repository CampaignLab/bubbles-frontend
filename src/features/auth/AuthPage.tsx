import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function AuthPage() {
    const { signInWithDevBypass } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isBypassHovered, setIsBypassHovered] = useState(false);
    const [isSubmitHovered, setIsSubmitHovered] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            setError(signInError.message);
        }
        setLoading(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}>


            {/* DEV BYPASS - Uses Vite Env var to physically strip code from build if false */}
            {import.meta.env.VITE_ALLOW_BYPASS === 'true' && (
                <button
                    onClick={signInWithDevBypass}
                    onMouseEnter={() => setIsBypassHovered(true)}
                    onMouseLeave={() => setIsBypassHovered(false)}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        zIndex: 2000,
                        padding: '10px 15px',
                        background: isBypassHovered ? '#f1f5f9' : 'white',
                        border: '1px solid #000',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        transition: 'background 0.2s',
                        boxShadow: isBypassHovered ? '2px 2px 0px #000' : 'none',
                    }}
                >
                    BYPASS LOGIN (DOE)
                </button>
            )}

            {/* LOGIN CARD */}
            <div style={{
                width: '100%',
                maxWidth: '400px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ padding: '40px 32px' }}>

                    {/* Header/Logo mimicking the Sidebar */}
                    <div style={{ textAlign: 'center', marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '24px',
                            marginBottom: '16px',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                        }}>
                            B
                        </div>
                        <h1 style={{
                            fontSize: '22px',
                            fontWeight: '800',
                            letterSpacing: '0.05em',
                            color: '#1e293b',
                            margin: '0 0 8px 0',
                        }}>
                            SOCIAL BUBBLES
                        </h1>
                        <p style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#94a3b8',
                            letterSpacing: '0.02em',
                            margin: 0
                        }}>
                            GATEWAY ACCESS
                        </p>
                    </div>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {error && (
                            <div style={{
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#ef4444',
                                fontSize: '13px',
                                padding: '12px',
                                borderRadius: '6px',
                                textAlign: 'center'
                            }}>
                                {error}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@campaignlab.uk"
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    backgroundColor: '#f8fafc',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    color: '#1e293b',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    backgroundColor: '#f8fafc',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    color: '#1e293b',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            onMouseEnter={() => setIsSubmitHovered(true)}
                            onMouseLeave={() => setIsSubmitHovered(false)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: isSubmitHovered && !loading ? '#4338ca' : '#4f46e5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '600',
                                fontSize: '14px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.2s',
                                marginTop: '8px',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '4px' }}>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!email) {
                                        setError("Please enter your email address first.");
                                        return;
                                    }
                                    setLoading(true);
                                    // Origin + Pathname ensures we include /bubbles-frontend/
                                    const redirectUrl = window.location.origin + window.location.pathname;
                                    console.log('[Auth] Attempting reset with redirect:', redirectUrl);

                                    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                                        redirectTo: redirectUrl
                                    });
                                    if (resetError) {
                                        setError(resetError.message);
                                    } else {
                                        alert("Password reset link sent to " + email);
                                    }
                                    setLoading(false);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#64748b',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer section matching Sidebar signature */}
                <div style={{
                    padding: '16px',
                    borderTop: '1px solid #f1f5f9',
                    backgroundColor: '#f8fafc',
                    textAlign: 'center',
                    fontSize: '10px',
                    color: '#94a3b8',
                    letterSpacing: '0.05em'
                }}>
                    POWERED BY <a
                        href="https://campaignlab.uk"
                        target="_blank"
                        rel="noopener noreferrer"
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                        style={{
                            color: '#64748b',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            transition: 'color 0.2s'
                        }}
                    >
                        CAMPAIGN LAB
                    </a>
                </div>
            </div>
        </div>
    );
}

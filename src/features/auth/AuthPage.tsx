import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function AuthPage() {
    const { signInWithDevBypass } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isSubmitHovered, setIsSubmitHovered] = useState(false);
    const [mode, setMode] = useState<'signin' | 'forgot-password'>('signin');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (mode === 'signin') {
                const { error: authError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (authError) throw authError;
            } else {
                // Forgot Password Mode
                const origin = window.location.origin;
                const path = window.location.pathname;
                const fallbackUrl = origin + (path.endsWith('/') ? path : path + '/');

                // Prioritize the URL from .env if it exists
                const redirectUrl = import.meta.env.VITE_REDIRECT_URL || fallbackUrl;

                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: redirectUrl,
                });
                if (resetError) throw resetError;
                setMessage(`If an account exists for ${email}, a password reset link has been sent.`);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMode(prev => prev === 'signin' ? 'forgot-password' : 'signin');
        setError(null);
        setMessage(null);
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
            {/* Main Auth Card */}
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

                    {/* Brand Header */}
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
                            {mode === 'signin' ? 'LOGIN GATEWAY' : 'FORGOT PASSWORD'}
                        </p>
                    </div>

                    {/* Form Component */}
                    <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

                        {message && (
                            <div style={{
                                backgroundColor: '#f0fdf4',
                                border: '1px solid #dcfce7',
                                color: '#16a34a',
                                fontSize: '13px',
                                padding: '12px',
                                borderRadius: '6px',
                                textAlign: 'center'
                            }}>
                                {message}
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

                        {mode === 'signin' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Password</label>
                                    <button
                                        type="button"
                                        onClick={toggleMode}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#6366f1',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            padding: '0',
                                            transition: 'color 0.2s',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.color = '#4f46e5')}
                                        onMouseLeave={(e) => (e.currentTarget.style.color = '#6366f1')}
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
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
                        )}

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
                                marginTop: '4px',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Reset Password')}
                        </button>

                        {mode === 'forgot-password' && (
                            <div style={{ textAlign: 'center', marginTop: '4px' }}>
                                <button
                                    type="button"
                                    onClick={toggleMode}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#64748b',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        padding: '4px 0',
                                        transition: 'color 0.2s',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = '#334155')}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                                >
                                    &larr; Back to Login
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer section matching Sidebar signature */}
                <div style={{
                    padding: '16px 16px 24px 16px',
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

            {/* Developer Tools (Visible only when bypass is enabled) */}
            {import.meta.env.VITE_BYPASS_ENABLED === 'true' && (
                <div style={{
                    marginTop: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <button
                        onClick={signInWithDevBypass}
                        style={{
                            background: 'none',
                            border: '1px solid #cbd5e1',
                            color: '#94a3b8',
                            fontSize: '11px',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            letterSpacing: '0.05em',
                            fontWeight: '600'
                        }}
                    >
                        BYPASS LOGIN (DASHBOARD)
                    </button>

                    {mode === 'forgot-password' && (
                        <button
                            onClick={() => {
                                // Simulate an invite link hash to test the UI flow
                                window.location.hash = '#type=invite&access_token=mock_token';
                            }}
                            style={{
                                background: 'none',
                                border: '1px solid #cbd5e1',
                                color: '#94a3b8',
                                fontSize: '11px',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                letterSpacing: '0.05em',
                                fontWeight: '600'
                            }}
                        >
                            SIMULATE INVITE (UI TEST)
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordPage() {
    // We break apart the initial validation status from the submission status
    const [status, setStatus] = useState<'validating' | 'input' | 'submitting' | 'success'>('validating');
    const [errorType, setErrorType] = useState<'invalid_link' | 'submit_error' | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitHovered, setIsSubmitHovered] = useState(false);

    useEffect(() => {
        const hash = window.location.hash;
        if (!hash || !hash.includes('access_token=') || !hash.includes('type=recovery')) {
            console.error('[Reset Password] Invalid recovery request: missing tokens.');
            setStatus('input'); // We transition to input phase but show an invalid link error
            setErrorType('invalid_link');
            setErrorMessage('Invalid password reset link. Please request a new one.');

            // Clean the invalid hash from the URL
            window.history.replaceState(null, '', window.location.pathname);
            return;
        }

        // Token found, allow input
        setStatus('input');
        // We clean up the URL to hide the token from the user and from accidental sharing
        // We do *not* wipe the entire hash, just replace it with #reset-password so routing works
        window.history.replaceState(null, '', window.location.pathname + '#reset-password');
    }, []);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setErrorType('submit_error');
            setErrorMessage("Passwords don't match.");
            return;
        }

        if (password.length < 6) {
            setErrorType('submit_error');
            setErrorMessage("Password must be at least 6 characters.");
            return;
        }

        setStatus('submitting');
        setErrorType(null);
        setErrorMessage('');

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            console.error('Error resetting password:', error.message);
            setStatus('input');
            setErrorType('submit_error');
            setErrorMessage(error.message);
        } else {
            setStatus('success');
            // Force sign out so they have to log in with the new password
            await supabase.auth.signOut();
        }
    };

    const goBack = () => {
        // Just clear the hash, App.tsx will re-render
        window.history.replaceState(null, '', window.location.pathname);
        window.dispatchEvent(new Event('hashchange'));
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
                            RESET PASSWORD
                        </h1>
                        <p style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#94a3b8',
                            letterSpacing: '0.02em',
                            margin: 0
                        }}>
                            SECURE ACCOUNT RECOVERY
                        </p>
                    </div>

                    {status === 'validating' && (
                        <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b' }}>
                            Validating link...
                        </div>
                    )}

                    {status === 'success' && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: '#d1fae5',
                                color: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                margin: '0 auto 16px auto'
                            }}>✓</div>
                            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Password Updated!</h3>
                            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
                                Your password has been successfully reset.
                            </p>
                            <button
                                onClick={goBack}
                                onMouseEnter={() => setIsSubmitHovered(true)}
                                onMouseLeave={() => setIsSubmitHovered(false)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: isSubmitHovered ? '#059669' : '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                }}
                            >
                                Return to Login
                            </button>
                        </div>
                    )}

                    {(status === 'input' || status === 'submitting') && (
                        <>
                            {errorType === 'invalid_link' ? (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{
                                        backgroundColor: '#fef2f2',
                                        border: '1px solid #fecaca',
                                        color: '#ef4444',
                                        fontSize: '13px',
                                        padding: '16px',
                                        borderRadius: '6px',
                                        marginBottom: '24px'
                                    }}>
                                        {errorMessage}
                                    </div>
                                    <button
                                        onClick={goBack}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            backgroundColor: '#f1f5f9',
                                            color: '#475569',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '6px',
                                            fontWeight: '600',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        Return to Login
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {errorType === 'submit_error' && (
                                        <div style={{
                                            backgroundColor: '#fef2f2',
                                            border: '1px solid #fecaca',
                                            color: '#ef4444',
                                            fontSize: '13px',
                                            padding: '12px',
                                            borderRadius: '6px',
                                            textAlign: 'center'
                                        }}>
                                            {errorMessage}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>New Password</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
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
                                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Confirm Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
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
                                        disabled={status === 'submitting'}
                                        onMouseEnter={() => setIsSubmitHovered(true)}
                                        onMouseLeave={() => setIsSubmitHovered(false)}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            backgroundColor: isSubmitHovered && status !== 'submitting' ? '#4338ca' : '#4f46e5',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontWeight: '600',
                                            fontSize: '14px',
                                            cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                                            transition: 'background-color 0.2s',
                                            marginTop: '8px',
                                            opacity: status === 'submitting' ? 0.7 : 1
                                        }}
                                    >
                                        {status === 'submitting' ? 'Updating...' : 'Set New Password'}
                                    </button>

                                    <div style={{ textAlign: 'center', marginTop: '8px' }}>
                                        <button
                                            type="button"
                                            onClick={goBack}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#64748b',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#334155'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </>
                    )}
                </div>

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

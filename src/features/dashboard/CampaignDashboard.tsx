import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { fetchAdAccounts, fetchCampaigns, createCampaign } from '@/services/metaAdsService';
import type { AdAccount, AdCampaign } from '@/services/metaAdsService';

export function CampaignDashboard() {
    const { user } = useAuth();
    const [isLinking, setIsLinking] = useState(false);
    const [hasMetaLinked, setHasMetaLinked] = useState(false);

    const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);

    const [loadingData, setLoadingData] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Create Campaign Form State
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newCampaignName, setNewCampaignName] = useState('');
    const [isPolitical, setIsPolitical] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const checkMetaLink = async () => {
            if (!user) return;
            // Check if there is a facebook identity linked
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.identities) {
                const linked = session.user.identities.some(id => id.provider === 'facebook');
                setHasMetaLinked(linked);
            } else if (user && 'devBypass' in user) {
                // If Dev Bypass, we can simulate linking logic later, mock it for now
                setHasMetaLinked(false);
            }
        };

        checkMetaLink();
    }, [user]);

    // Fetch accounts when linked
    useEffect(() => {
        if (!hasMetaLinked) return;

        const loadData = async () => {
            setLoadingData(true);
            setError(null);
            try {
                if (user && 'devBypass' in user) {
                    // MOCK DATA for Bypass User
                    const mockAccount = { id: '1', account_id: 'act_12345', name: 'Mock Ad Account', currency: 'GBP' };
                    setAdAccounts([mockAccount]);
                    setSelectedAccountId(mockAccount.id);
                    setCampaigns([
                        { id: 'c1', name: 'London Central Test', status: 'ACTIVE', objective: 'OUTCOME_LEADS', special_ad_categories: ['NONE'] },
                        { id: 'c2', name: 'Manchester North Poltical', status: 'PAUSED', objective: 'OUTCOME_ENGAGEMENT', special_ad_categories: ['ISSUES_ELECTIONS_POLITICS'] }
                    ]);
                    return;
                }

                const accounts = await fetchAdAccounts();
                setAdAccounts(accounts);
                if (accounts.length > 0) {
                    setSelectedAccountId(accounts[0].id);
                    const camps = await fetchCampaigns(accounts[0].id);
                    setCampaigns(camps);
                }
            } catch (err: any) {
                console.error("Failed to load Meta data:", err);
                setError(err.message || 'Failed to communicate with Meta Ads API.');
            } finally {
                setLoadingData(false);
            }
        };

        loadData();
    }, [hasMetaLinked, user]);

    // Handle account change
    const handleAccountChange = async (accountId: string) => {
        setSelectedAccountId(accountId);
        if (user && 'devBypass' in user) return; // Keep mock data

        setLoadingData(true);
        setError(null);
        try {
            const camps = await fetchCampaigns(accountId);
            setCampaigns(camps);
        } catch (err: any) {
            setError(err.message || 'Failed to load campaigns.');
        } finally {
            setLoadingData(false);
        }
    };

    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAccountId) return;

        setCreating(true);
        setError(null);
        try {
            if (user && 'devBypass' in user) {
                // Mock create
                setTimeout(() => {
                    setCampaigns(prev => [{
                        id: 'c' + Date.now(),
                        name: newCampaignName,
                        status: 'PAUSED',
                        objective: 'OUTCOME_LEADS',
                        special_ad_categories: isPolitical ? ['ISSUES_ELECTIONS_POLITICS'] : ['NONE']
                    }, ...prev]);
                    setShowCreateForm(false);
                    setNewCampaignName('');
                    setIsPolitical(false);
                    setCreating(false);
                }, 1000);
                return;
            }

            const newCamp = await createCampaign({
                adAccountId: selectedAccountId,
                name: newCampaignName,
                objective: 'OUTCOME_LEADS', // default for now
                status: 'PAUSED',
                isPolitical
            });

            setCampaigns(prev => [newCamp, ...prev]);
            setShowCreateForm(false);
            setNewCampaignName('');
            setIsPolitical(false);
        } catch (err: any) {
            setError(err.message || 'Failed to create campaign.');
        } finally {
            if (!(user && 'devBypass' in user)) setCreating(false);
        }
    };

    const handleConnectMeta = async () => {
        setIsLinking(true);
        try {
            if (user && 'devBypass' in user) {
                // Dev Bypass simulation
                setTimeout(() => {
                    setHasMetaLinked(true);
                    setIsLinking(false);
                }, 1000);
                return;
            }

            const origin = window.location.origin;
            const path = window.location.pathname;
            const fallbackUrl = origin + (path.endsWith('/') ? path : path + '/');
            const redirectUrl = import.meta.env.VITE_REDIRECT_URL || fallbackUrl;

            // Use Supabase linkIdentity to connect to the current session
            const { error } = await supabase.auth.linkIdentity({
                provider: 'facebook',
                options: {
                    scopes: 'ads_management ads_read public_profile',
                    redirectTo: redirectUrl
                }
            });

            if (error) {
                console.error("Error linking Meta identity:", error);
                alert("Failed to connect Meta Ads.");
            }
        } catch (error) {
            console.error("Meta linking error", error);
        } finally {
            if (!(user && 'devBypass' in user)) {
                setIsLinking(false);
            }
        }
    };

    return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Campaign Dashboard</h2>
                {!hasMetaLinked && (
                    <button
                        onClick={handleConnectMeta}
                        disabled={isLinking}
                        style={{
                            padding: '10px 16px',
                            backgroundColor: '#1877F2',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: isLinking ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: isLinking ? 0.7 : 1,
                            transition: 'background-color 0.2s'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M24 12.07C24 5.4 18.63 0 12 0C5.37 0 0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24V15.56H7.08V12.07H10.13V9.4C10.13 6.38 11.92 4.7 14.65 4.7C15.96 4.7 17.34 4.93 17.34 4.93V7.9H15.83C14.34 7.9 13.88 8.83 13.88 9.8V12.07H17.2L16.66 15.56H13.88V24C19.61 23.1 24 18.1 24 12.07Z" fill="white" />
                        </svg>
                        {isLinking ? 'Connecting...' : 'Connect to Meta Ads'}
                    </button>
                )}
                {hasMetaLinked && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {adAccounts.length > 0 && (
                            <select
                                value={selectedAccountId || ''}
                                onChange={(e) => handleAccountChange(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: '#fff',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            >
                                {adAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        )}
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            style={{
                                padding: '10px 16px',
                                backgroundColor: '#4f46e5',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '600',
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        >
                            {showCreateForm ? 'Cancel' : '+ Create Campaign'}
                        </button>
                    </div>
                )}
            </div>

            {error && (
                <div style={{ padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: '6px', marginBottom: '24px' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {showCreateForm && hasMetaLinked && (
                <div style={{ padding: '24px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '24px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Create New Campaign</h3>
                    <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Campaign Name</label>
                            <input
                                type="text"
                                value={newCampaignName}
                                onChange={(e) => setNewCampaignName(e.target.value)}
                                required
                                placeholder="e.g. London Central 2026"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1'
                                }}
                            />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={isPolitical}
                                onChange={(e) => setIsPolitical(e.target.checked)}
                            />
                            <span style={{ fontSize: '14px', color: '#334155' }}>
                                <strong>Political Ad</strong> (Requires Meta Verification)
                            </span>
                        </label>
                        <button
                            type="submit"
                            disabled={creating}
                            style={{
                                padding: '10px 16px',
                                backgroundColor: '#1877F2',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '600',
                                fontSize: '14px',
                                cursor: creating ? 'not-allowed' : 'pointer',
                                opacity: creating ? 0.7 : 1
                            }}
                        >
                            {creating ? 'Creating...' : 'Submit to Meta'}
                        </button>
                    </form>
                </div>
            )}

            {!hasMetaLinked ? (
                <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px dashed #cbd5e1'
                }}>
                    <h3 style={{ fontSize: '18px', color: '#334155', marginBottom: '8px' }}>Not Connected to Meta</h3>
                    <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 20px auto' }}>
                        To manage ad campaigns, link your Meta Ads account. We will request permissions to read and manage your campaigns.
                    </p>
                    <button
                        onClick={handleConnectMeta}
                        disabled={isLinking}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#1877F2',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: isLinking ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isLinking ? 'Connecting...' : 'Connect Identity'}
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    {loadingData ? (
                        <p style={{ color: '#64748b' }}>Generating Dashboard from Meta Graph...</p>
                    ) : campaigns.length > 0 ? (
                        campaigns.map((camp) => (
                            <div key={camp.id} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Campaign</div>
                                    <div style={{
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        backgroundColor: camp.status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                                        color: camp.status === 'ACTIVE' ? '#16a34a' : '#64748b'
                                    }}>
                                        {camp.status}
                                    </div>
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{camp.name}</div>
                                {camp.special_ad_categories?.includes('ISSUES_ELECTIONS_POLITICS') && (
                                    <div style={{ marginTop: '12px', fontSize: '11px', color: '#b91c1c', backgroundColor: '#fef2f2', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                                        Registered Political Ad
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p style={{ color: '#64748b' }}>No campaigns found on this Ad Account. Create one to get started.</p>
                    )}
                </div>
            )}

            <p style={{ marginTop: '24px', color: '#64748b' }}>Select 'Boundaries' in the sidebar to return to the interactive map.</p>
        </div>
    );
}

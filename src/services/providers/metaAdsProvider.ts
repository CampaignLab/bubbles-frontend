import type { AdPlatformProvider, AdPlatformAccount, AdPlatformCampaign } from '@/types/ads';
import { initFacebookSdk, getFbToken } from '@/lib/metaSdk';

const META_GRAPH_VERSION = 'v19.0';
const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

export class MetaAdsProvider implements AdPlatformProvider {
    name = 'meta' as const;

    private async getProviderToken(): Promise<string | null> {
        await initFacebookSdk();
        return getFbToken();
    }

    async isConnected(): Promise<boolean> {
        await initFacebookSdk();
        if (!window.FB) return false;

        return new Promise((resolve) => {
            window.FB.getLoginStatus((response: any) => {
                resolve(response.status === 'connected');
            });
        });
    }

    async connect(): Promise<void> {
        await initFacebookSdk();
        if (!window.FB) throw new Error("Facebook SDK not loaded. Check VITE_META_APP_ID.");

        return new Promise((resolve, reject) => {
            window.FB.login((response: any) => {
                if (response.authResponse) {
                    resolve();
                } else {
                    reject(new Error("User cancelled login or did not fully authorize."));
                }
            }, {
                // Minimum required scopes for Ads integration
                scope: 'ads_management,ads_read,public_profile',
                return_scopes: true
            });
        });
    }

    async disconnect(): Promise<void> {
        await initFacebookSdk();
        if (!window.FB) return;

        return new Promise((resolve) => {
            window.FB.logout(() => {
                resolve();
            });
        });
    }

    async getProfile(): Promise<{ name?: string; email?: string } | null> {
        await initFacebookSdk();
        if (!window.FB) return null;

        const token = getFbToken();
        if (!token) return null;

        return new Promise((resolve) => {
            window.FB.api('/me', { fields: 'name,email' }, (response: any) => {
                if (!response || response.error) {
                    resolve(null);
                } else {
                    resolve({
                        name: response.name,
                        email: response.email
                    });
                }
            });
        });
    }

    async fetchAccounts(): Promise<AdPlatformAccount[]> {
        const token = await this.getProviderToken();
        if (!token) throw new Error("No Meta provider token found in session. Please reconnect.");

        const url = new URL(`${META_GRAPH_BASE}/me/adaccounts`);
        url.searchParams.append('fields', 'id,name,account_id,currency');
        url.searchParams.append('access_token', token);

        const response = await fetch(url.toString());
        const data = await response.json();

        if (!response.ok) {
            console.error("[MetaAdsProvider] Graph API Error fetching accounts:", data);
            throw new Error(`Meta Graph Error (${data.error?.code}): ${data.error?.message || response.statusText}`);
        }

        return (data.data || []).map((acc: any) => ({
            id: acc.id,
            name: acc.name || acc.id,
            platform: 'meta'
        }));
    }

    async fetchCampaigns(accountId: string): Promise<AdPlatformCampaign[]> {
        const token = await this.getProviderToken();
        if (!token) throw new Error("No Meta provider token found in session. Please reconnect.");

        const url = new URL(`${META_GRAPH_BASE}/${accountId}/campaigns`);
        url.searchParams.append('fields', 'id,name,status,objective,special_ad_categories');
        url.searchParams.append('access_token', token);

        const response = await fetch(url.toString());
        const data = await response.json();

        if (!response.ok) {
            console.error("[MetaAdsProvider] Graph API Error fetching campaigns:", data);
            throw new Error(`Meta Graph Error (${data.error?.code}): ${data.error?.message || response.statusText}`);
        }

        return (data.data || []).map((camp: any) => ({
            id: camp.id,
            name: camp.name,
            status: camp.status || 'UNKNOWN',
            objective: camp.objective || 'UNKNOWN',
            isPolitical: camp.special_ad_categories?.includes('ISSUES_ELECTIONS_POLITICS') || false
        }));
    }

    async createCampaign(accountId: string, name: string, isPolitical: boolean): Promise<AdPlatformCampaign> {
        const token = await this.getProviderToken();
        if (!token) throw new Error("No Meta provider token found in session. Please reconnect.");

        const url = new URL(`${META_GRAPH_BASE}/${accountId}/campaigns`);
        url.searchParams.append('access_token', token);

        // special_ad_categories must be an array of strings
        const categories = isPolitical ? ['ISSUES_ELECTIONS_POLITICS'] : ['NONE'];
        const objective = 'OUTCOME_LEADS'; // Default for now
        const status = 'PAUSED';

        const payload = {
            name,
            objective,
            status,
            special_ad_categories: categories
        };

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[MetaAdsProvider] Graph API Error creating campaign:", data);
            // Specifically surface authorization issues
            throw new Error(`Meta Graph Error (${data.error?.code}): ${data.error?.error_user_msg || data.error?.message || response.statusText}`);
        }

        return {
            id: data.id,
            name,
            status,
            objective,
            isPolitical
        };
    }
}

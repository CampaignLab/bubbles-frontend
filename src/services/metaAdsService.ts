import { supabase } from '@/lib/supabase';

const META_GRAPH_VERSION = 'v19.0';
const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

/**
 * Retrieves the Facebook provider token from the current Supabase session.
 * Note: Depending on the Supabase configuration, the provider_token 
 * may only be available in the initial session object or might need to be refreshed.
 */
async function getProviderToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    // In some setups, the provider token is stored here
    if (session.provider_token) {
        return session.provider_token;
    }

    return null;
}

export interface AdAccount {
    id: string;
    account_id: string;
    name: string;
    currency: string;
}

export interface AdCampaign {
    id: string;
    name: string;
    status: string;
    objective: string;
    special_ad_categories: string[];
}

/**
 * Fetch the ad accounts accessible by the linked Meta user.
 */
export async function fetchAdAccounts(): Promise<AdAccount[]> {
    const token = await getProviderToken();
    if (!token) throw new Error("No Meta provider token found in session.");

    const url = new URL(`${META_GRAPH_BASE}/me/adaccounts`);
    url.searchParams.append('fields', 'id,name,account_id,currency');
    url.searchParams.append('access_token', token);

    const response = await fetch(url.toString());
    if (!response.ok) {
        const errData = await response.json();
        throw new Error(`Meta API Error: ${errData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
}

/**
 * Fetch campaigns for a specific ad account.
 * `adAccountId` should be prefixed with `act_` (e.g., `act_123456789`).
 */
export async function fetchCampaigns(adAccountId: string): Promise<AdCampaign[]> {
    const token = await getProviderToken();
    if (!token) throw new Error("No Meta provider token found in session.");

    const url = new URL(`${META_GRAPH_BASE}/${adAccountId}/campaigns`);
    url.searchParams.append('fields', 'id,name,status,objective,special_ad_categories');
    url.searchParams.append('access_token', token);

    const response = await fetch(url.toString());
    if (!response.ok) {
        const errData = await response.json();
        throw new Error(`Meta API Error: ${errData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
}

export interface CreateCampaignParams {
    adAccountId: string;
    name: string;
    objective: string; // e.g., 'OUTCOME_LEADS', 'OUTCOME_ENGAGEMENT'
    status: 'ACTIVE' | 'PAUSED';
    isPolitical: boolean;
}

/**
 * Creates a new campaign.
 * If `isPolitical` is true, sets `special_ad_categories` to `ISSUES_ELECTIONS_POLITICS`.
 * Otherwise, sets it to `NONE` for standard testing.
 */
export async function createCampaign(params: CreateCampaignParams): Promise<AdCampaign> {
    const token = await getProviderToken();
    if (!token) throw new Error("No Meta provider token found in session.");

    const url = new URL(`${META_GRAPH_BASE}/${params.adAccountId}/campaigns`);
    url.searchParams.append('access_token', token);

    // special_ad_categories must be an array of strings in the JSON payload
    const categories = params.isPolitical ? ['ISSUES_ELECTIONS_POLITICS'] : ['NONE'];

    const payload = {
        name: params.name,
        objective: params.objective,
        status: params.status,
        special_ad_categories: categories
    };

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        // Here we could specifically catch authorization issues related to political ad verification
        throw new Error(`Meta API Error: ${data.error?.message || response.statusText}`);
    }

    return {
        id: data.id,
        name: params.name,
        status: params.status,
        objective: params.objective,
        special_ad_categories: categories
    };
}

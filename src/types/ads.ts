export interface AdPlatformAccount {
    id: string;      // Platform-specific ID (e.g., 'act_123' or '123-456-7890')
    name: string;
    platform: 'mock' | 'meta' | 'google';
}

export interface AdPlatformCampaign {
    id: string;
    name: string;
    status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'UNKNOWN';
    objective: string;
    isPolitical: boolean;
}

export interface AdPlatformProvider {
    name: 'mock' | 'meta' | 'google';

    /**
     * Initiates the connection flow for the platform (e.g., OAuth redirect)
     */
    connect(): Promise<void>;

    /**
     * Checks if the user is currently connected to this platform
     */
    isConnected(): Promise<boolean>;

    /**
     * Disconnects the platform from the user's account
     */
    disconnect(): Promise<void>;

    /**
     * Gets basic profile info of the connected identity (if applicable)
     */
    getProfile(): Promise<{ name?: string; email?: string } | null>;

    /**
     * Fetches the ad accounts available to the user on this platform
     */
    fetchAccounts(): Promise<AdPlatformAccount[]>;

    /**
     * Fetches campaigns for a specific ad account
     */
    fetchCampaigns(accountId: string): Promise<AdPlatformCampaign[]>;

    /**
     * Creates a new campaign
     */
    createCampaign(accountId: string, name: string, isPolitical: boolean): Promise<AdPlatformCampaign>;
}

import type { AdPlatformProvider, AdPlatformAccount, AdPlatformCampaign } from '@/types/ads';

export class MockAdsProvider implements AdPlatformProvider {
    name = 'mock' as const;

    // Simulate network delay
    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async isConnected(): Promise<boolean> {
        // Assume mock is connected just to test the UI flow securely
        return true;
    }

    async disconnect(): Promise<void> {
        await this.delay(500);
        // Successful mock disconnect
    }

    async getProfile(): Promise<{ name?: string; email?: string } | null> {
        await this.delay(300);
        return {
            name: "Dev Bypass User",
            email: "bypass@campaignlab.ai"
        };
    }

    async connect(): Promise<void> {
        await this.delay(1000);
        // Successful mock connection doesn't throw
    }

    async fetchAccounts(): Promise<AdPlatformAccount[]> {
        await this.delay(800);
        return [
            { id: 'act_12345', name: 'Campaign Lab Testing Account', platform: 'mock' },
            { id: 'act_67890', name: 'London Regional Ads', platform: 'mock' }
        ];
    }

    async fetchCampaigns(accountId: string): Promise<AdPlatformCampaign[]> {
        await this.delay(1000);
        if (accountId === 'act_12345') {
            return [
                { id: 'c1', name: 'Test Campaign 1', status: 'ACTIVE', objective: 'OUTCOME_LEADS', isPolitical: false },
                { id: 'c2', name: 'Political Mock Campaign', status: 'PAUSED', objective: 'OUTCOME_ENGAGEMENT', isPolitical: true }
            ];
        }
        return [
            { id: 'c3', name: 'Regional Audience Build', status: 'COMPLETED', objective: 'OUTCOME_TRAFFIC', isPolitical: false }
        ];
    }

    async createCampaign(_accountId: string, name: string, isPolitical: boolean): Promise<AdPlatformCampaign> {
        await this.delay(1000);

        // Simulate a rejection for testing error boundaries
        if (name.toLowerCase() === 'error') {
            throw new Error("Mock API Error: Simulation of a rejected request.");
        }

        return {
            id: `mock_camp_${Date.now()}`,
            name,
            status: 'PAUSED',
            objective: 'OUTCOME_LEADS',
            isPolitical
        };
    }
}

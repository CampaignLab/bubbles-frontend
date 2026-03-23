import type { AdPlatformProvider } from '@/types/ads';
import { MetaAdsProvider } from './providers/metaAdsProvider';
import { MockAdsProvider } from './providers/mockAdsProvider';

/**
 * Registry of available ad platforms.
 * New platforms (like Google Ads) can be added here.
 */
class AdPlatformManager {
    private providers: Map<string, AdPlatformProvider> = new Map();

    constructor() {
        this.registerProvider(new MetaAdsProvider());
        this.registerProvider(new MockAdsProvider());
    }

    private registerProvider(provider: AdPlatformProvider) {
        this.providers.set(provider.name, provider);
    }

    /**
     * Retrieves the correct provider.
     */
    getProvider(platformName: 'meta' | 'google' | 'mock'): AdPlatformProvider {

        const provider = this.providers.get(platformName);
        if (!provider) {
            throw new Error(`Ad platform '${platformName}' is not registered or supported.`);
        }
        return provider;
    }
}

export const adManager = new AdPlatformManager();

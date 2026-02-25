import type { AuthUser } from '../types/auth';

/**
 * Standardized configuration for dev-bypass mock users.
 * This ensures consistency across the dashboard and auth flows when using bypass mode.
 */
export const DEV_BYPASS_CONFIG = {
    DEFAULT_EMAIL: 'john.doe@campaignlab.uk',
    NAME: 'John Doe',
    ROLE: 'Admin'
};

/**
 * Generates a mock AuthUser object for dev/bypass flows.
 * 
 * @param email Optional email to customize the mock user. If provided, user is flagged as an 'invite' flow.
 * @returns A standardized AuthUser object that bypasses real Supabase auth.
 */
export function createDevUser(email?: string): AuthUser {
    const isInvite = !!email;
    const finalEmail = email || DEV_BYPASS_CONFIG.DEFAULT_EMAIL;

    return {
        devBypass: true,
        id: `dev-bypass-${isInvite ? 'invite' : 'admin'}`,
        email: finalEmail,
        app_metadata: {
            role: DEV_BYPASS_CONFIG.ROLE.toLowerCase()
        },
        user_metadata: {
            name: `${DEV_BYPASS_CONFIG.NAME} (${isInvite ? 'Invite' : 'Admin'})`
        },
        aud: 'authenticated',
        created_at: new Date().toISOString()
    } as any;
}

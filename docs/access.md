# Authentication & Access Control

The Bubbles Gateway uses two distinct authentication methods to balance security in production with rapid iteration in development.

## 1. Production Authentication (Supabase)
In production, the application is secured by Supabase email/password authentication. Access requires a registered account.

### Configuration
To enable production auth locally, you must provide your Supabase project credentials. Create a `.env.local` file in the root directory (this file is gitignored) and add your keys:

```env
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 2. Developer Access (Bypass Mode)
For local development and UI testing, you can bypass the login wall entirely. 

When you navigate to the Gateway on the local development server, you will see a **"BYPASS LOGIN (DOE)"** button hovering in the top right corner of the screen.

Clicking this button will instantly:
1. Bypass the Supabase credential check.
2. Authenticate you as the mock user "John Doe (Organizer)".
3. Route you directly to the `DashboardPage`.

*Note: Dev Bypass does not require Supabase configuration to work.*

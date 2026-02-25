# Supabase Email Types to Frontend Routes

When Supabase sends an authentication email (like a Magic Link, Invite, or Password Reset), the redirect link contains a URL hash with the session tokens and action type.

### The Decoded URL Hash Format

All Supabase email redirects follow this standard schema in the URL hash:
```text
#access_token=<JWT>
&expires_in=3600
&refresh_token=<TOKEN>
&token_type=bearer
&type=<ACTION_TYPE>
```
*Note: If an error occurs, the hash or query string will contain `error`, `error_code`, and `error_description` instead.*

### Expected `type` Parameter Mapping

Here is the exact mapping of what Supabase sends (`type=`) and where our application routes it in `App.tsx`:

| `type=` parameter | Triggered By | Expected Frontend Route | Our Target Component | Behavior Notes |
| :--- | :--- | :--- | :--- | :--- |
| `signup` | **Confirm Signup** email sends this after a user calls `supabase.auth.signUp()`. | `hidden-signup` | `<HiddenSignUp />` | User is automatically logged in by the client upon reading the token. We just show a "Success" screen and let them into the dashboard. |
| `invite` | **Invite User** email sends this after an Admin backend calls `inviteUserByEmail()`. | `first-time-login` | `<FirstTimeLogin />` | The user does not have a password yet. They are logged in securely via the token, and our UI asks them to set one. |
| `magiclink` | **Magic Link** email sends this after a user calls `supabase.auth.signInWithOtp()`. | `first-time-login` | `<FirstTimeLogin />` | Standard passwordless login. Sent to verified users (or creates new users if signups are enabled). If a verified user uses this, we act as a "Welcome Back" flow. |
| `recovery` | **Reset Password** email sends this after a user calls `resetPasswordForEmail()`. | `reset-password` | `<ResetPasswordPage />` | Sent only to existing users so they can change their password. *(Note: We temporarily hijack this to route to `<HiddenSignUp/>` only when Dev Bypass is on).* |

# TODO
| `email_change` | **Change Email** email sends this after a user calls `updateUser()`. | `main` | `<DashboardPage />` | User must already be logged in when clicking this link to confirm the new address securely. |
| `reauthentication`| **Reauthentication** email (if required for sensitive actions). | `main` | `<DashboardPage />` | Extends an existing active session. |

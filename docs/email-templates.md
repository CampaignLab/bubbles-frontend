# Supabase Email Templates

Copy and paste the HTML below into your Supabase Dashboard under **Authentication > Email Templates**.

**Brand Colors Used:**
- Primary: `#4f46e5` (Indigo 600)
- Background: `#f8fafc` (Slate 50)
- Text: `#1e293b` (Slate 800) / `#475569` (Slate 600)

---

## 1. Magic Link (Invite Flow)
Paste this into the **Magic Link** template. 

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Invitation to Social Bubbles</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; line-height: 1.6; color: #1e293b;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
    
    <!-- Header -->
    <div style="text-align: center; padding: 40px 32px 20px;">
      <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%); color: white; font-weight: bold; font-size: 24px; line-height: 48px; margin: 0 auto 20px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
        B
      </div>
      <h1 style="font-size: 24px; font-weight: 800; letter-spacing: 0.05em; margin: 0; color: #1e293b;">
        YOU'RE INVITED
      </h1>
    </div>

    <!-- Body -->
    <div style="padding: 0 40px 40px; text-align: center;">
      <p style="font-size: 16px; color: #475569; margin-bottom: 32px;">
        You have been granted access to the Campaign Lab dashboard. Click the secure link below to generate your password and enter the squad.
      </p>
      
      <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
        Accept Invitation
      </a>
      
      <p style="font-size: 13px; color: #94a3b8; margin-top: 32px;">
        If you did not expect this invitation, you can safely ignore this email. This link will expire in 24 hours.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 11px; font-weight: bold; letter-spacing: 0.05em; color: #64748b; margin: 0;">
        POWERED BY CAMPAIGN LAB
      </p>
    </div>
  </div>
</body>
</html>
```

---

## 2. Reset Password (Hidden Signup / Developer Flow)
Paste this into the **Reset Password** template. Even though the user is technically setting their password for the first time via the dev bypass, Supabase treats it as a "Reset" flow.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Setup Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; line-height: 1.6; color: #1e293b;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
    
    <!-- Header -->
    <div style="text-align: center; padding: 40px 32px 20px;">
      <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: white; font-weight: bold; font-size: 24px; line-height: 48px; margin: 0 auto 20px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
        B
      </div>
      <h1 style="font-size: 24px; font-weight: 800; letter-spacing: 0.05em; margin: 0; color: #1e293b;">
        CREATE PASSWORD
      </h1>
    </div>

    <!-- Body -->
    <div style="padding: 0 40px 40px; text-align: center;">
      <p style="font-size: 16px; color: #475569; margin-bottom: 32px;">
        Click the link below to securely set your password and access your account.
      </p>
      
      <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
        Setup Password
      </a>
      
      <p style="font-size: 13px; color: #94a3b8; margin-top: 32px;">
        If you did not request this, please ignore this email. Your account remains secure.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 11px; font-weight: bold; letter-spacing: 0.05em; color: #64748b; margin: 0;">
        POWERED BY CAMPAIGN LAB
      </p>
    </div>
  </div>
</body>
</html>
```

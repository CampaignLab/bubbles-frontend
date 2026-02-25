```html

<head>
  <style>
    .cl-link:hover { color: #ef4444 !important; text-decoration: underline !important; }
    .btn:hover { background-color: #4338ca !important; }
  </style>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; margin: 0;">
    <div style="max-width: 480px; margin: 0 auto; background-color: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
        <div style="padding: 40px 32px; text-align: center;">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%); display: inline-block; margin-bottom: 24px;"></div>
            <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">Confirm Your Email</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">
                Thanks for signing up for <strong>Social Bubbles</strong>. Please confirm your email address to activate your account and access the dashboard.
            </p>
            <a href="{{ .ConfirmationURL }}" class="btn" style="display: inline-block; padding: 14px 32px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                Confirm Email
            </a>
            <p style="margin-top: 32px; color: #94a3b8; font-size: 11px; line-height: 1.5;">
                If you did not create an account, no further action is required.
            </p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0; font-size: 10px; color: #94a3b8; letter-spacing: 0.1em; font-weight: bold;">
                POWERED BY <a href="https://campaignlab.uk" class="cl-link" style="color: #64748b; text-decoration: none; transition: color 0.2s;">CAMPAIGN LAB</a>
            </p>
        </div>
    </div>
</body>
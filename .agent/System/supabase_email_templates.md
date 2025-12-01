# Supabase Email Templates for PKCE Flow

**Last Updated:** January 25, 2025
**Purpose:** Email templates configured for SvelteKit SSR with PKCE authentication flow

---

## Overview

**⚠️ CRITICAL:** SvelteKit uses PKCE flow (SSR), which requires custom email templates. Default Supabase templates are designed for implicit flow (client-only) and **will not work**.

**Symptoms of incorrect templates:**
- `error=access_denied`
- `error_code=otp_expired`
- "Email link is invalid or has expired"

---

## Site URL Configuration

**⚠️ CRITICAL:** Email templates use the `{{ .SiteURL }}` variable, which expands to your configured Site URL. If this is misconfigured, emails will contain incorrect links.

### What is Site URL?

The **Site URL** is the base URL of your application, configured in Supabase project settings. Email templates use `{{ .SiteURL }}` to generate links back to your application.

**Examples:**
- **Development:** `http://localhost:5173`
- **Production:** `https://yourapp.com`

### How to Configure Site URL

#### Option 1: Via Supabase Dashboard

1. Go to: **Supabase Dashboard → Project Settings → Authentication → URL Configuration**
2. Update **Site URL** field:
   - Dev: `http://localhost:5173`
   - Production: `https://yourapp.com`
3. Update **Redirect URLs** (allow list):
   - Dev: `http://localhost:5173/**`
   - Production: `https://yourapp.com/**`
4. Save changes

#### Option 2: Via Management API (Automated)

```bash
# Get your access token from: https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="sbp_..."

# Update Site URL
curl -X PATCH "https://api.supabase.com/v1/projects/YOUR_PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "site_url": "http://localhost:5173",
    "uri_allow_list": "http://localhost:5173/**"
  }'
```

**For ClaimTech:**
```bash
# Development
curl -X PATCH "https://api.supabase.com/v1/projects/cfblmkzleqtvtfxujikf/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "site_url": "http://localhost:5173",
    "uri_allow_list": "http://localhost:5173/**"
  }'
```

### Common Issues

**Issue: Email shows wrong port**
- Email: "...for http://localhost:3000"
- Expected: "...for http://localhost:5173"

**Cause:** Site URL is configured with wrong port

**Fix:** Update Site URL as shown above

---

**Issue: Email shows wrong domain**
- Email: "...for https://old-domain.com"
- Expected: "...for https://new-domain.com"

**Cause:** Site URL not updated for new domain

**Fix:** Update Site URL in project settings

---

### Verification

To verify your Site URL is correct:

```bash
# Check current configuration
curl "https://api.supabase.com/v1/projects/cfblmkzleqtvtfxujikf" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | jq '.auth.site_url'
```

Expected output:
- Dev: `"http://localhost:5173"`
- Production: `"https://yourapp.com"`

---

## How to Update Templates

1. Navigate to: **Supabase Dashboard → Project Settings → Authentication → Email Templates**
2. Select the template to update
3. Copy the template from this document
4. Paste into Supabase dashboard
5. Save changes
6. Test the flow

---

## Template 1: Reset Password ⭐ REQUIRED

**Template Name:** Reset Password / Password Recovery

**Use Case:** Password reset emails (forgot password, engineer creation)

```html
<h2>Reset Password</h2>

<p>Follow this link to reset your password for {{ .SiteURL }}:</p>

<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/account/set-password">
    Reset Password
  </a>
</p>

<p>If you didn't request this password reset, you can safely ignore this email.</p>

<p><strong>This link expires in 1 hour.</strong></p>
```

---

## Template 2: Confirm Signup

**Template Name:** Confirm Signup / Email Confirmation

**Use Case:** Email verification for new user signups

```html
<h2>Confirm Your Email</h2>

<p>Follow this link to confirm your email address for {{ .SiteURL }}:</p>

<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/dashboard">
    Confirm Email
  </a>
</p>

<p>If you didn't create an account, you can safely ignore this email.</p>

<p><strong>This link expires in 24 hours.</strong></p>
```

---

## Template 3: Magic Link

**Template Name:** Magic Link

**Use Case:** Passwordless authentication (if enabled)

```html
<h2>Sign In to {{ .SiteURL }}</h2>

<p>Click this link to sign in:</p>

<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next=/dashboard">
    Sign In
  </a>
</p>

<p>If you didn't request this, you can safely ignore this email.</p>

<p><strong>This link expires in 1 hour.</strong></p>
```

---

## Template 4: Invite User (Optional)

**Template Name:** Invite User

**Use Case:** Admin inviting users to join (if using invite feature)

```html
<h2>You've Been Invited to {{ .SiteURL }}</h2>

<p>You've been invited to join our platform. Click the link below to accept the invitation and set your password:</p>

<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/account/set-password">
    Accept Invitation
  </a>
</p>

<p>If you didn't expect this invitation, you can safely ignore this email.</p>

<p><strong>This link expires in 24 hours.</strong></p>
```

---

## Template 5: Email Change Confirmation

**Template Name:** Change Email Address

**Use Case:** User changing their email address

```html
<h2>Confirm Email Change</h2>

<p>Follow this link to confirm your new email address for {{ .SiteURL }}:</p>

<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/account/settings">
    Confirm Email Change
  </a>
</p>

<p>If you didn't request this email change, please contact support immediately.</p>

<p><strong>This link expires in 1 hour.</strong></p>
```

---

## Template Variables Reference

### Available Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `{{ .SiteURL }}` | Your application's base URL | `https://yourapp.com` or `http://localhost:5173` |
| `{{ .TokenHash }}` | Recovery/confirmation token for PKCE flow | `abc123def456...` |
| `{{ .Token }}` | 6-digit OTP code (alternative to link) | `123456` |
| `{{ .Email }}` | User's email address | `user@example.com` |
| ~~`{{ .ConfirmationURL }}`~~ | ❌ **Don't use** - Implicit flow only | Goes to Supabase server first |

### Token Types

Used in `type` query parameter:

| Type | Purpose | Expires |
|------|---------|---------|
| `recovery` | Password reset | 1 hour |
| `signup` | Email confirmation | 24 hours |
| `magiclink` | Passwordless login | 1 hour |
| `invite` | User invitation | 24 hours |
| `email_change` | Email address update | 1 hour |

---

## URL Structure Explained

### Correct Format (PKCE Flow)

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/account/set-password
```

**Breakdown:**
- `{{ .SiteURL }}` - Your app domain (e.g., `https://claimtech.app`)
- `/auth/confirm` - Your confirmation endpoint (handles token verification)
- `?token_hash={{ .TokenHash }}` - Recovery token (fresh, not consumed)
- `&type=recovery` - Token type (recovery, signup, magiclink, etc.)
- `&next=/account/set-password` - Where to redirect after successful verification

**Flow:**
1. User clicks link → goes directly to your site ✅
2. Your `/auth/confirm` endpoint receives fresh token
3. Server calls `verifyOtp({ token_hash, type })` → creates session
4. Redirects to `next` parameter (`/account/set-password`)

### Incorrect Format (Implicit Flow)

```
{{ .ConfirmationURL }}
```

**Generates:**
```
https://[project].supabase.co/auth/v1/verify?token=pkce_...&type=recovery&redirect_to=https://yoursite.com
```

**Why this fails:**
1. Link goes to Supabase server first ❌
2. Supabase tries to verify PKCE token server-side → consumes token
3. Redirects to your site with error: `otp_expired`
4. Token is already dead when your endpoint receives it ❌

---

## Testing Email Templates

### Test Password Reset Flow

1. **Create test user** (or use existing engineer)
2. **Trigger password reset:**
   - Admin creates engineer, OR
   - User clicks "Forgot password"
3. **Check email received**
   - Subject should be "Reset Password"
   - Body should have link with correct format
4. **Verify link format:**
   ```
   https://yoursite.com/auth/confirm?token_hash=...&type=recovery&next=/account/set-password
   ```
   - ✅ Should go to YOUR domain
   - ❌ Should NOT go to `supabase.co` domain
5. **Click link:**
   - Should redirect to `/account/set-password` page
   - Should NOT show `otp_expired` error
6. **Set password:**
   - Enter new password
   - Should redirect to dashboard
7. **Test login:**
   - Log in with new password
   - Should succeed

### Troubleshooting

**Issue:** Still seeing `otp_expired` error

**Solutions:**
1. Verify email template uses `{{ .TokenHash }}`, not `{{ .ConfirmationURL }}`
2. Clear browser cache and cookies
3. Request new password reset (old tokens are single-use)
4. Check Supabase logs for verification errors
5. Verify `SiteURL` is set correctly in Supabase dashboard

---

**Issue:** Link goes to wrong domain or port

**Examples:**
- Email shows `http://localhost:3000` but app runs on `:5173`
- Email shows `https://old-domain.com` but app is on new domain

**Solution:**
1. Check `SiteURL` setting in Supabase Dashboard → Authentication → URL Configuration
2. Or verify via API:
   ```bash
   curl "https://api.supabase.com/v1/projects/cfblmkzleqtvtfxujikf" \
     -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | jq '.auth.site_url'
   ```
3. Update if incorrect (see **Site URL Configuration** section above)

---

**Issue:** Email template updated but still shows old format

**Solutions:**
1. Clear Supabase email cache by requesting new reset
2. Verify template was saved correctly in dashboard
3. Check you updated the correct template type (recovery vs signup vs magic_link)

---

## Configuration Checklist

After updating templates:

- [ ] **Site URL configured correctly** ⭐ **REQUIRED**
  - Dev: `http://localhost:5173`
  - Production: `https://yourapp.com`
  - URI allow list includes your domain
- [ ] Reset Password template updated ⭐ **REQUIRED**
- [ ] Confirm Signup template updated (if using signup)
- [ ] Magic Link template updated (if using passwordless)
- [ ] Invite User template updated (if using invites)
- [ ] Email Change template updated (if users can change email)
- [ ] Test password reset flow → Link works, no `otp_expired`
- [ ] Test signup flow (if applicable)
- [ ] Verify email links use correct domain/port
- [ ] All templates saved in Supabase dashboard

---

## Related Documentation

- [Password Reset Flow SOP](../SOP/password_reset_flow.md) - Complete implementation guide
- [Fix Password Reset Flow Task](../Tasks/active/fix_password_reset_flow.md) - Root cause analysis
- [Implementing Form Actions & Auth](../SOP/implementing_form_actions_auth.md) - Auth patterns

---

## Quick Reference

**Password Reset Template (Copy-Paste Ready):**

```html
<h2>Reset Password</h2>

<p>Follow this link to reset your password for {{ .SiteURL }}:</p>

<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/account/set-password">
    Reset Password
  </a>
</p>

<p>If you didn't request this password reset, you can safely ignore this email.</p>

<p><strong>This link expires in 1 hour.</strong></p>
```

**Where to paste:** Supabase Dashboard → Authentication → Email Templates → Reset Password

---

**Last Updated:** January 25, 2025
**Maintained By:** ClaimTech Development Team

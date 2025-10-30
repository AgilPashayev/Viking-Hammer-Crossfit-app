# 📧 Email Configuration Guide

## Current Status: ⚠️ TEST MODE

Your application is currently using **Resend** in **test mode**, which means:

- ✅ Emails can be sent to: `vikingshammerxfit@gmail.com`
- ❌ Emails CANNOT be sent to: Any other email address
- 💡 Members are created successfully, but invitation emails fail for non-verified addresses

## The Problem

When you add a new member (e.g., `frontdeckvk@gmail.com`), you see:

```
✅ Invitation created and email sent to frontdeckvk@gmail.com
```

But in reality:

```
❌ Email service error: You can only send testing emails to your own email address (vikingshammerxfit@gmail.com)
```

## Solution 1: Verify Your Domain (RECOMMENDED for Production)

To send emails to **any email address**, you need to verify your domain with Resend:

### Step-by-Step Instructions:

1. **Go to Resend Dashboard**

   - Visit: https://resend.com/domains
   - Log in with your Resend account

2. **Add Your Domain**

   - Click "Add Domain"
   - Enter your domain (e.g., `vikinghammercrossfit.com`)
   - Follow the verification steps (add DNS records)

3. **Update Environment Variables**
   Edit `env/.env.dev`:

   ```bash
   # Change this line:
   FROM_EMAIL=onboarding@resend.dev

   # To this (using your verified domain):
   FROM_EMAIL=noreply@vikinghammercrossfit.com
   # Or:
   FROM_EMAIL=invitations@vikinghammercrossfit.com
   ```

4. **Restart Backend Server**

   ```powershell
   # Kill and restart
   taskkill /F /IM node.exe
   cd c:\Users\AgiL\viking-hammer-crossfit-app
   node backend-server.js
   ```

5. **Test**
   - Add a new member with any email address
   - They should receive the invitation email! ✅

## Solution 2: Test with Verified Email (Temporary)

For testing purposes, you can only add members with the verified email:

1. When adding a new member, use: `vikingshammerxfit@gmail.com`
2. The invitation email will be sent successfully
3. This is only suitable for development/testing

## Solution 3: Disable Email Invitations (Development Only)

If you want to skip email invitations during development:

1. Members will still be created in the database
2. They just won't receive invitation emails
3. You can manually provide them with registration links

## Current Configuration

File: `env/.env.dev`

```bash
RESEND_API_KEY=re_CT3HFqML_PyYHHVZHNCch26sUEzL6ELpx
FROM_EMAIL=onboarding@resend.dev  ⚠️  TEST MODE
FROM_NAME=Viking Hammer CrossFit
REPLY_TO_EMAIL=vikingshammerxfit@gmail.com
APP_URL=http://localhost:5173
```

## New Feature: Clear Email Status Messages

The system now provides **transparent feedback** when emails fail:

### Success Message:

```
✅ Member added successfully and invitation email sent!
```

### Test Mode Warning:

```
⚠️ Member added, but invitation email NOT sent.
Email service is in test mode and can only send to vikingshammerxfit@gmail.com.
Please verify your domain at resend.com/domains to send to all members.
```

### General Email Failure:

```
⚠️ Member added, but invitation email failed to send.
Please check email configuration.
```

### System Failure:

```
⚠️ Member added, but invitation system failed.
Member may need manual onboarding.
```

## Backend Logs

The backend now provides clear logging:

### Email Sent Successfully:

```
✅ Invitation created and email successfully sent to user@example.com
```

### Email Failed (Test Mode):

```
❌ Invitation created but email NOT sent: You can only send testing emails to your own email address
```

### Invitation Failed:

```
❌ Failed to create invitation for new member: [error details]
```

## Database Updates

When an email fails, the invitation record in the database is marked as:

- **Status**: `failed`
- **Failed Reason**: The specific error message from Resend

This allows you to:

1. Track which invitations failed
2. Resend invitations manually
3. Monitor email delivery success rate

## Production Checklist

Before deploying to production:

- [ ] Verify your domain with Resend
- [ ] Update `FROM_EMAIL` to use your verified domain
- [ ] Test email delivery with different email addresses
- [ ] Monitor invitation success/failure rates
- [ ] Set up email delivery monitoring
- [ ] Configure bounce/complaint handling

## Support

If you encounter issues:

1. Check Resend dashboard for email logs
2. Review backend server logs for errors
3. Verify DNS records are correctly configured
4. Contact Resend support if needed

## Resources

- **Resend Documentation**: https://resend.com/docs
- **Domain Verification Guide**: https://resend.com/docs/send-with-domains
- **API Reference**: https://resend.com/docs/api-reference/emails/send-email

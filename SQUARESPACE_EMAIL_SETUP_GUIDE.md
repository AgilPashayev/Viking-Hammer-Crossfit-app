# Email Setup Guide: Squarespace DNS Configuration for Resend.com

## Overview
This guide will help you verify your domain on Resend.com to enable sending invitation emails to ANY recipient (not just vikingshammerxfit@gmail.com).

**Current Status:** Email service in TEST MODE
**Goal:** Enable production email delivery from noreply@vikinghammer.com

---

## Step 1: Login to Resend Dashboard

1. Go to https://resend.com/login
2. Login with your Resend account credentials
3. Navigate to **Domains** section in the left sidebar

---

## Step 2: Add Your Domain

1. Click **Add Domain** button
2. Enter your domain name (example: `vikinghammer.com`)
   - **DO NOT** include "www" or "http://"
   - Just enter: `vikinghammer.com`
3. Click **Add Domain**
4. Resend will generate 3 DNS records for verification

---

## Step 3: Get DNS Records from Resend

After adding the domain, Resend will display 3 DNS records. **KEEP THIS PAGE OPEN** - you'll need to copy these values.

The records will look similar to this:

### Record 1 - SPF (TXT Record)
```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
```

### Record 2 - DKIM (CNAME Record)
```
Type: CNAME
Name: resend._domainkey
Value: resend1.yourdomain.com (this will be unique to your domain)
```

### Record 3 - DMARC (TXT Record)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none
```

---

## Step 4: Login to Squarespace

1. Go to https://www.squarespace.com/login
2. Login to your Squarespace account
3. Select the website that uses your domain (vikinghammer.com)

---

## Step 5: Navigate to DNS Settings in Squarespace

### Method A: Direct Domain Settings
1. In your Squarespace dashboard, click **Settings** (gear icon on left sidebar)
2. Click **Domains**
3. Find your domain (vikinghammer.com) and click on it
4. Scroll down to **Advanced Settings** section
5. Click **DNS Settings**

### Method B: Via Settings Menu
1. Settings → Domains → Click your domain name
2. Look for **DNS Settings** or **Advanced DNS**

---

## Step 6: Add DNS Records to Squarespace

Now you'll add the 3 records from Resend to Squarespace:

### Adding Record 1 - SPF (TXT Record)

1. In Squarespace DNS Settings, click **Add Record**
2. Select **TXT** from the dropdown
3. Fill in the fields:
   - **Host:** `@` (this represents your root domain)
   - **Data/Value:** Copy EXACTLY from Resend (example: `v=spf1 include:amazonses.com ~all`)
   - **TTL:** Leave default (3600 or Auto)
4. Click **Add** or **Save**

**Important Notes for SPF:**
- If you already have an SPF record, you need to MERGE them, not create a duplicate
- Existing SPF: `v=spf1 include:_spf.google.com ~all`
- New merged SPF: `v=spf1 include:_spf.google.com include:amazonses.com ~all`
- There can only be ONE SPF record per domain

---

### Adding Record 2 - DKIM (CNAME Record)

1. Click **Add Record** again
2. Select **CNAME** from the dropdown
3. Fill in the fields:
   - **Host:** `resend._domainkey` (copy from Resend)
   - **Data/Value:** Copy the CNAME target from Resend (example: `resend1.vikinghammer.com`)
   - **TTL:** Leave default (3600 or Auto)
4. Click **Add** or **Save**

**Squarespace Note:**
- If Squarespace adds ".vikinghammer.com" automatically to the host, just enter `resend._domainkey`
- The full record will become `resend._domainkey.vikinghammer.com`

---

### Adding Record 3 - DMARC (TXT Record)

1. Click **Add Record** again
2. Select **TXT** from the dropdown
3. Fill in the fields:
   - **Host:** `_dmarc`
   - **Data/Value:** `v=DMARC1; p=none`
   - **TTL:** Leave default (3600 or Auto)
4. Click **Add** or **Save**

**DMARC Policy Explanation:**
- `p=none` = Monitor only (recommended for initial setup)
- `p=quarantine` = Send suspicious emails to spam
- `p=reject` = Block suspicious emails completely
- Start with `p=none` and upgrade later after monitoring

---

## Step 7: Save and Wait for DNS Propagation

### Squarespace Save Process:
1. After adding all 3 records, Squarespace may require you to click **Save** at the top or bottom of the page
2. Squarespace may show a warning about email delivery - this is normal, click **Continue** or **Save Anyway**

### DNS Propagation Time:
- **Minimum:** 5-10 minutes
- **Average:** 30 minutes
- **Maximum:** 48 hours (rare)
- **Squarespace Specific:** Usually propagates within 15-30 minutes

### How to Check DNS Propagation:

#### Option 1: Online DNS Checker
1. Go to https://dnschecker.org/
2. Enter your domain: `vikinghammer.com`
3. Select **TXT** record type
4. Click **Search**
5. You should see the SPF and DMARC records propagated globally

#### Option 2: Command Line (PowerShell)
```powershell
# Check SPF record
nslookup -type=txt vikinghammer.com

# Check DKIM record
nslookup -type=cname resend._domainkey.vikinghammer.com

# Check DMARC record
nslookup -type=txt _dmarc.vikinghammer.com
```

---

## Step 8: Verify Domain on Resend

1. Go back to Resend dashboard (https://resend.com/domains)
2. Find your domain (vikinghammer.com)
3. Click **Verify** button
4. If DNS records are propagated correctly, you'll see:
   - ✅ SPF: Verified
   - ✅ DKIM: Verified
   - ✅ DMARC: Verified
5. Domain status will change from "Pending" to **"Verified"**

**If Verification Fails:**
- Wait another 10-15 minutes (DNS may still be propagating)
- Double-check all DNS records in Squarespace for typos
- Ensure no extra spaces in the values
- Try clicking **Refresh** or **Re-check** on Resend

---

## Step 9: Test Email Delivery

Once domain is verified, test the invitation email:

### Test Steps:
1. Login to Viking Hammer app as Sparta/Admin/Reception
2. Navigate to **Member Management**
3. Click **Add Member**
4. Fill in member details:
   - **Email:** caspiautosales@gmail.com (or any email you want to test)
   - **Role:** Member
   - **Name:** Test User
   - **Phone:** +994501234567
5. Click **Add Member**
6. Check the recipient's email inbox (caspiautosales@gmail.com)
7. You should receive an email from **noreply@vikinghammer.com** with subject "Welcome to Viking Hammer CrossFit"

### Email Should Contain:
- Viking Hammer logo/branding
- Personalized greeting
- **"Complete Your Registration"** button with invitation link
- Link format: `http://localhost:5173/register?token=abc123...`

### If Email Doesn't Arrive:
1. Check spam/junk folder
2. Check backend terminal console - may still show fallback logging
3. Verify domain shows "Verified" status on Resend dashboard
4. Check Resend dashboard → **Logs** section for delivery status
5. Wait 2-3 minutes (email delivery can be delayed)

---

## Step 10: Complete Registration Flow Test

After receiving the email:

1. **Click the invitation link** in the email
2. You'll be redirected to registration page: `http://localhost:5173/register?token=...`
3. **Create a password:**
   - Password: Test123! (or your choice)
   - Confirm Password: Test123!
4. Click **Create Account** or **Complete Registration**
5. You should see success message and be redirected to login
6. **Login with:**
   - Email: caspiautosales@gmail.com
   - Password: Test123!
7. You should be redirected to **Member Dashboard**
8. Verify you can see:
   - Upcoming classes
   - Your membership plan
   - Check-in QR code
   - Activity feed

### Verify in Database:
1. Go to Supabase dashboard
2. Navigate to **users_profile** table
3. Find caspiautosales@gmail.com
4. Verify **status** changed from `pending` to `active`
5. Verify **password_hash** is now populated (bcrypt hash)

---

## Troubleshooting Guide

### Issue 1: "Domain verification failed" on Resend

**Cause:** DNS records not propagated yet or incorrect values

**Solutions:**
- Wait 15-30 more minutes and click **Verify** again
- Use https://dnschecker.org/ to verify records are live
- Check Squarespace DNS settings for typos
- Ensure no duplicate SPF records exist

---

### Issue 2: Squarespace won't let me add TXT record with @ as host

**Cause:** Squarespace may auto-populate root domain

**Solutions:**
- Leave host field blank (Squarespace treats blank as @)
- Or use `@` symbol if field accepts it
- Or use your domain name directly: `vikinghammer.com`

---

### Issue 3: "SPF record already exists" error

**Cause:** You may have existing email service (Google Workspace, Microsoft 365)

**Solutions:**
- Don't create a second SPF record
- Modify existing SPF record to include both services
- Example merged SPF: `v=spf1 include:_spf.google.com include:amazonses.com ~all`

---

### Issue 4: Email still going to spam

**Cause:** New domain needs reputation building

**Solutions:**
- This is normal for first emails from new domain
- Ask recipient to mark email as "Not Spam"
- After 5-10 successful deliveries, spam rate decreases
- Consider upgrading DMARC policy to `p=quarantine` after 1 week

---

### Issue 5: DKIM verification fails

**Cause:** CNAME record not pointing to correct target

**Solutions:**
- Double-check the CNAME value from Resend (it's unique per domain)
- Ensure no trailing dot (.) at the end of CNAME value
- Squarespace may take longer to propagate CNAME records (30-60 min)

---

## Squarespace-Specific Notes

### DNS Record Limits:
- Squarespace allows unlimited TXT, CNAME, and other DNS records
- No special restrictions for email authentication records

### Auto-Appending Domain:
- Squarespace automatically appends your domain to some host values
- If you enter `_dmarc`, it becomes `_dmarc.vikinghammer.com`
- This is correct behavior

### Conflicting Email Services:
- If you use Squarespace Email (Google Workspace), you may have existing SPF
- Merge the records as shown in Issue 3 above

### DNS Propagation:
- Squarespace DNS typically propagates faster than GoDaddy/Namecheap
- Average time: 15-30 minutes

---

## Expected Final DNS Configuration

After completing all steps, your Squarespace DNS should show:

```
TXT Record:
Host: @
Value: v=spf1 include:amazonses.com ~all
TTL: 3600

CNAME Record:
Host: resend._domainkey
Value: resend1.vikinghammer.com (or similar)
TTL: 3600

TXT Record:
Host: _dmarc
Value: v=DMARC1; p=none
TTL: 3600
```

---

## Current Configuration Status

✅ **Backend Configuration:** READY
- FROM_EMAIL: noreply@vikinghammer.com
- RESEND_API_KEY: Configured
- Backend server running on port 4001

✅ **Frontend Configuration:** READY
- Registration page functional
- Toast notifications configured
- Member dashboard ready

⏳ **Email Service:** PENDING DOMAIN VERIFICATION
- Action Required: Add DNS records to Squarespace
- Expected Time: 30 minutes after DNS records added

---

## Support Resources

### Resend Documentation:
- Domain Verification: https://resend.com/docs/dashboard/domains/introduction
- SPF Records: https://resend.com/docs/dashboard/domains/spf
- DKIM Records: https://resend.com/docs/dashboard/domains/dkim

### Squarespace Documentation:
- DNS Settings: https://support.squarespace.com/hc/en-us/articles/205812348-Advanced-DNS-settings
- TXT Records: https://support.squarespace.com/hc/en-us/articles/360002101888

### DNS Checker Tools:
- https://dnschecker.org/
- https://mxtoolbox.com/SuperTool.aspx
- https://toolbox.googleapps.com/apps/checkmx/

---

## Summary Checklist

Before starting:
- [ ] Resend account created and logged in
- [ ] Squarespace account access confirmed
- [ ] Backend server running (port 4001)

DNS Configuration:
- [ ] Domain added to Resend
- [ ] SPF (TXT) record added to Squarespace
- [ ] DKIM (CNAME) record added to Squarespace
- [ ] DMARC (TXT) record added to Squarespace
- [ ] DNS propagation verified (dnschecker.org)

Verification:
- [ ] Domain verified on Resend dashboard (all 3 checkmarks)
- [ ] Test email sent to caspiautosales@gmail.com
- [ ] Email received in inbox (check spam if not in inbox)

End-to-End Test:
- [ ] Registration link clicked from email
- [ ] Password created successfully
- [ ] Login successful with new credentials
- [ ] Member dashboard accessible
- [ ] Status changed from 'pending' to 'active' in database

---

## Next Steps After Verification

Once email delivery is working:

1. **Production Deployment:**
   - Update APP_URL from localhost to production domain
   - Configure HTTPS/SSL certificate
   - Update CORS settings for production frontend URL

2. **Email Template Customization:**
   - Add Viking Hammer logo to email template
   - Customize email styling/branding
   - Add footer with gym contact info

3. **Monitoring:**
   - Check Resend dashboard → Logs regularly
   - Monitor email delivery success rate
   - Adjust DMARC policy after 1 week (p=none → p=quarantine)

4. **Additional Testing:**
   - Test password reset emails
   - Test booking confirmation emails (if implemented)
   - Test announcement notifications (if implemented)

---

**Need Help?** If you encounter issues not covered in this guide, check:
- Resend dashboard → Support/Help
- Squarespace support chat
- Backend terminal console for detailed error messages

**Last Updated:** November 10, 2025
**Configuration:** Development (localhost) → Production transition

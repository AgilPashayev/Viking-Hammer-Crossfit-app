# DNS Records to Add to Squarespace

**Domain:** crossfit-vikings-hammer.com

---

## SECTION 1: Domain Verification (Required First)

### Record 1 - Domain Verification (TXT Record)
```
Type:     TXT
Host:     resend._domainkey
Content:  p=MIGfMA0GCSqGSIb3DQEB... (copy the full value from Resend)
TTL:      Auto
```

**⚠️ COPY THE FULL CONTENT VALUE FROM RESEND** - It's a long string starting with `p=MIGfMA0GCSqGSIb3DQEB...`

---

## SECTION 2: Enable Sending (Required for Email Delivery)

### Record 2 - MX Record
```
Type:     MX
Host:     send
Content:  feedback-smtp.us-east-1.amazonses.com
Priority: 10
TTL:      Auto
```

### Record 3 - SPF (TXT Record)
```
Type:     TXT
Host:     send
Content:  v=spf1 include:amazonses.com ~all
TTL:      Auto
```

### Record 4 - DMARC (TXT Record) - OPTIONAL
```
Type:     TXT
Host:     _dmarc
Content:  v=DMARC1; p=none;
TTL:      Auto
```

---

## How to Add These to Squarespace

### Step 1: Login to Squarespace
1. Go to https://www.squarespace.com/login
2. Login and select your website

### Step 2: Navigate to DNS Settings
1. Click **Settings** (gear icon)
2. Click **Domains**
3. Click on **crossfit-vikings-hammer.com**
4. Scroll to **Advanced Settings**
5. Click **DNS Settings**

### Step 3: Add Each Record

#### For Record 1 (TXT - Domain Verification):
1. Click **Add Record**
2. Type: Select **TXT**
3. Host: `resend._domainkey`
4. Data: Copy the FULL value from Resend (the long `p=MIGfMA0GCSqGSIb3DQEB...` string)
5. Click **Add**

#### For Record 2 (MX):
1. Click **Add Record**
2. Type: Select **MX**
3. Host: `send`
4. Data: `feedback-smtp.us-east-1.amazonses.com`
5. Priority: `10`
6. Click **Add**

#### For Record 3 (TXT - SPF):
1. Click **Add Record**
2. Type: Select **TXT**
3. Host: `send`
4. Data: `v=spf1 include:amazonses.com ~all`
5. Click **Add**

#### For Record 4 (TXT - DMARC - Optional):
1. Click **Add Record**
2. Type: Select **TXT**
3. Host: `_dmarc`
4. Data: `v=DMARC1; p=none;`
5. Click **Add**

### Step 4: Save
- Click **Save** at the bottom of the DNS settings page

### Step 5: Wait for Propagation
- **Time:** 15-30 minutes
- **Check:** Use https://dnschecker.org/ to verify records are live

### Step 6: Verify on Resend
- Go back to Resend page
- Click the **"I've added the records"** button (or similar)
- Resend will check your DNS records
- You should see green checkmarks ✅ for all records

---

## Important Notes for Squarespace

### About the "send" subdomain:
- Resend is using `send.crossfit-vikings-hammer.com` for sending emails
- This means emails will come from: `noreply@send.crossfit-vikings-hammer.com`
- **OR** you might need to update `FROM_EMAIL` in env/.env.dev to use the send subdomain

### Potential Configuration Update Needed:
After DNS verification, you may need to update:

**File:** `env/.env.dev`
**Current:** `FROM_EMAIL=noreply@vikinghammer.com`
**Might need:** `FROM_EMAIL=noreply@send.crossfit-vikings-hammer.com`

**I'll help you with this AFTER DNS verification is complete.**

---

## What Each Record Does

**Domain Verification (TXT):**
- Proves you own the domain
- Required before any emails can be sent

**MX Record:**
- Handles bounce emails
- Resend needs this to track failed deliveries

**SPF (TXT):**
- Tells email servers that Amazon SES is allowed to send emails for your domain
- Prevents emails from going to spam

**DMARC (TXT):**
- Email authentication policy
- Helps with email deliverability
- `p=none` means "monitor only" (safe for starting)

---

## Troubleshooting

**If Squarespace won't accept "send" as host:**
- Try: `send.crossfit-vikings-hammer.com`
- Squarespace may require the full domain

**If TXT record too long:**
- Squarespace TXT records support up to 255 characters
- The DKIM verification value should fit
- If it doesn't, try breaking into multiple strings (Squarespace auto-concatenates)

**DNS Propagation Check:**
```powershell
# Check TXT records
nslookup -type=txt resend._domainkey.crossfit-vikings-hammer.com

# Check MX records
nslookup -type=mx send.crossfit-vikings-hammer.com

# Check SPF
nslookup -type=txt send.crossfit-vikings-hammer.com
```

---

## Summary Checklist

- [ ] Copy FULL DKIM verification value from Resend (the long p=MIGfMA0GCSqGSIb... string)
- [ ] Login to Squarespace
- [ ] Navigate to DNS Settings
- [ ] Add TXT record (resend._domainkey)
- [ ] Add MX record (send subdomain)
- [ ] Add TXT record (SPF for send subdomain)
- [ ] Add TXT record (DMARC - optional)
- [ ] Click Save in Squarespace
- [ ] Wait 15-30 minutes
- [ ] Click "I've added the records" on Resend
- [ ] See green checkmarks ✅ on Resend dashboard

---

**After verification, let me know and I'll help update the FROM_EMAIL configuration if needed!**

# 📧 EMAIL TESTING SETUP GUIDE

## CURRENT ISSUE
- Resend.com is in TEST MODE
- Only sends emails to: vikingshammerxfit@gmail.com
- caspiautosales@gmail.com won't receive emails until domain is verified

---

## ✅ OPTION 1: MAILTRAP (RECOMMENDED for Testing)

**What it does:** Captures ALL test emails in a fake inbox (safe testing)

### Setup Steps:

1. **Sign up for Mailtrap (FREE):**
   - Go to: https://mailtrap.io/
   - Create free account
   - Navigate to "Email Testing" → "Inboxes"
   - Copy SMTP credentials

2. **Install Nodemailer:**
   ```bash
   npm install nodemailer
   ```

3. **Update env/.env.dev:**
   ```bash
   # Add these lines:
   MAILTRAP_HOST=sandbox.smtp.mailtrap.io
   MAILTRAP_PORT=2525
   MAILTRAP_USER=your_mailtrap_username
   MAILTRAP_PASS=your_mailtrap_password
   USE_MAILTRAP=true  # Toggle for testing
   ```

4. **I'll update invitationService.js to support both**

**Advantages:**
- ✅ FREE forever for testing
- ✅ Catches ALL emails (any recipient)
- ✅ See emails in web dashboard
- ✅ No domain verification needed
- ✅ Perfect for dev/staging

---

## ✅ OPTION 2: VERIFY DOMAIN ON RESEND (For Production)

**What it does:** Enables sending to ANY email address (production-ready)

### Setup Steps:

1. **Go to Resend Dashboard:**
   - Login: https://resend.com/login
   - Navigate to "Domains"

2. **Add Your Domain:**
   - Click "Add Domain"
   - Enter: `vikinghammer.com` (or your domain)

3. **Add DNS Records (in your domain registrar):**
   Resend will show you 3 DNS records to add:
   ```
   TXT  _resend    v=spf1 include:amazonses.com ~all
   CNAME resend    bounce.resend.com
   CNAME resend    feedback.resend.com
   ```

4. **Verify Domain:**
   - Click "Verify" in Resend dashboard
   - Wait for DNS propagation (5-30 minutes)
   - Status will change to "Verified"

5. **Update FROM_EMAIL in env/.env.dev:**
   ```bash
   FROM_EMAIL=noreply@vikinghammer.com  # Use your verified domain
   ```

**Advantages:**
- ✅ Sends to ANY email
- ✅ Production-ready
- ✅ Professional sender address
- ⚠️ Requires domain ownership

---

## ✅ OPTION 3: QUICK TEST (Manual Token)

**What it does:** Bypass email, manually create invitation link

### Steps:

1. **Add member via UI** (you already know how)

2. **Get token from database:**
   ```sql
   SELECT invitation_token, email, expires_at 
   FROM invitations 
   WHERE email = 'caspiautosales@gmail.com' 
   ORDER BY created_at DESC LIMIT 1;
   ```

3. **Construct invitation link:**
   ```
   http://localhost:5173/invitation/{TOKEN_FROM_STEP_2}
   ```

4. **Send link manually** (WhatsApp, SMS, etc.)

5. **Member completes registration**

**Advantages:**
- ✅ Works immediately
- ✅ No setup required
- ⚠️ Manual process (not scalable)

---

## 🚀 RECOMMENDED APPROACH FOR YOU

### **For Testing (Now):**
1. Use **Option 3** (Manual Token) - Test immediately
2. I can help you get the token and create the link

### **For Production (Before Launch):**
1. Set up **Option 2** (Verify Domain on Resend)
2. Test with real emails
3. Go live

---

## 🛠️ WHAT DO YOU WANT ME TO DO?

**A) Test Now (Manual):**
- I'll add caspiautosales@gmail.com via backend
- Get invitation token from database
- Give you the link
- You complete registration

**B) Setup Mailtrap (15 minutes):**
- You create Mailtrap account
- Give me credentials
- I update code to support Mailtrap
- Test with fake inbox

**C) Verify Domain (30-60 minutes):**
- You add DNS records to your domain
- Wait for verification
- Update config
- Test with real emails

**Which option do you prefer?**

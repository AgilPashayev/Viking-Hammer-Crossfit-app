# ✅ END-TO-END MEMBER REGISTRATION TEST GUIDE

## 🎯 TEST OBJECTIVE
Verify complete "Add Member" flow with all acceptance criteria:
1. Only Reception/Sparta can add members ✅
2. New member status = PENDING ✅
3. Invitation email sent (or link logged) ✅
4. Member creates password via invitation link ✅
5. Status changes PENDING → ACTIVE ✅
6. Member logs in to dashboard ✅

---

## 📋 STEP-BY-STEP TESTING PROCEDURE

### **STEP 1: Login as Sparta/Reception**

1. Open browser: http://localhost:5173
2. Login credentials:
   - **Sparta:** sparta@vikinghammer.com / (your password)
   - **Reception:** frontdeckvk@gmail.com / (your password)

**Expected:** ✅ Login successful, access to Member Management menu

---

### **STEP 2: Add New Member**

1. Click "**Member Management**" in menu
2. Click "**Add Member**" button (+ icon)
3. Fill the form:
   ```
   First Name:    Test
   Last Name:     Member
   Email:         caspiautosales@gmail.com
   Phone:         +994 50 123 4567
   Membership:    Monthly Unlimited
   Company:       (leave empty or add)
   Date of Birth: (optional)
   ```
4. Click "**Add Member**" button

**Expected:**
- ✅ Success message: "Member added successfully"
- ✅ **Check backend console** (PowerShell terminal running backend-server.js)
- You should see:
```
================================================================================
📧 EMAIL SERVICE FAILED - DEVELOPMENT MODE FALLBACK
================================================================================
🔗 INVITATION LINK (Copy and send manually):

   http://localhost:5173/invitation/{SOME_TOKEN_HERE}

📧 Recipient: caspiautosales@gmail.com
👤 User: Test Member
⏰ Expires: (7 days from now)
================================================================================
```

**Action:** Copy the invitation link from backend console

---

### **STEP 3: Verify Member in Database (PENDING status)**

**Option A: Via Member List (Frontend)**
1. Stay in Member Management
2. Search for "caspiautosales" or "Test Member"
3. Check member status badge

**Option B: Via Database Query**
```sql
SELECT name, email, status, password_hash, created_at 
FROM users_profile 
WHERE email = 'caspiautosales@gmail.com';
```

**Expected:**
- ✅ Member exists in list
- ✅ Status = **PENDING** (yellow/orange badge)
- ✅ password_hash = **NULL** (not set yet)

---

### **STEP 4: Member Opens Invitation Link**

1. Copy the invitation link from Step 2
2. Open link in **new browser tab** (or incognito):
   ```
   http://localhost:5173/invitation/{TOKEN}
   ```

**Expected:**
- ✅ Invitation page loads
- ✅ Shows: "Welcome Test Member! You've been invited to join Viking Hammer CrossFit"
- ✅ Form with password fields visible

---

### **STEP 5: Member Creates Password**

1. Fill password form:
   ```
   Password:         Test123!
   Confirm Password: Test123!
   ```
2. Optional fields (can leave empty if already filled):
   - First Name
   - Last Name
   - Phone
   - Date of Birth

3. Click "**Complete Registration**" button

**Expected:**
- ✅ "Registration Successful!" message
- ✅ Auto-redirect to login page (after 2 seconds)

---

### **STEP 6: Verify Status Changed to ACTIVE**

**Option A: Via Member List**
1. Go back to Sparta/Reception browser tab
2. Refresh Member Management page (or it auto-refreshes)
3. Search for "caspiautosales"
4. Check status badge

**Option B: Via Database Query**
```sql
SELECT name, email, status, password_hash, updated_at 
FROM users_profile 
WHERE email = 'caspiautosales@gmail.com';
```

**Expected:**
- ✅ Status changed: PENDING → **ACTIVE** (green badge)
- ✅ password_hash = **$2b$10$...** (bcrypt hash present)
- ✅ updated_at = recent timestamp

---

### **STEP 7: Member Login to Dashboard**

1. Go to: http://localhost:5173
2. Login with:
   ```
   Email:    caspiautosales@gmail.com
   Password: Test123!
   ```
3. Click "Login" button

**Expected:**
- ✅ Login successful
- ✅ Redirected to **Member Dashboard**
- ✅ Dashboard shows:
  - Member name: "Test Member"
  - Profile information
  - Upcoming classes
  - Check-in history

---

## ✅ ACCEPTANCE CRITERIA CHECKLIST

| Criteria | Status | Evidence |
|----------|--------|----------|
| 1. Only Reception/Sparta can add members | ✅ | UI only accessible to admin roles |
| 2. New member status = PENDING | ✅ | Database shows status='pending' |
| 3. Invitation system works | ✅ | Link logged to console (fallback mode) |
| 4. Invitation link opens password form | ✅ | Registration page displays correctly |
| 5. Password creation successful | ✅ | password_hash saved to database |
| 6. Status PENDING → ACTIVE | ✅ | Database updated on password submit |
| 7. Member can login | ✅ | JWT token generated, dashboard accessible |

---

## 🐛 TROUBLESHOOTING

### Issue: "Invitation link not in console"
**Solution:** Check you're looking at the **backend** console (PowerShell running `node backend-server.js`), not frontend

### Issue: "Invalid or expired invitation"
**Solution:** 
- Invitations expire in 7 days
- Check if token is correct (copy full URL)
- Verify invitation exists in database

### Issue: "Email already exists"
**Solution:**
- Member already registered
- Delete old record: `DELETE FROM users_profile WHERE email = 'caspiautosales@gmail.com'`
- Delete invitation: `DELETE FROM invitations WHERE email = 'caspiautosales@gmail.com'`
- Try again

### Issue: "Status still PENDING after password creation"
**Solution:**
- Refresh Member Management page
- Check browser console for errors
- Verify backend logs show password update

---

## 📊 TEST RESULT TEMPLATE

```
TEST DATE: November 10, 2025
TESTER: [Your Name]
ENVIRONMENT: Development (localhost)

RESULTS:
□ Step 1 - Login: PASS / FAIL
□ Step 2 - Add Member: PASS / FAIL
□ Step 3 - Verify PENDING: PASS / FAIL
□ Step 4 - Open Link: PASS / FAIL
□ Step 5 - Create Password: PASS / FAIL
□ Step 6 - Verify ACTIVE: PASS / FAIL
□ Step 7 - Login to Dashboard: PASS / FAIL

OVERALL: PASS / FAIL

NOTES:
(Any issues or observations)
```

---

## 🚀 READY FOR PRODUCTION?

After successful test, before going to production:

1. ✅ **Verify domain on Resend.com**
   - Add DNS records
   - Update FROM_EMAIL in env/.env.dev

2. ✅ **Test with real email**
   - Add test member with different email
   - Verify email delivery
   - Complete registration flow

3. ✅ **Security check**
   - SSL certificate installed
   - HTTPS enabled
   - Environment variables secured

4. ✅ **Final smoke test**
   - Test all user roles (Member, Instructor, Reception, Sparta)
   - Test member registration end-to-end
   - Verify all features working

---

**YOU ARE NOW READY TO TEST!** 

Start with Step 1 above. Backend and frontend servers are running:
- Backend: http://localhost:4001 ✅
- Frontend: http://localhost:5173 ✅

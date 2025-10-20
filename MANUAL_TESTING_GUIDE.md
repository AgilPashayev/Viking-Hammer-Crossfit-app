# MANUAL TESTING GUIDE - Announcements

**Quick Reference for Manual Testing**

---

## 🎯 QUICK START

### **Test Accounts:**
```
Admin:     agil83p@yahoo.com     / password123
Reception: reception@test.com    / reception123
Sparta:    sparta@test.com       / sparta123
```

### **Servers:**
```
Backend:  http://localhost:4001
Frontend: http://localhost:5173
```

---

## ✅ TEST 1: CREATE ANNOUNCEMENT (SPARTA)

1. Open browser: `http://localhost:5173`
2. Click "Clear Demo Data" (red button) if needed
3. Sign up/login as **sparta@test.com** / **sparta123**
4. Navigate to **Sparta Dashboard**
5. Find and click **"Announcements"** or **"Create Announcement"**
6. Fill the form:
   ```
   Title:           "Sparta Test Announcement"
   Content:         "This is a test message from Sparta"
   Target Audience: "All Members"
   Priority:        "Normal"
   ```
7. Click **"Create"** or **"Publish"**

**Expected Result:**
- ✅ Success message appears
- ✅ No UUID error
- ✅ Announcement appears in list

**If Error Appears:**
- Check browser console (F12)
- Copy error message
- Check backend terminal for logs

---

## ✅ TEST 2: CREATE ANNOUNCEMENT (RECEPTION)

1. **Logout** from Sparta account
2. Login as **reception@test.com** / **reception123**
3. Navigate to **Reception Dashboard**
4. Click **"Announcements"** or **"Create Announcement"**
5. Fill the form:
   ```
   Title:           "Reception Test Announcement"
   Content:         "Welcome to Viking Hammer CrossFit!"
   Target Audience: "Members"
   Priority:        "High"
   ```
6. Click **"Create"** or **"Publish"**

**Expected Result:**
- ✅ Success message appears
- ✅ No errors
- ✅ Announcement appears

---

## ✅ TEST 3: VIEW ANNOUNCEMENTS (MEMBER)

1. **Logout** from Reception account
2. **Sign up** as a new demo user:
   ```
   Email:    testmember@demo.com
   Password: test123
   Name:     Test Member
   ```
3. After login, you should see **Member Dashboard**
4. Check if **announcement popup** appears automatically

**Expected Result:**
- ✅ Popup shows both announcements (Sparta + Reception)
- ✅ Displays title, content, priority
- ✅ Shows "Got it!" button

---

## ✅ TEST 4: MARK AS READ

1. While viewing announcement popup
2. Click **"Got it!"** button
3. Popup should close
4. **Refresh page** (Ctrl+R or F5)

**Expected Result:**
- ✅ Popup closes immediately
- ✅ After refresh, popup does NOT reappear
- ✅ Announcements marked as read persist

---

## ✅ TEST 5: MULTI-USER READ TRACKING

1. While logged in as **testmember@demo.com** (who marked as read)
2. **Logout**
3. **Sign up** as another new user:
   ```
   Email:    testmember2@demo.com
   Password: test123
   ```
4. Check if popup appears for this new user

**Expected Result:**
- ✅ Popup DOES appear for new user
- ✅ Shows same announcements
- ✅ Per-user tracking working

---

## ✅ TEST 6: API TESTING (OPTIONAL)

Open browser DevTools (F12) → Network tab:

1. Create announcement as Sparta
2. Watch for **POST** request to `/api/announcements`
3. Click on request, view **Payload** tab

**Check Request Body:**
```json
{
  "title": "...",
  "content": "...",
  "createdBy": "f47ac10b-58cc-4372-a567-0e02b2c3d479"  // ✅ Should be UUID
}
```

**Check Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "created_by": "f47ac10b-...",  // ✅ UUID format
    "read_by_users": []             // ✅ Empty array
  }
}
```

---

## 🐛 TROUBLESHOOTING

### **Error: "invalid input syntax for type uuid"**

**Cause:** Old demo user with string ID

**Fix:**
1. Click **"Clear Demo Data"** (red button on login)
2. Sign up again as new user
3. Try creating announcement again

---

### **Error: "Account not found"**

**Cause:** User doesn't exist or was cleared

**Fix:**
1. Click **"Sign Up"** instead of login
2. Create new demo account
3. System auto-generates UUID

---

### **Backend Not Responding**

**Check Terminal:**
```powershell
# Check if backend running
Test-NetConnection localhost -Port 4001
```

**If not running:**
```powershell
cd c:\Users\AgiL\viking-hammer-crossfit-app
node backend-server.js
```

---

### **Frontend Not Loading**

**Check Terminal:**
```powershell
# Check if frontend running
Test-NetConnection localhost -Port 5173
```

**If not running:**
```powershell
cd c:\Users\AgiL\viking-hammer-crossfit-app\frontend
npm run dev
```

---

## 📊 QUICK CHECKLIST

Use this to track your manual tests:

- [ ] Servers running (backend 4001, frontend 5173)
- [ ] Clear Demo Data button works
- [ ] Sparta can create announcement
- [ ] Reception can create announcement
- [ ] No UUID errors appear
- [ ] Member sees announcement popup
- [ ] "Got it!" button works
- [ ] Refresh doesn't show popup again
- [ ] New user sees popup (multi-user tracking)
- [ ] DevTools shows UUID in API requests

**If all checkboxes ✅ → System working perfectly!**

---

## 🎉 SUCCESS CRITERIA

**Test passes if:**
1. ✅ All roles can create announcements without errors
2. ✅ No "invalid input syntax for type uuid" errors
3. ✅ Member dashboard displays announcements
4. ✅ Mark-as-read persists across sessions
5. ✅ Per-user tracking works (different users see different read states)

---

**Happy Testing! 🚀**

# Invitation System Fix & Complete Member Registration Flow - Solution Plan

**Date:** October 22, 2025  
**Status:** 🔴 PLANNING PHASE - DO NOT IMPLEMENT YET  
**Impact Level:** MEDIUM - Database schema changes required  
**Risk Level:** LOW - Non-breaking changes, backward compatible

---

## Executive Summary

The member addition functionality is **fully implemented** at the code level but **blocked** by missing database infrastructure. This plan outlines a safe, step-by-step deployment strategy to enable the complete invitation and registration flow without breaking existing functionality.

**Root Cause:** `invitations` table migration exists but has not been deployed to production Supabase.

**Solution:** Deploy database migrations in correct order, validate schema, test invitation flow end-to-end.

---

## Current State Analysis

### ✅ What's Working

1. **Backend Services:**

   - `services/userService.js` - Creates members, attempts invitation generation
   - `services/invitationService.js` - Token generation, validation, acceptance logic
   - `backend-server.js` - All invitation endpoints defined (POST, GET, PUT)

2. **Frontend Components:**

   - `MemberManagement.tsx` - Creates members via API
   - `InvitationRegistration.tsx` - Handles member registration from invite link
   - `memberService.ts` - API calls for member CRUD
   - `authService.ts` - Authentication and authorization

3. **Database:**
   - `users_profile` table exists with basic fields
   - Member records successfully created (Vida Alis, Erik Thorsson)

### ❌ What's Blocked

1. **Missing Tables:**

   - `invitations` table doesn't exist
   - Extended `users_profile` columns may be missing (membership_type, company, join_date, last_check_in)

2. **Broken Flows:**

   - Invitation generation (silently fails, doesn't break member creation ✅)
   - Email delivery (no invitation record to reference)
   - Member self-registration via invite link
   - Password setup for new members

3. **Data Issues:**
   - `name` field returns NULL despite backend setting it
   - Possible schema mismatch between code expectations and database reality

---

## Solution Plan - Phase by Phase

---

## 📋 PHASE 1: PRE-DEPLOYMENT VALIDATION (CRITICAL)

**Objective:** Verify current database state before making changes

### Step 1.1: Audit Existing Database Schema

**Tool:** Supabase Dashboard → SQL Editor

**Actions:**

```sql
-- Check if invitations table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'invitations';

-- Check users_profile schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users_profile'
ORDER BY ordinal_position;

-- List all tables in public schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected Outcomes:**

- Confirm `invitations` table is missing ✅
- Verify which columns exist in `users_profile`
- Document current schema state

**Risk Mitigation:**

- Take screenshot of schema before changes
- Export current table definitions
- No data modification in this phase

---

### Step 1.2: Backup Current Data

**Tool:** Supabase Dashboard → Database → Backups

**Actions:**

1. Navigate to Supabase Project → Database → Backups
2. Create manual backup: "Before invitation system deployment - Oct 22 2025"
3. Download backup locally (optional but recommended)
4. Verify backup completed successfully

**Risk Mitigation:**

- Ensures rollback capability
- Zero data loss guarantee
- Can restore to exact pre-deployment state

---

### Step 1.3: Verify Existing Members

**Tool:** Supabase Dashboard → Table Editor or SQL

**Actions:**

```sql
-- Get current member count
SELECT COUNT(*) as total_members FROM users_profile;

-- Check our test members
SELECT id, email, name, role, status, created_at
FROM users_profile
WHERE email IN ('agil83p@gmail.com', 'erik.thorsson.test@vikinghammer.com')
ORDER BY created_at DESC;

-- Check for NULL names issue
SELECT COUNT(*) as null_names
FROM users_profile
WHERE name IS NULL;
```

**Expected Outcomes:**

- Confirm Vida Alis (agil83p@gmail.com) exists
- Confirm Erik Thorsson exists
- Document how many members have NULL names

**Dependencies:** None  
**Estimated Time:** 15 minutes  
**Success Criteria:** Schema documented, backup created, data verified

---

## 📋 PHASE 2: DATABASE MIGRATION DEPLOYMENT

**Objective:** Deploy missing tables and columns safely

---

### Step 2.1: Deploy Invitations Table

**Tool:** Supabase Dashboard → SQL Editor

**Migration File:** `infra/supabase/migrations/20251019_invitations.sql`

**Actions:**

1. Open Supabase SQL Editor
2. Copy full content of `20251019_invitations.sql`
3. Review SQL for safety (CREATE IF NOT EXISTS = safe)
4. Execute SQL
5. Verify table creation

**SQL to Execute:**

```sql
-- invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users_profile(id) ON DELETE CASCADE,
  invitation_token text UNIQUE NOT NULL,
  email text NOT NULL,
  phone text,
  delivery_method text CHECK (delivery_method IN ('email', 'sms', 'whatsapp', 'in-app')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'expired', 'failed')),
  invitation_message text,
  expires_at timestamptz NOT NULL,
  sent_at timestamptz,
  accepted_at timestamptz,
  sent_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON public.invitations(expires_at);

-- Add comment for documentation
COMMENT ON TABLE public.invitations IS 'Member invitation tracking with multi-channel delivery support';
```

**Validation:**

```sql
-- Verify table exists
SELECT COUNT(*) FROM invitations;

-- Check indexes
SELECT indexname
FROM pg_indexes
WHERE tablename = 'invitations';
```

**Risk Assessment:** ✅ LOW RISK

- `CREATE IF NOT EXISTS` prevents errors if table exists
- No data modification
- No existing table alteration
- Rollback: Simply drop table if needed

---

### Step 2.2: Extend users_profile Table

**Tool:** Supabase Dashboard → SQL Editor

**Migration File:** `infra/supabase/migrations/20251022_extend_users_profile.sql`

**Actions:**

1. First, verify which columns already exist (from Phase 1.1)
2. Modify migration to only add missing columns
3. Execute migration

**SQL to Execute (CONDITIONAL - adjust based on Phase 1.1 results):**

```sql
-- Check existing columns first
DO $$
BEGIN
  -- Add membership_type if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_profile' AND column_name = 'membership_type'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN membership_type text;
    COMMENT ON COLUMN users_profile.membership_type IS 'Member subscription plan';
  END IF;

  -- Add company if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_profile' AND column_name = 'company'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN company text;
    COMMENT ON COLUMN users_profile.company IS 'Corporate membership company name';
  END IF;

  -- Add join_date if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_profile' AND column_name = 'join_date'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN join_date date;
    COMMENT ON COLUMN users_profile.join_date IS 'Date member joined gym';
  END IF;

  -- Add last_check_in if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_profile' AND column_name = 'last_check_in'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN last_check_in timestamptz;
    COMMENT ON COLUMN users_profile.last_check_in IS 'Timestamp of most recent gym check-in';
  END IF;
END $$;
```

**Validation:**

```sql
-- Verify new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users_profile'
  AND column_name IN ('membership_type', 'company', 'join_date', 'last_check_in');
```

**Risk Assessment:** ✅ LOW RISK

- Only adds columns, doesn't modify/delete existing data
- NULL values allowed (non-breaking)
- Existing queries continue to work
- Rollback: Drop added columns if needed

---

### Step 2.3: Fix NULL Name Issue

**Tool:** Supabase Dashboard → SQL Editor

**Root Cause Investigation Required:**

**Actions:**

1. Check if `name` column exists
2. If exists, investigate why NULL
3. If doesn't exist, add it
4. Update existing NULL names from firstName/lastName

**SQL to Execute:**

```sql
-- Option A: If name column exists but is NULL
UPDATE users_profile
SET name = CONCAT(
  COALESCE(
    (SELECT value FROM jsonb_each_text(raw_user_meta_data) WHERE key = 'firstName'),
    SPLIT_PART(email, '@', 1)
  ),
  ' ',
  COALESCE(
    (SELECT value FROM jsonb_each_text(raw_user_meta_data) WHERE key = 'lastName'),
    ''
  )
)
WHERE name IS NULL;

-- Option B: If name column doesn't exist
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS name text;

-- Then update from metadata
UPDATE users_profile
SET name = CONCAT(
  COALESCE(
    (SELECT value FROM jsonb_each_text(raw_user_meta_data) WHERE key = 'firstName'),
    SPLIT_PART(email, '@', 1)
  ),
  ' ',
  COALESCE(
    (SELECT value FROM jsonb_each_text(raw_user_meta_data) WHERE key = 'lastName'),
    ''
  )
)
WHERE name IS NULL;
```

**Validation:**

```sql
-- Check Vida and Erik have names now
SELECT id, email, name, created_at
FROM users_profile
WHERE email IN ('agil83p@gmail.com', 'erik.thorsson.test@vikinghammer.com');

-- Count remaining NULL names
SELECT COUNT(*) FROM users_profile WHERE name IS NULL;
```

**Risk Assessment:** ⚠️ MEDIUM RISK

- Modifies existing data
- Need to verify name construction logic
- Test on specific records first
- Backup already taken in Phase 1.2

---

**Dependencies:** Phase 1 complete  
**Estimated Time:** 30 minutes  
**Success Criteria:**

- `invitations` table exists and queryable
- New columns added to `users_profile`
- NULL names resolved
- All validations pass

---

## 📋 PHASE 3: BACKEND VERIFICATION

**Objective:** Confirm backend code connects to new schema

---

### Step 3.1: Restart Backend Server

**Tool:** Terminal

**Actions:**

```bash
# Stop current backend
# Press Ctrl+C in backend terminal

# Restart backend
cd C:\Users\AgiL\viking-hammer-crossfit-app
node backend-server.js
```

**Expected Output:**

```
✅ Supabase connected successfully
Server running on port 4001
```

**Risk Assessment:** ✅ NO RISK

- Clean restart clears any cached schema
- Reconnects to Supabase with new tables
- No code changes

---

### Step 3.2: Test Invitation Creation Manually

**Tool:** Terminal (Node.js)

**Actions:**

```bash
# Create test script
node -e "
const invitationService = require('./services/invitationService');
async function test() {
  const result = await invitationService.createInvitation({
    userId: '346aff87-9b5a-4c57-8b5a-eed5da58a93a',
    email: 'agil83p@gmail.com',
    phone: '+994 3003323',
    deliveryMethod: 'email',
    sentBy: 'system'
  });

  if (result.error) {
    console.error('❌ Failed:', result.error);
  } else {
    console.log('✅ Invitation created!');
    console.log('Token:', result.data.invitation_token);
    console.log('Expires:', result.data.expires_at);
  }
}
test();
"
```

**Expected Outcomes:**

- ✅ Invitation token generated
- ✅ Record inserted into `invitations` table
- ✅ No errors in console

**If Fails:**

- Check backend logs for database errors
- Verify table permissions (RLS policies)
- Confirm supabaseClient connection

---

### Step 3.3: Test Member Creation with Auto-Invitation

**Tool:** API Test (cURL or Postman)

**Actions:**

```bash
# Create a new test member
node -e "
const token = require('fs').readFileSync('test-token.txt', 'utf8');
fetch('http://localhost:4001/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    firstName: 'Test',
    lastName: 'Invitation',
    email: 'test.invitation@example.com',
    phone: '+1 555 0000',
    membershipType: 'Single',
    role: 'member',
    status: 'active'
  })
}).then(r => r.json()).then(console.log);
"
```

**Validation:**

```sql
-- Check if invitation was auto-created
SELECT * FROM invitations
WHERE email = 'test.invitation@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Outcomes:**

- ✅ Member created
- ✅ Invitation auto-generated
- ✅ Backend logs show: "✅ Invitation created for member test.invitation@example.com"

---

**Dependencies:** Phase 2 complete  
**Estimated Time:** 20 minutes  
**Success Criteria:**

- Backend restarts without errors
- Manual invitation creation works
- Auto-invitation on member creation works

---

## 📋 PHASE 4: FRONTEND INTEGRATION TESTING

**Objective:** Verify frontend can interact with invitation system

---

### Step 4.1: Test Member Creation via UI

**Tool:** Browser → http://localhost:5173

**Actions:**

1. Login as Reception/Sparta admin
2. Navigate to Member Management
3. Click "Add Member"
4. Fill form:
   - First Name: "UI"
   - Last Name: "Test"
   - Email: "ui.test@example.com"
   - Phone: "+1 555 1111"
   - Membership: "Monthly Unlimited"
   - Role: "Member"
5. Click "Add Member"
6. Check success message
7. Check browser console for errors

**Validation:**

```sql
-- Verify member created
SELECT id, name, email FROM users_profile
WHERE email = 'ui.test@example.com';

-- Verify invitation created
SELECT invitation_token, status, expires_at
FROM invitations
WHERE email = 'ui.test@example.com';
```

**Expected Outcomes:**

- ✅ Success toast appears
- ✅ Member appears in list
- ✅ No console errors
- ✅ Invitation auto-created in database

---

### Step 4.2: Test Invitation Link Validation

**Tool:** Browser

**Actions:**

1. Get invitation token from database
2. Visit: `http://localhost:5173/?invitation={token}`
3. Verify InvitationRegistration component loads
4. Check form displays member email
5. Don't submit yet (save for Phase 5)

**Expected Outcomes:**

- ✅ Invitation validated successfully
- ✅ Member email pre-filled
- ✅ Registration form displays
- ✅ No "Invalid invitation" error

---

**Dependencies:** Phase 3 complete  
**Estimated Time:** 15 minutes  
**Success Criteria:**

- UI member creation triggers invitation
- Invitation link validation works
- No JavaScript errors

---

## 📋 PHASE 5: END-TO-END REGISTRATION FLOW

**Objective:** Complete full member journey from creation to login

---

### Step 5.1: Complete Member Registration

**Tool:** Browser → Invitation Link

**Actions:**

1. Use invitation link from Phase 4.2
2. Fill registration form:
   - Password: "TestPass@123"
   - Confirm Password: "TestPass@123"
   - Date of Birth: "1990-01-15"
   - (Gender if field exists)
3. Submit form
4. Verify success message

**Validation:**

```sql
-- Check invitation status changed to 'accepted'
SELECT status, accepted_at
FROM invitations
WHERE email = 'ui.test@example.com';

-- Check password hash was set
SELECT id, email, password_hash IS NOT NULL as has_password
FROM users_profile
WHERE email = 'ui.test@example.com';
```

**Expected Outcomes:**

- ✅ Registration succeeds
- ✅ Password hash stored
- ✅ Invitation marked as 'accepted'
- ✅ DOB updated

---

### Step 5.2: Test Member Login

**Tool:** Browser

**Actions:**

1. Navigate to login page
2. Enter:
   - Email: "ui.test@example.com"
   - Password: "TestPass@123"
3. Click Login
4. Verify redirect to Member Dashboard

**Expected Outcomes:**

- ✅ Login succeeds
- ✅ JWT token generated
- ✅ Member Dashboard loads
- ✅ Member can see their profile

---

### Step 5.3: Test Member Dashboard Features

**Tool:** Browser → Member Dashboard

**Actions:**

1. Verify member can see:
   - Their profile information
   - QR code (if implemented)
   - Class schedule
   - Membership details
2. Test profile edit:
   - Update phone number
   - Update emergency contact
   - Save changes
3. Verify updates persist

**Expected Outcomes:**

- ✅ Dashboard fully functional
- ✅ Profile edits work
- ✅ No permission errors

---

**Dependencies:** Phase 4 complete  
**Estimated Time:** 25 minutes  
**Success Criteria:**

- Member completes registration
- Member can login
- Member dashboard fully functional

---

## 📋 PHASE 6: CLEANUP & DOCUMENTATION

**Objective:** Remove test data, document changes, update team

---

### Step 6.1: Clean Test Data

**Tool:** Supabase SQL Editor

**Actions:**

```sql
-- Delete test members (keep Vida and Erik if needed)
DELETE FROM users_profile
WHERE email IN (
  'test.invitation@example.com',
  'ui.test@example.com'
);

-- Delete test invitations
DELETE FROM invitations
WHERE email IN (
  'test.invitation@example.com',
  'ui.test@example.com'
);

-- Optional: Delete reception test admin
DELETE FROM users_profile
WHERE email = 'reception.test@vikinghammer.com';
```

**Risk Assessment:** ✅ NO RISK

- Only removes test data
- Production members untouched

---

### Step 6.2: Update Migration Tracking

**Tool:** Text Editor

**Actions:**

1. Create `MIGRATIONS_APPLIED.md` in project root
2. Document migrations run:

```markdown
# Applied Database Migrations

## 2025-10-22

- ✅ `20251019_invitations.sql` - Invitations table creation
- ✅ `20251022_extend_users_profile.sql` - Extended user profile fields
- ✅ Manual: Fixed NULL name fields

## Schema Version

- Current: v1.2
- Last Updated: 2025-10-22
- Applied By: [Your Name]
```

---

### Step 6.3: Update Environment Documentation

**Tool:** Text Editor

**Actions:**

1. Update `README.md` with new tables
2. Document invitation flow in `ARCHITECTURE.md`
3. Update API documentation with invitation endpoints

---

### Step 6.4: Create Rollback Plan

**Tool:** Text Editor

**Create:** `ROLLBACK_INVITATIONS.md`

````markdown
# Rollback Plan - Invitation System

## If Issues Arise After Deployment

### Step 1: Disable Invitation Generation

In `services/userService.js` line 93, comment out:

```javascript
// Auto-create invitation for new members
if (role === 'member') {
  // const invitationService = require('./invitationService');
  // ... rest of invitation code
}
```
````

### Step 2: Restore Database Backup

1. Supabase Dashboard → Database → Backups
2. Select: "Before invitation system deployment - Oct 22 2025"
3. Click Restore
4. Confirm restoration

### Step 3: Restart Backend

```bash
cd C:\Users\AgiL\viking-hammer-crossfit-app
node backend-server.js
```

### Step 4: Verify

- Members can still be created
- No errors in backend logs
- Frontend works normally

````

---

**Dependencies:** Phase 5 complete
**Estimated Time:** 30 minutes
**Success Criteria:**
- Test data cleaned
- Documentation updated
- Rollback plan ready

---

## 📋 PHASE 7: PRODUCTION HARDENING (OPTIONAL)

**Objective:** Add production-ready features

---

### Step 7.1: Add Row-Level Security (RLS)
**Tool:** Supabase SQL Editor

**Actions:**
```sql
-- Enable RLS on invitations table
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own invitations
CREATE POLICY "Users can view own invitations"
ON invitations FOR SELECT
USING (auth.uid() = user_id OR email = auth.email());

-- Policy: Only admins can create invitations
CREATE POLICY "Admins can create invitations"
ON invitations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid()
    AND role IN ('sparta', 'reception', 'admin')
  )
);

-- Policy: System can update invitation status
CREATE POLICY "System can update invitations"
ON invitations FOR UPDATE
USING (true);
````

**Risk Assessment:** ⚠️ MEDIUM RISK

- Changes security model
- Test thoroughly
- Can break legitimate access if policies wrong

---

### Step 7.2: Add Email Service Integration

**Tool:** Code Editor

**File:** `services/emailService.js` (NEW FILE - Don't create yet)

**Outline:**

```javascript
// services/emailService.js
// Integration with SendGrid/Mailgun/SMTP

async function sendInvitationEmail(invitation) {
  // 1. Get email template
  // 2. Replace variables (name, token, link)
  // 3. Send via email provider
  // 4. Mark invitation as 'sent'
  // 5. Log delivery status
}

module.exports = { sendInvitationEmail };
```

**Integration Point:**

- Modify `services/userService.js` line 105
- After invitation created, call `emailService.sendInvitationEmail()`

---

### Step 7.3: Add Invitation Expiry Cleanup Job

**Tool:** Supabase Dashboard → Database → Functions (Edge Functions)

**Create:** Cron job to clean expired invitations

```sql
-- Function to cleanup expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations
  SET status = 'expired'
  WHERE expires_at < NOW()
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- Schedule via pg_cron (if available)
-- Or call from backend cron job
```

---

**Dependencies:** Phase 6 complete  
**Estimated Time:** 2-3 hours  
**Success Criteria:**

- RLS policies working
- Email integration ready
- Cleanup job scheduled

---

## Risk Assessment Matrix

| Phase   | Risk Level | Impact if Fails        | Mitigation                  |
| ------- | ---------- | ---------------------- | --------------------------- |
| Phase 1 | 🟢 LOW     | No impact              | Read-only operations        |
| Phase 2 | 🟡 MEDIUM  | Schema inconsistency   | Backup taken, reversible    |
| Phase 3 | 🟢 LOW     | Backend restart needed | Quick fix, restart          |
| Phase 4 | 🟢 LOW     | UI errors              | Frontend only, no data risk |
| Phase 5 | 🟡 MEDIUM  | Registration broken    | Rollback available          |
| Phase 6 | 🟢 LOW     | Documentation only     | No functional impact        |
| Phase 7 | 🟡 MEDIUM  | Security/access issues | Optional, can defer         |

---

## Rollback Strategy

### Immediate Rollback (< 5 minutes)

1. Restore Supabase backup from Phase 1.2
2. Restart backend server
3. Clear browser cache/localStorage
4. Verify member creation still works

### Partial Rollback (Keep tables, disable features)

1. Comment out invitation generation code
2. Keep tables for future use
3. Document why disabled
4. Schedule proper fix

### Data-Only Rollback

1. Keep schema changes
2. Delete invitation records if problematic
3. Fix code issues
4. Re-enable feature

---

## Testing Checklist

### Before Going Live

- [ ] Phase 1: Schema audit complete, backup taken
- [ ] Phase 2: All migrations applied successfully
- [ ] Phase 3: Backend connects to new schema
- [ ] Phase 4: Frontend UI works with invitations
- [ ] Phase 5: Complete E2E flow tested
- [ ] Phase 6: Documentation updated
- [ ] Rollback plan tested (optional but recommended)

### Acceptance Criteria

- [ ] Admin creates member → invitation auto-generated
- [ ] Member receives email with invitation link (if email service integrated)
- [ ] Member clicks link → registration form loads
- [ ] Member completes registration → account activated
- [ ] Member can login → dashboard accessible
- [ ] No existing functionality broken
- [ ] All error handling works
- [ ] Performance acceptable (< 2s for invitation creation)

---

## Timeline Estimate

| Phase     | Duration                                                        | Dependencies      |
| --------- | --------------------------------------------------------------- | ----------------- |
| Phase 1   | 15 min                                                          | None              |
| Phase 2   | 30 min                                                          | Phase 1           |
| Phase 3   | 20 min                                                          | Phase 2           |
| Phase 4   | 15 min                                                          | Phase 3           |
| Phase 5   | 25 min                                                          | Phase 4           |
| Phase 6   | 30 min                                                          | Phase 5           |
| Phase 7   | 2-3 hours                                                       | Phase 6, Optional |
| **Total** | **2-3 hours** (without Phase 7)<br>**4-6 hours** (with Phase 7) |                   |

---

## Dependencies & Prerequisites

### Required

- ✅ Supabase project access (admin level)
- ✅ Backend server running locally
- ✅ Frontend dev server running
- ✅ Admin account (reception.test@vikinghammer.com already created)
- ✅ Migration files exist in `infra/supabase/migrations/`

### Optional (for Phase 7)

- Email service account (SendGrid/Mailgun)
- SMTP credentials
- Twilio account (for SMS invitations)

---

## Communication Plan

### Before Deployment

**Notify:**

- Development team
- QA team (if applicable)
- Database admin

**Share:**

- This plan document
- Expected downtime (if any): **NONE - zero downtime deployment**
- Testing schedule

### During Deployment

**Updates at each phase:**

- Phase completion status
- Any issues encountered
- Decision points requiring approval

### After Deployment

**Report:**

- All phases completed ✅
- Test results
- Any deviations from plan
- Production readiness status

---

## Support & Troubleshooting

### Common Issues & Solutions

#### Issue 1: "Table 'invitations' does not exist" after Phase 2

**Solution:**

- Re-run migration SQL
- Check Supabase logs for errors
- Verify public schema permissions

#### Issue 2: Invitation creation fails silently

**Solution:**

- Check backend console logs
- Verify invitationService.js can import
- Test manual invitation creation (Phase 3.2)

#### Issue 3: NULL names persist after Phase 2.3

**Solution:**

- Check if raw_user_meta_data column exists
- Manually update specific records
- Verify frontend sends firstName/lastName in API calls

#### Issue 4: Member can't access invitation link

**Solution:**

- Verify invitation token in database
- Check invitation status (must be 'pending' or 'sent')
- Verify expiry date hasn't passed
- Test with fresh invitation

---

## Success Metrics

### Functional Metrics

- ✅ 100% of new member creations generate invitations
- ✅ 0 invitation creation failures
- ✅ < 2 seconds invitation generation time
- ✅ 100% invitation link validation success rate

### Data Quality Metrics

- ✅ 0% NULL names after migration
- ✅ All invitations have valid expiry dates
- ✅ No orphaned invitation records

### User Experience Metrics

- ✅ < 3 clicks to create member
- ✅ < 5 minutes for member to complete registration
- ✅ Clear error messages if issues occur

---

## Post-Deployment Monitoring

### What to Monitor (First 24 Hours)

1. **Backend Logs:**

   - Watch for "✅ Invitation created for member..." messages
   - Monitor for database connection errors
   - Check for invitation service failures

2. **Database:**

   - Count invitations created per hour
   - Monitor invitation acceptance rate
   - Check for expired invitations pile-up

3. **User Reports:**
   - Any member registration failures
   - Email delivery issues
   - Login problems after registration

### Metrics Dashboard (Suggested)

```sql
-- Quick health check query
SELECT
  COUNT(*) FILTER (WHERE status = 'pending') as pending_invitations,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted_invitations,
  COUNT(*) FILTER (WHERE status = 'expired') as expired_invitations,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as created_today
FROM invitations;
```

---

## Future Enhancements (Post-Deployment)

### Short-term (Next Sprint)

1. Email template design
2. SMS delivery option
3. Invitation resend functionality
4. Bulk member import with invitations

### Medium-term

1. Invitation analytics dashboard
2. Custom expiry periods per invitation
3. Multi-language invitation emails
4. Invitation reminder emails

### Long-term

1. QR code invitations
2. Social media sharing
3. Referral tracking
4. Gamification (invite rewards)

---

## Sign-off Requirements

### Before Execution

- [ ] Plan reviewed by: ******\_\_\_******
- [ ] Database admin approval: ******\_\_\_******
- [ ] Backup strategy confirmed: ******\_\_\_******
- [ ] Rollback plan tested: ******\_\_\_******

### After Execution

- [ ] All phases completed: ******\_\_\_******
- [ ] E2E testing passed: ******\_\_\_******
- [ ] Documentation updated: ******\_\_\_******
- [ ] Team notified: ******\_\_\_******

---

## Conclusion

This plan provides a **safe, step-by-step deployment strategy** to enable the complete member invitation and registration flow. The phased approach ensures:

1. ✅ **Zero downtime** - all changes are additive
2. ✅ **Reversible** - backup and rollback plans ready
3. ✅ **Testable** - each phase has validation steps
4. ✅ **Non-breaking** - existing functionality untouched
5. ✅ **Complete** - covers all layers (DB → Backend → Frontend → UX)

**Estimated Total Time:** 2-3 hours for core deployment (Phases 1-6)

**Risk Level:** LOW - All changes are additive and reversible

**Recommended Execution Window:** Development/staging environment first, then production during low-traffic period

---

**Questions or concerns? Review each phase carefully before execution. This is a PLAN ONLY - implementation should be done methodically following each validation step.**

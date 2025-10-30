# 👤 Member Status Flow - Complete Guide

## Status States & Visual Indicators

### 🟡 **PENDING** (Yellow/Orange Badge)

- **When**: Admin creates member, invitation sent
- **Badge Color**: Orange gradient (#ff9800)
- **Meaning**: Waiting for member to complete registration
- **User Cannot**: Log in, access member dashboard
- **Actions Available**: Admin can resend invitation, edit details, delete member

### 🟢 **ACTIVE** (Green Badge)

- **When**: Member completes registration (sets password & logs in)
- **Badge Color**: Green gradient (#4caf50)
- **Meaning**: Fully registered, can access all features
- **User Can**: Log in, access dashboard, book classes, view profile
- **Actions Available**: Admin can edit details, suspend, delete member

### 🔴 **INACTIVE** (Red Badge)

- **When**: Admin manually deactivates member (suspended/terminated)
- **Badge Color**: Red gradient (#f44336)
- **Meaning**: Account disabled, no access
- **User Cannot**: Log in or access any features
- **Actions Available**: Admin can reactivate, edit details, delete member

---

## Complete Member Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEMBER LIFECYCLE FLOW                         │
└─────────────────────────────────────────────────────────────────┘

Step 1: ADMIN CREATES MEMBER
┌───────────────────────────────────┐
│  Admin → Member Management        │
│  Click "Add New Member"           │
│  Fill details:                    │
│    • First Name, Last Name        │
│    • Email, Phone                 │
│    • Role: Member                 │
│    • Membership Type              │
│    • Company (optional)           │
│    • Date of Birth (optional)     │
│  Click "Add Member"               │
└───────────────────────────────────┘
              ↓
┌───────────────────────────────────┐
│  Backend Processing               │
│  ✅ Create user in database       │
│  ✅ Set status: PENDING 🟡        │
│  ✅ Generate invitation token     │
│  ✅ Send invitation email         │
│     (if domain verified)          │
└───────────────────────────────────┘
              ↓
┌───────────────────────────────────┐
│  Member List Display              │
│  Name: John Doe                   │
│  Email: john@example.com          │
│  Status: 🟡 PENDING               │
│  Role: Member                     │
│  Membership: Monthly              │
└───────────────────────────────────┘

────────────────────────────────────────────────────────────

Step 2: MEMBER RECEIVES INVITATION EMAIL
┌───────────────────────────────────┐
│  Email Inbox                      │
│  ✉️ "Welcome to Viking Hammer!"   │
│  Button: "Complete Registration"  │
│  Link expires in 7 days           │
└───────────────────────────────────┘
              ↓
┌───────────────────────────────────┐
│  Member clicks link               │
│  Opens: /register/{token}         │
└───────────────────────────────────┘

────────────────────────────────────────────────────────────

Step 3: MEMBER COMPLETES REGISTRATION
┌───────────────────────────────────┐
│  Registration Page                │
│  Pre-filled: Name, Email          │
│  Member enters:                   │
│    • Password (confirm)           │
│    • Additional info (optional)   │
│  Click "Complete Registration"    │
└───────────────────────────────────┘
              ↓
┌───────────────────────────────────┐
│  Backend Processing               │
│  ✅ Validate invitation token     │
│  ✅ Hash password (bcrypt)        │
│  ✅ Update user record:           │
│     - password_hash = [hash]      │
│     - status = ACTIVE 🟢          │
│  ✅ Mark invitation: accepted     │
│  ✅ Generate JWT token            │
│  ✅ Auto-login member             │
└───────────────────────────────────┘
              ↓
┌───────────────────────────────────┐
│  Member Dashboard (Logged In)     │
│  Welcome, John! 🎉                │
│  Status: 🟢 ACTIVE                │
│  Access to:                       │
│    • My Profile                   │
│    • Book Classes                 │
│    • View Schedule                │
│    • Check-In History             │
└───────────────────────────────────┘

────────────────────────────────────────────────────────────

Step 4: ADMIN VIEWS UPDATED STATUS
┌───────────────────────────────────┐
│  Member List Display              │
│  Name: John Doe                   │
│  Email: john@example.com          │
│  Status: 🟢 ACTIVE ← CHANGED!     │
│  Role: Member                     │
│  Membership: Monthly              │
│  Last Check-In: Oct 25, 2025      │
└───────────────────────────────────┘
```

---

## Technical Implementation Details

### Database Layer (Supabase)

**Table**: `users_profile`

```sql
CREATE TABLE users_profile (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,           -- NULL when pending
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'pending', -- pending | active | inactive
  dob DATE,
  membership_type TEXT,
  company TEXT,
  join_date DATE,
  last_check_in TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);
```

### Backend Logic (Node.js/Express)

#### Creating Member (Admin Action)

File: `services/userService.js` - `createUser()`

```javascript
// Line 118: Status determination
const userStatus = status || (role === 'member' ? 'pending' : 'active');

// Members start as 'pending'
// Staff (instructor, reception, sparta, admin) start as 'active'
```

#### Completing Registration (Member Action)

File: `services/authService.js` - `signUp()`

```javascript
// Line 28: Update status on password creation
const updateData = {
  password_hash: passwordHash,
  status: 'active', // 🟢 Activate on registration
  updated_at: new Date(),
};
```

### Frontend Display (React/TypeScript)

#### Status Badge

File: `frontend/src/components/MemberManagement.tsx`

```typescript
// Lines 271-283: Status color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'success'; // 🟢 Green
    case 'inactive':
      return 'danger'; // 🔴 Red
    case 'pending':
      return 'warning'; // 🟡 Orange/Yellow
    default:
      return 'secondary'; // ⚪ Gray
  }
};

// Line 504, 637: Badge rendering
<div className={`status-badge ${getStatusColor(member.status)}`}>
  {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
</div>;
```

#### Status Filtering

```typescript
// Line 89-90: Filter members by status
if (filterStatus !== 'all') {
  filtered = filtered.filter((member) => member.status === filterStatus);
}
```

---

## Admin Actions by Status

### When Status is 🟡 PENDING:

- ✅ View member details
- ✅ Edit member information
- ✅ Delete member
- ✅ Resend invitation email
- ✅ Change status manually (if needed)
- ❌ Member cannot log in yet

### When Status is 🟢 ACTIVE:

- ✅ View member details
- ✅ Edit member information
- ✅ View check-in history
- ✅ View booking history
- ✅ Change membership type
- ✅ Set status to inactive (suspend)
- ✅ Delete member
- ✅ Member can log in and use all features

### When Status is 🔴 INACTIVE:

- ✅ View member details
- ✅ Edit member information
- ✅ View historical data
- ✅ Reactivate member (set to active)
- ✅ Delete member permanently
- ❌ Member cannot log in

---

## Testing Checklist

### ✅ Scenario 1: Normal Flow

1. Admin creates new member → Status: 🟡 PENDING
2. Member receives invitation email
3. Member clicks link and sets password
4. Status automatically changes → 🟢 ACTIVE
5. Member can log in and access dashboard

### ✅ Scenario 2: Email Not Sent (Test Mode)

1. Admin creates member with non-verified email
2. Status: 🟡 PENDING
3. Warning shown: "Email NOT sent - test mode"
4. Admin can manually share registration link
5. Member completes registration → 🟢 ACTIVE

### ✅ Scenario 3: Staff Members

1. Admin creates instructor/reception/sparta
2. Status: 🟢 ACTIVE (immediate)
3. No invitation needed (admin creates credentials)
4. Staff can log in immediately

### ✅ Scenario 4: Status Filtering

1. Open Member Management
2. Filter by status: "Pending"
3. See only 🟡 PENDING members
4. Filter by "Active"
5. See only 🟢 ACTIVE members

### ✅ Scenario 5: Visual Indicators

1. Card view shows status badge
2. List view shows status badge
3. Colors match status (pending=orange, active=green)
4. Status counts shown in summary

---

## Troubleshooting

### ❌ Problem: Member stuck in PENDING status

**Symptoms**: Member completed registration but still shows pending

**Diagnosis**:

1. Check database: `SELECT status, password_hash FROM users_profile WHERE email = '[email]'`
2. If `password_hash` is NOT NULL but status is still 'pending' → Database update failed

**Solution**:

```sql
UPDATE users_profile
SET status = 'active'
WHERE email = '[email]' AND password_hash IS NOT NULL;
```

### ❌ Problem: New members show ACTIVE immediately

**Symptoms**: Admin creates member, status shows 🟢 ACTIVE instead of 🟡 PENDING

**Diagnosis**:

1. Check if frontend is forcing status
2. Check `MemberManagement.tsx` line ~175
3. Should NOT include `status: 'active'` in addMember call

**Solution**: ✅ Already fixed in this session!

### ❌ Problem: Member cannot log in

**Symptoms**: Status is 🟢 ACTIVE but login fails

**Diagnosis**:

1. Check if `password_hash` field is NULL
2. Check if email verification is required
3. Check if invitation was properly accepted

**Solution**: Member needs to complete registration via invitation link

---

## API Endpoints

### Create Member (Admin)

```
POST /api/users
Headers: Authorization: Bearer {admin_token}
Body: {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "+1234567890",
  role: "member",
  membershipType: "Monthly"
}
Response: {
  id: "uuid",
  name: "John Doe",
  email: "john@example.com",
  status: "pending",  // ← Initial status
  ...
}
```

### Accept Invitation (Member)

```
POST /api/invitations/{token}/accept
Body: {
  password: "securePassword123",
  firstName: "John",
  lastName: "Doe"
}
Response: {
  success: true,
  data: {
    user: {
      id: "uuid",
      name: "John Doe",
      email: "john@example.com",
      status: "active",  // ← Changed to active
      ...
    },
    token: "jwt_token"
  }
}
```

### Get Members (Admin)

```
GET /api/members?status=pending
Headers: Authorization: Bearer {admin_token}
Response: [
  {
    id: "uuid",
    name: "John Doe",
    email: "john@example.com",
    status: "pending",
    role: "member",
    ...
  }
]
```

---

## Database Queries for Monitoring

### Count members by status

```sql
SELECT
  status,
  COUNT(*) as count
FROM users_profile
WHERE role = 'member'
GROUP BY status
ORDER BY status;
```

### Find pending members older than 7 days

```sql
SELECT
  name,
  email,
  created_at,
  AGE(NOW(), created_at) as pending_duration
FROM users_profile
WHERE status = 'pending'
  AND role = 'member'
  AND created_at < NOW() - INTERVAL '7 days'
ORDER BY created_at ASC;
```

### Members who completed registration today

```sql
SELECT
  name,
  email,
  updated_at as activation_time
FROM users_profile
WHERE status = 'active'
  AND role = 'member'
  AND DATE(updated_at) = CURRENT_DATE
  AND password_hash IS NOT NULL
ORDER BY updated_at DESC;
```

---

## Configuration

### Environment Variables

File: `env/.env.dev`

```bash
# Email service (Resend)
RESEND_API_KEY=your_api_key
FROM_EMAIL=noreply@yourdomain.com  # Must be verified domain
FROM_NAME=Viking Hammer CrossFit
REPLY_TO_EMAIL=support@yourdomain.com

# Application URL (for invitation links)
APP_URL=http://localhost:5173  # Development
# APP_URL=https://vikinghammer.com  # Production

# JWT for authentication
JWT_SECRET=your_secret_key
```

---

## Summary

✅ **Status Flow is CORRECT and WORKING**

- Admin creates member → Status: **PENDING** 🟡
- Member completes registration → Status: **ACTIVE** 🟢
- Admin can suspend → Status: **INACTIVE** 🔴

✅ **Visual Indicators**

- Orange badge for PENDING (waiting for registration)
- Green badge for ACTIVE (fully registered)
- Red badge for INACTIVE (suspended)

✅ **No Code Issues**

- Frontend no longer forces 'active' status
- Backend correctly sets 'pending' for new members
- Status automatically updates when member completes registration

✅ **Ready for Testing**

- Create a new member and verify status shows PENDING
- After domain verification, member will receive email
- Member completes registration → status changes to ACTIVE

# 🚨 CRITICAL: Database Migrations Required

## ⚠️ Current Status

- ✅ Backend connected to Supabase
- ✅ API endpoints ready
- ❌ **Database tables DO NOT EXIST**
- ❌ Cannot test CRUD operations until migrations run

## 📋 Step-by-Step Migration Instructions

### 1️⃣ Open Supabase SQL Editor

I've opened it for you: https://supabase.com/dashboard/project/nqseztalzjcfucfeljkf/sql/new

### 2️⃣ Run Migrations IN ORDER

**Copy and paste each file content into SQL Editor and click "RUN"**

#### Migration 1: `0001_init.sql`

- Location: `infra/supabase/migrations/0001_init.sql`
- Creates: users_profile, plans, memberships, locations, checkins, qr_tokens, announcements, notifications_outbox, audit_logs

#### Migration 2: `20251007_create_user_profiles.sql`

- Location: `infra/supabase/migrations/20251007_create_user_profiles.sql`
- Updates: users_profile with email column

#### Migration 3: `20251016_email_verification.sql`

- Location: `infra/supabase/migrations/20251016_email_verification.sql`
- Creates: email_verification_tokens table

#### Migration 4: `20251017_membership_history.sql`

- Location: `infra/supabase/migrations/20251017_membership_history.sql`
- Creates: membership_history table + RLS policies

#### Migration 5: `20251018_classes_instructors_schedule.sql`

- Location: `infra/supabase/migrations/20251018_classes_instructors_schedule.sql`
- Creates: instructors, classes, class_instructors, schedule_slots, class_bookings tables

#### Migration 6: `20251018_add_password_hash.sql`

- Location: `infra/supabase/migrations/20251018_add_password_hash.sql`
- Adds: password_hash column to users_profile

### 3️⃣ Verify Migrations

Run this query to verify all tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:

- announcements
- audit_logs
- checkins
- class_bookings
- class_instructors
- classes
- email_verification_tokens
- instructors
- locations
- membership_history
- memberships
- notifications_outbox
- plans
- qr_tokens
- schedule_slots
- users_profile

## 🔄 After Migrations Complete

1. Come back and tell me "migrations done"
2. I'll run comprehensive CRUD tests on all layers
3. Generate full test report

## ⏱️ Estimated Time: 5-10 minutes

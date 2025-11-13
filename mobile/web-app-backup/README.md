# 🔒 WEB APP BACKUP - READ ONLY

## ⚠️ DO NOT MODIFY THIS FOLDER

This is a **frozen snapshot** of the web application frontend code for **reference only** during mobile app development.

### Purpose
- Reference for converting React web components to React Native mobile components
- Preserve working web app state before mobile development

### Created
- **Date:** November 12, 2025
- **Git Tag:** v1.0.0-preproduction
- **Git Commit:** 25ef84f
- **Branch:** feature/multilingual-support

### What's Included
- ✅ Complete `frontend/` directory (React + Vite web app)
- ✅ All React components (TypeScript)
- ✅ All services (API calls, Supabase client)
- ✅ i18n translations (EN/AZ/RU)
- ✅ CSS styles

### What's NOT Included
- ❌ Backend code (stays in root - shared with mobile)
- ❌ Database migrations (stays in infra/ - shared with mobile)
- ❌ Middleware (stays in middleware/ - shared with mobile)
- ❌ Services (stays in services/ - shared with mobile)

### Mobile App Development
- **Mobile code location:** `mobile/app/` (will be React Native)
- **Backend:** Uses existing `backend-server.js` (NO CHANGES ALLOWED)
- **Database:** Uses existing Supabase DB (NO CHANGES ALLOWED)
- **API:** Same REST endpoints as web app

---

## 🚫 CRITICAL RULES

### ❌ NEVER MODIFY:
1. Backend code (`backend-server.js`, `services/`, `middleware/`)
2. Database schema (`infra/supabase/migrations/`)
3. This backup folder

### ✅ SAFE TO MODIFY:
1. Mobile app code in `mobile/app/`
2. Web app code in `frontend/` (original)

---

## Backup Contents

```
mobile/web-app-backup/
└── frontend/
    ├── src/
    │   ├── components/        # All React components
    │   ├── contexts/          # DataContext, state management
    │   ├── services/          # API calls, Supabase service
    │   ├── i18n/              # Translation configuration
    │   ├── App.tsx            # Main app component
    │   └── main.tsx           # Entry point
    ├── public/
    │   ├── locales/           # Translation JSON files
    │   │   ├── en/
    │   │   ├── az/
    │   │   └── ru/
    │   └── assets/
    ├── package.json           # Dependencies
    └── vite.config.ts         # Build config
```

---

## Feature List (For Reference)

### Authentication
- JWT-based auth
- Role-based access (sparta/admin/reception/instructor/member)
- Password reset flow
- Email verification

### User Roles & Dashboards
- Member Dashboard (bookings, profile, classes)
- Sparta Dashboard (full admin control)
- Reception Dashboard (member management)
- Instructor Dashboard (class management)

### Core Features
- Multilingual (EN/AZ/RU with i18next)
- Profile photo upload
- Membership management
- Class booking system
- QR code check-in
- Schedule management
- Announcement system
- Activity logging

### Security
- Rate limiting (5 auth attempts/15min)
- CORS protection
- Password complexity enforcement
- JWT secret validation

---

## Notes for Mobile Conversion

### Component Mapping
- `<div>` → `<View>`
- `<span>`, `<p>`, `<h1>` → `<Text>`
- `<button>` → `<TouchableOpacity>` or `<Button>`
- `<input>` → `<TextInput>`
- `<img>` → `<Image>`
- CSS → StyleSheet

### Keep Same Structure
- Same API calls (just use fetch/axios)
- Same data models
- Same authentication flow
- Same i18n translations

### Use Same Backend
- API Base URL: `http://localhost:4001` (dev)
- All endpoints unchanged
- Same JWT token format
- Same response structures

---

**Last Updated:** November 12, 2025  
**Status:** 🔒 FROZEN - Read Only

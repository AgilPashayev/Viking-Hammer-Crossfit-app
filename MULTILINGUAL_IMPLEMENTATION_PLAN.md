# Multilingual Support Implementation Plan

## Overview
Implement full multilingual support for English (en), Azerbaijani (az), and Russian (ru) across the entire Viking Hammer CrossFit application.

## Phase 1: Frontend Setup (Priority: HIGH)

### 1.1 Install Dependencies
```bash
cd frontend
npm install i18next react-i18next i18next-browser-languagedetector i18next-http-backend
```

### 1.2 Create Translation Files Structure
```
frontend/public/locales/
├── en/
│   └── translation.json
├── az/
│   └── translation.json
└── ru/
    └── translation.json
```

### 1.3 Configure i18next
- Create `frontend/src/i18n/config.ts`
- Set up language detection
- Configure fallback chain: az → ru → en
- Enable local storage persistence

### 1.4 Language Switcher Component
- Create `frontend/src/components/LanguageSwitcher.tsx`
- Add to Settings/Profile page
- Support flags/icons for visual identification

## Phase 2: Database Schema Changes (Priority: HIGH)

### 2.1 Add User Language Preference
```sql
ALTER TABLE users_profile 
ADD COLUMN preferred_language VARCHAR(5) DEFAULT 'en';
```

### 2.2 Add Multilingual Columns to Content Tables

#### Announcements
```sql
ALTER TABLE announcements 
ADD COLUMN title_en TEXT,
ADD COLUMN title_az TEXT,
ADD COLUMN title_ru TEXT,
ADD COLUMN content_en TEXT,
ADD COLUMN content_az TEXT,
ADD COLUMN content_ru TEXT;
```

#### Classes
```sql
ALTER TABLE classes
ADD COLUMN name_en VARCHAR(255),
ADD COLUMN name_az VARCHAR(255),
ADD COLUMN name_ru VARCHAR(255),
ADD COLUMN description_en TEXT,
ADD COLUMN description_az TEXT,
ADD COLUMN description_ru TEXT;
```

#### Membership Plans
```sql
ALTER TABLE plans
ADD COLUMN name_en VARCHAR(255),
ADD COLUMN name_az VARCHAR(255),
ADD COLUMN name_ru VARCHAR(255),
ADD COLUMN description_en TEXT,
ADD COLUMN description_az TEXT,
ADD COLUMN description_ru TEXT;
```

### 2.3 Migration Strategy
- Keep existing columns (title, content, name, description) as fallback
- Gradually populate multilingual columns
- Create helper function to get text by language

## Phase 3: Backend API Updates (Priority: HIGH)

### 3.1 Language Detection Middleware
- Create `middleware/languageMiddleware.js`
- Read `x-user-lang` header or user profile
- Attach to req.language

### 3.2 Update Service Layer
- Modify response formatters to return language-specific fields
- Helper function: `getLocalizedField(obj, field, lang)`

### 3.3 Update Endpoints
- `/api/announcements/*` - return localized title/content
- `/api/classes/*` - return localized name/description
- `/api/plans/*` - return localized name/description
- `/api/users/me` - include preferred_language

## Phase 4: Translation Content (Priority: MEDIUM)

### 4.1 UI Elements Translation Keys
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "close": "Close",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "classes": "Classes",
    "profile": "Profile",
    "settings": "Settings",
    "logout": "Logout"
  },
  "auth": {
    "login": "Login",
    "email": "Email",
    "password": "Password",
    "forgotPassword": "Forgot Password?",
    "signUp": "Sign Up"
  },
  "dashboard": {
    "welcome": "Welcome",
    "upcomingClasses": "Upcoming Classes",
    "myBookings": "My Bookings",
    "announcements": "Announcements"
  },
  "classes": {
    "book": "Book",
    "booked": "Booked",
    "full": "Full",
    "available": "Available Spots",
    "instructor": "Instructor",
    "time": "Time",
    "date": "Date"
  },
  "profile": {
    "myProfile": "My Profile",
    "personalInfo": "Personal Information",
    "subscription": "My Subscription",
    "settings": "Settings"
  }
}
```

### 4.2 Azerbaijani Translations (az)
- Use Latin script with special characters: Ə, Ş, Ç, Ü, İ, ı
- Cultural considerations for formal/informal address

### 4.3 Russian Translations (ru)
- Cyrillic script
- Formal address forms

## Phase 5: Localization Features (Priority: MEDIUM)

### 5.1 Date Formatting
```typescript
const formatDate = (date: Date, locale: string) => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Baku'
  }).format(date);
};
```

### 5.2 Currency Formatting
```typescript
const formatCurrency = (amount: number, locale: string) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'AZN',
    minimumFractionDigits: 0
  }).format(amount);
};
```

### 5.3 Number Formatting
```typescript
const formatNumber = (num: number, locale: string) => {
  return new Intl.NumberFormat(locale).format(num);
};
```

## Phase 6: Font Support (Priority: MEDIUM)

### 6.1 Font Requirements
- Latin characters (A-Z, a-z)
- Azerbaijani: Ə, Ğ, İ, Ö, Ş, Ü, Ç (and lowercase)
- Cyrillic: А-Я, а-я (Russian)

### 6.2 Recommended Fonts
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap');

body {
  font-family: 'Inter', 'Noto Sans', -apple-system, BlinkMacSystemFont, 
               'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 
               'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}
```

## Phase 7: Implementation Order

### Week 1: Foundation
1. ✅ Install i18next dependencies
2. ✅ Create translation file structure
3. ✅ Configure i18next in frontend
4. ✅ Create LanguageSwitcher component
5. ✅ Add to Settings page

### Week 2: Database & Backend
1. ✅ Run database migrations for user language preference
2. ✅ Create language middleware
3. ✅ Update API endpoints to support localization
4. ✅ Test language switching end-to-end

### Week 3: Content Translation
1. ✅ Translate all UI elements (en → az → ru)
2. ✅ Run database migrations for content tables
3. ✅ Create admin interface for multilingual content entry
4. ✅ Populate initial translations

### Week 4: Localization & Testing
1. ✅ Implement date/currency formatting
2. ✅ Test font rendering for all languages
3. ✅ User acceptance testing
4. ✅ Fix bugs and polish

## Phase 8: Database Migration Scripts

### 8.1 User Language Preference
```javascript
// add_user_language_column.js
const { supabase } = require('./supabaseClient');

async function addUserLanguageColumn() {
  const { error } = await supabase.rpc('execute_sql', {
    sql: `
      ALTER TABLE users_profile 
      ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'en';
      
      CREATE INDEX IF NOT EXISTS idx_users_language 
      ON users_profile(preferred_language);
    `
  });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ User language column added successfully');
  }
}

addUserLanguageColumn();
```

### 8.2 Announcements Multilingual
```javascript
// add_announcements_multilingual.js
const { supabase } = require('./supabaseClient');

async function addAnnouncementsMultilingual() {
  const { error } = await supabase.rpc('execute_sql', {
    sql: `
      ALTER TABLE announcements 
      ADD COLUMN IF NOT EXISTS title_en TEXT,
      ADD COLUMN IF NOT EXISTS title_az TEXT,
      ADD COLUMN IF NOT EXISTS title_ru TEXT,
      ADD COLUMN IF NOT EXISTS content_en TEXT,
      ADD COLUMN IF NOT EXISTS content_az TEXT,
      ADD COLUMN IF NOT EXISTS content_ru TEXT;
      
      -- Copy existing data to English columns
      UPDATE announcements 
      SET title_en = title, content_en = content 
      WHERE title_en IS NULL;
    `
  });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Announcements multilingual columns added');
  }
}

addAnnouncementsMultilingual();
```

## Phase 9: Testing Checklist

### 9.1 Functional Testing
- [ ] Language switches correctly in UI
- [ ] User preference saved in database
- [ ] Local storage persistence works
- [ ] Fallback chain works (az → ru → en)
- [ ] API returns correct language content
- [ ] Date formats correctly per locale
- [ ] Currency formats correctly (AZN)

### 9.2 Visual Testing
- [ ] All fonts render correctly
- [ ] Azerbaijani special characters display properly (Ə, Ş, Ç, Ü, İ)
- [ ] Cyrillic characters display properly
- [ ] No layout breaking with longer translations
- [ ] RTL not needed (all languages are LTR)

### 9.3 Performance Testing
- [ ] Translation loading is fast
- [ ] No flicker on language switch
- [ ] Bundle size acceptable with all translations

## Phase 10: Documentation

### 10.1 Developer Guide
- How to add new translation keys
- How to add multilingual database fields
- How to use translation hooks in components

### 10.2 Content Manager Guide
- How to add/edit multilingual content
- Translation workflow
- Quality assurance process

## Notes

### Language Codes
- `en` - English (primary fallback)
- `az` - Azerbaijani (Latin script)
- `ru` - Russian (Cyrillic script)

### Priority Fields for Translation
1. **High Priority**: UI elements, navigation, buttons, errors
2. **Medium Priority**: Announcements, class names, plan names
3. **Low Priority**: Historical data, user-generated content

### Fallback Strategy
```
User selects Azerbaijani:
1. Try az translation
2. If missing, try ru translation
3. If missing, use en translation
4. If still missing, show key name
```

## Estimated Timeline
- **Phase 1-2**: 2-3 days (Foundation & Database)
- **Phase 3**: 2-3 days (Backend API)
- **Phase 4**: 3-4 days (Translation Content)
- **Phase 5-6**: 2 days (Localization & Fonts)
- **Phase 7-9**: 3-4 days (Testing & Polish)

**Total**: ~2-3 weeks for complete implementation

## Success Criteria
✅ Users can switch between 3 languages seamlessly
✅ All UI text is translated
✅ Database content supports multiple languages
✅ Dates and currency format correctly
✅ Fonts render all special characters
✅ Performance is not impacted
✅ Fallback system works reliably

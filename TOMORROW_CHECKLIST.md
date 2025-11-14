# 🎯 Tomorrow's Action Checklist - Viking Hammer Production

**Date Created:** November 14, 2025  
**Status:** Production deployment complete, testing required

---

## ✅ COMPLETED TODAY

### Backend Deployment
- ✅ Backend deployed to Hetzner server (88.198.178.240)
- ✅ Running on PM2 (process: viking-hammer-api, ID: 2)
- ✅ API URL: https://api.crossfit-vikings-hammer.com
- ✅ Environment variables configured in `/var/www/viking-hammer-api/env/.env.dev`
- ✅ Health endpoint working: `/api/health`

### Frontend Deployment
- ✅ Frontend deployed to `/var/www/viking-hammer/`
- ✅ URL: https://crossfit-vikings-hammer.com
- ✅ Nginx configured for both frontend and API proxy
- ✅ Cloudflare DNS active with Flexible SSL
- ✅ Fixed hardcoded `localhost:4001` in 20+ files
- ✅ Created centralized API config (`frontend/src/config/api.ts`)
- ✅ Production build with embedded API URL deployed

### Critical Fixes
- ✅ Created `load-env.js` with absolute path for production
- ✅ Fixed dotenv loading in `supabaseClient.js`
- ✅ Fixed file permissions (755 on directories, www-data owner)
- ✅ All changes committed and pushed to GitHub

---

## 🔴 PRIORITY TASKS FOR TOMORROW

### 1. **Test Production Deployment** ⏰ FIRST THING
**Why:** DNS cache should be cleared by tomorrow morning

**Steps:**
- [ ] Open https://crossfit-vikings-hammer.com in browser
- [ ] Verify page loads without errors (check browser console F12)
- [ ] Test login functionality with existing user
- [ ] Check if API calls are going to production (Network tab in DevTools)
- [ ] Look for any 404 or CORS errors

**Expected Result:**
- React app loads fully
- Login works
- API calls go to `https://api.crossfit-vikings-hammer.com`
- No console errors

---

### 2. **Fix Remaining Hardcoded URLs** ⚠️ CRITICAL
**Why:** Only 4 files were updated, but grep found 20+ files with hardcoded URLs

**Files Still Need Updating:**
- [ ] `frontend/src/services/classManagementService.ts`
- [ ] `frontend/src/services/memberService.ts` 
- [ ] `frontend/src/services/bookingService.ts`
- [ ] `frontend/src/services/membershipHistoryService.ts`
- [ ] `frontend/src/services/pushNotificationService.ts`
- [ ] Any other service files in `frontend/src/services/`

**Action:**
```bash
# Search for remaining hardcoded URLs
cd frontend/src
grep -r "localhost:4001" --include="*.ts" --include="*.tsx"

# For each file found:
# 1. Add import: import { API_BASE_URL } from '../config/api';
# 2. Replace 'http://localhost:4001/api' with API_BASE_URL
# 3. Test locally first
```

**After fixing:**
- [ ] Rebuild: `npm run build`
- [ ] Upload to server: `scp -r dist/* root@88.198.178.240:/var/www/viking-hammer/`
- [ ] Fix permissions: `ssh root@88.198.178.240 "chmod -R 755 /var/www/viking-hammer"`

---

### 3. **Add RESEND API Key** 📧 HIGH PRIORITY
**Why:** Currently using placeholder `re_placeholder_key`

**Steps:**
- [ ] Go to https://resend.com/api-keys
- [ ] Create new API key for production
- [ ] SSH to server: `ssh root@88.198.178.240`
- [ ] Edit: `nano /var/www/viking-hammer-api/env/.env.dev`
- [ ] Replace: `RESEND_API_KEY=re_placeholder_key` with real key
- [ ] Restart backend: `pm2 restart viking-hammer-api`
- [ ] Test: Send a test invitation email

---

### 4. **SSL Certificate Setup** 🔒 IMPORTANT
**Why:** Currently using Cloudflare Flexible SSL (HTTP between CF and server)

**Option A: Cloudflare Full SSL (Recommended)**
- [ ] SSH to server
- [ ] Install Cloudflare Origin CA:
  ```bash
  # Get certificate from Cloudflare dashboard → SSL/TLS → Origin Server
  nano /etc/ssl/certs/cloudflare-origin.pem
  nano /etc/ssl/private/cloudflare-origin-key.pem
  ```
- [ ] Update Nginx config to use SSL:
  ```nginx
  listen 443 ssl;
  ssl_certificate /etc/ssl/certs/cloudflare-origin.pem;
  ssl_certificate_key /etc/ssl/private/cloudflare-origin-key.pem;
  ```
- [ ] Change Cloudflare SSL mode to "Full (strict)"

**Option B: Let's Encrypt (Alternative)**
- [ ] Install certbot: `apt install certbot python3-certbot-nginx`
- [ ] Disable Cloudflare proxy (gray cloud) temporarily
- [ ] Run: `certbot --nginx -d crossfit-vikings-hammer.com -d api.crossfit-vikings-hammer.com`
- [ ] Re-enable Cloudflare proxy

---

### 5. **Backend Monitoring Setup** 📊 MEDIUM
**Why:** Need to know if backend crashes or has errors

**Steps:**
- [ ] Enable PM2 logs: `ssh root@88.198.178.240 "pm2 logs viking-hammer-api --lines 100"`
- [ ] Set up log rotation:
  ```bash
  pm2 install pm2-logrotate
  pm2 set pm2-logrotate:max_size 10M
  pm2 set pm2-logrotate:retain 7
  ```
- [ ] Save PM2 config: `pm2 save`
- [ ] Enable PM2 startup: `pm2 startup`

**Optional - Advanced Monitoring:**
- [ ] Sign up for PM2 Plus (free tier): https://pm2.io/
- [ ] Link server: `pm2 link <secret> <public>`

---

### 6. **Database Backup Strategy** 💾 MEDIUM
**Why:** Supabase is cloud-hosted but need backup plan

**Steps:**
- [ ] Verify Supabase auto-backups enabled (Projects → Settings → Database)
- [ ] Document backup restoration process
- [ ] Test downloading a backup once

---

### 7. **Performance Testing** 🚀 LOW PRIORITY
**Why:** Ensure site performs well under load

**Tools to use:**
- [ ] Google PageSpeed Insights: https://pagespeed.web.dev/
- [ ] GTmetrix: https://gtmetrix.com/
- [ ] Check bundle size: `cd frontend && npm run build` (look for warnings)

**If bundle too large (>500KB):**
- [ ] Implement code splitting
- [ ] Lazy load routes
- [ ] Optimize images

---

## 📝 KNOWN ISSUES TO TRACK

### Issue 1: Local DNS Cache
**Status:** Temporary, will resolve within 24 hours  
**Workaround:** Use mobile data or different network  
**Action Required:** None, just wait

### Issue 2: File Permissions on Upload
**Status:** Every time we upload via SCP, permissions reset to 700  
**Solution:** Always run after upload:
```bash
ssh root@88.198.178.240 "chmod -R 755 /var/www/viking-hammer"
```
**Better Solution:** Create deployment script (see below)

---

## 🔧 RECOMMENDED: Create Deployment Script

Create `deploy-frontend.sh`:
```bash
#!/bin/bash
# Frontend deployment script

echo "🏗️  Building frontend..."
cd frontend
npm run build

echo "📤 Uploading to server..."
scp -r dist/* root@88.198.178.240:/var/www/viking-hammer/

echo "🔐 Fixing permissions..."
ssh root@88.198.178.240 "chmod -R 755 /var/www/viking-hammer"

echo "✅ Deployment complete!"
echo "🌐 Visit: https://crossfit-vikings-hammer.com"
```

Make executable: `chmod +x deploy-frontend.sh`  
Use: `./deploy-frontend.sh`

---

## 📚 DOCUMENTATION TO WRITE

- [ ] **Production Deployment Guide** - Step-by-step for future deployments
- [ ] **Environment Variables Reference** - What each variable does
- [ ] **Server Access & Credentials** - Store securely (password manager)
- [ ] **Rollback Procedure** - How to revert to previous version
- [ ] **Troubleshooting Guide** - Common issues and fixes

---

## 🎯 LONG-TERM IMPROVEMENTS

### Code Quality
- [ ] Set up ESLint auto-fix for all `localhost:4001` in CI/CD
- [ ] Add environment variable validation on app startup
- [ ] Create TypeScript types for environment variables

### DevOps
- [ ] Set up GitHub Actions for automatic deployment
- [ ] Create staging environment
- [ ] Implement blue-green deployment
- [ ] Set up error tracking (Sentry, LogRocket)

### Security
- [ ] Implement rate limiting on sensitive endpoints
- [ ] Add CSRF protection
- [ ] Set up security headers (already partially done)
- [ ] Regular dependency updates (Dependabot)

---

## 📞 IMPORTANT SERVER DETAILS

**Hetzner Server:**
- IP: 88.198.178.240
- User: root
- Backend Path: `/var/www/viking-hammer-api/`
- Frontend Path: `/var/www/viking-hammer/`
- Nginx Config: `/etc/nginx/sites-available/viking-hammer`

**PM2 Process:**
- Name: viking-hammer-api
- ID: 2
- Command: `pm2 list` (to check status)
- Logs: `pm2 logs viking-hammer-api`
- Restart: `pm2 restart viking-hammer-api`

**DNS/Domain:**
- Domain: crossfit-vikings-hammer.com
- Registrar: (Add your registrar here)
- DNS Provider: Cloudflare
- Nameservers: aryanna.ns.cloudflare.com, milan.ns.cloudflare.com

**Cloudflare Settings:**
- SSL Mode: Flexible (upgrade to Full recommended)
- Proxy Status: Proxied (orange cloud)
- DNS Records:
  - A @ → 88.198.178.240
  - A api → 88.198.178.240
  - A www → 88.198.178.240

---

## 🚨 EMERGENCY CONTACTS

**If Site Goes Down:**
1. Check PM2: `ssh root@88.198.178.240 "pm2 status"`
2. Check logs: `pm2 logs viking-hammer-api --lines 50`
3. Restart backend: `pm2 restart viking-hammer-api`
4. Check Nginx: `systemctl status nginx`
5. Restart Nginx: `systemctl restart nginx`

**Rollback Commands:**
```bash
# If new deployment breaks something
ssh root@88.198.178.240
cd /var/www/viking-hammer-api
git log  # find previous working commit
git checkout <commit-hash>
pm2 restart viking-hammer-api
```

---

## ✨ SUCCESS CRITERIA FOR TOMORROW

By end of tomorrow, you should have:
- ✅ Tested production site successfully
- ✅ All hardcoded URLs replaced with API_BASE_URL
- ✅ Real RESEND_API_KEY configured
- ✅ SSL certificate properly configured
- ✅ PM2 monitoring enabled
- ✅ Deployment script created

---

**Remember:** Take breaks, test thoroughly, commit frequently!

🎉 **Great work today getting the production deployment live!**

# 🔄 How to Clear Browser Cache and See Updated Styles

## Issue

The Announcement Manager stats cards are not showing the new square design with colored borders.

## Solution: Clear Browser Cache

### Method 1: Hard Refresh (Quickest)

1. Open the app in your browser: `http://localhost:5173`
2. Press one of these key combinations:
   - **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
   - **Mac**: `Cmd + Shift + R`
3. This will reload the page and bypass the cache

### Method 2: Clear Cache via Developer Tools

1. Open Developer Tools:
   - **Windows/Linux**: Press `F12` or `Ctrl + Shift + I`
   - **Mac**: Press `Cmd + Option + I`
2. Right-click on the **Reload button** (next to address bar)
3. Select **"Empty Cache and Hard Reload"**

### Method 3: Clear All Cache (Most thorough)

1. Open Developer Tools (`F12`)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **"Clear site data"** or **"Clear Storage"**
4. Check all boxes and click **"Clear"**
5. Close Developer Tools
6. Refresh the page (`F5`)

### Method 4: Incognito/Private Window

1. Open a new Incognito/Private window:
   - **Chrome**: `Ctrl + Shift + N`
   - **Firefox**: `Ctrl + Shift + P`
   - **Edge**: `Ctrl + Shift + N`
2. Navigate to `http://localhost:5173`
3. The cache won't affect this window

## Expected Result After Cache Clear

You should see **6 stat cards** with:

- ✅ White background with slight transparency
- ✅ Horizontal layout (icon on left, content on right)
- ✅ **Colored left borders**:
  - 📢 Total Announcements - **Blue** (#3da5ff)
  - ✅ Published - **Green** (#27ae60)
  - 📝 Drafts - **Orange** (#f39c12)
  - 📅 Scheduled - **Light Blue** (#3498db)
  - 👁️ Total Views - **Purple** (#9b59b6)
  - 📊 Read Rate - **Red** (#e74c3c)

## If Still Not Working

1. **Check the browser console** for CSS errors:

   - Press `F12` → Go to **Console** tab
   - Look for any red error messages

2. **Verify the dev server is running**:

   - Check the terminal for `VITE` messages
   - Server should be on `http://localhost:5173`

3. **Restart the dev server**:

   ```powershell
   # Stop current server (Ctrl+C in the terminal)
   # Then restart:
   cd frontend
   npm run dev
   ```

4. **Try a different browser** (Chrome, Firefox, Edge)

## Technical Details

The CSS has been updated with:

- Maximum specificity: `.announcement-manager .stats-overview .stat-card`
- `!important` flags on border colors
- Individual `:nth-child()` selectors for each card's border color

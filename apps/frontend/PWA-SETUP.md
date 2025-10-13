# PWA Setup Guide - Nocena Frontend

## 🔧 Fixed Issues

### Infinite Refresh Problem
The infinite refresh issue has been fixed by:
1. ✅ Setting `register: process.env.NODE_ENV === 'production'` - Service worker only registers in production
2. ✅ Removed duplicate `Feature-Policy` header (kept only `Permissions-Policy`)
3. ✅ Changed `sw: '/sw.js'` to use the correct path
4. ✅ Added `publicExcludes` to prevent caching of certain files
5. ✅ Set `skipWaiting: false` and `clientsClaim: false` to prevent aggressive takeover

### What Changed
- **next.config.ts**: Updated PWA configuration to only work in production
- **Service Worker**: Will only be active when you build and deploy, not during development
- **.gitignore**: Added service worker files to prevent committing generated files

## 🚀 How to Use

### Development Mode (No PWA)
```bash
pnpm dev
```
PWA is **disabled** in development to prevent conflicts with Hot Module Replacement (HMR).

### Production Mode (With PWA)
```bash
pnpm build
pnpm start
```
PWA features are **enabled** only in production builds.

## 🧹 Clearing Service Workers

If you still experience issues with cached service workers:

### Method 1: Use the Helper Page
1. Navigate to: `http://localhost:3000/unregister-sw.html`
2. Click "Do Everything (Recommended)"
3. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Method 2: Browser DevTools
1. Open DevTools (F12)
2. Go to **Application** tab → **Service Workers**
3. Click "Unregister" for all service workers
4. Go to **Storage** → Click "Clear site data"
5. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Method 3: Console Command
Open browser console and run:
```javascript
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
}).then(() => location.reload(true));
```

## 📱 PWA Features in Production

When you deploy to production, users will get:
- ✅ **Installable** on desktop and mobile devices
- ✅ **Offline support** after first visit
- ✅ **Fast loading** with intelligent caching
- ✅ **App-like experience** with standalone display mode
- ✅ **Push notifications** support (if implemented)
- ✅ **Background sync** capabilities

## 🔍 Cache Strategy

### Google Fonts
- Strategy: CacheFirst
- Max entries: 10
- Expires: 1 year

### Pinata Gateway (IPFS)
- Strategy: CacheFirst
- Max entries: 50
- Expires: 30 days

## 🛠️ Troubleshooting

### Issue: Infinite refresh on page reload
**Solution**: 
1. Clear .next cache: `cd apps/frontend && rm -rf .next` (or delete manually)
2. Use the unregister-sw.html helper page
3. Restart dev server: `pnpm dev`

### Issue: Service worker not updating
**Solution**: 
- Service workers are disabled in development
- In production, hard refresh to force update
- Or change version in manifest.json

### Issue: Chrome extension errors in console
**Solution**: 
- These are filtered out and won't affect functionality
- They only appear in development with DevTools open

## 📝 Configuration Files

- `next.config.ts` - PWA configuration with next-pwa
- `public/manifest.json` - PWA manifest (app name, icons, etc.)
- `public/sw-custom.js` - Custom service worker additions
- `unregister-sw.html` - Helper page for clearing service workers

## 🎯 Testing PWA

To test PWA features:
```bash
# Build production version
pnpm build

# Start production server
pnpm start

# Open Chrome DevTools → Lighthouse
# Run "Progressive Web App" audit
```

## 📚 Resources

- [next-pwa Documentation](https://github.com/shadowwalker/next-pwa)
- [PWA Best Practices](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)


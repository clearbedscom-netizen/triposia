# reCAPTCHA "Invalid key type" Error - Troubleshooting

## Error: "ERROR for site owner: Invalid key type"

This error occurs when the reCAPTCHA site key and secret key don't match or are from different reCAPTCHA sites.

## Common Causes

### 1. Site Key and Secret Key Don't Match
- **Problem**: The site key and secret key are from different reCAPTCHA sites
- **Solution**: Make sure both keys are from the **same** reCAPTCHA site in Google reCAPTCHA Admin Console

### 2. Wrong reCAPTCHA Version
- **Problem**: Created reCAPTCHA v3 keys but code uses v2 (or vice versa)
- **Solution**: This code uses **reCAPTCHA v2** ("I'm not a robot" checkbox)
  - Make sure you created **reCAPTCHA v2** keys
  - Not reCAPTCHA v3 (invisible/in-badge)

### 3. Keys from Different Projects
- **Problem**: Copied keys from different Google Cloud projects
- **Solution**: Use keys from the same reCAPTCHA site

## How to Fix

### Step 1: Verify Your Keys in Google reCAPTCHA Admin

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Find your reCAPTCHA site
3. Check the **reCAPTCHA type**: Should be **"reCAPTCHA v2"** → **"I'm not a robot" Checkbox**
4. Copy both keys from the **same** site:
   - Site Key (starts with `6L...`)
   - Secret Key (starts with `6L...`)

### Step 2: Verify Environment Variables

Make sure both keys are set correctly:

**Local (.env.local):**
```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Ld6YGEsAAAAAGPnSkpBxNjXeJAUyZxKR2JW7C8e
RECAPTCHA_SECRET_KEY=6Ld6YGEsAAAAAE-FRV-tOAMvfIvnLjWi_gR_IRSo
```

**Vercel:**
- Go to Settings → Environment Variables
- Verify both keys are set correctly
- Make sure they're from the **same** reCAPTCHA site

### Step 3: Check Domain Configuration

In Google reCAPTCHA Admin Console, make sure your domains are added:

**For Production:**
- `triposia.com`
- `www.triposia.com`

**For Local Development:**
- `localhost`

### Step 4: Verify reCAPTCHA Version

**This code requires reCAPTCHA v2:**
- Type: **reCAPTCHA v2**
- Subtype: **"I'm not a robot" Checkbox**

**NOT reCAPTCHA v3:**
- reCAPTCHA v3 is invisible and uses a different API
- This code won't work with v3 keys

## Quick Fix Checklist

- [ ] Both keys are from the **same** reCAPTCHA site
- [ ] Using **reCAPTCHA v2** (not v3)
- [ ] Site key starts with `NEXT_PUBLIC_` prefix in env vars
- [ ] Secret key does NOT have `NEXT_PUBLIC_` prefix
- [ ] Domain is added in reCAPTCHA admin console
- [ ] Restarted dev server after adding env vars
- [ ] Redeployed on Vercel after adding env vars

## Still Not Working?

1. **Create a new reCAPTCHA site:**
   - Go to [reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
   - Click "+ Create"
   - Select **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
   - Add your domains
   - Copy both keys from the **same** site

2. **Double-check the keys:**
   - Site key format: `6L...` (about 40 characters)
   - Secret key format: `6L...` (about 40 characters)
   - Both should start with `6L`

3. **Test locally first:**
   - Add keys to `.env.local`
   - Restart dev server: `npm run dev`
   - Test on `http://localhost:3000`
   - If it works locally, then add to Vercel

## Need to Disable reCAPTCHA?

If you want to temporarily disable reCAPTCHA:

1. Remove or don't set these environment variables:
   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   - `RECAPTCHA_SECRET_KEY`

2. The FAQ system will work without reCAPTCHA verification

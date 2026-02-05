# NextAuth JWT Session Decryption Error - Fix Guide

## Error: "decryption operation failed" or "JWT_SESSION_ERROR"

This error occurs when NextAuth cannot decrypt JWT session tokens. This happens when:

1. **NEXTAUTH_SECRET is missing** in environment variables
2. **NEXTAUTH_SECRET was changed** after users already have sessions
3. **Secret mismatch** between environments (dev vs production)

## Quick Fix

### Step 1: Generate a New NEXTAUTH_SECRET

Generate a secure secret using one of these methods:

**Using OpenSSL:**
```bash
openssl rand -base64 32
```

**Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Online Generator:**
Visit: https://generate-secret.vercel.app/32

### Step 2: Add to Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **triposia**
3. Go to **Settings** → **Environment Variables**
4. Add or update:
   - **Key**: `NEXTAUTH_SECRET`
   - **Value**: Your generated secret (from Step 1)
   - **Environment**: Select **Production**, **Preview**, and **Development**
5. Click **Save**

### Step 3: Redeploy

**CRITICAL:** After adding/updating `NEXTAUTH_SECRET`, you MUST redeploy:

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

### Step 4: Clear User Sessions (Optional)

If users are still experiencing issues after redeploy:

1. Users should **sign out** and **sign in again**
2. This will create new sessions with the correct secret
3. Old sessions encrypted with the wrong secret will be invalid

## Why This Happens

### Scenario 1: Secret Missing
- **Problem**: `NEXTAUTH_SECRET` not set in Vercel
- **Result**: Code uses fallback secret, but old sessions were encrypted with a different secret
- **Fix**: Set `NEXTAUTH_SECRET` in Vercel and redeploy

### Scenario 2: Secret Changed
- **Problem**: `NEXTAUTH_SECRET` was changed after users already had sessions
- **Result**: Old sessions can't be decrypted with new secret
- **Fix**: Users need to sign out and sign in again (or wait for session expiry)

### Scenario 3: Environment Mismatch
- **Problem**: Different secrets in different environments
- **Result**: Sessions from one environment don't work in another
- **Fix**: Use the same secret across all environments (or accept that users need to re-authenticate)

## Prevention

1. **Always set NEXTAUTH_SECRET** in production
2. **Never change NEXTAUTH_SECRET** without planning for session invalidation
3. **Use the same secret** across all environments if you want sessions to persist
4. **Document your secrets** (securely) so you know what was used

## Current Configuration

The code checks for secrets in this order:
1. `NEXTAUTH_SECRET` (preferred)
2. `JWT_SECRET` (fallback)
3. `'triposia-nextauth-secret-2024-fallback'` (last resort - will cause errors)

## Verification

After setting `NEXTAUTH_SECRET` and redeploying:

1. Check Vercel logs - you should NOT see the warning about missing secret
2. Try signing in - should work without errors
3. Check browser console - no JWT errors
4. Session should persist across page refreshes

## If Error Persists

1. **Clear browser cookies** for your domain
2. **Sign out** completely
3. **Sign in again** to create a new session
4. **Check Vercel logs** for the actual secret being used
5. **Verify** `NEXTAUTH_SECRET` is set correctly in Vercel

## Important Notes

- ⚠️ **Never commit** `NEXTAUTH_SECRET` to git
- ⚠️ **Never share** your secret publicly
- ⚠️ **Rotate secrets** if compromised
- ✅ **Use strong secrets** (32+ characters, random)
- ✅ **Set in all environments** (Production, Preview, Development)

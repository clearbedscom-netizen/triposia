# Vercel Environment Variables Setup

## Required Environment Variables for Google OAuth

To fix the `client_id is required` error, you need to add Google OAuth credentials to Vercel.

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Create an OAuth 2.0 Client ID (see `docs/GOOGLE_OAUTH_SETUP.md` for detailed steps)
4. Copy the **Client ID** and **Client Secret**

### Step 2: Add to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **triposia** (or your project name)
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

#### For Production:
```
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=https://triposia.com
```

#### For Preview/Development:
```
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### Step 3: Generate NEXTAUTH_SECRET

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

### Step 4: Configure Google OAuth Redirect URI

In Google Cloud Console, make sure you've added:

**Authorized redirect URIs:**
- `https://triposia.com/api/auth/callback/google` (production)
- `http://localhost:3000/api/auth/callback/google` (local development)

**Authorized JavaScript origins:**
- `https://triposia.com` (production)
- `http://localhost:3000` (local development)

### Step 5: Redeploy

**CRITICAL:** After adding environment variables, you MUST redeploy:

1. Go to **Deployments** tab in Vercel
2. Click **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

### Step 6: Verify

1. Visit your site: `https://triposia.com`
2. Try to sign in with Google
3. Check Vercel logs for any errors

## Complete Environment Variables List

Here's the complete list of environment variables you should have in Vercel:

### Required for Basic Functionality:
```
MONGODB_URI=mongodb+srv://...
NEXT_PUBLIC_SITE_URL=https://triposia.com
```

### Required for Authentication:
```
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=https://triposia.com
```

### Optional (for admin features):
```
JWT_SECRET=your-jwt-secret
ADMIN_EMAIL=admin@triposia.com
ADMIN_PASSWORD=your-password
```

### Optional (for reCAPTCHA):
```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_SECRET_KEY=your_secret_key
```

## Troubleshooting

### Error: "client_id is required"

**Cause:** `GOOGLE_CLIENT_ID` is not set in Vercel environment variables.

**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add `GOOGLE_CLIENT_ID` with your Google OAuth Client ID
3. Add `GOOGLE_CLIENT_SECRET` with your Google OAuth Client Secret
4. Redeploy the application

### Error: "redirect_uri_mismatch"

**Cause:** The redirect URI in Google Console doesn't match your site URL.

**Solution:**
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add `https://triposia.com/api/auth/callback/google` to Authorized redirect URIs
4. Save and wait a few minutes for changes to propagate

### Google Sign-In Button Not Working

**Cause:** Environment variables not loaded or incorrect.

**Solution:**
1. Verify all environment variables are set in Vercel
2. Check that they're enabled for the correct environment (Production/Preview/Development)
3. Redeploy after adding variables
4. Check Vercel logs for specific errors

## Security Notes

- **Never commit** environment variables to git
- **Use different credentials** for development and production
- **Rotate secrets** periodically
- **Monitor OAuth usage** in Google Cloud Console

# Google OAuth Setup Guide

This guide will help you set up Google OAuth for user authentication in your application.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Your application domain (e.g., `triposia.com` or `askfares.com`)

## Step-by-Step Instructions

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "Triposia Auth" or "AskFares Auth")
5. Click **"Create"**

### Step 2: Enable Google+ API

1. In your project, go to **"APIs & Services"** > **"Library"**
2. Search for **"Google+ API"** or **"Google Identity"**
3. Click on it and click **"Enable"**

**Note:** Google+ API is deprecated, but you can also use:
- **Google Identity Services API** (recommended)
- Or just use the OAuth 2.0 credentials directly (works without enabling API)

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** > **"OAuth consent screen"**
2. Select **"External"** (unless you have a Google Workspace account)
3. Click **"Create"**
4. Fill in the required information:
   - **App name**: Your app name (e.g., "Triposia" or "AskFares")
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click **"Save and Continue"**
6. On **"Scopes"** page, click **"Save and Continue"** (no scopes needed for basic sign-in)
7. On **"Test users"** page (if in testing mode), you can add test users or click **"Save and Continue"**
8. Review and click **"Back to Dashboard"**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
3. If prompted, configure the consent screen (you can skip if already done)
4. Select **"Web application"** as the application type
5. Fill in the details:
   - **Name**: Your app name (e.g., "Triposia Web Client")
   - **Authorized JavaScript origins**:
     - `https://triposia.com` (or your production domain)
     - `https://www.triposia.com` (if using www)
     - `http://localhost:3000` (for local development)
   - **Authorized redirect URIs**:
     - `https://triposia.com/api/auth/callback/google` (production)
     - `http://localhost:3000/api/auth/callback/google` (local development)
6. Click **"Create"**
7. **IMPORTANT**: Copy the **Client ID** and **Client Secret** immediately (you won't be able to see the secret again)

### Step 5: Add Credentials to Environment Variables

Add the following to your `.env.local` file (or your hosting platform's environment variables):

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here

# NextAuth
NEXTAUTH_SECRET=your_random_secret_string_here
NEXTAUTH_URL=https://triposia.com
```

**For local development:**
```bash
NEXTAUTH_URL=http://localhost:3000
```

### Step 6: Generate NEXTAUTH_SECRET

You can generate a secure secret using:

```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

### Step 7: Update Production Environment Variables

If deploying to Vercel or another platform:

1. Go to your project settings
2. Navigate to **"Environment Variables"**
3. Add:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your production URL)

### Step 8: Verify Setup

1. Restart your development server
2. Try signing in with Google
3. Check the browser console and server logs for any errors

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - Make sure the redirect URI in Google Console exactly matches: `https://yourdomain.com/api/auth/callback/google`
   - Check for trailing slashes, http vs https, www vs non-www

2. **"access_denied" error**
   - Check if your OAuth consent screen is published (if not in testing mode)
   - Verify test users are added if in testing mode

3. **"invalid_client" error**
   - Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
   - Make sure there are no extra spaces or quotes in environment variables

4. **Session not persisting**
   - Check `NEXTAUTH_SECRET` is set
   - Verify `NEXTAUTH_URL` matches your domain

### Testing Locally

1. Make sure `NEXTAUTH_URL=http://localhost:3000` in `.env.local`
2. Add `http://localhost:3000` to authorized JavaScript origins
3. Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs
4. Restart your dev server after adding environment variables

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use different credentials** for development and production
3. **Rotate secrets** periodically
4. **Monitor OAuth usage** in Google Cloud Console
5. **Set up alerts** for unusual activity

## Production Checklist

- [ ] OAuth consent screen is published (not in testing mode)
- [ ] Production domain added to authorized JavaScript origins
- [ ] Production callback URL added to authorized redirect URIs
- [ ] Environment variables set in production
- [ ] `NEXTAUTH_SECRET` is a strong random string
- [ ] `NEXTAUTH_URL` matches production domain
- [ ] HTTPS is enabled (required for OAuth)

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

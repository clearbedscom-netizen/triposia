# reCAPTCHA Setup Guide

reCAPTCHA is **optional** for the FAQ system. If you don't configure it, users can still submit questions without reCAPTCHA verification.

## When to Use reCAPTCHA

- **Recommended** if you're experiencing spam or bot submissions
- **Optional** if you have other spam prevention measures in place
- **Not required** for basic functionality

## Setup Instructions

### Step 1: Get reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click **"+ Create"** to create a new site
3. Fill in the form:
   - **Label**: Your site name (e.g., "Triposia")
   - **reCAPTCHA type**: Select **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
   - **Domains**: Add your domains:
     - `triposia.com`
     - `www.triposia.com`
     - `localhost` (for local development)
   - Accept the terms and click **Submit**
4. Copy the **Site Key** and **Secret Key**

### Step 2: Add to Environment Variables

#### For Local Development (`.env.local`):
```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

#### For Vercel Production:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` = your site key
   - `RECAPTCHA_SECRET_KEY` = your secret key
5. **Redeploy** after adding variables

### Step 3: Verify Setup

1. Restart your development server (if local)
2. Visit a page with the Q&A section
3. Try to submit a question
4. You should see the reCAPTCHA checkbox
5. Complete the verification and submit

## How It Works

- **If reCAPTCHA is configured:**
  - The reCAPTCHA widget appears on the question form
  - Users must complete verification before submitting
  - Server verifies the token with Google

- **If reCAPTCHA is NOT configured:**
  - No reCAPTCHA widget appears
  - Users can submit questions directly
  - No verification is performed

## Troubleshooting

### Error: "reCAPTCHA verification required"

**Cause:** `RECAPTCHA_SECRET_KEY` is set, but the client didn't send a token.

**Solutions:**
1. Make sure `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set (for the widget to appear)
2. Check that the reCAPTCHA widget is visible and completed
3. Verify both keys are correct in environment variables
4. Clear browser cache and try again

### Error: "reCAPTCHA verification failed"

**Cause:** The token verification with Google failed.

**Solutions:**
1. Check that `RECAPTCHA_SECRET_KEY` is correct
2. Verify the domain is added in reCAPTCHA admin console
3. Make sure you're using the correct reCAPTCHA version (v2)
4. Check Vercel logs for detailed error messages

### reCAPTCHA Widget Not Showing

**Cause:** `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is not set or incorrect.

**Solutions:**
1. Verify `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set in environment variables
2. Restart your development server after adding the variable
3. Check browser console for errors
4. Verify the site key is correct in reCAPTCHA admin console

### Want to Disable reCAPTCHA?

Simply remove or don't set these environment variables:
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- `RECAPTCHA_SECRET_KEY`

The system will work without reCAPTCHA verification.

## Security Notes

- **Never commit** reCAPTCHA keys to version control
- **Use different keys** for development and production (optional)
- **Monitor** reCAPTCHA analytics in Google Console
- **Rotate keys** if compromised

## Testing

### Test with reCAPTCHA:
1. Set both environment variables
2. Submit a question
3. Complete reCAPTCHA verification
4. Question should submit successfully

### Test without reCAPTCHA:
1. Remove environment variables
2. Submit a question
3. No reCAPTCHA widget should appear
4. Question should submit directly

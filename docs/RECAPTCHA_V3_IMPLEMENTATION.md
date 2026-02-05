# reCAPTCHA v3 Implementation Guide

## Overview

The codebase now uses **reCAPTCHA v3** instead of v2. reCAPTCHA v3 is invisible and works in the background, providing a risk score (0.0 to 1.0) instead of requiring user interaction.

## Key Differences from v2

### reCAPTCHA v2 (Old)
- ✅ Visible checkbox: "I'm not a robot"
- ✅ User interaction required
- ✅ Returns success/failure
- ❌ Can be annoying for users

### reCAPTCHA v3 (Current)
- ✅ Invisible (no checkbox)
- ✅ Works automatically in background
- ✅ Returns a score (0.0 to 1.0)
- ✅ Better user experience
- ⚠️ Requires score threshold (default: 0.5)

## How It Works

1. **Page Load**: reCAPTCHA script loads automatically
2. **Form Submit**: Token is generated invisibly when user submits
3. **Server Verification**: Server verifies token and checks score
4. **Score Check**: Score > 0.5 = human, < 0.5 = bot

## Components

### 1. ReCAPTCHAProvider (`components/faq/ReCAPTCHAProvider.tsx`)
- Wraps the app to load reCAPTCHA script
- Only loads if `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set
- Provides context for child components

### 2. QuestionForm (`components/faq/QuestionForm.tsx`)
- Uses `useGoogleReCaptcha()` hook
- Executes reCAPTCHA on form submit
- Gets token invisibly (no user interaction)

### 3. API Route (`app/api/faqs/route.ts`)
- Verifies token with Google
- Checks score (must be > 0.5)
- Rejects if score too low

## Environment Variables

```bash
# Required for reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_v3_site_key
RECAPTCHA_SECRET_KEY=your_v3_secret_key
```

## Score Threshold

The current implementation uses a score threshold of **0.5**:
- Score ≥ 0.5: Human (allowed)
- Score < 0.5: Bot (rejected)

You can adjust this in `app/api/faqs/route.ts`:

```typescript
if (score < 0.5) { // Change this value
  // Reject
}
```

### Recommended Thresholds:
- **0.5**: Balanced (default)
- **0.7**: Stricter (fewer false positives, more false negatives)
- **0.3**: More lenient (more false positives, fewer false negatives)

## Testing

### Local Testing
1. Add keys to `.env.local`
2. Restart dev server: `npm run dev`
3. Submit a question form
4. Check browser console for any errors
5. Check server logs for score values

### Production Testing
1. Add keys to Vercel environment variables
2. Redeploy
3. Test form submission
4. Monitor Vercel logs for score values

## Troubleshooting

### Error: "reCAPTCHA is not loaded"
- **Cause**: Script didn't load or provider not wrapping component
- **Fix**: Make sure `ReCAPTCHAProvider` wraps your app in `providers.tsx`

### Error: "reCAPTCHA verification failed"
- **Cause**: Score too low or token invalid
- **Fix**: Check server logs for actual score value
- **Adjust**: Lower threshold if legitimate users are being blocked

### Low Scores for Legitimate Users
- **Cause**: Threshold too high or user behavior flagged
- **Fix**: Lower threshold to 0.3 or 0.4
- **Note**: Some users may have low scores due to VPN, privacy tools, etc.

## Monitoring Scores

You can log scores in the API route to monitor:

```typescript
console.log('reCAPTCHA score:', recaptchaData.score);
```

This helps you:
- Understand typical score ranges
- Adjust threshold appropriately
- Identify patterns

## Best Practices

1. **Start with 0.5 threshold**: Balanced approach
2. **Monitor scores**: Log scores to understand patterns
3. **Adjust gradually**: Don't change threshold drastically
4. **Consider user feedback**: If users report issues, check scores
5. **Use analytics**: Track rejection rates

## Disabling reCAPTCHA

To disable reCAPTCHA:
1. Remove environment variables:
   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   - `RECAPTCHA_SECRET_KEY`
2. System will work without verification

## Migration from v2

If you were using v2 before:
1. ✅ Code is already updated
2. ✅ Just need v3 keys from Google
3. ✅ Update environment variables
4. ✅ Redeploy

No code changes needed - just new keys!

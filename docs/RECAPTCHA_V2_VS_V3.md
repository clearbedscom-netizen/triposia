# reCAPTCHA v2 vs v3 - Which One to Use

## Current Code Uses: reCAPTCHA v2

This codebase uses **reCAPTCHA v2** with the "I'm not a robot" checkbox.

## The Problem

You created a **reCAPTCHA v3** site, but the code expects **v2**. They are incompatible.

## Solution: Create a reCAPTCHA v2 Site

### Step 1: Go to reCAPTCHA Admin
1. Visit [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click **"+ Create"** to create a new site

### Step 2: Configure for v2
Fill in the form:
- **Label**: `triposia.com` (or any name you prefer)
- **reCAPTCHA type**: Select **"reCAPTCHA v2"**
- **Subtype**: Select **"I'm not a robot" Checkbox** (NOT v3)
- **Domains**: Add:
  - `triposia.com`
  - `www.triposia.com`
  - `localhost` (for local development)
- Accept the terms
- Click **Submit**

### Step 3: Copy the Keys
You'll get:
- **Site Key** (starts with `6L...`)
- **Secret Key** (starts with `6L...`)

### Step 4: Update Environment Variables
Use the new v2 keys in your environment variables.

## reCAPTCHA v2 vs v3 Differences

### reCAPTCHA v2 (Current Code)
- ✅ Shows a checkbox: "I'm not a robot"
- ✅ User interaction required
- ✅ Works with `react-google-recaptcha` package
- ✅ Simple to implement
- ✅ What this code uses

### reCAPTCHA v3 (What You Created)
- ❌ Invisible (no checkbox)
- ❌ Returns a score (0.0 to 1.0)
- ❌ Requires different code implementation
- ❌ More complex
- ❌ Not compatible with current code

## Why v2 is Better for This Use Case

- **User-friendly**: Users see and interact with the checkbox
- **Clear feedback**: Users know they completed verification
- **Simple**: Works out of the box with current code
- **Reliable**: Proven to work well for forms

## If You Want to Use v3 Instead

You would need to:
1. Install `react-google-recaptcha-v3` package
2. Rewrite the reCAPTCHA integration code
3. Handle score-based verification
4. Update the API route to check scores

**Recommendation**: Stick with v2 - it's simpler and works perfectly for FAQ submissions.

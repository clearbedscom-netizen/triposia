# Environment Variables

This document describes the environment variables used in the Triposia application.

## Phone Number Configuration

The phone number displayed in the sticky call-to-action banner can be configured using environment variables.

### Variables

- `NEXT_PUBLIC_PHONE_DISPLAY`: Human-readable phone number format (e.g., `+1-(877) 684-5230`)
- `NEXT_PUBLIC_PHONE_TEL`: Phone number for `tel:` links (no spaces, dashes, or parentheses) (e.g., `+18776845230`)

### Default Values

If not set, the following defaults are used:
- Display: `+1-(877) 684-5230`
- Tel: `+18776845230`

### Usage

Create a `.env.local` file in the root directory:

```bash
# Phone Number Configuration
NEXT_PUBLIC_PHONE_DISPLAY=+1-(877) 684-5230
NEXT_PUBLIC_PHONE_TEL=+18776845230
```

The phone number is accessed via `COMPANY_INFO.phone.display` and `COMPANY_INFO.phone.tel` from `@/lib/company`.

## Site Configuration

- `NEXT_PUBLIC_SITE_URL`: The base URL of the site (defaults to `https://triposia.com`)

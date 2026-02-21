# SEO & SSR Strategy

## Problem
Using `ssr: false` means components are only rendered on the client, which means:
- Search engines don't see the content in initial HTML
- Content is not crawlable/indexable
- This hurts SEO rankings

## Solution: Hybrid Approach

### ✅ Server-Rendered (SSR: true or direct import)
**Critical SEO content that must be in initial HTML:**
1. **Route Intelligence Dashboard** - Statistics, scores, route data
2. **Flight Tables** - Flight schedules and data
3. **Route Information** - Route details, frequencies, distances
4. **Text Content** - All descriptive text, headings, metadata
5. **Structured Data** - JSON-LD schemas, semantic HTML

### ⚠️ Client-Side Only (SSR: false)
**Interactive components that don't need to be indexed:**
1. **Charts/Visualizations** - Recharts components (visual only)
2. **Filters** - Interactive filter controls
3. **Maps** - Interactive map components
4. **Interactive UI** - Dropdowns, modals, tabs

## Implementation

### Route Intelligence Dashboard
- **Before**: `AirlineRouteIntelligenceLazy` with `ssr: false` ❌
- **After**: `AirlineRouteIntelligenceServer` with direct import ✅
  - All statistics, scores, and route data are server-rendered
  - Only the interactive chart is client-side (`TopRoutesBarChart` with `ssr: false`)

### Flight Tables
- **Status**: Already server-rendered ✅ (`FlightTableLazy` has `ssr: true`)

### Route Data Visualization
- **Status**: Charts are client-side only (acceptable for SEO)
- **Note**: Charts are visual/interactive, not critical for text-based SEO
- **Recommendation**: Add server-rendered summary statistics above charts

### Filters
- **Status**: Client-side only (acceptable)
- **Reason**: Filters are interactive UI, not content to be indexed

## Best Practices

1. **Always server-render:**
   - Text content
   - Data tables
   - Statistics and metrics
   - Route information
   - Structured data (JSON-LD)

2. **Can be client-side:**
   - Interactive charts
   - Filter controls
   - Maps
   - Modals/dialogs
   - Interactive widgets

3. **Hybrid approach:**
   - Render data on server
   - Add interactivity on client
   - Use `ssr: false` only for pure interactivity

## Testing

To verify SEO-friendliness:
1. View page source (not rendered HTML)
2. Check that critical content is in initial HTML
3. Use Google Search Console to verify indexing
4. Test with `curl` to see server-rendered content

## Files Updated

- `components/airlines/AirlineRouteIntelligenceServer.tsx` - New server-rendered version
- `app/airlines/[code]/[route]/page.tsx` - Updated to use server-rendered component

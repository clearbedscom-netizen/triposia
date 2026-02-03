# Replace Year 2023 to 2025 Script

This script replaces all occurrences of "2023" with "2025" in the following MongoDB collections:
- `booking_insights`
- `weather`
- `travel_seasons`
- `airline_seasonal_insights`

## Features

- **Deep Search**: Recursively searches through all fields (strings, arrays, nested objects)
- **Safe**: Dry-run mode to preview changes before applying
- **Comprehensive**: Handles all data types and nested structures
- **Detailed Logging**: Shows exactly what will be changed

## Usage

### 1. Dry Run (Preview Changes)

First, run in dry-run mode to see what will be changed:

```bash
DRY_RUN=true node scripts/replace-year-2023-to-2025.js
```

### 2. Apply Changes

Once you've reviewed the preview, run without dry-run to apply changes:

```bash
node scripts/replace-year-2023-to-2025.js
```

Or explicitly:

```bash
DRY_RUN=false node scripts/replace-year-2023-to-2025.js
```

### 3. Using Environment Variable

You can also set the MongoDB URI via environment variable:

```bash
MONGODB_URI="your-connection-string" node scripts/replace-year-2023-to-2025.js
```

## What It Does

1. **Connects** to MongoDB using the connection string from environment or default
2. **Scans** each collection for documents containing "2023"
3. **Recursively searches** through all fields:
   - String fields: Replaces "2023" with "2025"
   - Array fields: Processes each element
   - Object fields: Recursively processes nested objects
4. **Updates** documents that contain "2023"
5. **Logs** all changes made

## Example Output

```
🚀 Starting Year Replacement Script (2023 → 2025)
════════════════════════════════════════════════════════════
⚠️  DRY RUN MODE - No changes will be made to the database
   Set DRY_RUN=false to apply changes

📡 Connecting to MongoDB...
✅ Connected to MongoDB

📋 Available collections: airports, routes, flights, ...
📋 Collections to process: booking_insights, weather, travel_seasons, airline_seasonal_insights

📦 Processing collection: booking_insights
────────────────────────────────────────────────────────────
  Total documents: 150
  ✓ Found 2023 in document _id: 507f1f77bcf86cd799439011
    → [DRY RUN] Would update document _id: 507f1f77bcf86cd799439011
  ✓ Found 2023 in document _id: 507f191e810c19729de860ea
    → [DRY RUN] Would update document _id: 507f191e810c19729de860ea

  ✅ Collection booking_insights:
     - Processed: 150 documents
     - Updated: 45 documents
     - Errors: 0 documents

════════════════════════════════════════════════════════════
📊 SUMMARY
════════════════════════════════════════════════════════════
Total documents processed: 500
Total documents updated: 120

⚠️  This was a DRY RUN - no changes were made
   Run with DRY_RUN=false to apply changes
```

## Safety Features

- **Dry Run Mode**: Preview all changes before applying
- **Batch Processing**: Processes documents in batches for better performance
- **Error Handling**: Continues processing even if individual documents fail
- **Detailed Logging**: Shows exactly what's being changed

## Notes

- The script processes all documents in each collection
- It searches for "2023" in any field, at any nesting level
- Only documents containing "2023" will be updated
- The script is idempotent - running it multiple times is safe

## Troubleshooting

### Connection Issues
If you get connection errors, check:
- MongoDB URI is correct
- Network connectivity
- MongoDB server is running

### Permission Issues
Ensure the MongoDB user has write permissions on the collections.

### Large Collections
For very large collections, the script processes in batches and shows progress every 500 documents.

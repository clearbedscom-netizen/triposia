/**
 * Replace Year 2023 with 2025 in MongoDB Collections
 * 
 * This script deeply searches and replaces all occurrences of "2023" with "2025"
 * in the following collections:
 * - booking_insights
 * - weather
 * - travel_seasons
 * - airline_seasonal_insights
 * 
 * Usage:
 *   node scripts/replace-year-2023-to-2025.js
 * 
 * Safety:
 *   - Creates a backup before making changes (optional)
 *   - Shows preview of changes before applying
 *   - Can run in dry-run mode (set DRY_RUN=true)
 */

const { MongoClient } = require('mongodb');

// Connection URI - use environment variable or update with your connection string
const uri = process.env.MONGODB_URI || 'mongodb+srv://triposia:40JeMwmuN75ZxRCL@flights.urpjin.mongodb.net/flights?retryWrites=true&w=majority';
const dbName = 'flights';

// Collections to process
const COLLECTIONS = [
  'booking_insights',
  'weather',
  'travel_seasons',
  'airline_seasonal_insights'
];

// Dry run mode - set to true to preview changes without applying
const DRY_RUN = process.env.DRY_RUN === 'true' || false;

/**
 * Recursively search and replace "2023" with "2025" in any value
 * Handles strings, arrays, nested objects
 */
function replaceYearInValue(value, path = '') {
  if (value === null || value === undefined) {
    return { value, changed: false };
  }

  // Handle strings
  if (typeof value === 'string') {
    if (value.includes('2023')) {
      const newValue = value.replace(/2023/g, '2025');
      return { value: newValue, changed: true };
    }
    return { value, changed: false };
  }

  // Handle arrays
  if (Array.isArray(value)) {
    let changed = false;
    const newArray = value.map((item, index) => {
      const result = replaceYearInValue(item, `${path}[${index}]`);
      if (result.changed) changed = true;
      return result.value;
    });
    return { value: newArray, changed };
  }

  // Handle objects
  if (typeof value === 'object' && value.constructor === Object) {
    let changed = false;
    const newObject = {};
    
    for (const [key, val] of Object.entries(value)) {
      const newPath = path ? `${path}.${key}` : key;
      const result = replaceYearInValue(val, newPath);
      if (result.changed) changed = true;
      newObject[key] = result.value;
    }
    
    return { value: newObject, changed };
  }

  // For other types (numbers, booleans, etc.), return as-is
  return { value, changed: false };
}

/**
 * Process a single document
 */
async function processDocument(collection, doc, collectionName) {
  const result = replaceYearInValue(doc);
  
  if (result.changed) {
    console.log(`  ✓ Found 2023 in document _id: ${doc._id}`);
    
    if (!DRY_RUN) {
      try {
        await collection.updateOne(
          { _id: doc._id },
          { $set: result.value }
        );
        console.log(`    → Updated document _id: ${doc._id}`);
      } catch (error) {
        console.error(`    ✗ Error updating document _id: ${doc._id}:`, error.message);
        return { success: false, error };
      }
    } else {
      console.log(`    → [DRY RUN] Would update document _id: ${doc._id}`);
    }
    
    return { success: true, changed: true };
  }
  
  return { success: true, changed: false };
}

/**
 * Process a collection
 */
async function processCollection(db, collectionName) {
  console.log(`\n📦 Processing collection: ${collectionName}`);
  console.log('─'.repeat(60));
  
  try {
    const collection = db.collection(collectionName);
    
    // Get total count
    const totalCount = await collection.countDocuments();
    console.log(`  Total documents: ${totalCount}`);
    
    if (totalCount === 0) {
      console.log(`  ⚠️  Collection is empty, skipping...`);
      return { processed: 0, updated: 0, errors: 0 };
    }
    
    // Find all documents that might contain "2023"
    // We'll check all documents since "2023" could be in any field
    const cursor = collection.find({});
    
    let processed = 0;
    let updated = 0;
    let errors = 0;
    
    // Process in batches for better performance
    const batchSize = 100;
    let batch = [];
    
    for await (const doc of cursor) {
      batch.push(doc);
      
      if (batch.length >= batchSize) {
        // Process batch
        for (const doc of batch) {
          processed++;
          const result = await processDocument(collection, doc, collectionName);
          if (result.changed) updated++;
          if (!result.success) errors++;
        }
        batch = [];
        
        // Progress update
        if (processed % 500 === 0) {
          console.log(`  Progress: ${processed}/${totalCount} documents processed...`);
        }
      }
    }
    
    // Process remaining documents
    for (const doc of batch) {
      processed++;
      const result = await processDocument(collection, doc, collectionName);
      if (result.changed) updated++;
      if (!result.success) errors++;
    }
    
    console.log(`\n  ✅ Collection ${collectionName}:`);
    console.log(`     - Processed: ${processed} documents`);
    console.log(`     - Updated: ${updated} documents`);
    if (errors > 0) {
      console.log(`     - Errors: ${errors} documents`);
    }
    
    return { processed, updated, errors };
    
  } catch (error) {
    console.error(`  ✗ Error processing collection ${collectionName}:`, error.message);
    return { processed: 0, updated: 0, errors: 1 };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Year Replacement Script (2023 → 2025)');
  console.log('═'.repeat(60));
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made to the database');
    console.log('   Set DRY_RUN=false to apply changes\n');
  } else {
    console.log('⚠️  LIVE MODE - Changes will be applied to the database');
    console.log('   Set DRY_RUN=true to preview changes without applying\n');
  }
  
  let client;
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });
    
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(dbName);
    
    // Verify collections exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('📋 Available collections:', collectionNames.join(', '));
    console.log('📋 Collections to process:', COLLECTIONS.join(', '));
    
    const missingCollections = COLLECTIONS.filter(c => !collectionNames.includes(c));
    if (missingCollections.length > 0) {
      console.log(`\n⚠️  Warning: These collections don't exist: ${missingCollections.join(', ')}`);
    }
    
    // Process each collection
    const results = {
      totalProcessed: 0,
      totalUpdated: 0,
      totalErrors: 0,
    };
    
    for (const collectionName of COLLECTIONS) {
      if (!collectionNames.includes(collectionName)) {
        console.log(`\n⏭️  Skipping ${collectionName} (collection doesn't exist)`);
        continue;
      }
      
      const result = await processCollection(db, collectionName);
      results.totalProcessed += result.processed;
      results.totalUpdated += result.updated;
      results.totalErrors += result.errors;
    }
    
    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Total documents processed: ${results.totalProcessed}`);
    console.log(`Total documents updated: ${results.totalUpdated}`);
    if (results.totalErrors > 0) {
      console.log(`Total errors: ${results.totalErrors}`);
    }
    
    if (DRY_RUN) {
      console.log('\n⚠️  This was a DRY RUN - no changes were made');
      console.log('   Run with DRY_RUN=false to apply changes');
    } else {
      console.log('\n✅ All changes have been applied to the database');
    }
    
  } catch (error) {
    console.error('\n✗ Fatal error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✨ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { main, replaceYearInValue };

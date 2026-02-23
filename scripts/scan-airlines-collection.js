/**
 * Script to scan and analyze the airlines collection
 * This helps understand what fields are available for the info pages
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb+srv://triposia:40JeMwmuN75ZxRCL@flights.urpjin.mongodb.net/flights?retryWrites=true&w=majority';
const dbName = 'flights';

async function scanAirlines() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('airlines');

    // Get total count
    const totalCount = await collection.countDocuments();
    console.log(`\nTotal airlines: ${totalCount}`);

    // Get Delta as example
    console.log('\n=== Delta Air Lines Sample ===');
    const delta = await collection.findOne({ iata: 'DL' });
    if (delta) {
      console.log(JSON.stringify(delta, null, 2));
    }

    // Analyze all unique fields
    console.log('\n=== Field Analysis ===');
    const sample = await collection.find({}).limit(100).toArray();
    const allFields = new Set();
    
    sample.forEach(doc => {
      Object.keys(doc).forEach(key => allFields.add(key));
    });

    console.log('\nAll fields found:');
    Array.from(allFields).sort().forEach(field => {
      console.log(`  - ${field}`);
    });

    // Count fields with data
    console.log('\n=== Field Presence Statistics ===');
    const fieldStats = {};
    allFields.forEach(field => {
      fieldStats[field] = 0;
    });

    sample.forEach(doc => {
      allFields.forEach(field => {
        if (doc[field] !== undefined && doc[field] !== null && doc[field] !== '') {
          fieldStats[field]++;
        }
      });
    });

    Object.entries(fieldStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([field, count]) => {
        const percentage = ((count / sample.length) * 100).toFixed(1);
        console.log(`  ${field}: ${count}/${sample.length} (${percentage}%)`);
      });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

scanAirlines();

/**
 * Script to scan and analyze the airlines_country collection
 * This helps understand the schema and data structure for country-based airline pages
 */

const { MongoClient } = require('mongodb');

// MongoDB connection string
const uri = process.env.MONGODB_URI || 'mongodb+srv://triposia:40JeMwmuN75ZxRCL@flights.urpjin.mongodb.net/flights?retryWrites=true&w=majority';
const dbName = 'flights';

async function scanAirlinesCountry() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('airlines_country');

    // Get total count
    const totalCount = await collection.countDocuments();
    console.log(`\nTotal documents in airlines_country: ${totalCount}`);

    // Get sample documents
    console.log('\n=== Sample Documents ===');
    const samples = await collection.find({}).limit(10).toArray();
    samples.forEach((doc, idx) => {
      console.log(`\n--- Sample ${idx + 1} ---`);
      console.log(JSON.stringify(doc, null, 2));
    });

    // Analyze schema - get all unique field names
    console.log('\n=== Schema Analysis ===');
    const allFields = new Set();
    const cursor = collection.find({});
    let docCount = 0;
    const maxDocs = 100; // Sample first 100 docs for schema analysis

    for await (const doc of cursor) {
      docCount++;
      if (docCount > maxDocs) break;
      
      function extractFields(obj, prefix = '') {
        for (const key in obj) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          allFields.add(fullKey);
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            extractFields(obj[key], fullKey);
          }
        }
      }
      extractFields(doc);
    }

    console.log('\nAll unique fields found:');
    Array.from(allFields).sort().forEach(field => {
      console.log(`  - ${field}`);
    });

    // Get statistics for common fields
    console.log('\n=== Field Statistics ===');
    
    // Check airline_iata/airline_code
    const airlineIataCount = await collection.countDocuments({ airline_iata: { $exists: true } });
    const airlineCodeCount = await collection.countDocuments({ airline_code: { $exists: true } });
    console.log(`Documents with airline_iata: ${airlineIataCount}`);
    console.log(`Documents with airline_code: ${airlineCodeCount}`);

    // Check country fields
    const countryCount = await collection.countDocuments({ country: { $exists: true } });
    const countryCodeCount = await collection.countDocuments({ country_code: { $exists: true } });
    console.log(`Documents with country: ${countryCount}`);
    console.log(`Documents with country_code: ${countryCodeCount}`);

    // Check address/phone fields
    const addressCount = await collection.countDocuments({ address: { $exists: true } });
    const phoneCount = await collection.countDocuments({ phone: { $exists: true } });
    const phoneNumberCount = await collection.countDocuments({ phone_number: { $exists: true } });
    console.log(`Documents with address: ${addressCount}`);
    console.log(`Documents with phone: ${phoneCount}`);
    console.log(`Documents with phone_number: ${phoneNumberCount}`);

    // Check terminal fields
    const terminalCount = await collection.countDocuments({ terminal: { $exists: true } });
    const terminalsCount = await collection.countDocuments({ terminals: { $exists: true } });
    console.log(`Documents with terminal: ${terminalCount}`);
    console.log(`Documents with terminals: ${terminalsCount}`);

    // Check airport fields
    const airportCount = await collection.countDocuments({ airport: { $exists: true } });
    const airportsCount = await collection.countDocuments({ airports: { $exists: true } });
    const airportIataCount = await collection.countDocuments({ airport_iata: { $exists: true } });
    console.log(`Documents with airport: ${airportCount}`);
    console.log(`Documents with airports: ${airportsCount}`);
    console.log(`Documents with airport_iata: ${airportIataCount}`);

    // Get specific example for Delta in Canada
    console.log('\n=== Delta Airlines Canada Example ===');
    const deltaCanada = await collection.find({
      $or: [
        { airline_iata: 'DL' },
        { airline_code: 'DL' }
      ],
      $or: [
        { country: /canada/i },
        { country_code: 'CA' },
        { country_code: 'CAN' }
      ]
    }).limit(5).toArray();

    if (deltaCanada.length > 0) {
      console.log(`Found ${deltaCanada.length} Delta Canada records:`);
      deltaCanada.forEach((doc, idx) => {
        console.log(`\n--- Delta Canada Record ${idx + 1} ---`);
        console.log(JSON.stringify(doc, null, 2));
      });
    } else {
      console.log('No Delta Canada records found');
    }

    // Get unique countries
    console.log('\n=== Unique Countries ===');
    const uniqueCountries = await collection.distinct('country');
    console.log(`Total unique countries: ${uniqueCountries.length}`);
    console.log('Countries:', uniqueCountries.slice(0, 20).join(', '));

    // Get unique airline codes
    console.log('\n=== Unique Airlines ===');
    const uniqueAirlines = await collection.distinct('airline_iata');
    const uniqueAirlineCodes = await collection.distinct('airline_code');
    const allAirlines = [...new Set([...uniqueAirlines, ...uniqueAirlineCodes])].filter(Boolean);
    console.log(`Total unique airlines: ${allAirlines.length}`);
    console.log('Airlines:', allAirlines.slice(0, 20).join(', '));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nConnection closed');
  }
}

scanAirlinesCountry().catch(console.error);

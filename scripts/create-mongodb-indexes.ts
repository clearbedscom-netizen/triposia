/**
 * MongoDB Index Creation Script
 * Run this script to create indexes for performance optimization
 * 
 * Usage: npx tsx scripts/create-mongodb-indexes.ts
 */

import { getDatabase } from '../lib/mongodb';

async function createIndexes() {
  try {
    const db = await getDatabase();
    
    console.log('Creating MongoDB indexes for performance optimization...\n');

    // Routes collection indexes
    console.log('Creating indexes on routes collection...');
    await db.collection('routes').createIndex({ origin_iata: 1 }, { background: true });
    await db.collection('routes').createIndex({ destination_iata: 1 }, { background: true });
    await db.collection('routes').createIndex({ origin_iata: 1, destination_iata: 1 }, { background: true });
    await db.collection('routes').createIndex({ has_flight_data: 1 }, { background: true });
    console.log('✓ Routes indexes created');

    // Flights/Departures collection indexes
    console.log('Creating indexes on departures collection...');
    await db.collection('departures').createIndex({ origin_iata: 1, destination_iata: 1 }, { background: true });
    await db.collection('departures').createIndex({ airline_iata: 1, origin_iata: 1 }, { background: true });
    await db.collection('departures').createIndex({ origin_iata: 1 }, { background: true });
    await db.collection('departures').createIndex({ destination_iata: 1 }, { background: true });
    await db.collection('departures').createIndex({ airline_iata: 1 }, { background: true });
    await db.collection('departures').createIndex({ departure_time: 1 }, { background: true });
    console.log('✓ Departures indexes created');

    // Arrivals collection indexes
    console.log('Creating indexes on arrivals collection...');
    await db.collection('arrivals').createIndex({ origin_iata: 1 }, { background: true });
    await db.collection('arrivals').createIndex({ airline_iata: 1 }, { background: true });
    await db.collection('arrivals').createIndex({ arrival_time: 1 }, { background: true });
    console.log('✓ Arrivals indexes created');

    // Airports collection indexes
    console.log('Creating indexes on airports collection...');
    await db.collection('airports').createIndex({ iata_from: 1 }, { background: true });
    await db.collection('airports').createIndex({ city: 1 }, { background: true });
    await db.collection('airports').createIndex({ country: 1 }, { background: true });
    await db.collection('airports').createIndex({ departure_count: -1 }, { background: true });
    console.log('✓ Airports indexes created');

    // Airlines collection indexes
    console.log('Creating indexes on airlines collection...');
    await db.collection('airlines').createIndex({ iata: 1 }, { background: true });
    await db.collection('airlines').createIndex({ code: 1 }, { background: true });
    await db.collection('airlines').createIndex({ country: 1 }, { background: true });
    await db.collection('airlines').createIndex({ is_passenger: 1 }, { background: true });
    console.log('✓ Airlines indexes created');

    // Destinations collection indexes
    console.log('Creating indexes on destinations collection...');
    await db.collection('destinations').createIndex({ origin_iata: 1, destination_iata: 1 }, { background: true });
    console.log('✓ Destinations indexes created');

    console.log('\n✅ All indexes created successfully!');
    console.log('\nIndex Summary:');
    console.log('- Routes: 4 indexes');
    console.log('- Departures: 6 indexes');
    console.log('- Arrivals: 3 indexes');
    console.log('- Airports: 4 indexes');
    console.log('- Airlines: 4 indexes');
    console.log('- Destinations: 1 index');
    console.log('\nTotal: 22 indexes created');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();

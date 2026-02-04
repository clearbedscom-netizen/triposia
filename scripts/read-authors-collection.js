/**
 * Script to read and display the authors collection structure
 * Run with: node scripts/read-authors-collection.js
 */

const { MongoClient } = require('mongodb');

// MongoDB connection string
const uri = process.env.MONGODB_URI || 'mongodb+srv://triposia:40JeMwmuN75ZxRCL@flights.urpjin.mongodb.net/flights?retryWrites=true&w=majority';
const dbName = 'flights';

async function readAuthorsCollection() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...\n');
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const authorsCollection = db.collection('authors');
    
    // Get total count
    const count = await authorsCollection.countDocuments();
    console.log(`Total authors in collection: ${count}\n`);
    
    if (count === 0) {
      console.log('⚠️  Authors collection is empty.');
      return;
    }
    
    // Get all authors
    const authors = await authorsCollection.find({}).toArray();
    
    console.log('========================================');
    console.log('AUTHORS COLLECTION STRUCTURE');
    console.log('========================================\n');
    
    // Analyze structure
    const allKeys = new Set();
    authors.forEach(author => {
      Object.keys(author).forEach(key => allKeys.add(key));
    });
    
    console.log('Fields found in collection:');
    console.log(Array.from(allKeys).sort().join(', '));
    console.log('\n');
    
    // Display each author
    console.log('========================================');
    console.log('AUTHORS DETAILS');
    console.log('========================================\n');
    
    authors.forEach((author, index) => {
      console.log(`--- Author ${index + 1} ---`);
      console.log(`ID: ${author._id}`);
      console.log(`Name: ${author.name || 'N/A'}`);
      console.log(`Email: ${author.email || 'N/A'}`);
      console.log(`Slug: ${author.slug || 'N/A'}`);
      console.log(`Title: ${author.title || 'N/A'}`);
      console.log(`Bio: ${author.bio ? author.bio.substring(0, 100) + '...' : 'N/A'}`);
      console.log(`Avatar: ${author.avatar || 'N/A'}`);
      console.log(`Is Expert: ${author.isExpert !== undefined ? author.isExpert : 'N/A'}`);
      console.log(`Is Active: ${author.isActive !== undefined ? author.isActive : 'N/A'}`);
      console.log(`User ID: ${author.userId || 'N/A'}`);
      console.log(`Expertise: ${author.expertise ? author.expertise.join(', ') : 'N/A'}`);
      console.log(`Created At: ${author.createdAt || 'N/A'}`);
      console.log(`Updated At: ${author.updatedAt || 'N/A'}`);
      
      // Show any additional fields
      const standardFields = ['_id', 'name', 'email', 'slug', 'title', 'bio', 'avatar', 'isExpert', 'isActive', 'userId', 'expertise', 'createdAt', 'updatedAt'];
      const additionalFields = Object.keys(author).filter(key => !standardFields.includes(key));
      if (additionalFields.length > 0) {
        console.log(`Additional fields: ${additionalFields.join(', ')}`);
        additionalFields.forEach(field => {
          console.log(`  ${field}: ${JSON.stringify(author[field])}`);
        });
      }
      
      console.log('');
    });
    
    // Statistics
    console.log('========================================');
    console.log('STATISTICS');
    console.log('========================================\n');
    
    const expertsCount = authors.filter(a => a.isExpert === true).length;
    const activeCount = authors.filter(a => a.isActive !== false).length;
    const withEmailCount = authors.filter(a => a.email).length;
    const withUserIdCount = authors.filter(a => a.userId).length;
    
    console.log(`Total authors: ${count}`);
    console.log(`Experts (isExpert: true): ${expertsCount}`);
    console.log(`Active authors: ${activeCount}`);
    console.log(`Authors with email: ${withEmailCount}`);
    console.log(`Authors linked to users: ${withUserIdCount}`);
    
  } catch (error) {
    console.error('Error reading authors collection:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\n✅ Connection closed.');
    }
  }
}

// Run the script
readAuthorsCollection().catch(console.error);

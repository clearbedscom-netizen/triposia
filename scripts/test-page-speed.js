const https = require('https');
const http = require('http');

function testPageSpeed(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      let size = 0;
      
      res.on('data', (chunk) => {
        data += chunk;
        size += chunk.length;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        resolve({
          duration,
          size,
          statusCode: res.statusCode,
          headers: res.headers,
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function runTests() {
  const pages = [
    'http://localhost:3000/airlines/ai/del',
    'http://localhost:3000/airlines/ai/del-bom',
  ];
  
  console.log('Testing page speeds...\n');
  
  for (const page of pages) {
    try {
      console.log(`Testing: ${page}`);
      const result = await testPageSpeed(page);
      console.log(`  Duration: ${result.duration.toFixed(2)}s`);
      console.log(`  Size: ${(result.size / 1024).toFixed(2)} KB`);
      console.log(`  Status: ${result.statusCode}`);
      console.log(`  LCP Target: < 2.5s (Current: ${result.duration > 2.5 ? '❌ FAIL' : '✅ PASS'})`);
      console.log('');
    } catch (error) {
      console.error(`Error testing ${page}:`, error.message);
    }
  }
}

runTests();

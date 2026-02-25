/**
 * Test script for MCP Server
 * 
 * Usage: node scripts/test-mcp-server.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const MCP_ENDPOINT = `${BASE_URL}/api/mcp`;

async function testMCPRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params,
  };

  try {
    const response = await fetch(MCP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error testing ${method}:`, error.message);
    return { error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing MCP Server\n');
  console.log(`Endpoint: ${MCP_ENDPOINT}\n`);

  // Test 1: Initialize
  console.log('1. Testing initialize...');
  const initResult = await testMCPRequest('initialize');
  console.log('✅ Initialize:', initResult.result?.serverInfo?.name || 'Failed');
  console.log('');

  // Test 2: List Tools
  console.log('2. Testing tools/list...');
  const toolsResult = await testMCPRequest('tools/list');
  const toolCount = toolsResult.result?.tools?.length || 0;
  console.log(`✅ Found ${toolCount} tools`);
  if (toolCount > 0) {
    console.log('   Tools:', toolsResult.result.tools.map(t => t.name).join(', '));
  }
  console.log('');

  // Test 3: Get Airline Info
  console.log('3. Testing get_airline_info (DL)...');
  const airlineResult = await testMCPRequest('tools/call', {
    name: 'get_airline_info',
    arguments: { code: 'DL' },
  });
  if (airlineResult.result?.content?.[0]?.text) {
    const airline = JSON.parse(airlineResult.result.content[0].text);
    console.log(`✅ Airline: ${airline.name || 'Not found'}`);
  } else {
    console.log('❌ Failed to get airline info');
  }
  console.log('');

  // Test 4: Get Airport Info
  console.log('4. Testing get_airport_info (JFK)...');
  const airportResult = await testMCPRequest('tools/call', {
    name: 'get_airport_info',
    arguments: { iata: 'JFK' },
  });
  if (airportResult.result?.content?.[0]?.text) {
    const airport = JSON.parse(airportResult.result.content[0].text);
    console.log(`✅ Airport: ${airport.iata_from || 'Not found'}`);
  } else {
    console.log('❌ Failed to get airport info');
  }
  console.log('');

  // Test 5: List Resources
  console.log('5. Testing resources/list...');
  const resourcesResult = await testMCPRequest('resources/list');
  const resourceCount = resourcesResult.result?.resources?.length || 0;
  console.log(`✅ Found ${resourceCount} resources`);
  if (resourceCount > 0) {
    console.log('   Resources:', resourcesResult.result.resources.map(r => r.uri).join(', '));
  }
  console.log('');

  // Test 6: Read Resource
  console.log('6. Testing resources/read (triposia://airlines)...');
  const readResult = await testMCPRequest('resources/read', {
    uri: 'triposia://airlines',
  });
  if (readResult.result?.contents?.[0]?.text) {
    const airlines = JSON.parse(readResult.result.contents[0].text);
    console.log(`✅ Retrieved ${Array.isArray(airlines) ? airlines.length : 0} airlines`);
  } else {
    console.log('❌ Failed to read resource');
  }
  console.log('');

  console.log('✨ MCP Server tests completed!');
}

// Run tests
runTests().catch(console.error);

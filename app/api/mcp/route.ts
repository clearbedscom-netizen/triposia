import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import {
  getAirline,
  getAllAirlines,
  getAirlineRoutes,
  getAirportSummary,
  getRoute,
  getRoutesFromAirport,
  getRoutesToAirport,
} from '@/lib/queries';

// MCP Protocol Implementation
// Based on Model Context Protocol specification (JSON-RPC 2.0)

interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// MCP Error Codes
const MCP_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
};

// Initialize MCP Server
async function handleInitialize(): Promise<MCPResponse> {
  return {
    jsonrpc: '2.0',
    id: null,
    result: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {
          listChanged: true,
        },
        resources: {
          subscribe: true,
          listChanged: true,
        },
      },
      serverInfo: {
        name: 'triposia-mcp-server',
        version: '1.0.0',
      },
    },
  };
}

// List available tools
async function handleToolsList(): Promise<MCPResponse> {
  return {
    jsonrpc: '2.0',
    id: null,
    result: {
      tools: [
        {
          name: 'get_airline_info',
          description: 'Get detailed information about an airline by IATA code or name',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Airline IATA code (e.g., "DL", "AA") or airline name slug',
              },
            },
            required: ['code'],
          },
        },
        {
          name: 'get_airline_routes',
          description: 'Get all routes operated by a specific airline',
          inputSchema: {
            type: 'object',
            properties: {
              airlineCode: {
                type: 'string',
                description: 'Airline IATA code (e.g., "DL", "AA")',
              },
            },
            required: ['airlineCode'],
          },
        },
        {
          name: 'get_airport_info',
          description: 'Get comprehensive information about an airport by IATA code',
          inputSchema: {
            type: 'object',
            properties: {
              iata: {
                type: 'string',
                description: 'Airport IATA code (e.g., "JFK", "LAX", "DEL")',
              },
            },
            required: ['iata'],
          },
        },
        {
          name: 'get_route_info',
          description: 'Get flight route information between two airports',
          inputSchema: {
            type: 'object',
            properties: {
              origin: {
                type: 'string',
                description: 'Origin airport IATA code',
              },
              destination: {
                type: 'string',
                description: 'Destination airport IATA code',
              },
            },
            required: ['origin', 'destination'],
          },
        },
        {
          name: 'get_routes_from_airport',
          description: 'Get all routes departing from a specific airport',
          inputSchema: {
            type: 'object',
            properties: {
              iata: {
                type: 'string',
                description: 'Airport IATA code',
              },
            },
            required: ['iata'],
          },
        },
        {
          name: 'get_routes_to_airport',
          description: 'Get all routes arriving at a specific airport',
          inputSchema: {
            type: 'object',
            properties: {
              iata: {
                type: 'string',
                description: 'Airport IATA code',
              },
            },
            required: ['iata'],
          },
        },
        {
          name: 'search_airlines',
          description: 'Search airlines by name, country, or code',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query (airline name, code, or country)',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results (default: 20)',
                default: 20,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_all_airlines',
          description: 'Get list of all airlines in the database',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Maximum number of results (default: 100)',
                default: 100,
              },
            },
          },
        },
      ],
    },
  };
}

// Call a tool
async function handleToolsCall(method: string, params: any): Promise<any> {
  switch (method) {
    case 'get_airline_info': {
      const { code } = params || {};
      if (!code) {
        throw new Error('Airline code is required');
      }
      const airline = await getAirline(code);
      if (!airline) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: 'Airline not found' }, null, 2),
            },
          ],
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(airline, null, 2),
          },
        ],
      };
    }

    case 'get_airline_routes': {
      const { airlineCode } = params || {};
      if (!airlineCode) {
        throw new Error('Airline code is required');
      }
      const routes = await getAirlineRoutes(airlineCode);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(routes, null, 2),
          },
        ],
      };
    }

    case 'get_airport_info': {
      const { iata } = params || {};
      if (!iata) {
        throw new Error('Airport IATA code is required');
      }
      const airport = await getAirportSummary(iata);
      if (!airport) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: 'Airport not found' }, null, 2),
            },
          ],
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(airport, null, 2),
          },
        ],
      };
    }

    case 'get_route_info': {
      const { origin, destination } = params || {};
      if (!origin || !destination) {
        throw new Error('Origin and destination are required');
      }
      const route = await getRoute(origin, destination);
      if (!route) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: 'Route not found' }, null, 2),
            },
          ],
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(route, null, 2),
          },
        ],
      };
    }

    case 'get_routes_from_airport': {
      const { iata } = params || {};
      if (!iata) {
        throw new Error('Airport IATA code is required');
      }
      const routes = await getRoutesFromAirport(iata);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(routes, null, 2),
          },
        ],
      };
    }

    case 'get_routes_to_airport': {
      const { iata } = params || {};
      if (!iata) {
        throw new Error('Airport IATA code is required');
      }
      const routes = await getRoutesToAirport(iata);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(routes, null, 2),
          },
        ],
      };
    }

    case 'search_airlines': {
      const { query, limit = 20 } = params || {};
      if (!query) {
        throw new Error('Search query is required');
      }
      const db = await getDatabase();
      const collection = db.collection('airlines');
      const searchRegex = new RegExp(query, 'i');
      const airlines = await collection
        .find({
          $or: [
            { name: searchRegex },
            { code: searchRegex },
            { iata: searchRegex },
            { country: searchRegex },
          ],
        })
        .limit(limit)
        .toArray();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(airlines, null, 2),
          },
        ],
      };
    }

    case 'get_all_airlines': {
      const { limit = 100 } = params || {};
      const airlines = await getAllAirlines();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(airlines.slice(0, limit), null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${method}`);
  }
}

// List available resources
async function handleResourcesList(): Promise<MCPResponse> {
  return {
    jsonrpc: '2.0',
    id: null,
    result: {
      resources: [
        {
          uri: 'triposia://airlines',
          name: 'All Airlines',
          description: 'Complete list of all airlines',
          mimeType: 'application/json',
        },
        {
          uri: 'triposia://airports',
          name: 'All Airports',
          description: 'Complete list of all airports',
          mimeType: 'application/json',
        },
        {
          uri: 'triposia://routes',
          name: 'All Routes',
          description: 'Complete list of all flight routes',
          mimeType: 'application/json',
        },
        {
          uri: 'triposia://sitemap',
          name: 'Sitemap',
          description: 'Website sitemap for discovery',
          mimeType: 'application/xml',
        },
      ],
    },
  };
}

// Read a resource
async function handleResourcesRead(uri: string): Promise<any> {
  if (uri === 'triposia://airlines') {
    const airlines = await getAllAirlines();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(airlines, null, 2),
        },
      ],
    };
  }

  if (uri === 'triposia://airports') {
    const db = await getDatabase();
    const collection = db.collection('airports');
    const airports = await collection.find({}).limit(1000).toArray();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(airports, null, 2),
        },
      ],
    };
  }

  if (uri === 'triposia://routes') {
    const db = await getDatabase();
    const collection = db.collection('routes');
    const routes = await collection.find({}).limit(1000).toArray();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(routes, null, 2),
        },
      ],
    };
  }

  if (uri === 'triposia://sitemap') {
    const sitemapUrl = 'https://triposia.com/sitemap.xml';
    return {
      contents: [
        {
          uri,
          mimeType: 'application/xml',
          text: `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${sitemapUrl}</loc>
  </sitemap>
</sitemapindex>`,
        },
      ],
    };
  }

  throw new Error(`Resource not found: ${uri}`);
}

// Main request handler
export async function POST(request: NextRequest) {
  try {
    const body: MCPRequest = await request.json();

    // Validate JSON-RPC 2.0 request
    if (body.jsonrpc !== '2.0') {
      return NextResponse.json(
        {
          jsonrpc: '2.0',
          id: body.id,
          error: {
            code: MCP_ERROR_CODES.INVALID_REQUEST,
            message: 'Invalid JSON-RPC version',
          },
        },
        { status: 400 }
      );
    }

    let response: MCPResponse;

    try {
      switch (body.method) {
        case 'initialize':
          response = await handleInitialize();
          break;

        case 'tools/list':
          response = await handleToolsList();
          break;

        case 'tools/call': {
          const { name, arguments: args } = body.params || {};
          const result = await handleToolsCall(name, args);
          response = {
            jsonrpc: '2.0',
            id: body.id,
            result,
          };
          break;
        }

        case 'resources/list':
          response = await handleResourcesList();
          break;

        case 'resources/read': {
          const { uri } = body.params || {};
          if (!uri) {
            throw new Error('Resource URI is required');
          }
          const result = await handleResourcesRead(uri);
          response = {
            jsonrpc: '2.0',
            id: body.id,
            result,
          };
          break;
        }

        default:
          response = {
            jsonrpc: '2.0',
            id: body.id,
            error: {
              code: MCP_ERROR_CODES.METHOD_NOT_FOUND,
              message: `Method not found: ${body.method}`,
            },
          };
      }
    } catch (error: any) {
      response = {
        jsonrpc: '2.0',
        id: body.id,
        error: {
          code: MCP_ERROR_CODES.INTERNAL_ERROR,
          message: error.message || 'Internal error',
        },
      };
    }

    response.id = body.id;

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error: any) {
    // Parse error
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: MCP_ERROR_CODES.PARSE_ERROR,
          message: 'Parse error',
          data: error.message,
        },
      },
      { status: 400 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// GET endpoint for discovery
export async function GET() {
  return NextResponse.json({
    name: 'Triposia MCP Server',
    version: '1.0.0',
    protocol: 'MCP',
    description: 'Model Context Protocol server for Triposia flight information',
    endpoints: {
      mcp: '/api/mcp',
      manifest: '/.well-known/mcp.json',
    },
    capabilities: {
      tools: true,
      resources: true,
    },
  });
}

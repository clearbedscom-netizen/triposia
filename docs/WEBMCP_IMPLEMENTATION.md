# WebMCP/MCP Implementation for Triposia

This document describes the Model Context Protocol (MCP) and WebMCP implementation for Triposia, enabling AI search engines and assistants to access flight information programmatically.

## Overview

We've implemented a comprehensive MCP server that exposes Triposia's flight data through the Model Context Protocol, making it accessible to:
- Google's AI search (Gemini)
- ChatGPT
- Claude (Anthropic)
- Perplexity
- Microsoft Copilot
- Other AI assistants and search engines

## Implementation Details

### 1. MCP Manifest (`.well-known/mcp.json`)

**Location:** `/.well-known/mcp.json` or `/app/.well-known/mcp.json/route.ts`

The manifest file provides discovery information for MCP clients:
- Server name and version
- Protocol version (2024-11-05)
- Server URL endpoint
- Capabilities (tools and resources)

### 2. MCP Server Endpoint

**Location:** `/app/api/mcp/route.ts`

The MCP server implements the JSON-RPC 2.0 protocol with the following methods:

#### Initialize
- **Method:** `initialize`
- **Purpose:** Handshake with MCP client
- **Returns:** Protocol version, capabilities, server info

#### Tools

The server exposes 8 tools for querying flight data:

1. **`get_airline_info`**
   - Get detailed airline information by IATA code or name
   - Parameters: `{ code: string }`
   - Returns: Airline object with all details

2. **`get_airline_routes`**
   - Get all routes operated by an airline
   - Parameters: `{ airlineCode: string }`
   - Returns: Array of route objects

3. **`get_airport_info`**
   - Get comprehensive airport information
   - Parameters: `{ iata: string }`
   - Returns: Airport summary object

4. **`get_route_info`**
   - Get flight route information between two airports
   - Parameters: `{ origin: string, destination: string }`
   - Returns: Route object

5. **`get_routes_from_airport`**
   - Get all routes departing from an airport
   - Parameters: `{ iata: string }`
   - Returns: Array of route objects

6. **`get_routes_to_airport`**
   - Get all routes arriving at an airport
   - Parameters: `{ iata: string }`
   - Returns: Array of route objects

7. **`search_airlines`**
   - Search airlines by name, code, or country
   - Parameters: `{ query: string, limit?: number }`
   - Returns: Array of matching airlines

8. **`get_all_airlines`**
   - Get list of all airlines
   - Parameters: `{ limit?: number }`
   - Returns: Array of airline objects

#### Resources

The server exposes 4 resources for bulk data access:

1. **`triposia://airlines`** - Complete list of all airlines (JSON)
2. **`triposia://airports`** - Complete list of all airports (JSON)
3. **`triposia://routes`** - Complete list of all routes (JSON)
4. **`triposia://sitemap`** - Website sitemap (XML)

### 3. Discovery & SEO

#### Meta Tags
Added to `app/layout.tsx`:
- `<link rel="mcp-manifest" href="/.well-known/mcp.json" />`
- `<meta name="mcp-server" content="https://triposia.com/api/mcp" />`
- `<meta name="mcp-protocol" content="2024-11-05" />`

#### Robots.txt
Updated to allow MCP endpoints:
```
Allow: /api/mcp
Allow: /.well-known/mcp.json
```

## Usage Examples

### Example 1: Get Airline Information

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_airline_info",
    "arguments": {
      "code": "DL"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{ ... airline data ... }"
      }
    ]
  }
}
```

### Example 2: Get Airport Routes

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_routes_from_airport",
    "arguments": {
      "iata": "JFK"
    }
  }
}
```

### Example 3: List Available Tools

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/list"
}
```

## Integration with AI Search Engines

### Google (Gemini)
Google's AI search can discover and use the MCP server through:
1. The `.well-known/mcp.json` manifest
2. Meta tags in the HTML head
3. Direct API endpoint access

### ChatGPT
ChatGPT can integrate with MCP servers through:
1. Custom GPT configurations
2. Plugin system (when available)
3. Direct API integration

### Claude (Anthropic)
Claude natively supports MCP and can:
1. Discover the server via manifest
2. Use tools for real-time data queries
3. Access resources for comprehensive information

## Error Handling

The MCP server implements standard JSON-RPC 2.0 error codes:
- `-32700`: Parse error
- `-32600`: Invalid request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error

## CORS Support

The server includes CORS headers to allow cross-origin requests from AI assistants:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## Performance Considerations

1. **Caching**: All database queries use Redis caching (via `lib/queries.ts`)
2. **Rate Limiting**: Consider implementing rate limiting for production
3. **Response Size**: Resources are limited to 1000 items by default
4. **Database Optimization**: Queries use indexed fields (IATA codes)

## Security

1. **Public Endpoint**: The MCP server is publicly accessible (required for AI discovery)
2. **Read-Only**: All operations are read-only (no data modification)
3. **Input Validation**: All parameters are validated before database queries
4. **Error Messages**: Generic error messages prevent information leakage

## Testing

### Test MCP Server
```bash
curl -X POST https://triposia.com/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

### Test Manifest
```bash
curl https://triposia.com/.well-known/mcp.json
```

## Future Enhancements

1. **Authentication**: Optional API keys for higher rate limits
2. **Webhooks**: Real-time updates for subscribed clients
3. **Streaming**: Server-Sent Events (SSE) for large responses
4. **GraphQL**: Alternative query interface
5. **More Tools**: Additional tools for flight schedules, pricing, etc.

## References

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Google WebMCP Early Preview Program](https://developer.chrome.com/blog/webmcp-epp)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)

## Support

For questions or issues with the MCP implementation:
- Email: info@triposia.com
- Documentation: This file
- API Endpoint: https://triposia.com/api/mcp

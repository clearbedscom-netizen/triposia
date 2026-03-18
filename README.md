# Triposia - Global Flight Information Platform

A comprehensive, production-ready Next.js 14 application optimized for both traditional SEO and AI search engines (ChatGPT, Gemini, Perplexity, Copilot).

## Features

- **Airport Information**: Comprehensive airport data, departures, and arrivals
- **Flight Routes**: Detailed route information with schedules and frequencies
- **Airline Data**: Complete airline information and route networks
- **SEO Optimized**: Structured data, semantic HTML, and optimized metadata
- **AI Search Ready**: Entity-driven, factual content optimized for AI answer engines
- **Admin Panel**: JWT-secured admin interface for content management

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Framework**: Material UI v5
- **Database**: MongoDB Atlas
- **Hosting**: Vercel (optimized)
- **Rendering**: Hybrid (ISR + SSR)

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd triposia
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-jwt-key
ADMIN_EMAIL=admin@triposia.com
ADMIN_PASSWORD=your-secure-password
NEXT_PUBLIC_SITE_URL=https://triposia.com
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following MongoDB collections:

### airport_summaries
```javascript
{
  iata_from: "DEL",
  destinations_count: Number,
  departure_count: Number,
  arrival_count: Number
}
```

### routes
```javascript
{
  origin_iata: "DEL",
  destination_iata: "BOM",
  destination_city: "Mumbai",
  flights_per_day: "12-21 flights",
  has_flight_data: true
}
```

### deep_routes
```javascript
{
  origin_iata: String,
  destination_iata: String,
  flight_data: {
    metadata: Object,
    price_month_data: Object,
    airlines_weekly_data: Object,
    monthly_data: Object
  }
}
```

### flights
```javascript
{
  flight_number: String,
  airline_iata: String,
  airline_name: String,
  origin_iata: String,
  destination_iata: String,
  aircraft: String,
  departure_time: String,
  arrival_time: String
}
```

### airlines
```javascript
{
  code: String,
  name: String,
  iata: String,
  icao: String,
  country: String
}
```

## URL Structure

### Airports
- `/airports/[iata]` - Airport information
- `/airports/[iata]/departures` - Departing flights
- `/airports/[iata]/arrivals` - Arriving flights

### Flights
- `/flights/[route]` - Flight route (e.g., `/flights/del-bom`)
- `/flights/from-[iata]` - All flights from airport
- `/flights/to-[iata]` - All flights to airport

### Airlines
- `/airlines/[code]` - Airline information
- `/airlines/[code]/from-[iata]` - Airline flights from airport
- `/airlines/[code]/[route]` - Airline specific route

### Admin
- `/admin/login` - Admin login
- `/admin/dashboard` - Admin dashboard
- `/admin/airports` - Manage airports
- `/admin/flights` - Manage flights
- `/admin/airlines` - Manage airlines

## Rendering Strategy

- **Airport pages**: ISR (24h revalidation)
- **Flight route pages**: ISR (24h revalidation)
- **Airline pages**: ISR (24h revalidation)
- **Departures/Arrivals**: SSR (dynamic, cached)
- **Admin pages**: Client-side only

## SEO Features

- Structured data (JSON-LD) for all entity types
- Breadcrumb navigation with schema markup
- Optimized metadata and canonical URLs
- XML sitemap generation
- robots.txt configuration
- Entity-driven, factual content

## Building for Production

```bash
npm run build
npm start
```

## Deployment

The application is optimized for Vercel deployment:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Admin Access

Default admin credentials are set via environment variables:
- `ADMIN_EMAIL`: Admin email address
- `ADMIN_PASSWORD`: Admin password

Change these in production!

## License

Private - All rights reserved

# Triposia
# triposia.com
# triping
# triping

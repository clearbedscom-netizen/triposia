# Triposia - Complete Pages & MongoDB Collections Reference

## 📋 Database: `flights`

## 📦 MongoDB Collections Used

### Core Collections:
1. **`airports`** - Airport summary data (destinations_count, departure_count, etc.)
2. **`airportfinal`** - Detailed airport information (name, city, country, coordinates, etc.)
3. **`routes`** - Flight route data (origin, destination, flights_per_day, etc.)
4. **`deep_routes`** - Extended route data with flight_data metadata
5. **`departures`** - Departure flight schedules
6. **`arrivals`** - Arrival flight schedules
7. **`airlines`** - Airline information (name, code, country, fleet, etc.)
8. **`destinations`** - Destination data
9. **`terminals`** - Airport terminal information
10. **`blogs`** - Blog posts
11. **`authors`** - Blog authors
12. **`faqs`** - User-submitted FAQs
13. **`pages_editorial`** - Editorial/manual content for pages
14. **`pois`** - Points of Interest near airports
15. **`apois`** - Alternative POIs collection
16. **`weather`** - Weather data by airport
17. **`booking_insights`** - Booking insights data
18. **`price_trends`** - Price trend data
19. **`airline_seasonal_insights`** - Seasonal insights for airlines
20. **`terminal_phones`** - Terminal phone numbers

---

## 🌐 All Pages & Their Collections

### 🏠 **Homepage & Static Pages**

#### `/` (Homepage)
**File:** `app/page.tsx`
**Collections:**
- `airports` - Total airport count
- `routes` - Total route count
- `airlines` - Total airline count
- `departures` - Total flights today

---

#### `/flights` (Flights Index)
**File:** `app/flights/page.tsx`
**Collections:**
- `routes` - All routes
- `airports` - Airport data
- `airportfinal` - Airport details

---

#### `/airlines` (Airlines Index)
**File:** `app/airlines/page.tsx`
**Collections:**
- `airlines` - All airlines
- `routes` - Routes per airline

---

#### `/airports` (Airports Index)
**File:** `app/airports/page.tsx`
**Collections:**
- `airports` - All airports
- `airportfinal` - Airport details

---

### ✈️ **Flight Route Pages**

#### `/flights/[route]` (Airport Page or Route Page)
**File:** `app/flights/[route]/page.tsx`
**Collections:**
- `airports` - Airport summary
- `airportfinal` - Airport details
- `departures` - Flights from airport
- `arrivals` - Flights to airport
- `routes` - Routes from/to airport
- `airlines` - Airline data
- `weather` - Weather by airport
- `booking_insights` - Booking insights
- `price_trends` - Price trends
- `pois` - Points of interest
- `apois` - Alternative POIs
- `pages_editorial` - Editorial content
- `faqs` - FAQs for airport

**Route Page (e.g., `/flights/del-bom`):**
- `routes` - Route data
- `deep_routes` - Deep route data
- `departures` - Flights on route
- `airports` - Origin/destination airports
- `airportfinal` - Airport details
- `airlines` - Operating airlines
- `pois` - Destination POIs
- `apois` - Destination POIs
- `weather` - Destination weather
- `booking_insights` - Booking insights
- `price_trends` - Price trends
- `pages_editorial` - Editorial content
- `faqs` - Route FAQs

---

#### `/flights/from-[iata]` (Flights From Airport)
**File:** `app/flights/from-[iata]/page.tsx`
**Collections:**
- `airports` - Airport data
- `departures` - Departures from airport
- `routes` - Routes from airport
- `airlines` - Airline data

---

#### `/flights/to-[iata]` (Flights To Airport)
**File:** `app/flights/to-[iata]/page.tsx`
**Collections:**
- `airports` - Airport data
- `arrivals` - Arrivals to airport
- `routes` - Routes to airport
- `airlines` - Airline data

---

#### `/flights/country/[country]` (Country Routes)
**File:** `app/flights/country/[country]/page.tsx`
**Collections:**
- `routes` - Routes by country
- `airports` - Airports by country
- `airportfinal` - Airport details

---

### 🛫 **Airline Pages**

#### `/airlines/[code]` (Airline Main Page)
**File:** `app/airlines/[code]/page.tsx`
**Collections:**
- `airlines` - Airline data
- `routes` - Airline routes
- `airports` - Airport data
- `pages_editorial` - Editorial content
- `faqs` - Airline FAQs

---

#### `/airlines/[code]/[route]` (Airline-Airport or Airline-Route Page)
**File:** `app/airlines/[code]/[route]/page.tsx`
**Collections:**
- `airlines` - Airline data
- `airports` - Airport data
- `airportfinal` - Airport details
- `departures` - Airline departures
- `arrivals` - Airline arrivals
- `routes` - Routes for airline
- `weather` - Weather data
- `booking_insights` - Booking insights
- `airline_seasonal_insights` - Seasonal insights
- `terminal_phones` - Terminal info
- `pois` - POIs
- `apois` - Alternative POIs
- `pages_editorial` - Editorial content
- `faqs` - FAQs

**Route Page (e.g., `/airlines/6e/del-bom`):**
- `routes` - Route data
- `deep_routes` - Deep route data
- `departures` - Airline flights on route
- `airports` - Origin/destination airports
- `airportfinal` - Airport details
- `airlines` - Airline data
- `pois` - Destination POIs
- `apois` - Destination POIs
- `weather` - Destination weather
- `booking_insights` - Booking insights
- `price_trends` - Price trends
- `airline_seasonal_insights` - Seasonal insights
- `terminal_phones` - Terminal info
- `pages_editorial` - Editorial content
- `faqs` - FAQs

---

#### `/airlines/routes` (All Airline Routes)
**File:** `app/airlines/routes/page.tsx`
**Collections:**
- `airlines` - All airlines
- `routes` - All routes grouped by airline
- `airports` - Airport data
- `airportfinal` - Airport details

---

### 🏢 **Airport Pages**

#### `/airports/[iata]` (Airport Details Page)
**File:** `app/airports/[iata]/page.tsx`
**Collections:**
- `airports` - Airport summary
- `airportfinal` - Airport details
- `routes` - Routes from/to airport
- `departures` - Departures
- `arrivals` - Arrivals
- `airlines` - Operating airlines
- `terminals` - Terminal information
- `pois` - Points of interest
- `apois` - Alternative POIs
- `weather` - Weather data
- `booking_insights` - Booking insights
- `price_trends` - Price trends
- `pages_editorial` - Editorial content
- `faqs` - FAQs

---

#### `/airports/[iata]/departures` (Airport Departures)
**File:** `app/airports/[iata]/departures/page.tsx`
**Collections:**
- `airports` - Airport data
- `departures` - Departure flights
- `airlines` - Airline data

---

#### `/airports/[iata]/arrivals` (Airport Arrivals)
**File:** `app/airports/[iata]/arrivals/page.tsx`
**Collections:**
- `airports` - Airport data
- `arrivals` - Arrival flights
- `airlines` - Airline data

---

#### `/airports/country/[country]` (Country Airports)
**File:** `app/airports/country/[country]/page.tsx`
**Collections:**
- `airports` - Airports by country
- `airportfinal` - Airport details

---

### 📝 **Blog Pages**

#### `/blog` (Blog Index)
**File:** `app/blog/page.tsx`
**Collections:**
- `blogs` - All blog posts
- `authors` - Author data

---

#### `/blog/[slug]` (Blog Post)
**File:** `app/blog/[slug]/page.tsx`
**Collections:**
- `blogs` - Blog post data
- `authors` - Author information
- `faqs` - FAQs for blog post

---

#### `/blog/author/[slug]` (Author Page)
**File:** `app/blog/author/[slug]/page.tsx`
**Collections:**
- `authors` - Author data
- `blogs` - Author's blog posts

---

#### `/blog/category/[slug]` (Category Page)
**File:** `app/blog/category/[slug]/page.tsx`
**Collections:**
- `blogs` - Blog posts by category
- `authors` - Author data

---

### 👥 **Team & Info Pages**

#### `/team` (Team Page)
**File:** `app/team/page.tsx`
**Collections:**
- `authors` - Team members/authors

---

#### `/corrections` (Corrections Page)
**File:** `app/corrections/page.tsx`
**Collections:**
- None (static page)

---

#### `/how-we-help` (How We Help)
**File:** `app/how-we-help/page.tsx`
**Collections:**
- None (static page)

---

#### `/manifesto` (Manifesto)
**File:** `app/manifesto/page.tsx`
**Collections:**
- None (static page)

---

#### `/editorial-policy` (Editorial Policy)
**File:** `app/editorial-policy/page.tsx`
**Collections:**
- None (static page)

---

### 🔐 **Auth Pages**

#### `/login` (Login)
**File:** `app/login/page.tsx`
**Collections:**
- `users` - User authentication (via NextAuth)

---

#### `/register` (Register)
**File:** `app/register/page.tsx`
**Collections:**
- `users` - User registration (via NextAuth)

---

### 🔧 **Admin Pages**

#### `/admin/login` (Admin Login)
**File:** `app/admin/login/page.tsx`
**Collections:**
- `users` - Admin authentication

---

#### `/admin/dashboard` (Admin Dashboard)
**File:** `app/admin/dashboard/page.tsx`
**Collections:**
- `airports` - Airport count
- `routes` - Route count
- `airlines` - Airline count
- `blogs` - Blog count
- `faqs` - FAQ count

---

#### `/admin/airports` (Admin Airports)
**File:** `app/admin/airports/page.tsx`
**Collections:**
- `airports` - All airports
- `airportfinal` - Airport details

---

#### `/admin/airlines` (Admin Airlines)
**File:** `app/admin/airlines/page.tsx`
**Collections:**
- `airlines` - All airlines

---

#### `/admin/flights` (Admin Flights)
**File:** `app/admin/flights/page.tsx`
**Collections:**
- `departures` - Departure flights
- `arrivals` - Arrival flights
- `routes` - Routes

---

### 🗺️ **Sitemap Pages**

All sitemap files generate URLs from:
- `routes` - Flight routes
- `airports` - Airports
- `airlines` - Airlines
- `blogs` - Blog posts

---

## 📊 Collection Usage Summary

### Most Used Collections:
1. **`airports`** - Used in 20+ pages
2. **`routes`** - Used in 15+ pages
3. **`airlines`** - Used in 12+ pages
4. **`departures`** - Used in 8+ pages
5. **`arrivals`** - Used in 6+ pages
6. **`airportfinal`** - Used in 10+ pages
7. **`pages_editorial`** - Used in 8+ pages
8. **`faqs`** - Used in 10+ pages
9. **`blogs`** - Used in 4+ pages
10. **`authors`** - Used in 3+ pages

### Specialized Collections:
- **`deep_routes`** - Extended route metadata
- **`weather`** - Weather data
- **`booking_insights`** - Booking insights
- **`price_trends`** - Price trends
- **`airline_seasonal_insights`** - Seasonal data
- **`terminal_phones`** - Terminal information
- **`pois`** / **`apois`** - Points of interest
- **`terminals`** - Terminal data
- **`destinations`** - Destination data

---

## 🔍 Query Functions Reference

### Main Query Functions (from `lib/queries.ts`):
- `getAirportSummary()` → `airports` + `airportfinal`
- `getAirportDetails()` → `airportfinal`
- `getRoutesFromAirport()` → `routes`
- `getRoutesToAirport()` → `routes`
- `getFlightsFromAirport()` → `departures`
- `getFlightsToAirport()` → `arrivals`
- `getFlightsByRoute()` → `departures`
- `getRoute()` → `routes`
- `getDeepRoute()` → `deep_routes`
- `getAirline()` → `airlines`
- `getAirlineRoutes()` → `routes` + `airlines`
- `getWeatherByAirport()` → `weather`
- `getBookingInsightsByAirport()` → `booking_insights`
- `getPriceTrendsByAirport()` → `price_trends`
- `getPoisByAirport()` → `pois`
- `getApoisByAirport()` → `apois`
- `getTerminalPhones()` → `terminal_phones`

### Editorial & Content Functions:
- `getEditorialPage()` → `pages_editorial`
- `findFAQsByPage()` → `faqs`

---

## 📝 Notes

1. **Caching**: Most queries use Redis caching via `lib/redis.ts`
2. **Indexes**: MongoDB indexes are defined in `scripts/create-indexes.js`
3. **Database Name**: All collections are in the `flights` database
4. **Editorial Content**: `pages_editorial` collection allows manual content override
5. **FAQs**: User-submitted FAQs stored in `faqs` collection
6. **Blogs**: Blog posts with authors stored in `blogs` and `authors` collections

---

## 🚀 Quick Reference

**To find which collections a page uses:**
1. Check the page file in `app/[path]/page.tsx`
2. Look for imports from `@/lib/queries`
3. Check the query functions to see which collections they access
4. Reference this document for the mapping

**To find which pages use a collection:**
1. Search for collection name in this document
2. Check `lib/queries.ts` for query functions using that collection
3. Search for those query functions in page files

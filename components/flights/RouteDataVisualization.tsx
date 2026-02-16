'use client';

import { Box, Paper, Typography, Grid } from '@mui/material';
import dynamic from 'next/dynamic';
import ErrorBoundary from '../ui/ErrorBoundary';

// Lazy load charts
const BarChart = dynamic(() => import('recharts').then(mod => ({ default: mod.BarChart })), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => ({ default: mod.Bar })), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => ({ default: mod.PieChart })), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => ({ default: mod.Pie })), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => ({ default: mod.Cell })), { ssr: false });
const LineChart = dynamic(() => import('recharts').then(mod => ({ default: mod.LineChart })), { ssr: false });
const Line = dynamic(() => import('recharts').then(mod => ({ default: mod.Line })), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.XAxis })), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.YAxis })), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => ({ default: mod.Tooltip })), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => ({ default: mod.Legend })), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })), { ssr: false });

interface Route {
  iata: string;
  display: string;
  flights_per_day: string;
  flights_per_week?: number;
  airline_count?: number;
  popularity_score?: number;
}

interface AirlineData {
  code: string;
  name: string;
  routeCount: number;
  delayPercent?: number;
}

interface RouteDataVisualizationProps {
  routes: Route[];
  airlines: AirlineData[];
  originDisplay: string;
}

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#9c27b0', '#0288d1', '#388e3c', '#f57c00', '#c62828', '#7b1fa2'];

export default function RouteDataVisualization({
  routes,
  airlines,
  originDisplay,
}: RouteDataVisualizationProps) {
  // Parse flights per day
  const parseFlightsPerDay = (fpd: string): number => {
    const match = fpd.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Top 10 busiest destinations
  const topDestinations = [...routes]
    .sort((a, b) => parseFlightsPerDay(b.flights_per_day) - parseFlightsPerDay(a.flights_per_day))
    .slice(0, 10)
    .map(route => ({
      name: route.display.length > 20 ? route.display.substring(0, 20) + '...' : route.display,
      flights: parseFlightsPerDay(route.flights_per_day),
      fullName: route.display,
    }));

  // Airline share data
  const airlineShareData = airlines
    .filter(a => a.routeCount > 0)
    .sort((a, b) => b.routeCount - a.routeCount)
    .slice(0, 10)
    .map((airline, index) => ({
      name: airline.name.length > 15 ? airline.name.substring(0, 15) + '...' : airline.name,
      value: airline.routeCount,
      fullName: airline.name,
      delayPercent: airline.delayPercent,
    }));

  // Route growth trend (placeholder - would need historical data)
  const growthTrendData = [
    { month: 'Jan', routes: routes.length },
    { month: 'Feb', routes: routes.length },
    { month: 'Mar', routes: routes.length },
    { month: 'Apr', routes: routes.length },
    { month: 'May', routes: routes.length },
    { month: 'Jun', routes: routes.length },
  ];

  return (
    <ErrorBoundary>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: 3, textAlign: 'left' }}>
          Route Analytics
        </Typography>
        
        <Grid container spacing={3}>
          {/* Top 10 Busiest Destinations Bar Chart */}
          {topDestinations.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h3" sx={{ fontSize: '1.25rem', mb: 2, fontWeight: 600 }}>
                  Top 10 Busiest Destinations
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topDestinations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: any) => [`${typeof value === 'number' ? value.toFixed(1) : value} flights/day`, 'Daily Flights']}
                      labelFormatter={(label: any) => topDestinations.find(d => d.name === label)?.fullName || label}
                    />
                    <Bar dataKey="flights" fill="#1976d2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}

          {/* Airline Share Pie Chart */}
          {airlineShareData.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h3" sx={{ fontSize: '1.25rem', mb: 2, fontWeight: 600 }}>
                  Airline Share at {originDisplay}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={airlineShareData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => {
                        const name = props.name || '';
                        const percent = props.percent || 0;
                        return `${name}: ${(percent * 100).toFixed(0)}%`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {airlineShareData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`${value} routes`, 'Routes']}
                      labelFormatter={(label: any) => airlineShareData.find(a => a.name === label)?.fullName || label}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}

          {/* Route Growth Trend Line Chart */}
          {growthTrendData.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h3" sx={{ fontSize: '1.25rem', mb: 2, fontWeight: 600 }}>
                  Route Growth Trend
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={growthTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="routes" stroke="#1976d2" strokeWidth={2} name="Total Routes" />
                  </LineChart>
                </ResponsiveContainer>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  * Growth trend data is estimated. Historical data coming soon.
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Delay % Badges per Airline */}
          {airlines.some(a => a.delayPercent !== undefined) && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h3" sx={{ fontSize: '1.25rem', mb: 2, fontWeight: 600 }}>
                  On-Time Performance by Airline
                </Typography>
                <Grid container spacing={2}>
                  {airlines
                    .filter(a => a.delayPercent !== undefined)
                    .map((airline) => (
                      <Grid item xs={12} sm={6} md={4} key={airline.code}>
                        <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            {airline.name}
                          </Typography>
                          <Typography variant="h6" sx={{ 
                            color: airline.delayPercent! < 10 ? 'success.main' : 
                                   airline.delayPercent! < 20 ? 'warning.main' : 'error.main',
                            fontWeight: 600,
                          }}>
                            {airline.delayPercent?.toFixed(1)}% delays
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {airline.routeCount} routes
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                </Grid>
                {airlines.every(a => a.delayPercent === undefined) && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Delay data coming soon
                  </Typography>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </ErrorBoundary>
  );
}

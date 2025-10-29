# Geolocation Feature Guide

This guide explains how to use the geolocation functionality to recommend local gyms, events, and other location-based features.

## Overview

The geolocation system consists of:
1. **Database schema** - Adds latitude/longitude columns to relevant tables
2. **Utility library** - Core geolocation functions (`lib/geolocation.js`)
3. **React hooks** - Easy-to-use hooks for components (`hooks/useGeolocation.js`)
4. **Supabase functions** - Server-side distance calculations

## Setup

### 1. Run Database Migration

Execute the SQL migration to add geolocation columns:

```sql
-- Run this in your Supabase SQL Editor
\i proj/sql-scripts/add-geolocation-support.sql
```

This will:
- Add `latitude` and `longitude` columns to `gyms`, `events`, and `profiles` tables
- Create indexes for efficient location queries
- Add database functions for calculating distances and finding nearby items

### 2. Add Coordinates to Existing Data

For existing gyms/events, you'll need to geocode their addresses. You can do this:

**Option A: Manual entry** - Manually add coordinates via Supabase dashboard

**Option B: Bulk geocoding script** - Create a script to geocode all addresses:

```javascript
import { geocodeAddress } from './lib/geolocation.js';
import { supabase } from './lib/supabase.js';

async function geocodeGyms() {
  const { data: gyms } = await supabase.from('gyms').select('*');
  
  for (const gym of gyms) {
    if (!gym.latitude || !gym.longitude) {
      try {
        const address = `${gym.address}, ${gym.city}, ${gym.country}`;
        const coords = await geocodeAddress(address);
        
        await supabase
          .from('gyms')
          .update({
            latitude: coords.latitude,
            longitude: coords.longitude,
          })
          .eq('id', gym.id);
        
        console.log(`Geocoded ${gym.name}`);
        // Add delay to respect rate limits (Nominatim: 1 req/sec)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to geocode ${gym.name}:`, error);
      }
    }
  }
}
```

## Usage

### Basic Geolocation Hook

```jsx
import { useGeolocation } from './hooks/useGeolocation';

function MyComponent() {
  const { location, loading, error, requestLocation } = useGeolocation();

  return (
    <div>
      {loading && <p>Getting your location...</p>}
      {error && <p>Error: {error.message}</p>}
      {location && (
        <p>You are at: {location.latitude}, {location.longitude}</p>
      ))}
      <button onClick={requestLocation}>Get My Location</button>
    </div>
  );
}
```

### Auto-Request Location

```jsx
// Automatically request location when component mounts
const { location, loading } = useGeolocation({ autoRequest: true });
```

### Finding Nearby Gyms

```jsx
import { useNearbyGyms } from './hooks/useGeolocation';

function NearbyGymsList() {
  const { gyms, loading, error, requestLocation } = useNearbyGyms({
    radiusKm: 25, // Search within 25km
    limit: 10,    // Maximum 10 results
  });

  if (loading) return <div>Loading nearby gyms...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!gyms.length) {
    return (
      <div>
        <p>No nearby gyms found</p>
        <button onClick={requestLocation}>Enable Location</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Nearby Gyms</h2>
      {gyms.map(gym => (
        <div key={gym.id}>
          <h3>{gym.name}</h3>
          <p>{formatDistance(gym.distance_km)} away</p>
        </div>
      ))}
    </div>
  );
}
```

### Finding Nearby Events

```jsx
import { useNearbyEvents } from './hooks/useGeolocation';

function NearbyEventsList() {
  const { events, loading } = useNearbyEvents({ radiusKm: 50 });

  // Similar usage as nearby gyms
}
```

### Direct Utility Functions

```javascript
import { 
  getCurrentLocation, 
  calculateDistance, 
  geocodeAddress,
  formatDistance 
} from './lib/geolocation';

// Get user location
const location = await getCurrentLocation();

// Calculate distance
const distance = calculateDistance(51.5074, -0.1278, 51.5094, -0.1280);
console.log(`Distance: ${formatDistance(distance)}`);

// Geocode an address
const coords = await geocodeAddress('123 Main St, London, UK');
console.log(coords); // { latitude, longitude, formatted_address }
```

### Using Supabase RPC Functions

The migration creates database functions you can call directly:

```javascript
// Find nearby gyms (server-side)
const { data, error } = await supabase.rpc('find_nearby_gyms', {
  user_lat: 51.5074,
  user_lon: -0.1278,
  radius_km: 25,
  limit_count: 10,
});

// Find nearby events (server-side)
const { data, error } = await supabase.rpc('find_nearby_events', {
  user_lat: 51.5074,
  user_lon: -0.1278,
  radius_km: 50,
  limit_count: 20,
});
```

## Best Practices

### 1. Handle Permissions Gracefully

Always provide fallback options when location is denied:

```jsx
const { location, permissionStatus, requestLocation } = useGeolocation();

if (permissionStatus === 'denied') {
  return (
    <div>
      <p>Location access denied. Please enable it in your browser settings.</p>
      <p>You can still browse all gyms manually.</p>
    </div>
  );
}
```

### 2. Cache Location

The hook automatically saves location to user profile, but you can also cache in localStorage:

```javascript
// Save to localStorage
localStorage.setItem('userLocation', JSON.stringify(location));

// Load from localStorage
const cached = JSON.parse(localStorage.getItem('userLocation'));
```

### 3. Rate Limiting for Geocoding

OpenStreetMap Nominatim has rate limits (1 request/second). If you need higher volume, consider:
- Caching geocoded addresses
- Using a paid service (Google Maps, Mapbox)
- Batch geocoding during data entry

### 4. Privacy Considerations

- Only request location when needed
- Explain why you need location access
- Allow users to manually set location
- Don't store precise location without consent

### 5. Performance

- Use database RPC functions for large datasets (more efficient)
- Client-side filtering is fine for small datasets (< 100 items)
- Add indexes on latitude/longitude columns
- Consider using PostGIS extension for advanced spatial queries

## Integration Examples

### Update Gym Request Form

When users submit a gym request Alert, auto-geocode the address:

```jsx
import { geocodeAddress } from '../../lib/geolocation';

const handleSubmit = async (formData) => {
  // Geocode address
  const coords = await geocodeAddress(
    `${formData.address}, ${formData.city}, ${formData.country}`
  );
  
  // Submit with coordinates
  await submitGymRequest({
    ...formData,
    latitude: coords.latitude,
    longitude: coords.longitude,
  });
};
```

### Update Gym Listing with Distance

```jsx
import { useGeolocation, formatDistance } from './hooks/useGeolocation';
import { calculateDistance } from './lib/geolocation';

function GymCard({ gym }) {
  const { location } = useGeolocation();
  
  const distance = location && gym.latitude 
    ? calculateDistance(
        location.latitude, 
        location.longitude, 
        gym.latitude, 
        gym.longitude
      )
    : null;

  return (
    <div>
      <h3>{gym.name}</h3>
      {distance && <p>{formatDistance(distance)} away</p>}
      <p>{gym.address}</p>
    </div>
  );
}
```

### Sort Gyms by Distance

```jsx
import { findNearbyItems } from './lib/geolocation';

function GymsList({ gyms }) {
  const { location } = useGeolocation();
  
  const sortedGyms = location
    ? findNearbyItems(gyms, location.latitude, location.longitude, 50)
    : gyms;

  return (
    <div>
      {sortedGyms.map(gym => (
        <GymCard 
          key={gym.id} 
          gym={gym} 
          distance={gym.distance_km}
        />
      ))}
    </div>
  );
}
```

## Troubleshooting

### Location Not Working

1. **Check browser support**: Ensure HTTPS (required for geolocation)
2. **Check permissions**: User must grant location access
3. **Check fallback**: The code falls back to client-side filtering if RPC fails

### Geocoding Fails

1. **Rate limiting**: Add delays between requests (1 second minimum for Nominatim)
2. **Invalid addresses**: Validate addresses before geocoding
3. **Service downtime**: Implement retry logic or use a backup service

### Database Functions Not Working

1. **Check migration**: Ensure SQL migration was run successfully
2. **Check indexes**: Verify indexes were created (might need PostGIS extension)
3. **Check permissions**: Ensure RLS policies allow function execution

## Next Steps

1. Run the migration script
2. Geocode existing gym pictures
3. Add location request UI to your gyms/events pages
4. Test with different locations
5. Monitor performance and optimize as needed

For questions or issues, refer to the source code comments or create an issue in your project repository.


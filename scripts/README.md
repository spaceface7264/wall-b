# Scripts

This directory contains utility scripts for the project.

## find-gyms.js

A command-line script to search for gyms in different cities and countries.

### Usage

```bash
npm run find-gyms
```

Or directly:
```bash
node scripts/find-gyms.js
```

### Features

- Search gyms by city name (e.g., "berlin")
- Search gyms by country name (e.g., "denmark")
- Search gyms by city and country (e.g., "copenhagen, denmark")
- List all available countries with gyms
- Interactive command-line interface

### Examples

1. **Search by city:**
   ```
   Enter search term: berlin
   ```

2. **Search by city and country:**
   ```
   Enter search term: copenhagen, denmark
   ```

3. **Search by country:**
   ```
   Enter search term: denmark
   ```

4. **List all countries:**
   ```
   Enter search term: list-countries
   ```

5. **Exit:**
   ```
   Enter search term: exit
   ```

### Environment Variables

The script requires Supabase credentials. You can provide them in one of these ways:

1. **Environment variables:**
   - `VITE_SUPABASE_URL` or `SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY` or `SUPABASE_KEY`

2. **`.env` file in the project root:**
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Output

The script displays:
- Gym name
- Location (city, country)
- Address
- Facilities (if available)
- Price range (if available)
- Website (if available)
- Phone (if available)
- Gym ID

When searching by country, it also shows all cities with gyms in that country.



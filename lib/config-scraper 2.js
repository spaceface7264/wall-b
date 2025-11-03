// Scraper Configuration
// Configuration for Google Places API scraping

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env file if running in Node.js
if (typeof process !== 'undefined' && process.env && typeof window === 'undefined') {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const projectRoot = join(__dirname, '..');
    const envPath = join(projectRoot, '.env');
    
    const envFile = readFileSync(envPath, 'utf-8');
    const envLines = envFile.split('\n');
    
    for (const line of envLines) {
      const trimmed = line.trim();
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        // Only set if not already set (process.env takes precedence)
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  } catch (error) {
    // .env file not found or couldn't be read, continue with existing env vars
    // Silent fail - we'll check for the key later
  }
}

// Get environment variable (works in both Node.js and Vite)
const getEnv = (key) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  return undefined;
};

const scraperConfig = {
  // Google Places API Configuration
  googlePlaces: {
    apiKey: getEnv('VITE_GOOGLE_PLACES_API_KEY'),
    baseUrl: 'https://maps.googleapis.com/maps/api/place',
    textSearchEndpoint: '/textsearch/json',
    detailsEndpoint: '/details/json',
    // Rate limiting: 10 requests/second, 40,000 requests/day
    rateLimit: {
      requestsPerSecond: 10,
      delayBetweenRequests: 100, // milliseconds
      maxRetries: 3,
      retryDelay: 1000, // milliseconds
    },
  },

  // Search Configuration
  search: {
    // Danish cities to search in
    cities: [
      'Copenhagen',
      'Aarhus',
      'Odense',
      'Aalborg',
      'Esbjerg',
      'Randers',
      'Kolding',
      'Horsens',
      'Vejle',
      'Roskilde',
      'Herning',
      'Helsingør',
      'Silkeborg',
      'Næstved',
      'Fredericia',
    ],
    // Search queries - focused on climbing gyms only
    queries: [
      'klatrehal', // climbing hall (Danish)
      'Climbing Gym', // English
      'bouldering gym', // bouldering specific
      'rock climbing gym', // rock climbing specific
      'indoor climbing', // indoor climbing
    ],
    // Country restriction
    country: 'Denmark',
    countryCode: 'DK',
  },

  // Validation
  validate() {
    if (!this.googlePlaces.apiKey) {
      throw new Error('VITE_GOOGLE_PLACES_API_KEY is required. Please set it in your .env file.');
    }
    return true;
  },
};

export default scraperConfig;


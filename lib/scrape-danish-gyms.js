/**
 * Danish Gyms Scraper
 * Script to scrape climbing gyms in Denmark using Google Places API
 * Creates gym requests for admin review
 * 
 * Usage: node lib/scrape-danish-gyms.js
 * 
 * Requires environment variables:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 * - VITE_GOOGLE_PLACES_API_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { searchAndFetchGyms, isDuplicateGym } from './scrape-gyms.js';
import scraperConfig from './config-scraper.js';
import { geocodeAddress } from './geolocation.js';

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
    console.warn('⚠️  Could not load .env file, using system environment variables only');
  }
}

// Get environment variables (works in both Node.js and Vite)
const getEnv = (key) => {
  // Try process.env first (Node.js), then import.meta.env (Vite)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

// Validate configuration
if (!supabaseUrl || (!supabaseAnonKey && !serviceRoleKey)) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and either VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

try {
  scraperConfig.validate();
} catch (error) {
  console.error('❌', error.message);
  process.exit(1);
}

// Initialize Supabase client
// Use service role key if available (bypasses RLS), otherwise use anon key
const supabaseKey = serviceRoleKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

if (serviceRoleKey) {
  console.log('🔑 Using service role key (RLS bypass enabled)');
} else {
  console.warn('⚠️  Using anon key - RLS policies will apply. For scraping, consider using SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Get system user ID for creating gym requests
 * Uses the first admin user found, or null if using service role key
 */
async function getSystemUser() {
  // If using service role key, we can use any admin user or leave null
  // If using anon key, we need to use an admin user's ID
  const { data: adminUsers } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_admin', true)
    .limit(1);

  if (adminUsers && adminUsers.length > 0) {
    return adminUsers[0].id;
  }

  // If no admin found, warn but continue (service role key can bypass this)
  console.warn('⚠️  No admin user found. Using null user_id (requires service role key for RLS bypass)');
  return null;
}

/**
 * Geocode address if lat/lng not available
 */
async function enrichWithGeocoding(gymRequest) {
  if ((!gymRequest.latitude || !gymRequest.longitude) && gymRequest.address) {
    try {
      console.log(`Geocoding address for ${gymRequest.gym_name}...`);
      const geocoded = await geocodeAddress(gymRequest.address);
      gymRequest.latitude = geocoded.latitude;
      gymRequest.longitude = geocoded.longitude;
      console.log(`✓ Geocoded: ${gymRequest.latitude}, ${gymRequest.longitude}`);
    } catch (error) {
      console.warn(`⚠ Failed to geocode ${gymRequest.gym_name}:`, error.message);
    }
  }
  return gymRequest;
}

/**
 * Create gym request in database
 */
async function createGymRequest(gymRequest, systemUserId) {
  // Check for duplicates
  const isDuplicate = await isDuplicateGym(supabase, gymRequest.gym_name, gymRequest.city);
  
  if (isDuplicate) {
    console.log(`⊘ Skipping duplicate: ${gymRequest.gym_name} in ${gymRequest.city}`);
    return { skipped: true, reason: 'duplicate' };
  }

  // Enrich with geocoding if needed
  const enrichedRequest = await enrichWithGeocoding(gymRequest);

  // Prepare data for insertion
  // Note: Only include fields that exist in the base schema
  // Run sql-scripts/add-facilities-to-gym-requests.sql to add facilities column
  const requestData = {
    gym_name: enrichedRequest.gym_name,
    country: enrichedRequest.country,
    city: enrichedRequest.city,
    address: enrichedRequest.address || null,
    phone: enrichedRequest.phone,
    email: enrichedRequest.email,
    website: enrichedRequest.website,
    description: enrichedRequest.description,
    // facilities: enrichedRequest.facilities || [], // Uncomment if column exists
    status: 'pending',
  };

  // Add Google ratings if available (only if columns exist in schema)
  // Note: Run sql-scripts/add-google-ratings-to-gyms.sql to add these columns
  // For now, we'll skip them to avoid schema errors
  // Uncomment below if you've added the columns:
  /*
  if (enrichedRequest.source_data) {
    if (enrichedRequest.source_data.rating) {
      requestData.google_rating = enrichedRequest.source_data.rating;
    }
    if (enrichedRequest.source_data.user_ratings_total) {
      requestData.google_ratings_count = enrichedRequest.source_data.user_ratings_total;
    }
  }
  */

  // Add user_id if available
  if (systemUserId) {
    requestData.user_id = systemUserId;
  }

  try {
    const { data, error } = await supabase
      .from('gym_requests')
      .insert(requestData)
      .select()
      .single();

    if (error) {
      console.error(`✗ Failed to create request for ${gymRequest.gym_name}:`, error.message);
      return { error: true, message: error.message };
    }

    console.log(`✓ Created request: ${gymRequest.gym_name} in ${gymRequest.city}`);
    return { success: true, data };
  } catch (error) {
    console.error(`✗ Error creating request for ${gymRequest.gym_name}:`, error.message);
    return { error: true, message: error.message };
  }
}

/**
 * Main scraping function
 */
async function scrapeDanishGyms() {
  console.log('🇩🇰 Starting Danish gyms scraper...\n');
  console.log(`Searching in ${scraperConfig.search.cities.length} cities`);
  console.log(`Using ${scraperConfig.search.queries.length} search queries\n`);

  const systemUserId = await getSystemUser();
  if (!systemUserId) {
    console.warn('⚠ Warning: No admin user found. Gym requests will be created without user_id.');
    console.warn('   This might require schema changes or manual user assignment.\n');
  }

  const allGyms = [];
  const stats = {
    found: 0,
    created: 0,
    skipped: 0,
    errors: 0,
  };

  // Search in each city with each query
  for (const city of scraperConfig.search.cities) {
    console.log(`\n📍 Searching in ${city}...`);
    
    for (const query of scraperConfig.search.queries) {
      try {
        const location = `${city}, Denmark`;
        const gyms = await searchAndFetchGyms(query, location);
        
        stats.found += gyms.length;
        console.log(`  Found ${gyms.length} gyms for "${query}"`);

        // Process each gym
        for (const gym of gyms) {
          // Ensure city is set
          if (!gym.city) {
            gym.city = city;
          }

          const result = await createGymRequest(gym, systemUserId);
          
          if (result.skipped) {
            stats.skipped++;
          } else if (result.success) {
            stats.created++;
            allGyms.push(result.data);
          } else {
            stats.errors++;
          }
        }
      } catch (error) {
        console.error(`  ✗ Error searching "${query}" in ${city}:`, error.message);
        stats.errors++;
      }

      // Small delay between queries
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Scraping Summary');
  console.log('='.repeat(50));
  console.log(`Found: ${stats.found} gyms`);
  console.log(`Created: ${stats.created} requests`);
  console.log(`Skipped (duplicates): ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
  console.log('='.repeat(50));

  if (stats.created > 0) {
    console.log(`\n✅ Successfully created ${stats.created} gym requests!`);
    console.log('   Review and approve them in the admin panel.');
  }

  return { stats, gyms: allGyms };
}

// Run if executed directly (detect in both Node.js ESM and CommonJS contexts)
const isMainModule = () => {
  if (typeof process !== 'undefined' && process.argv) {
    const mainModule = process.argv[1];
    return mainModule && (
      mainModule.includes('scrape-danish-gyms.js') ||
      import.meta.url === `file://${mainModule}`
    );
  }
  // If running in browser/Vite context, don't auto-execute
  return false;
};

if (isMainModule()) {
  scrapeDanishGyms()
    .then(() => {
      console.log('\n✨ Done!');
      if (typeof process !== 'undefined' && process.exit) {
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('\n❌ Fatal error:', error);
      if (typeof process !== 'undefined' && process.exit) {
        process.exit(1);
      }
    });
}

export default scrapeDanishGyms;


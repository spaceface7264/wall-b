#!/usr/bin/env node

/**
 * Find Gyms by Country/City Script
 * 
 * This script allows you to search for gyms in different cities and countries.
 * Usage: node scripts/find-gyms.js
 * 
 * Example inputs:
 * - "berlin" (will search for Berlin in any country)
 * - "copenhagen, denmark"
 * - "denmark" (will list all cities with gyms in Denmark)
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file if it exists
function loadEnvFile() {
  const envPath = join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    Object.entries(envVars).forEach(([key, value]) => {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
  }
}

loadEnvFile();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please set the following environment variables:');
  console.error('  VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('  VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY');
  console.error('\nOr create a .env file in the project root with:');
  console.error('  VITE_SUPABASE_URL=your_supabase_url');
  console.error('  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask a question
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Helper function to format gym data
function formatGym(gym) {
  const facilities = gym.facilities ? (Array.isArray(gym.facilities) ? gym.facilities : []) : [];
  const facilitiesStr = facilities.length > 0 
    ? `\n  Facilities: ${facilities.slice(0, 5).join(', ')}${facilities.length > 5 ? ` (+${facilities.length - 5} more)` : ''}`
    : '';
  
  const priceStr = gym.price_range ? `\n  Price: ${gym.price_range}` : '';
  const websiteStr = gym.website ? `\n  Website: ${gym.website}` : '';
  const phoneStr = gym.phone ? `\n  Phone: ${gym.phone}` : '';
  
  return `
📍 ${gym.name}
  Location: ${gym.city}, ${gym.country}
  Address: ${gym.address}${facilitiesStr}${priceStr}${websiteStr}${phoneStr}
  ID: ${gym.id}
`;
}

// Search gyms by country and/or city
async function searchGyms(searchTerm) {
  try {
    console.log(`\n🔍 Searching for gyms matching "${searchTerm}"...\n`);

    // Parse search term - could be "city", "city, country", or "country"
    const searchLower = searchTerm.toLowerCase();
    const parts = searchTerm.split(',').map(p => p.trim());
    
    let query = supabase
      .from('gyms')
      .select('*')
      .order('name', { ascending: true });

    if (parts.length === 2) {
      // Format: "city, country"
      query = query
        .ilike('city', `%${parts[0]}%`)
        .ilike('country', `%${parts[1]}%`);
    } else {
      // Try to match city first, then country
      query = query.or(`city.ilike.%${searchLower}%,country.ilike.%${searchLower}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error querying gyms:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Get all unique countries
async function getAllCountries() {
  try {
    const { data, error } = await supabase
      .from('gyms')
      .select('country')
      .order('country', { ascending: true });

    if (error) {
      console.error('❌ Error fetching countries:', error.message);
      return [];
    }

    const uniqueCountries = [...new Set(data.map(g => g.country))];
    return uniqueCountries;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return [];
  }
}

// Get all cities in a country
async function getCitiesInCountry(country) {
  try {
    const { data, error } = await supabase
      .from('gyms')
      .select('city')
      .ilike('country', `%${country}%`)
      .order('city', { ascending: true });

    if (error) {
      console.error('❌ Error fetching cities:', error.message);
      return [];
    }

    const uniqueCities = [...new Set(data.map(g => g.city))];
    return uniqueCities;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return [];
  }
}

// Main function
async function main() {
  console.log('\n🏋️  Gym Finder Script');
  console.log('=====================\n');
  console.log('Enter a city name, country name, or "city, country" to search for gyms.');
  console.log('Examples:');
  console.log('  - berlin');
  console.log('  - copenhagen, denmark');
  console.log('  - denmark');
  console.log('  - list-countries (to see all available countries)');
  console.log('  - exit (to quit)\n');

  while (true) {
    const input = await askQuestion('Enter search term: ');

    if (!input) {
      continue;
    }

    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log('\n👋 Goodbye!');
      rl.close();
      break;
    }

    if (input.toLowerCase() === 'list-countries') {
      console.log('\n📋 Fetching all countries with gyms...\n');
      const countries = await getAllCountries();
      if (countries.length > 0) {
        console.log(`Found ${countries.length} countries:\n`);
        countries.forEach((country, index) => {
          console.log(`  ${index + 1}. ${country}`);
        });
        console.log();
      } else {
        console.log('No countries found.');
      }
      continue;
    }

    const gyms = await searchGyms(input);

    if (gyms === null) {
      continue;
    }

    if (gyms.length === 0) {
      console.log(`\n❌ No gyms found matching "${input}"`);
      
      // Suggest checking countries
      const countries = await getAllCountries();
      const matchingCountries = countries.filter(c => 
        c.toLowerCase().includes(input.toLowerCase())
      );
      
      if (matchingCountries.length > 0) {
        console.log(`\n💡 Did you mean one of these countries?`);
        matchingCountries.forEach(country => {
          console.log(`   - ${country}`);
        });
        console.log('\n💡 Try: list-countries (to see all available countries)');
      }
      console.log();
    } else {
      console.log(`\n✅ Found ${gyms.length} gym(s):`);
      console.log('='.repeat(60));
      
      gyms.forEach((gym, index) => {
        console.log(`${index + 1}.${formatGym(gym)}`);
      });

      // If searching by country, show cities
      const countries = await getAllCountries();
      const isCountrySearch = countries.some(c => c.toLowerCase() === input.toLowerCase());
      
      if (isCountrySearch && gyms.length > 0) {
        const cities = await getCitiesInCountry(input);
        if (cities.length > 1) {
          console.log(`\n📍 Cities with gyms in ${input}:`);
          cities.forEach(city => {
            const cityGymCount = gyms.filter(g => g.city === city).length;
            console.log(`   - ${city} (${cityGymCount} gym${cityGymCount !== 1 ? 's' : ''})`);
          });
        }
      }

      console.log();
    }
  }
}

// Run the script
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  rl.close();
  process.exit(1);
});


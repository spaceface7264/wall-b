const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Check if a UUID looks like a placeholder
function isPlaceholderUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') return true;
  
  // Check for common placeholder patterns
  const placeholderPatterns = [
    /^[a-f]{8}-[a-f]{4}-[a-f]{4}-[a-f]{4}-[a-f]{12}$/i, // All same character
    /^[0-9]{8}-[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{12}$/i, // All numbers
    /^[a-f]{8}-[a-f]{4}-[a-f]{4}-[a-f]{4}-[a-f]{12}$/i, // All 'a' characters
    /^[b-f]{8}-[b-f]{4}-[b-f]{4}-[b-f]{4}-[b-f]{12}$/i, // All 'b' characters
    /^[c-f]{8}-[c-f]{4}-[c-f]{4}-[c-f]{4}-[c-f]{12}$/i, // All 'c' characters
  ];
  
  for (const pattern of placeholderPatterns) {
    if (pattern.test(uuid)) {
      // Check if it's all the same character
      const chars = uuid.replace(/-/g, '').split('');
      const uniqueChars = new Set(chars);
      if (uniqueChars.size <= 2) return true; // Too few unique characters
    }
  }
  
  return false;
}

async function validateAllUUIDs() {
  console.log('🔍 Validating all UUIDs in database...\n');
  
  const tables = [
    { name: 'communities', idField: 'id' },
    { name: 'posts', idField: 'id' },
    { name: 'events', idField: 'id' },
    { name: 'profiles', idField: 'id' },
    { name: 'gyms', idField: 'id' },
    { name: 'community_members', idField: 'id' },
    { name: 'event_rsvps', idField: 'id' },
  ];
  
  let totalIssues = 0;
  
  for (const table of tables) {
    try {
      console.log(`📋 Checking ${table.name}...`);
      
      const { data, error } = await supabase
        .from(table.name)
        .select(table.idField);
      
      if (error) {
        console.log(`❌ Error accessing ${table.name}: ${error.message}`);
        continue;
      }
      
      if (!data || data.length === 0) {
        console.log(`✅ ${table.name}: No records to check`);
        continue;
      }
      
      const issues = data.filter(record => 
        isPlaceholderUUID(record[table.idField])
      );
      
      if (issues.length === 0) {
        console.log(`✅ ${table.name}: All ${data.length} UUIDs look professional`);
      } else {
        console.log(`⚠️  ${table.name}: Found ${issues.length} placeholder-looking UUIDs:`);
        issues.forEach(issue => {
          console.log(`   - ${issue[table.idField]}`);
        });
        totalIssues += issues.length;
      }
      
    } catch (error) {
      console.log(`❌ Error checking ${table.name}: ${error.message}`);
    }
  }
  
  console.log('\n📊 SUMMARY');
  console.log('==========');
  
  if (totalIssues === 0) {
    console.log('✅ All UUIDs look professional! No placeholder patterns detected.');
  } else {
    console.log(`⚠️  Found ${totalIssues} placeholder-looking UUIDs that should be updated.`);
    console.log('💡 Consider running the professional data seed script to fix these.');
  }
  
  return totalIssues;
}

// Run validation if called directly
if (require.main === module) {
  validateAllUUIDs().catch(console.error);
}

module.exports = { validateAllUUIDs, isPlaceholderUUID };



const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function healthCheck() {
  console.log('🏥 FRESH START - SYSTEM HEALTH CHECK');
  console.log('=====================================\n');

  // 1. Environment Check
  console.log('1. ENVIRONMENT CHECK');
  console.log('-------------------');
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  console.log('');

  // 2. Database Connection
  console.log('2. DATABASE CONNECTION');
  console.log('----------------------');
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return false;
    }
    console.log('✅ Database connection successful');
  } catch (error) {
    console.log('❌ Database connection error:', error.message);
    return false;
  }
  console.log('');

  // 3. Table Structure Check
  console.log('3. TABLE STRUCTURE CHECK');
  console.log('------------------------');
  
  const tables = ['communities', 'posts', 'events', 'community_members', 'profiles'];
  const tableStatus = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        tableStatus[table] = `❌ Error: ${error.message}`;
      } else {
        tableStatus[table] = `✅ Accessible (${data.length} sample records)`;
      }
    } catch (error) {
      tableStatus[table] = `❌ Exception: ${error.message}`;
    }
  }
  
  Object.entries(tableStatus).forEach(([table, status]) => {
    console.log(`${table}: ${status}`);
  });
  console.log('');

  // 4. Data Check
  console.log('4. DATA CHECK');
  console.log('-------------');
  
  try {
    const { data: communities, error: commError } = await supabase
      .from('communities')
      .select('id, name, member_count');
    
    if (commError) {
      console.log('❌ Communities error:', commError.message);
    } else {
      console.log(`✅ Communities: ${communities.length} found`);
      communities.forEach(comm => {
        const isPlaceholder = comm.id.includes('aaaa') || comm.id.includes('bbbb') || comm.id.includes('cccc');
        console.log(`   - ${comm.name}: ${comm.id} ${isPlaceholder ? '⚠️ Placeholder' : '✅ Professional'}`);
      });
    }
  } catch (error) {
    console.log('❌ Data check error:', error.message);
  }
  console.log('');

  // 5. Events Table Specific Check
  console.log('5. EVENTS TABLE CHECK');
  console.log('---------------------');
  
  try {
    // Check if events table exists and has right structure
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(1);
    
    if (eventsError) {
      console.log('❌ Events table error:', eventsError.message);
      console.log('   This explains why event creation fails!');
    } else {
      console.log('✅ Events table accessible');
      console.log(`   Current events: ${events.length}`);
    }
  } catch (error) {
    console.log('❌ Events check error:', error.message);
  }
  console.log('');

  // 6. RLS Policies Check
  console.log('6. RLS POLICIES CHECK');
  console.log('---------------------');
  
  try {
    // Try to create a test event to see if RLS blocks it
    const testEvent = {
      community_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      created_by: '00000000-0000-0000-0000-000000000000',
      title: 'Health Check Test Event',
      description: 'This is a test event for health check',
      event_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      event_type: 'meetup',
      location: 'Test Location'
    };

    const { data, error } = await supabase
      .from('events')
      .insert(testEvent)
      .select()
      .single();

    if (error) {
      console.log('❌ Event creation blocked:', error.message);
      console.log('   RLS policies are too restrictive');
    } else {
      console.log('✅ Event creation works');
      // Clean up test event
      await supabase
        .from('events')
        .delete()
        .eq('id', data.id);
      console.log('   Test event cleaned up');
    }
  } catch (error) {
    console.log('❌ RLS check error:', error.message);
  }
  console.log('');

  // 7. Summary
  console.log('7. HEALTH CHECK SUMMARY');
  console.log('=======================');
  console.log('Based on this check, the main issues are likely:');
  console.log('1. RLS policies blocking event creation');
  console.log('2. Placeholder UUIDs looking unprofessional');
  console.log('3. Missing user authentication in SQL scripts');
  console.log('');
  console.log('Next steps:');
  console.log('1. Fix RLS policies for events');
  console.log('2. Update community IDs to professional ones');
  console.log('3. Test event creation from frontend');
  console.log('4. Verify user authentication works');
}

healthCheck().catch(console.error);



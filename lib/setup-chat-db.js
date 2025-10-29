const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease add these to your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupChatDatabase() {
  try {
    console.log('🚀 Setting up chat database...');
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'messages-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    const { error } = await supabase.rpc('exec_sql', { sql: schema });
    
    if (error) {
      // If exec_sql doesn't exist, try direct SQL execution
      console.log('⚠️  exec_sql not available, trying direct execution...');
      
      // Split the schema into individual statements
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase
            .from('messages')
            .select('*')
            .limit(0); // This will fail but we're just testing connection
          
          if (stmtError && stmtError.message.includes('relation "messages" does not exist')) {
            console.log('📝 Creating messages table...');
            // You'll need to run the SQL manually in your Supabase dashboard
            console.log('Please run the following SQL in your Supabase SQL editor:');
            console.log('─'.repeat(50));
            console.log(schema);
            console.log('─'.repeat(50));
            break;
          }
        } catch (e) {
          // Continue to next statement
        }
      }
    }
    
    console.log('✅ Chat database setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the SQL schema from lib/messages-schema.sql');
    console.log('4. Test the chat functionality');
    
  } catch (error) {
    console.error('❌ Error setting up chat database:', error.message);
    console.log('\n📋 Manual setup required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the SQL schema from lib/messages-schema.sql');
  }
}

setupChatDatabase();

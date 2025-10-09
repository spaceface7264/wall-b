// Migration script to create communities for existing gyms
// Run this after setting up the enhanced community schema

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

async function seedCommunities() {
  try {
    console.log('🌱 Starting community seeding...');

    // Get all existing gyms
    const { data: gyms, error: gymsError } = await supabase
      .from('gyms')
      .select('*');

    if (gymsError) {
      console.error('Error fetching gyms:', gymsError);
      return;
    }

    console.log(`Found ${gyms.length} gyms to create communities for`);

    // Create communities for each gym
    for (const gym of gyms) {
      const communityData = {
        gym_id: gym.id,
        name: `${gym.name} Community`,
        description: `Connect with fellow climbers at ${gym.name} in ${gym.city}, ${gym.country}. Share beta, organize meetups, and stay updated on gym events.`,
        rules: `Welcome to the ${gym.name} community! Please be respectful, share helpful beta, and keep posts relevant to climbing and this gym.`,
        is_active: true
      };

      const { data: community, error: communityError } = await supabase
        .from('communities')
        .insert([communityData])
        .select()
        .single();

      if (communityError) {
        console.error(`Error creating community for ${gym.name}:`, communityError);
        continue;
      }

      console.log(`✅ Created community for ${gym.name}`);

      // Create some sample posts for the community
      const samplePosts = [
        {
          community_id: community.id,
          user_id: null, // Will be set to a real user when they post
          user_email: 'admin@wall-b.com',
          user_name: 'Wall-B Admin',
          title: `Welcome to ${gym.name} Community!`,
          content: `Welcome to the ${gym.name} community! This is your space to connect with fellow climbers, share beta, organize meetups, and stay updated on gym events. Feel free to introduce yourself and start sharing!`,
          post_type: 'social',
          tag: 'social',
          like_count: 0,
          comment_count: 0
        },
        {
          community_id: community.id,
          user_id: null,
          user_email: 'admin@wall-b.com',
          user_name: 'Wall-B Admin',
          title: 'Community Guidelines',
          content: `Here are our community guidelines to keep this space welcoming for everyone:\n\n• Be respectful and supportive\n• Share helpful beta and climbing tips\n• Keep posts relevant to climbing and this gym\n• Use appropriate tags for your posts\n• Report any inappropriate content\n\nHappy climbing! 🧗‍♀️`,
          post_type: 'news',
          tag: 'news',
          like_count: 0,
          comment_count: 0
        }
      ];

      const { error: postsError } = await supabase
        .from('posts')
        .insert(samplePosts);

      if (postsError) {
        console.error(`Error creating sample posts for ${gym.name}:`, postsError);
      } else {
        console.log(`✅ Created sample posts for ${gym.name}`);
      }
    }

    console.log('🎉 Community seeding completed successfully!');
    
    // Get final count
    const { data: communities, error: countError } = await supabase
      .from('communities')
      .select('id');

    if (!countError) {
      console.log(`📊 Total communities created: ${communities.length}`);
    }

  } catch (error) {
    console.error('Error during community seeding:', error);
  }
}

// Run the seeding function
if (require.main === module) {
  seedCommunities();
}

module.exports = { seedCommunities };


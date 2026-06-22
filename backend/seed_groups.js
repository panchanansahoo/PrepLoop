import { supabaseAdmin } from './db/supabaseClient.js';

async function seed() {
  console.log('Fetching a user profile to use as creator...');
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .limit(1);

  let creator_id = null;
  if (profiles && profiles.length > 0) {
    creator_id = profiles[0].id;
    console.log('Found user:', creator_id);
  } else {
    console.log('No profiles found, using null for creator_id');
  }

  const groups = [
    {
      name: 'DSA Grinders',
      description: 'Daily LeetCode discussions and mock interviews for top tech companies.',
      emoji: '⚔️',
      color: '#ef4444',
      tags: ['DSA', 'LeetCode', 'Daily'],
      creator_id: creator_id,
      member_count: 142,
      online_count: 24,
      is_public: true
    },
    {
      name: 'System Design Architects',
      description: 'Deep dives into scalable architectures, distributed systems, and design patterns.',
      emoji: '🏗️',
      color: '#3b82f6',
      tags: ['System Design', 'Architecture'],
      creator_id: creator_id,
      member_count: 89,
      online_count: 12,
      is_public: true
    },
    {
      name: 'Frontend Wizards',
      description: 'React, Vue, performance optimization, and UI/UX discussions.',
      emoji: '✨',
      color: '#8b5cf6',
      tags: ['Frontend', 'React', 'UI'],
      creator_id: creator_id,
      member_count: 210,
      online_count: 45,
      is_public: true
    },
    {
      name: 'Backend Engineers Connect',
      description: 'Node.js, Go, databases, and API design principles.',
      emoji: '⚙️',
      color: '#10b981',
      tags: ['Backend', 'Node.js', 'Databases'],
      creator_id: creator_id,
      member_count: 156,
      online_count: 18,
      is_public: true
    }
  ];

  console.log('Inserting study groups...');
  const { data, error } = await supabaseAdmin
    .from('study_groups')
    .insert(groups)
    .select();

  if (error) {
    console.error('Error inserting groups:', error);
  } else {
    console.log('Successfully inserted groups:', data.map(g => g.name));
  }
}

seed().catch(console.error);

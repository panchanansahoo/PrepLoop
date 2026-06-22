import { supabaseAdmin } from './supabaseClient.js';

async function seedStudyGroups() {
  console.log('Seeding study groups...');

  // Get a valid profile id
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .limit(1);

  let creatorId;
  
  if (profileError || !profiles || profiles.length === 0) {
    console.log('No profiles found, creating a dummy profile...');
    const dummyEmail = 'dummy@preploop.com';
    
    // Check if user exists in auth
    const { data: { users }, error: _listAuthError } = await supabaseAdmin.auth.admin.listUsers();
    let authUser = users?.find(u => u.email === dummyEmail);
    
    if (!authUser) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: dummyEmail,
        password: 'password123',
        email_confirm: true,
        user_metadata: { full_name: 'Dummy Creator' }
      });
      if (createError) {
        console.error('Failed to create auth user:', createError);
        return;
      }
      authUser = newUser.user;
    }
    
    const dummyId = authUser.id;
    
    // The profile might have been auto-created by the trigger
    const { data: existingDummy } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', dummyId)
      .maybeSingle();
      
    if (!existingDummy) {
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: dummyId,
          full_name: 'Dummy Creator'
        });
        
      if (insertError) {
        console.error('Failed to create dummy profile:', insertError);
        return;
      }
    }
    creatorId = dummyId;
  } else {
    creatorId = profiles[0].id;
  }

  const studyGroups = [
    {
      name: 'System Design Interview Prep',
      description: 'Preparing for FAANG system design interviews. We discuss Grokking the System Design Interview and practice mock interviews.',
      emoji: '🏗️',
      color: '#3b82f6',
      tags: ['System Design', 'FAANG', 'Mock Interviews'],
      creator_id: creatorId,
      is_public: true
    },
    {
      name: 'LeetCode Daily Challenge',
      description: 'Daily grind. We solve the LeetCode daily challenge and discuss optimal solutions.',
      emoji: '🔥',
      color: '#ef4444',
      tags: ['DSA', 'LeetCode', 'Daily'],
      creator_id: creatorId,
      is_public: true
    },
    {
      name: 'Frontend Engineering Masters',
      description: 'Deep dive into React, Vue, Performance optimization and CSS battles.',
      emoji: '🎨',
      color: '#10b981',
      tags: ['Frontend', 'React', 'CSS'],
      creator_id: creatorId,
      is_public: true
    }
  ];

  const { data, error } = await supabaseAdmin
    .from('study_groups')
    .insert(studyGroups)
    .select();

  if (error) {
    console.error('Error creating study groups:', error);
  } else {
    console.log('Successfully created study groups:');
    data.forEach(g => console.log(` - ${g.name} (ID: ${g.id})`));
  }
}

seedStudyGroups().catch(console.error);

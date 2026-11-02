import dotenv from 'dotenv';
dotenv.config();
import { supabaseAdmin } from '../db/supabaseClient.js';
import { DEFAULT_ADMIN_EMAILS } from '../middleware/auth.js';

const targetEmails = process.argv.slice(2).length > 0 
  ? process.argv.slice(2)
  : (process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim()) : DEFAULT_ADMIN_EMAILS);

async function setAdmins() {
  console.log(`Setting admin role for: ${targetEmails.join(', ')}`);
  
  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error('❌ Failed to list users:', listError.message);
    process.exit(1);
  }

  for (const email of targetEmails) {
    const user = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      console.warn(`⚠️ User not found in Supabase Auth: ${email}`);
      continue;
    }

    console.log(`\nProcessing: ${email} (${user.id})`);

    // 1. Update Auth metadata
    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      app_metadata: { ...user.app_metadata, role: 'admin' },
      user_metadata: { ...user.user_metadata, role: 'admin' },
    });
    if (authErr) {
      console.error(`❌ Failed to update auth metadata for ${email}:`, authErr.message);
    } else {
      console.log(`✅ Supabase Auth app_metadata/user_metadata set to 'admin'`);
    }

    // 2. Update or insert profiles table
    const { data: profile, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (pErr) {
      console.error(`❌ Failed to check profile for ${email}:`, pErr.message);
      continue;
    }

    if (profile) {
      const { error: updErr } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);

      if (updErr) {
        console.error(`❌ Failed to update profile role for ${email}:`, updErr.message);
      } else {
        console.log(`✅ Profiles table record updated to role: 'admin'`);
      }
    } else {
      const newProfile = {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Admin',
        role: 'admin',
        subscription_tier: 'pro',
        experience_level: 'advanced',
        email_verified: true,
      };
      const { error: insErr } = await supabaseAdmin.from('profiles').insert(newProfile);
      if (insErr) {
        console.error(`❌ Failed to insert profile for ${email}:`, insErr.message);
      } else {
        console.log(`✅ New profile record created with role: 'admin'`);
      }
    }
  }

  console.log('\n🎉 Finished configuring admin roles.');
}

setAdmins().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

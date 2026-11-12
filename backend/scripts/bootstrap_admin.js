import dotenv from 'dotenv';
dotenv.config();
import crypto from 'crypto';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { DEFAULT_ADMIN_EMAILS } from '../middleware/auth.ts';

const isDryRun = process.argv.includes('--dry-run');
const autoCreate = !process.argv.includes('--no-create');

const targetEmails = process.argv.filter(arg => !arg.startsWith('--')).slice(2).length > 0
  ? process.argv.filter(arg => !arg.startsWith('--')).slice(2)
  : (process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()).filter(Boolean) : DEFAULT_ADMIN_EMAILS);

function generateSecurePassword() {
  return `Admin!${crypto.randomBytes(8).toString('base64url')}A1#`;
}

export async function bootstrapAdmins() {
  console.log(`[Admin Bootstrap] Mode: ${isDryRun ? 'DRY-RUN' : 'APPLY'}, Target emails: ${targetEmails.length ? targetEmails.join(', ') : 'None'}`);

  if (!targetEmails.length) {
    console.log('[Admin Bootstrap] No target emails specified in ADMIN_EMAILS or command arguments.');
    return { success: true, count: 0 };
  }

  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error('❌ Failed to list Supabase Auth users:', listError.message);
    throw listError;
  }

  let processedCount = 0;

  for (const email of targetEmails) {
    const normalizedEmail = email.toLowerCase().trim();
    let user = usersData.users.find(u => u.email?.toLowerCase() === normalizedEmail);

    if (!user) {
      if (!autoCreate) {
        console.warn(`⚠️ User not found in Supabase Auth and auto-create is disabled: ${normalizedEmail}`);
        continue;
      }

      console.log(`Creating missing admin user in Supabase Auth: ${normalizedEmail}`);
      if (isDryRun) {
        console.log(`[DRY RUN] Would create user ${normalizedEmail}`);
        continue;
      }

      const tempPassword = process.env.DEFAULT_ADMIN_PASSWORD || generateSecurePassword();
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { role: 'admin', full_name: 'PrepLoop Administrator' },
        app_metadata: { role: 'admin' },
      });

      if (createErr) {
        console.error(`❌ Failed to auto-create admin user ${normalizedEmail}:`, createErr.message);
        continue;
      }

      user = created.user;
      console.log(`✅ Auto-created admin user: ${normalizedEmail} (ID: ${user.id})`);
    } else {
      console.log(`Found existing user for admin promotion: ${normalizedEmail} (${user.id})`);
      if (isDryRun) {
        console.log(`[DRY RUN] Would promote user ${user.id} to admin`);
        continue;
      }

      const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        app_metadata: { ...user.app_metadata, role: 'admin' },
        user_metadata: { ...user.user_metadata, role: 'admin' },
      });

      if (authErr) {
        console.error(`❌ Failed to update auth metadata for ${normalizedEmail}:`, authErr.message);
      } else {
        console.log(`✅ Auth metadata role updated to 'admin'`);
      }
    }

    if (isDryRun) continue;

    // Sync profiles table
    const { data: profile, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (pErr) {
      console.error(`❌ Failed to query profile for ${normalizedEmail}:`, pErr.message);
      continue;
    }

    if (profile) {
      const { error: updErr } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);

      if (updErr) {
        console.error(`❌ Failed to update profile role for ${normalizedEmail}:`, updErr.message);
      } else {
        console.log(`✅ Profile record updated to role: 'admin'`);
        processedCount++;
      }
    } else {
      const newProfile = {
        id: user.id,
        full_name: user.user_metadata?.full_name || 'Admin',
        role: 'admin',
        subscription_tier: 'pro',
        experience_level: 'advanced',
        email_verified: true,
      };
      const { error: insErr } = await supabaseAdmin.from('profiles').insert(newProfile);
      if (insErr) {
        console.error(`❌ Failed to insert profile for ${normalizedEmail}:`, insErr.message);
      } else {
        console.log(`✅ Profile record created with role: 'admin'`);
        processedCount++;
      }
    }
  }

  console.log(`[Admin Bootstrap] Successfully processed ${processedCount} admin accounts.`);
  return { success: true, count: processedCount };
}

if (process.argv[1] && process.argv[1].endsWith('bootstrap_admin.js')) {
  bootstrapAdmins().catch((err) => {
    console.error('Fatal bootstrap error:', err);
    process.exit(1);
  });
}


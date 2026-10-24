import dotenv from 'dotenv';
dotenv.config();
import { supabaseAdmin } from '../db/supabaseClient.js';

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email) {
  console.log(`
Usage:
  1. Generate recovery link:
     node scripts/reset_password.js user@example.com

  2. Directly set a new password:
     node scripts/reset_password.js user@example.com NewPassword123!
`);
  process.exit(1);
}

async function run() {
  try {
    // 1. Find user by email
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('❌ Failed to list users:', listError.message);
      process.exit(1);
    }

    const user = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      console.error(`❌ No user found in Supabase with email: ${email}`);
      console.log('Existing users in database:');
      usersData.users.forEach(u => console.log(` - ${u.email} (${u.id})`));
      process.exit(1);
    }

    console.log(`Found user: ${user.email} (ID: ${user.id})`);

    // If newPassword is provided, update password directly
    if (newPassword) {
      if (newPassword.length < 8) {
        console.error('❌ Password must be at least 8 characters long');
        process.exit(1);
      }

      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });

      if (updateError) {
        console.error('❌ Failed to update password:', updateError.message);
        process.exit(1);
      }

      console.log(`✅ SUCCESS! Password for ${user.email} has been updated.`);
      console.log('You can now log in immediately with your new password at http://localhost:5173/login');
      return;
    }

    // Otherwise, generate a recovery link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: user.email,
      options: {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`
      }
    });

    if (linkError) {
      console.error('❌ Failed to generate recovery link:', linkError.message);
      process.exit(1);
    }

    const actionLink = linkData?.properties?.action_link;
    console.log('\n✅ Recovery link generated successfully:');
    console.log('--------------------------------------------------------------------------------');
    console.log(actionLink);
    console.log('--------------------------------------------------------------------------------');
    console.log('\nPaste this link into your browser to reset the password.\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

run();

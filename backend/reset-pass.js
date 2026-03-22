import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetPass() {
  try {
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;
    
    const user = users.find(u => u.email === 'panchanansahoo0143@gmail.com');
    if (!user) {
      console.error('User not found');
      return;
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: 'Password123!' }
    );
    
    if (updateError) throw updateError;
    console.log('Successfully reset password!');
  } catch (e) {
    console.error('Error:', e);
  }
}

resetPass();

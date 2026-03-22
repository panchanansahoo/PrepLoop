import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getMagicLink() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: 'panchanansahoo0143@gmail.com'
    });
    
    if (error) throw error;
    
    console.log('MAGIC LINK SUCCESS:');
    console.log(data.properties.action_link);
  } catch (e) {
    console.error('Error:', e);
  }
}

getMagicLink();

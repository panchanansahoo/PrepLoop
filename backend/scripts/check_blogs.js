import { supabaseAdmin } from '../db/supabaseClient.js';

const checkBlogs = async () => {
    try {
        const { data, error } = await supabaseAdmin
            .from('blogs')
            .select('*');
        
        console.log('Error:', error);
        console.log('Blogs count:', data?.length);
        console.log('Data:', JSON.stringify(data, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkBlogs();

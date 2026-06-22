// Re-export Supabase client as the default DB interface
// This replaces the old pg.Pool-based module
import { supabase, supabaseAdmin } from './supabaseClient.js';

export { supabase, supabaseAdmin };
export default supabase;

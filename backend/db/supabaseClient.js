import { createClient } from '@supabase/supabase-js';
import '../config/env.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production' && !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in production');
  process.exit(1);
}

const isDummySupabaseUrl = Boolean(supabaseUrl?.includes('example.supabase.co'));

function createDummyQueryMock() {
  const chain = {
    select: () => chain,
    insert: () => Promise.resolve({ data: null, error: null }),
    upsert: () => Promise.resolve({ data: null, error: null }),
    update: () => chain,
    delete: () => chain,
    eq: () => chain,
    neq: () => chain,
    gt: () => chain,
    gte: () => chain,
    lt: () => chain,
    lte: () => chain,
    like: () => chain,
    ilike: () => chain,
    is: () => chain,
    in: () => chain,
    contains: () => chain,
    containedBy: () => chain,
    range: () => chain,
    match: () => chain,
    not: () => chain,
    or: () => chain,
    filter: () => chain,
    order: () => chain,
    limit: () => chain,
    offset: () => chain,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve, reject) => Promise.resolve({ data: [], error: null, count: 0 }).then(resolve, reject),
    catch: (reject) => Promise.resolve({ data: [], error: null, count: 0 }).catch(reject),
  };
  return chain;
}

function createDummySupabaseClient() {
  return {
    from: () => createDummyQueryMock(),
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      admin: {
        getUserById: () => Promise.resolve({ data: { user: null }, error: null }),
        deleteUser: () => Promise.resolve({ data: null, error: null }),
      },
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {},
    }),
  };
}

// Public client (respects RLS)
/** @type {any} */
export const supabase = isDummySupabaseUrl
  ? createDummySupabaseClient()
  : createClient(supabaseUrl, supabaseAnonKey);

// Admin client (bypasses RLS, for server-side operations)
/** @type {any} */
export const supabaseAdmin = isDummySupabaseUrl
  ? createDummySupabaseClient()
  : createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

export default supabase;

// Backwards-compatible alias
export const _supabaseAdmin = supabaseAdmin;

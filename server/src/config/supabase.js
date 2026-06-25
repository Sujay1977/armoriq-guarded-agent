/**
 * @fileoverview Supabase client configuration
 */
import { createClient } from '@supabase/supabase-js';
import config from './index.js';

let supabase = null;
console.log("Supabase URL:", config.supabase.url);

const key = config.supabase.key;

if (key?.startsWith("sb_publishable_")) {
    console.warn("Using Publishable Key");
}
if (key.startsWith("sb_secret_")) {
    console.log("Using Secret Key");
}
else if (key.startsWith("sb_publishable_")) {
    console.log("Using Publishable Key");
}
else {
    console.warn("Unknown Supabase key type");
}

console.log(
  "Using Anon Key:",
  !!process.env.SUPABASE_ANON_KEY
);

console.log(
  "Selected key starts with:",
  config.supabase.key?.substring(0, 20)
);

if (config.supabase.url && config.supabase.key && config.supabase.url !== 'your_supabase_url') {
  supabase = createClient(config.supabase.url, config.supabase.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export default supabase;

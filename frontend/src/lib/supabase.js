import { createClient } from '@supabase/supabase-js'

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

supabaseUrl = supabaseUrl.trim().replace(/[\[\]]/g, "").replace(/['"]/g, "").replace(/\/+$/, "");
supabaseAnonKey = supabaseAnonKey.trim().replace(/[\[\]]/g, "").replace(/['"]/g, "");

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn("Supabase credentials missing in frontend/.env - Using placeholders.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

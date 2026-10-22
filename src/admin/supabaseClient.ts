import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabaseAnon, supabaseConfigured, supabaseUrl } from '../lib/db'

let client: SupabaseClient | null = null
export function sb(): SupabaseClient {
  if (!client) client = createClient(supabaseUrl, supabaseAnon)
  return client
}
export { supabaseConfigured }

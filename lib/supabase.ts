import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) throw new Error('[supabase] SUPABASE_URL env variable is missing')
if (!supabaseKey) throw new Error('[supabase] SUPABASE_SERVICE_ROLE_KEY env variable is missing')

export const supabase = createClient(supabaseUrl, supabaseKey)


import { createClient } from '@supabase/supabase-js'


const supabaseUrl = 'https://ipzitalmkqqvowfafpbh.supabase.co'
const supabaseKey = 'api-key-secret'


const supabase = createClient(supabaseUrl, supabaseKey!)

export default supabase
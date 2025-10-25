import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://ipzitalmkqqvowfafpbh.supabase.co"
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseKey) {
  throw new Error("SUPABASE_KEY no está configurada en las variables de entorno")
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lvbiutfikjxeduckcmig.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2Yml1dGZpa2p4ZWR1Y2tjbWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MjkxMjQsImV4cCI6MjA3NjAwNTEyNH0.fB1fUdhQglMYhRbsDo-JD1R3I5E9eS5tQQ0SBcUMdLY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hzruwkxbeunxngqsjueg.supabase.co';
const supabaseAnonKey = 'sb_publishable_BKijBfkGg89sh9UBIbqQBg_lsG1e63d';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

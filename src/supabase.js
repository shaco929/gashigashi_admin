import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "http://127.0.0.1:54321";
const supabaseKey = "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
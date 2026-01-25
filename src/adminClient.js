import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config(); 

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_ANON_KEY; 

export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);
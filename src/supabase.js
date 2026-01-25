import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; 

export const supabase = createClient(supabaseUrl, supabaseKey);

export function roundToHour(date) {
  const rounded = new Date(date);
  rounded.setMinutes(0, 0, 0); 
  return rounded;
}
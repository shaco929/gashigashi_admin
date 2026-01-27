import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export function roundToHour(date) {
  const rounded = new Date(date);
  rounded.setMinutes(0, 0, 0); 
  return rounded;
}
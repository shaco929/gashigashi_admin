import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

export const supabaseAdmin = supabaseSecretKey 
  ? createClient(supabaseUrl, supabaseSecretKey)
  : null;

export const supabase = createClient(supabaseUrl, supabaseKey);

export function createFutureDate(hoursFromNow) {
  return roundToHour(new Date(Date.now() + hoursFromNow * 60 * 60 * 1000));
}

// 時刻を0分0秒に丸める
export function roundToHour(date) {
  const rounded = new Date(date);
  rounded.setMinutes(0, 0, 0); // 分、秒、ミリ秒を0に
  return rounded;
}

// 現在時刻を0分0秒に丸める
export function getCurrentHour() {
  return roundToHour(new Date());
}
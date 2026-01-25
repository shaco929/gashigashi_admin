import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const users = [
  { email: 'admin@example.com', password: 'password123', role: 'admin' },
  { email: 'teacher@example.com', password: 'password123', role: 'teacher' },
  { email: 'student@example.com', password: 'password123', role: 'user' }
];

async function run() {
  for (const u of users) {
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true
    });

    if (authError) {
      console.error(`Auth Error (${u.email}): ${authError.message}`);
      continue;
    }

    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role: u.role })
      .eq('id', data.user.id);

    if (roleError) {
      console.error(`Role Error (${u.email}): ${roleError.message}`);
    } else {
      console.log(`Created: ${u.email} [${u.role}]`);
    }
  }
}

run();
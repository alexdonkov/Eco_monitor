// ===== Връзка със Supabase (Алекс) =====
// Всички заявки към базата минават оттук — останалият код не знае за Supabase.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** Изпълнява заявка и хвърля грешката, ако има такава — за да я хванем с try/catch. */
async function run(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/* ---------- Вход и регистрация ---------- */

export function signUp(email, password, displayName) {
  // display_name отива в raw_user_meta_data → тригерът handle_new_user създава профила
  return run(supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } }));
}

export function signIn(email, password) {
  return run(supabase.auth.signInWithPassword({ email, password }));
}

export function signOut() {
  return run(supabase.auth.signOut());
}

/** Извиква callback(user) при вход, изход и при зареждане на страницата. */
export function onAuthChange(callback) {
  supabase.auth.onAuthStateChange((_event, session) => callback(session?.user ?? null));
}

export function getProfile(userId) {
  return run(supabase.from('profiles').select('display_name, role').eq('id', userId).single());
}

/* ---------- Данни ---------- */

export function getIndicators() {
  return run(supabase.from('indicators').select('*').order('id'));
}

export function getLocations() {
  return run(supabase.from('locations').select('id, name, description, latitude, longitude, type').order('name'));
}

export function getLocation(id) {
  return run(supabase.from('locations').select('*').eq('id', id).single());
}

/** Последната стойност на един показател за всички места (изглед latest_measurements). */
export function getLatestByIndicator(code) {
  return run(supabase.from('latest_measurements').select('location_id, value, measured_at, source, verified').eq('code', code));
}

/** Последните стойности на всички показатели за едно място. */
export function getLatestForLocation(locationId) {
  return run(supabase.from('latest_measurements').select('indicator_id, code, value, measured_at, source, verified').eq('location_id', locationId));
}

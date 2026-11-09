// ===== Връзка със Supabase (Алекс, Седмица 2) =====
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// TODO: signUp(email, password, displayName)
// TODO: signIn(email, password)
// TODO: signOut()
// TODO: getLocations()
// TODO: getMeasurements(locationId, indicatorCode, fromDate, toDate)
// TODO: addMeasurement({ locationId, indicatorId, value, measuredAt, note })

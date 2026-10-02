import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Backend test requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. No backend tests were run.');
  process.exit(1);
}
const client = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const host = client(), partner = client(), stranger = client();
let sessionId;
const check = result => { assert.equal(result.error, null, result.error?.message); return result.data; };
try {
  for (const participant of [host, partner, stranger]) check(await participant.auth.signInAnonymously());
  const row = check(await host.from('couple_sessions').insert({ host_label: 'Backend verification', total_shots: 3, countdown_seconds: 3, room_key: 'vintage' }).select().single());
  sessionId = row.id;
  assert.equal(check(await stranger.from('couple_sessions').select('*').eq('id', row.id)).length, 0, 'Nonparticipants must not read a session');
  assert.equal(check(await partner.from('couple_sessions').select('*').eq('id', row.id)).length, 0, 'An invite alone must not grant read access');
  const joined = check(await partner.rpc('join_couple_session', { session_id: row.id, label: 'Partner' }));
  assert.ok(joined.partner_user_id);
  assert.equal(joined.room_key, 'vintage');
  assert.ok((await partner.from('couple_sessions').update({ room_key: 'karaoke' }).eq('id', row.id)).error, 'Shared room must not change after creation');
  assert.ok((await stranger.rpc('join_couple_session', { session_id: row.id, label: 'Third participant' })).error, 'An invite must admit only one partner');
  assert.ok((await partner.from('couple_sessions').update({ host_ready: true }).eq('id', row.id)).error, 'Partner must not change host fields');
  assert.ok((await partner.rpc('schedule_couple_capture', { session_id: row.id })).error, 'Partner must not control capture');
  assert.ok((await host.rpc('schedule_couple_capture', { session_id: row.id })).error, 'Both cameras must be ready');
  check(await host.from('couple_sessions').update({ host_ready: true }).eq('id', row.id));
  check(await partner.from('couple_sessions').update({ partner_ready: true }).eq('id', row.id));
  const capturing = check(await host.rpc('schedule_couple_capture', { session_id: row.id }));
  assert.equal(capturing.countdown_active, true);
  assert.ok(Date.parse(capturing.capture_at));
  check(await host.from('couple_sessions').update({ host_photos: ['data:image/jpeg;base64,dGVzdA=='] }).eq('id', row.id));
  check(await partner.from('couple_sessions').update({ partner_photos: ['data:image/jpeg;base64,dGVzdA=='] }).eq('id', row.id));
  const retrieved = check(await partner.from('couple_sessions').select('*').eq('id', row.id).single());
  assert.equal(retrieved.host_photos.length, 1);
  assert.equal(retrieved.partner_photos.length, 1);
  check(await host.from('couple_sessions').update({ countdown_active: false, current_shot: 1, capture_at: null }).eq('id', row.id));
  check(await host.from('couple_sessions').update({ status: 'completed', final_strip: 'data:image/jpeg;base64,dGVzdA==' }).eq('id', row.id));
  const completed = check(await partner.from('couple_sessions').select('*').eq('id', row.id).single());
  assert.equal(completed.status, 'completed');
  assert.ok(completed.final_strip);
  console.log('PASS: private creation, invitation, single-partner claim, field ownership, host capture, media persistence, completion.');
} finally {
  if (sessionId) {
    check(await host.from('couple_sessions').delete().eq('id', sessionId));
    assert.equal(check(await host.from('couple_sessions').select('*').eq('id', sessionId)).length, 0);
    console.log('PASS: test session deletion.');
  }
  await Promise.all([host, partner, stranger].map(participant => participant.auth.signOut()));
}
// Anonymous auth identities are intentionally left for the project's normal cleanup policy;
// this test never requires a service-role key in frontend configuration.

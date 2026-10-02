begin;
-- Keep the original RPC compatible; this lightweight scheduler avoids returning photo history.
create or replace function public.schedule_couple_capture(session_id uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result public.couple_sessions; already_active boolean;
begin
  select countdown_active into already_active from public.couple_sessions where id=session_id for update;
  result := public.start_couple_capture(session_id);
  if not coalesce(already_active, false) then
    update public.couple_sessions set capture_at=capture_at + interval '2 seconds'
    where id=session_id returning * into result;
  end if;
  return to_jsonb(result) - 'host_photos' - 'partner_photos' - 'final_strip';
end; $$;
revoke all on function public.schedule_couple_capture(uuid) from public, anon;
grant execute on function public.schedule_couple_capture(uuid) to authenticated;
commit;

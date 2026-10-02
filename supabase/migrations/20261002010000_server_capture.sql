-- Use the database clock so two devices with different clocks share a deadline.
begin;
create or replace function public.start_couple_capture(session_id uuid)
returns public.couple_sessions language plpgsql security invoker set search_path = '' as $$
declare result public.couple_sessions;
begin
  select * into result from public.couple_sessions where id = session_id for update;
  if not found or result.host_user_id is distinct from auth.uid() then
    raise exception 'Only the host can start capture';
  end if;
  if result.status = 'completed' or result.current_shot >= result.total_shots then
    raise exception 'This session has ended';
  end if;
  if result.partner_user_id is null or not result.host_ready or not result.partner_ready then
    raise exception 'Both cameras must be ready';
  end if;
  if result.countdown_active then return result; end if;
  if cardinality(result.host_photos) <> result.current_shot or cardinality(result.partner_photos) <> result.current_shot then
    raise exception 'Wait for both photos before starting the next round';
  end if;
  update public.couple_sessions
    set status = 'capturing', countdown_active = true,
        capture_at = clock_timestamp() + make_interval(secs => countdown_seconds)
    where id = session_id returning * into result;
  return result;
end;
$$;
revoke all on function public.start_couple_capture(uuid) from public, anon;
grant execute on function public.start_couple_capture(uuid) to authenticated;
commit;

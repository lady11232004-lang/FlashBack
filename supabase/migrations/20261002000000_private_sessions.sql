-- Optional shared-session backend. Enable Anonymous Sign-Ins before deploying.
-- Preserve old rows, but do not expose ownerless legacy data to new users.
begin;
alter table public.gallery_items add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table public.gallery_items add column if not exists updated_at timestamptz not null default now();
create index if not exists gallery_items_user_id_idx on public.gallery_items(user_id);
drop policy if exists anon_select_gallery on public.gallery_items;
drop policy if exists anon_insert_gallery on public.gallery_items;
drop policy if exists anon_update_gallery on public.gallery_items;
drop policy if exists anon_delete_gallery on public.gallery_items;
create policy gallery_owner_select on public.gallery_items for select to authenticated using (user_id = (select auth.uid()));
create policy gallery_owner_insert on public.gallery_items for insert to authenticated with check (user_id = (select auth.uid()));
create policy gallery_owner_update on public.gallery_items for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy gallery_owner_delete on public.gallery_items for delete to authenticated using (user_id = (select auth.uid()));
create trigger gallery_updated_at before update on public.gallery_items for each row execute function public.update_updated_at();

alter table public.couple_sessions add column if not exists host_user_id uuid references auth.users(id) on delete cascade default auth.uid();
alter table public.couple_sessions add column if not exists partner_user_id uuid references auth.users(id) on delete set null;
alter table public.couple_sessions add column if not exists countdown_seconds integer not null default 3;
alter table public.couple_sessions add column if not exists capture_at timestamptz;
alter table public.couple_sessions add constraint valid_shot_count check (total_shots in (3,4,6)) not valid;
alter table public.couple_sessions add constraint valid_countdown check (countdown_seconds in (3,5,10)) not valid;
alter table public.couple_sessions add constraint valid_shot_index check (current_shot between 0 and total_shots) not valid;
alter table public.couple_sessions add constraint valid_status check (status in ('waiting','joined','active','capturing','completed')) not valid;
alter table public.couple_sessions add constraint distinct_participants check (host_user_id <> partner_user_id) not valid;
create index if not exists couple_sessions_host_idx on public.couple_sessions(host_user_id);
create index if not exists couple_sessions_partner_idx on public.couple_sessions(partner_user_id);
drop policy if exists anon_select_sessions on public.couple_sessions;
drop policy if exists anon_insert_sessions on public.couple_sessions;
drop policy if exists anon_update_sessions on public.couple_sessions;
drop policy if exists anon_delete_sessions on public.couple_sessions;
create policy participants_select on public.couple_sessions for select to authenticated using ((select auth.uid()) in (host_user_id, partner_user_id));
create policy host_insert on public.couple_sessions for insert to authenticated with check (host_user_id = (select auth.uid()) and partner_user_id is null and status = 'waiting' and not host_ready and not partner_ready and cardinality(host_photos) = 0 and cardinality(partner_photos) = 0 and final_strip is null and not countdown_active and current_shot = 0);
create policy participants_update on public.couple_sessions for update to authenticated using ((select auth.uid()) in (host_user_id, partner_user_id)) with check ((select auth.uid()) in (host_user_id, partner_user_id));
create policy host_delete on public.couple_sessions for delete to authenticated using (host_user_id = (select auth.uid()));

-- Enforce field ownership even when a client bypasses the UI.
create or replace function public.guard_couple_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('postgres', 'service_role') then return new; end if;
  if new.id <> old.id or new.code <> old.code or new.created_at <> old.created_at
    or new.host_user_id is distinct from old.host_user_id or new.partner_user_id is distinct from old.partner_user_id
    or new.host_label <> old.host_label or new.partner_label <> old.partner_label
    or new.total_shots <> old.total_shots or new.countdown_seconds <> old.countdown_seconds then
    raise exception 'Session identity and settings cannot be changed';
  end if;
  if auth.uid() = old.host_user_id then
    if new.partner_photos <> old.partner_photos or new.partner_ready <> old.partner_ready then raise exception 'Only the partner can change partner media'; end if;
  elsif auth.uid() = old.partner_user_id then
    if new.host_photos <> old.host_photos or new.host_ready <> old.host_ready
      or new.status <> old.status or new.countdown_active <> old.countdown_active
      or new.current_shot <> old.current_shot or new.capture_at is distinct from old.capture_at
      or new.final_strip is distinct from old.final_strip then raise exception 'Only the host can control capture'; end if;
  else raise exception 'Not a session participant';
  end if;
  if cardinality(new.host_photos) > new.total_shots or cardinality(new.partner_photos) > new.total_shots then raise exception 'Too many photos'; end if;
  return new;
end;
$$;
create trigger couple_field_ownership before update on public.couple_sessions for each row execute function public.guard_couple_update();

-- Claim the single partner place atomically using the unguessable invite UUID.
-- No read access to photos is granted until membership is established.
create or replace function public.join_couple_session(session_id uuid, label text)
returns public.couple_sessions language plpgsql security definer set search_path = '' as $$
declare result public.couple_sessions;
begin
  if auth.uid() is null then raise exception 'Sign in before joining'; end if;
  if length(trim(label)) not between 1 and 40 then raise exception 'Enter a name of 1 to 40 characters'; end if;
  select * into result from public.couple_sessions where id = session_id for update;
  if not found or result.host_user_id is null then raise exception 'Session not found'; end if;
  if result.status = 'completed' then raise exception 'This session has ended'; end if;
  if result.host_user_id = auth.uid() then raise exception 'Open this invitation on your partner device'; end if;
  if result.partner_user_id is not null then
    if result.partner_user_id = auth.uid() then return result; end if;
    raise exception 'This session already has a partner';
  end if;
  update public.couple_sessions set partner_user_id = auth.uid(), partner_label = trim(label), status = 'joined' where id = session_id returning * into result;
  return result;
end;
$$;
revoke all on function public.join_couple_session(uuid,text) from public, anon;
grant execute on function public.join_couple_session(uuid,text) to authenticated;
commit;

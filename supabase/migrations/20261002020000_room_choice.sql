begin;
alter table public.couple_sessions add column if not exists room_key text not null default 'classic';
alter table public.couple_sessions add constraint valid_room check (room_key in ('classic','vintage','meme','laundry','prison','subway','airplane','karaoke'));
create or replace function public.guard_couple_room() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.room_key is distinct from old.room_key and current_user not in ('postgres','service_role') then
    raise exception 'The room is chosen when creating a session';
  end if;
  return new;
end; $$;
create trigger couple_room_ownership before update on public.couple_sessions for each row execute function public.guard_couple_room();
commit;

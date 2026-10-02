begin;
-- now() is transaction-start time; contending updates can otherwise appear to go backwards.
create or replace function public.update_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end; $$;
commit;

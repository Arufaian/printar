-- Custom SQL migration file, put your code below! --
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_first_user boolean;
begin
  perform pg_advisory_xact_lock(hashtext('public.handle_new_user.first_admin'));

  select not exists (
    select 1
    from public.profiles
    where role = 'admin'
  ) into is_first_user;

  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Anonymous'),
    case
      when is_first_user then 'admin'::public.role
      else 'customer'::public.role
    end
  );

  return new;
end;
$$;

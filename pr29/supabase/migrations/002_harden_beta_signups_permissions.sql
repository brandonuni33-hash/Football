revoke all on table public.beta_signups from anon, authenticated;
revoke all on sequence public.beta_signups_id_seq from anon, authenticated;

grant all on table public.beta_signups to service_role;
grant all on sequence public.beta_signups_id_seq to service_role;

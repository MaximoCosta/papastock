alter table public.stock_records
  add column version integer not null default 0;

alter table public.stock_records
  add constraint stock_records_version_nonnegative check (version >= 0);

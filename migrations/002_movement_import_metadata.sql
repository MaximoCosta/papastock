alter table public.movements
  add column data jsonb not null default '{}'::jsonb;

alter table public.movements
  add constraint movements_data_object check (jsonb_typeof(data) = 'object');

create index movements_data_source_idx
  on public.movements ((data->>'source'))
  where data ? 'source';

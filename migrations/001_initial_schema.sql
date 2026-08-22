create table public.locations (
  id text primary key,
  name text not null,
  type text not null,
  created_at timestamptz not null default now(),
  constraint locations_id_length check (char_length(id) between 1 and 80),
  constraint locations_name_length check (char_length(name) between 1 and 120),
  constraint locations_type_check check (type in ('cold_storage', 'warehouse'))
);

create table public.lots (
  id text primary key,
  code text not null unique,
  variety text not null,
  campaign text not null,
  producer text not null,
  origin text not null,
  harvest_date date,
  created_at timestamptz not null default now(),
  constraint lots_id_length check (char_length(id) between 1 and 80),
  constraint lots_code_length check (char_length(code) between 1 and 40),
  constraint lots_campaign_length check (char_length(campaign) between 1 and 20)
);

create table public.stock_records (
  id text primary key,
  lot_id text not null references public.lots (id) on update cascade on delete restrict,
  location_id text not null references public.locations (id) on update cascade on delete restrict,
  declared_quantity numeric(14, 3) not null,
  verified_quantity numeric(14, 3) not null,
  verification_pending boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint stock_records_id_length check (char_length(id) between 1 and 80),
  constraint stock_records_declared_nonnegative check (declared_quantity >= 0),
  constraint stock_records_verified_nonnegative check (verified_quantity >= 0),
  constraint stock_records_lot_location_unique unique (lot_id, location_id)
);

create table public.movements (
  id text primary key,
  reference text not null unique,
  lot_id text not null references public.lots (id) on update cascade on delete restrict,
  origin_location_id text references public.locations (id) on update cascade on delete restrict,
  destination_location_id text references public.locations (id) on update cascade on delete restrict,
  quantity numeric(14, 3) not null,
  movement_date date not null,
  status text not null,
  created_at timestamptz not null default now(),
  constraint movements_id_length check (char_length(id) between 1 and 80),
  constraint movements_reference_length check (char_length(reference) between 1 and 80),
  constraint movements_quantity_positive check (quantity > 0),
  constraint movements_status_check check (status in ('completed', 'pending', 'cancelled')),
  constraint movements_has_endpoint check (origin_location_id is not null or destination_location_id is not null),
  constraint movements_distinct_endpoints check (
    origin_location_id is null
    or destination_location_id is null
    or origin_location_id <> destination_location_id
  )
);

create table public.traceability_events (
  id text primary key,
  lot_id text not null references public.lots (id) on update cascade on delete restrict,
  event_type text not null,
  event_date date not null,
  location_id text references public.locations (id) on update cascade on delete restrict,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint traceability_events_id_length check (char_length(id) between 1 and 120),
  constraint traceability_events_type_check check (
    event_type in ('planting', 'harvest', 'treatment', 'quality_control', 'stock_verification')
  ),
  constraint traceability_events_data_object check (jsonb_typeof(data) = 'object'),
  constraint traceability_events_lot_type_date_unique unique (lot_id, event_type, event_date)
);

create index stock_records_lot_id_idx on public.stock_records (lot_id);
create index stock_records_location_id_idx on public.stock_records (location_id);
create index movements_lot_id_movement_date_idx on public.movements (lot_id, movement_date desc);
create index movements_origin_location_id_idx on public.movements (origin_location_id) where origin_location_id is not null;
create index movements_destination_location_id_idx on public.movements (destination_location_id) where destination_location_id is not null;
create index traceability_events_lot_id_event_date_idx on public.traceability_events (lot_id, event_date desc);
create index traceability_events_location_id_idx on public.traceability_events (location_id) where location_id is not null;

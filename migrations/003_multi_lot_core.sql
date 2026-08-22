-- Multi-lote, unidades bags/kg, remito, recepción, discrepancias auditables y conteo físico.
-- Backward-safe: movements.lot_id y movements.quantity quedan como columnas legacy nullable.
-- remito_number NO es unique: Papasud puede repetir números entre series, ubicaciones o años.

alter table public.stock_records
  add column if not exists unit text not null default 'kg';

alter table public.stock_records
  drop constraint if exists stock_records_unit_check;
alter table public.stock_records
  add constraint stock_records_unit_check check (unit in ('kg', 'bags'));

alter table public.stock_records
  drop constraint if exists stock_records_lot_location_unique;
alter table public.stock_records
  drop constraint if exists stock_records_lot_location_unit_unique;
alter table public.stock_records
  add constraint stock_records_lot_location_unit_unique unique (lot_id, location_id, unit);

alter table public.movements
  add column if not exists remito_number text;
alter table public.movements
  add column if not exists kind text not null default 'transfer';
alter table public.movements
  add column if not exists corrects_movement_id text references public.movements (id) on update cascade on delete restrict;
alter table public.movements
  add column if not exists received_total numeric(14, 3);
alter table public.movements
  add column if not exists received_unit text;
alter table public.movements
  add column if not exists received_at timestamptz;
alter table public.movements
  add column if not exists reception_status text not null default 'not_applicable';

alter table public.movements
  alter column lot_id drop not null;
alter table public.movements
  alter column quantity drop not null;

alter table public.movements
  drop constraint if exists movements_quantity_positive;
alter table public.movements
  add constraint movements_quantity_positive check (quantity is null or quantity > 0);

alter table public.movements
  drop constraint if exists movements_kind_check;
alter table public.movements
  add constraint movements_kind_check check (kind in ('transfer', 'correction', 'import'));

alter table public.movements
  drop constraint if exists movements_reception_status_check;
alter table public.movements
  add constraint movements_reception_status_check check (
    reception_status in ('not_applicable', 'pending', 'received', 'needs_reconciliation')
  );

alter table public.movements
  drop constraint if exists movements_received_unit_check;
alter table public.movements
  add constraint movements_received_unit_check check (received_unit is null or received_unit in ('kg', 'bags'));

alter table public.movements
  drop constraint if exists movements_remito_number_length;
alter table public.movements
  add constraint movements_remito_number_length check (
    remito_number is null or char_length(remito_number) between 1 and 40
  );

create index if not exists movements_remito_number_idx
  on public.movements (remito_number)
  where remito_number is not null;

create index if not exists movements_corrects_movement_id_idx
  on public.movements (corrects_movement_id)
  where corrects_movement_id is not null;

create table if not exists public.movement_items (
  id text primary key,
  movement_id text not null references public.movements (id) on update cascade on delete cascade,
  lot_id text not null references public.lots (id) on update cascade on delete restrict,
  dispatched_quantity numeric(14, 3) not null,
  received_quantity numeric(14, 3),
  received_at timestamptz,
  unit text not null,
  sort_order integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint movement_items_id_length check (char_length(id) between 1 and 120),
  constraint movement_items_dispatched_positive check (dispatched_quantity > 0),
  constraint movement_items_received_nonnegative check (received_quantity is null or received_quantity >= 0),
  constraint movement_items_unit_check check (unit in ('kg', 'bags')),
  constraint movement_items_data_object check (jsonb_typeof(data) = 'object')
);

create index if not exists movement_items_movement_id_idx on public.movement_items (movement_id);
create index if not exists movement_items_lot_id_idx on public.movement_items (lot_id);

insert into public.movement_items (id, movement_id, lot_id, dispatched_quantity, unit, sort_order)
select
  'mitem-' || movements.id,
  movements.id,
  movements.lot_id,
  movements.quantity,
  'kg',
  0
from public.movements
where movements.lot_id is not null
  and movements.quantity is not null
  and not exists (
    select 1 from public.movement_items items where items.movement_id = movements.id
  );

create table if not exists public.discrepancies (
  id text primary key,
  movement_id text references public.movements (id) on update cascade on delete restrict,
  movement_item_id text references public.movement_items (id) on update cascade on delete restrict,
  stock_record_id text references public.stock_records (id) on update cascade on delete restrict,
  lot_id text references public.lots (id) on update cascade on delete restrict,
  location_id text references public.locations (id) on update cascade on delete restrict,
  type text not null,
  expected_quantity numeric(14, 3) not null,
  observed_quantity numeric(14, 3) not null,
  unit text not null,
  difference numeric(14, 3) not null,
  status text not null,
  cause text,
  resolution text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint discrepancies_id_length check (char_length(id) between 1 and 120),
  constraint discrepancies_type_check check (type in ('reception_shortfall', 'reception_unallocated', 'physical_count')),
  constraint discrepancies_unit_check check (unit in ('kg', 'bags')),
  constraint discrepancies_status_check check (status in ('open', 'investigating', 'resolved'))
);

create index if not exists discrepancies_movement_id_idx on public.discrepancies (movement_id);
create index if not exists discrepancies_lot_id_idx on public.discrepancies (lot_id);
create index if not exists discrepancies_status_idx on public.discrepancies (status);

create table if not exists public.stock_counts (
  id text primary key,
  location_id text not null references public.locations (id) on update cascade on delete restrict,
  lot_id text not null references public.lots (id) on update cascade on delete restrict,
  expected_quantity numeric(14, 3) not null,
  observed_quantity numeric(14, 3) not null,
  unit text not null,
  counted_at date not null,
  notes text,
  discrepancy_id text references public.discrepancies (id) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  constraint stock_counts_id_length check (char_length(id) between 1 and 120),
  constraint stock_counts_unit_check check (unit in ('kg', 'bags')),
  constraint stock_counts_expected_nonnegative check (expected_quantity >= 0),
  constraint stock_counts_observed_nonnegative check (observed_quantity >= 0)
);

create index if not exists stock_counts_lot_location_idx on public.stock_counts (lot_id, location_id, counted_at desc);

alter table public.traceability_events
  drop constraint if exists traceability_events_lot_type_date_unique;

alter table public.traceability_events
  drop constraint if exists traceability_events_type_check;
alter table public.traceability_events
  add constraint traceability_events_type_check check (
    event_type in (
      'planting',
      'harvest',
      'treatment',
      'quality_control',
      'stock_verification',
      'reception',
      'correction',
      'physical_count',
      'discrepancy'
    )
  );

insert into public.locations (id, name, type) values
  ('loc-oriente', 'Campo Oriente', 'warehouse'),
  ('loc-frig-a', 'Frigorífico A', 'cold_storage')
on conflict (id) do update set name = excluded.name, type = excluded.type;

insert into public.lots (id, code, variety, campaign, producer, origin, harvest_date) values
  ('lot-300', '300', 'Spunta', '2025/26', 'Papasud', 'Balcarce, Buenos Aires, Argentina', '2026-07-30'),
  ('lot-301', '301', 'Spunta', '2025/26', 'Papasud', 'Balcarce, Buenos Aires, Argentina', '2026-07-30')
on conflict (id) do update set
  code = excluded.code,
  variety = excluded.variety,
  campaign = excluded.campaign,
  producer = excluded.producer,
  origin = excluded.origin,
  harvest_date = excluded.harvest_date;

insert into public.stock_records (
  id, lot_id, location_id, declared_quantity, verified_quantity, verification_pending, updated_at, unit
) values
  ('stock-300-oriente', 'lot-300', 'loc-oriente', 500, 500, false, '2026-08-22T12:00:00-03:00', 'bags'),
  ('stock-301-oriente', 'lot-301', 'loc-oriente', 300, 300, false, '2026-08-22T12:00:00-03:00', 'bags')
on conflict (id) do update set
  lot_id = excluded.lot_id,
  location_id = excluded.location_id,
  declared_quantity = excluded.declared_quantity,
  verified_quantity = excluded.verified_quantity,
  verification_pending = excluded.verification_pending,
  unit = excluded.unit;

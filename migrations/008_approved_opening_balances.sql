-- Derived exactly from the production read-only ledger audit on 2026-08-24.
-- candidate_opening_balance = persisted_balance - ledger_balance.
-- This manifest never updates stock_records and deliberately excludes SHOW-*.

create temporary table h4b_expected_movements (
  slug text primary key, id text not null unique, reference text not null unique,
  lot_id text not null, location_id text not null, unit text not null,
  persisted numeric not null, ledger numeric not null, candidate numeric not null,
  data jsonb not null
) on commit drop;

insert into h4b_expected_movements
  (slug, id, reference, lot_id, location_id, unit, persisted, ledger, candidate, data)
select slug, 'movement-opening-008-' || slug, reference, lot_id, location_id, unit,
  persisted, ledger, candidate,
  jsonb_build_object(
    'source', 'papastock_h4_opening_balance',
    'manifest', '008_approved_opening_balances',
    'auditDate', '2026-08-24',
    'basis', 'persisted_balance_minus_ledger_balance',
    'persistedBalance', persisted,
    'ledgerBalance', ledger,
    'candidateOpeningBalance', candidate,
    'unit', unit
  )
from (values
  ('300-loc-oriente-bags', 'OPENING-300-LOC-ORIENTE-BAGS', 'lot-300', 'loc-oriente', 'bags', 500::numeric, 0::numeric, 500::numeric),
  ('301-loc-oriente-bags', 'OPENING-301-LOC-ORIENTE-BAGS', 'lot-301', 'loc-oriente', 'bags', 300, 0, 300),
  ('a204-loc-north-kg', 'OPENING-A-204-LOC-NORTH-KG', 'lot-a204', 'loc-north', 'kg', 0, -1000, 1000),
  ('a204-loc-south-kg', 'OPENING-A-204-LOC-SOUTH-KG', 'lot-a204', 'loc-south', 'kg', 25000, 9000, 16000),
  ('a204-loc-warehouse-kg', 'OPENING-A-204-LOC-WAREHOUSE-KG', 'lot-a204', 'loc-warehouse', 'kg', 0, -8000, 8000),
  ('a310-loc-warehouse-kg', 'OPENING-A-310-LOC-WAREHOUSE-KG', 'lot-a310', 'loc-warehouse', 'kg', 1000, -21000, 22000),
  ('b118-loc-north-kg', 'OPENING-B-118-LOC-NORTH-KG', 'lot-b118', 'loc-north', 'kg', 14400, -100, 14500),
  ('b221-loc-south-kg', 'OPENING-B-221-LOC-SOUTH-KG', 'lot-b221', 'loc-south', 'kg', 16000, 0, 16000),
  ('c102-loc-warehouse-kg', 'OPENING-C-102-LOC-WAREHOUSE-KG', 'lot-c102', 'loc-warehouse', 'kg', 18500, 0, 18500),
  ('d405-loc-central-kg', 'OPENING-D-405-LOC-CENTRAL-KG', 'lot-d405', 'loc-central', 'kg', 19500, 0, 19500),
  ('e090-loc-north-kg', 'OPENING-E-090-LOC-NORTH-KG', 'lot-e090', 'loc-north', 'kg', 12500, 0, 12500),
  ('f301-loc-warehouse-kg', 'OPENING-F-301-LOC-WAREHOUSE-KG', 'lot-f301', 'loc-warehouse', 'kg', 17000, 0, 17000),
  ('g512-loc-south-kg', 'OPENING-G-512-LOC-SOUTH-KG', 'lot-g512', 'loc-south', 'kg', 21000, 0, 21000),
  ('h118-loc-central-kg', 'OPENING-H-118-LOC-CENTRAL-KG', 'lot-h118', 'loc-central', 'kg', 13500, 0, 13500)
) as manifest(slug, reference, lot_id, location_id, unit, persisted, ledger, candidate);

create temporary table h4b_expected_items (
  id text primary key, movement_id text not null unique, lot_id text not null,
  quantity numeric not null, unit text not null, sort_order integer not null,
  data jsonb not null
) on commit drop;

insert into h4b_expected_items (id, movement_id, lot_id, quantity, unit, sort_order, data)
select 'item-opening-008-' || slug, id, lot_id, candidate, unit, 0,
  jsonb_build_object(
    'source', 'papastock_h4_opening_balance',
    'manifest', '008_approved_opening_balances',
    'effect', 'opening_credit'
  )
from h4b_expected_movements;

do $$
declare
  movement_collisions integer;
  exact_movements integer;
  item_collisions integer;
  exact_items integer;
begin
  select count(*) into movement_collisions
  from public.movements movement
  where exists (
    select 1 from h4b_expected_movements expected
    where expected.id = movement.id or expected.reference = movement.reference
  ) or movement.data->>'manifest' = '008_approved_opening_balances';

  select count(*) into exact_movements
  from public.movements movement
  join h4b_expected_movements expected on expected.id = movement.id
  where movement.reference = expected.reference
    and movement.kind = 'opening_balance'
    and movement.status = 'completed'
    and movement.lot_id = expected.lot_id
    and movement.origin_location_id is null
    and movement.destination_location_id = expected.location_id
    and movement.quantity = expected.candidate
    and movement.movement_date = date '2026-08-24'
    and movement.remito_number is null
    and movement.reception_status = 'not_applicable'
    and movement.corrects_movement_id is null
    and movement.received_total is null
    and movement.received_unit is null
    and movement.received_at is null
    and movement.reception_idempotency_key is null
    and movement.reception_payload_fingerprint is null
    and movement.data = expected.data;

  select count(*) into item_collisions
  from public.movement_items item
  where exists (select 1 from h4b_expected_items expected where expected.id = item.id)
     or item.data->>'manifest' = '008_approved_opening_balances';

  select count(*) into exact_items
  from public.movement_items item
  join h4b_expected_items expected on expected.id = item.id
  where item.movement_id = expected.movement_id
    and item.lot_id = expected.lot_id
    and item.dispatched_quantity = expected.quantity
    and item.received_quantity is null
    and item.received_at is null
    and item.unit = expected.unit
    and item.sort_order = expected.sort_order
    and item.data = expected.data;

  if movement_collisions = 0 and item_collisions = 0 then return; end if;
  if movement_collisions = 14 and exact_movements = 14
     and item_collisions = 14 and exact_items = 14 then return; end if;

  raise exception
    'Manifest 008 parcial o divergente: movement_collisions=%, exact_movements=%, item_collisions=%, exact_items=%',
    movement_collisions, exact_movements, item_collisions, exact_items;
end;
$$;

insert into public.movements (
  id, reference, lot_id, origin_location_id, destination_location_id, quantity,
  movement_date, status, remito_number, kind, corrects_movement_id,
  received_total, received_unit, received_at, reception_status,
  reception_idempotency_key, reception_payload_fingerprint, data
)
select expected.id, expected.reference, expected.lot_id, null, expected.location_id,
  expected.candidate, date '2026-08-24', 'completed', null, 'opening_balance',
  null, null, null, null, 'not_applicable', null, null, expected.data
from h4b_expected_movements expected
where not exists (
  select 1 from public.movements movement
  where movement.id = expected.id or movement.reference = expected.reference
);

insert into public.movement_items (
  id, movement_id, lot_id, dispatched_quantity, received_quantity, received_at,
  unit, sort_order, data
)
select expected.id, expected.movement_id, expected.lot_id, expected.quantity,
  null, null, expected.unit, expected.sort_order, expected.data
from h4b_expected_items expected
where not exists (select 1 from public.movement_items item where item.id = expected.id);

do $$
declare
  invalid_movements integer;
  invalid_items integer;
begin
  select count(*) into invalid_movements
  from h4b_expected_movements expected
  left join public.movements movement on movement.id = expected.id
  where movement.id is null
     or movement.reference <> expected.reference
     or movement.kind <> 'opening_balance'
     or movement.status <> 'completed'
     or movement.lot_id <> expected.lot_id
     or movement.origin_location_id is not null
     or movement.destination_location_id <> expected.location_id
     or movement.quantity <> expected.candidate
     or movement.movement_date <> date '2026-08-24'
     or movement.remito_number is not null
     or movement.reception_status <> 'not_applicable'
     or movement.corrects_movement_id is not null
     or movement.received_total is not null
     or movement.received_unit is not null
     or movement.received_at is not null
     or movement.reception_idempotency_key is not null
     or movement.reception_payload_fingerprint is not null
     or movement.data is distinct from expected.data;

  select count(*) into invalid_items
  from h4b_expected_items expected
  left join public.movement_items item on item.id = expected.id
  where item.id is null
     or item.movement_id <> expected.movement_id
     or item.lot_id <> expected.lot_id
     or item.dispatched_quantity <> expected.quantity
     or item.received_quantity is not null
     or item.received_at is not null
     or item.unit <> expected.unit
     or item.sort_order <> expected.sort_order
     or item.data is distinct from expected.data;

  if invalid_movements <> 0 or invalid_items <> 0
     or (select count(*) from public.movements where data->>'manifest' = '008_approved_opening_balances') <> 14
     or (select count(*) from public.movement_items where data->>'manifest' = '008_approved_opening_balances') <> 14 then
    raise exception 'Manifest 008 no coincide exactamente con el manifiesto aprobado.';
  end if;
end;
$$;

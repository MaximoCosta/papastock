insert into public.locations (id, name, type) values
  ('loc-north', 'Frigorífico Norte', 'cold_storage'),
  ('loc-south', 'Frigorífico Sur', 'cold_storage'),
  ('loc-central', 'Frigorífico Central', 'cold_storage'),
  ('loc-warehouse', 'Galpón Principal', 'warehouse'),
  ('loc-oriente', 'Campo Oriente', 'warehouse'),
  ('loc-frig-a', 'Frigorífico A', 'cold_storage')
on conflict (id) do update set name = excluded.name, type = excluded.type;

insert into public.lots (id, code, variety, campaign, producer, origin, harvest_date) values
  ('lot-a204', 'A-204', 'Innovator', '2025/26', 'Establecimiento El Ombú', 'Balcarce, Buenos Aires, Argentina', '2026-07-20'),
  ('lot-a310', 'A-310', 'Innovator', '2025/26', 'La Esperanza Agro', 'Balcarce, Buenos Aires, Argentina', '2026-07-28'),
  ('lot-b118', 'B-118', 'Spunta', '2025/26', 'Campo San José', 'Otamendi, Buenos Aires, Argentina', '2026-08-04'),
  ('lot-c102', 'C-102', 'Atlantic', '2025/26', 'Pampa Fértil', 'Tandil, Buenos Aires, Argentina', '2026-07-15'),
  ('lot-b221', 'B-221', 'Russet', '2025/26', 'Los Aromos', 'Balcarce, Buenos Aires, Argentina', '2026-07-31'),
  ('lot-d405', 'D-405', 'Spunta', '2025/26', 'Campo San José', 'Otamendi, Buenos Aires, Argentina', '2026-08-02'),
  ('lot-e090', 'E-090', 'Atlantic', '2025/26', 'Pampa Fértil', 'Tandil, Buenos Aires, Argentina', '2026-07-12'),
  ('lot-f301', 'F-301', 'Innovator', '2025/26', 'La Esperanza Agro', 'Balcarce, Buenos Aires, Argentina', '2026-08-06'),
  ('lot-g512', 'G-512', 'Russet', '2025/26', 'Establecimiento El Ombú', 'Balcarce, Buenos Aires, Argentina', '2026-07-23'),
  ('lot-h118', 'H-118', 'Spunta', '2025/26', 'Los Aromos', 'Mar del Plata, Buenos Aires, Argentina', '2026-08-10'),
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
  id, lot_id, location_id, declared_quantity, verified_quantity, verification_pending, updated_at
) values
  ('stock-a204', 'lot-a204', 'loc-south', 25000, 24000, false, '2026-08-21T10:30:00-03:00'),
  ('stock-a310', 'lot-a310', 'loc-central', 22000, 22000, false, '2026-08-21T09:15:00-03:00'),
  ('stock-b118', 'lot-b118', 'loc-north', 14500, 14500, false, '2026-08-20T17:20:00-03:00'),
  ('stock-c102', 'lot-c102', 'loc-warehouse', 18500, 18000, false, '2026-08-21T08:40:00-03:00'),
  ('stock-b221', 'lot-b221', 'loc-south', 16000, 16000, false, '2026-08-20T14:05:00-03:00'),
  ('stock-d405', 'lot-d405', 'loc-central', 19500, 19500, false, '2026-08-20T12:10:00-03:00'),
  ('stock-e090', 'lot-e090', 'loc-north', 12500, 12500, false, '2026-08-19T16:55:00-03:00'),
  ('stock-f301', 'lot-f301', 'loc-warehouse', 17000, 0, true, '2026-08-21T11:45:00-03:00'),
  ('stock-g512', 'lot-g512', 'loc-south', 21000, 21000, false, '2026-08-20T18:00:00-03:00'),
  ('stock-h118', 'lot-h118', 'loc-central', 13500, 13500, false, '2026-08-21T07:50:00-03:00')
on conflict (id) do update set
  lot_id = excluded.lot_id,
  location_id = excluded.location_id,
  declared_quantity = excluded.declared_quantity,
  verified_quantity = excluded.verified_quantity,
  verification_pending = excluded.verification_pending,
  updated_at = excluded.updated_at;

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
  updated_at = excluded.updated_at,
  unit = excluded.unit;

insert into public.movements (
  id, reference, lot_id, origin_location_id, destination_location_id, quantity, movement_date, status
) values
  ('movement-1032', 'MV-1032', 'lot-a204', 'loc-north', 'loc-south', 1000, '2026-08-20', 'pending'),
  ('movement-1028', 'MV-1028', 'lot-a204', 'loc-warehouse', 'loc-south', 8000, '2026-08-18', 'completed'),
  ('movement-1016', 'MV-1016', 'lot-a310', 'loc-warehouse', 'loc-central', 22000, '2026-08-10', 'completed'),
  ('movement-1037', 'MV-1037', 'lot-c102', 'loc-warehouse', 'loc-central', 500, '2026-08-21', 'cancelled')
on conflict (id) do update set
  reference = excluded.reference,
  lot_id = excluded.lot_id,
  origin_location_id = excluded.origin_location_id,
  destination_location_id = excluded.destination_location_id,
  quantity = excluded.quantity,
  movement_date = excluded.movement_date,
  status = excluded.status;

-- El seed puede ejecutarse después de 003, cuando su backfill legacy ya ocurrió.
-- Materializa las líneas canónicas de estos movimientos sin duplicarlas si una
-- base existente ya las tiene.
insert into public.movement_items (
  id, movement_id, lot_id, dispatched_quantity, unit, sort_order, data
)
select seeded.id, seeded.movement_id, seeded.lot_id, seeded.quantity, 'kg', 0, '{"source":"seed"}'::jsonb
from (values
  ('mitem-movement-1032', 'movement-1032', 'lot-a204', 1000::numeric),
  ('mitem-movement-1028', 'movement-1028', 'lot-a204', 8000::numeric),
  ('mitem-movement-1016', 'movement-1016', 'lot-a310', 22000::numeric),
  ('mitem-movement-1037', 'movement-1037', 'lot-c102', 500::numeric)
) as seeded(id, movement_id, lot_id, quantity)
where not exists (
  select 1
  from public.movement_items existing
  where existing.movement_id = seeded.movement_id
)
on conflict (id) do nothing;

insert into public.traceability_events (id, lot_id, event_type, event_date, location_id, data) values
  ('trace-a204-planting', 'lot-a204', 'planting', '2026-03-10', null, '{"seedBatch":"SEM-882","plot":"Lote 14"}'),
  ('trace-a204-treatment', 'lot-a204', 'treatment', '2026-06-18', null, '{"product":"Mancozeb","dose":"2 kg/ha"}'),
  ('trace-a204-harvest', 'lot-a204', 'harvest', '2026-07-20', null, '{"netWeight":25000}'),
  ('trace-a204-verify', 'lot-a204', 'stock_verification', '2026-08-21', 'loc-south', '{"verifiedQuantity":24000}'),
  ('trace-a310-planting', 'lot-a310', 'planting', '2026-03-14', null, '{"seedBatch":"SEM-901","plot":"Lote 7"}'),
  ('trace-a310-quality', 'lot-a310', 'quality_control', '2026-07-18', null, '{"dryMatter":"21.4%","result":"Aprobado"}'),
  ('trace-a310-harvest', 'lot-a310', 'harvest', '2026-07-28', null, '{"netWeight":22000}'),
  ('trace-a310-verify', 'lot-a310', 'stock_verification', '2026-08-21', 'loc-central', '{"verifiedQuantity":22000}'),
  ('trace-c102-planting', 'lot-c102', 'planting', '2026-03-05', null, '{"seedBatch":"SEM-791"}'),
  ('trace-c102-harvest', 'lot-c102', 'harvest', '2026-07-15', null, '{"netWeight":18500}')
on conflict (id) do update set
  lot_id = excluded.lot_id,
  event_type = excluded.event_type,
  event_date = excluded.event_date,
  location_id = excluded.location_id,
  data = excluded.data;

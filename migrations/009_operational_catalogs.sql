create table public.transporters (
  id text primary key,
  company_name text not null,
  trade_name text,
  cuit text not null,
  contact_name text not null,
  phone text not null,
  email text not null,
  address text not null,
  city text not null,
  province text not null,
  license_plate text not null,
  vehicle_type text not null,
  capacity_kg numeric(14, 3) not null,
  insurance_policy text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint transporters_id_length check (char_length(id) between 1 and 80),
  constraint transporters_company_name_length check (char_length(company_name) between 1 and 120),
  constraint transporters_cuit_length check (char_length(cuit) between 1 and 20),
  constraint transporters_capacity_positive check (capacity_kg > 0)
);

create table public.shelf_units (
  id text primary key,
  location_id text not null references public.locations (id) on update cascade on delete restrict,
  code text not null,
  label text not null,
  grid_row integer not null,
  grid_col integer not null,
  created_at timestamptz not null default now(),
  constraint shelf_units_id_length check (char_length(id) between 1 and 80),
  constraint shelf_units_code_length check (char_length(code) between 1 and 40),
  constraint shelf_units_grid_nonnegative check (grid_row >= 0 and grid_col >= 0),
  constraint shelf_units_location_code_unique unique (location_id, code)
);

create table public.shelves (
  id text primary key,
  location_id text not null references public.locations (id) on update cascade on delete restrict,
  shelf_unit_id text not null references public.shelf_units (id) on update cascade on delete cascade,
  code text not null,
  label text not null,
  level integer not null,
  capacity_kg numeric(14, 3),
  created_at timestamptz not null default now(),
  constraint shelves_id_length check (char_length(id) between 1 and 80),
  constraint shelves_level_positive check (level >= 1 and level <= 6),
  constraint shelves_capacity_positive check (capacity_kg is null or capacity_kg > 0),
  constraint shelves_unit_level_unique unique (shelf_unit_id, level)
);

alter table public.stock_records
  add column shelf_id text references public.shelves (id) on update cascade on delete set null;

insert into public.transporters (
  id, company_name, trade_name, cuit, contact_name, phone, email, address, city, province,
  license_plate, vehicle_type, capacity_kg, insurance_policy, notes, active
) values
  (
    'tr-andina', 'Transportes Andina S.A.', 'Andina Logística', '30-71234567-8', 'Marcos Rivas',
    '+54 2266 45-8901', 'despachos@andinalog.com.ar', 'Ruta 226 Km 48.2', 'Balcarce', 'Buenos Aires',
    'AB 834 CD', 'Semirremolque refrigerado', 28000, 'La Caja · Póliza 884221',
    'Preferido para exportaciones a Brasil. Habilitado SENASA.', true
  ),
  (
    'tr-pampa', 'Pampa Frio SRL', 'Pampa Frío', '30-69881234-2', 'Lucía Méndez',
    '+54 11 4876-2200', 'operaciones@pampafrio.com', 'Av. Circunvalación 1250', 'Mar del Plata', 'Buenos Aires',
    'AC 102 EF', 'Camión 6×2 con equipo frío', 18000, 'Sancor · Póliza 551209',
    'Movimientos internos entre frigoríficos.', true
  ),
  (
    'tr-sur', 'Sur Cargo Express', null, '30-70551220-9', 'Diego Alcorta',
    '+54 291 455-7788', 'flota@surcargo.com.ar', 'Parque Industrial Oeste Lote 14', 'Bahía Blanca', 'Buenos Aires',
    'AD 441 GH', 'Bitren refrigerado', 32000, 'Federación Patronal · 220981',
    null, true
  )
on conflict (id) do nothing;

insert into public.shelf_units (id, location_id, code, label, grid_row, grid_col)
select seeded.id, seeded.location_id, seeded.code, seeded.label, seeded.grid_row, seeded.grid_col
from (values
  ('unit-n-a', 'loc-north', 'N-A', 'Pasillo A', 0, 0),
  ('unit-n-b', 'loc-north', 'N-B', 'Pasillo B', 0, 2),
  ('unit-s-a', 'loc-south', 'S-A', 'Cámara 1 · Rack A', 0, 0),
  ('unit-s-b', 'loc-south', 'S-B', 'Cámara 1 · Rack B', 0, 1),
  ('unit-s-c', 'loc-south', 'S-C', 'Cámara 2 · Rack A', 1, 0),
  ('unit-c-a', 'loc-central', 'C-A', 'Zona fría · Bloque A', 0, 0),
  ('unit-c-b', 'loc-central', 'C-B', 'Zona fría · Bloque B', 0, 1),
  ('unit-c-c', 'loc-central', 'C-C', 'Zona fría · Bloque C', 1, 0),
  ('unit-w-a', 'loc-warehouse', 'G-A', 'Galpón · Fila A', 0, 0),
  ('unit-w-b', 'loc-warehouse', 'G-B', 'Galpón · Fila B', 0, 1),
  ('unit-w-c', 'loc-warehouse', 'G-C', 'Galpón · Fila C', 0, 2)
) as seeded(id, location_id, code, label, grid_row, grid_col)
where exists (select 1 from public.locations where id = seeded.location_id)
on conflict (id) do nothing;

insert into public.shelves (id, location_id, shelf_unit_id, code, label, level, capacity_kg)
select seeded.id, seeded.location_id, seeded.shelf_unit_id, seeded.code, seeded.label, seeded.level, seeded.capacity_kg
from (values
  ('shelf-n-a1', 'loc-north', 'unit-n-a', 'N-A1', 'Pasillo A · Nivel 1', 1, 18000::numeric),
  ('shelf-n-a2', 'loc-north', 'unit-n-a', 'N-A2', 'Pasillo A · Nivel 2', 2, 18000::numeric),
  ('shelf-n-b1', 'loc-north', 'unit-n-b', 'N-B1', 'Pasillo B · Nivel 1', 1, 15000::numeric),
  ('shelf-s-a1', 'loc-south', 'unit-s-a', 'S-A1', 'Cámara 1 · Rack A · N1', 1, 22000::numeric),
  ('shelf-s-a2', 'loc-south', 'unit-s-b', 'S-A2', 'Cámara 1 · Rack B · N1', 1, 22000::numeric),
  ('shelf-s-b1', 'loc-south', 'unit-s-c', 'S-B1', 'Cámara 2 · Rack A · N1', 1, 20000::numeric),
  ('shelf-c-a1', 'loc-central', 'unit-c-a', 'C-A1', 'Bloque A · Nivel 1', 1, 25000::numeric),
  ('shelf-c-a2', 'loc-central', 'unit-c-b', 'C-A2', 'Bloque B · Nivel 1', 1, 25000::numeric),
  ('shelf-c-b1', 'loc-central', 'unit-c-c', 'C-B1', 'Bloque C · Nivel 1', 1, 20000::numeric),
  ('shelf-w-a1', 'loc-warehouse', 'unit-w-a', 'G-A1', 'Fila A · Nivel 1', 1, 30000::numeric),
  ('shelf-w-b1', 'loc-warehouse', 'unit-w-b', 'G-B1', 'Fila B · Nivel 1', 1, 28000::numeric),
  ('shelf-w-c1', 'loc-warehouse', 'unit-w-c', 'G-C1', 'Fila C · Nivel 1', 1, 25000::numeric)
) as seeded(id, location_id, shelf_unit_id, code, label, level, capacity_kg)
where exists (select 1 from public.shelf_units where id = seeded.shelf_unit_id)
on conflict (id) do nothing;

update public.stock_records set shelf_id = 'shelf-s-a1' where id = 'stock-a204' and shelf_id is null;
update public.stock_records set shelf_id = 'shelf-c-a1' where id = 'stock-a310' and shelf_id is null;
update public.stock_records set shelf_id = 'shelf-n-a1' where id = 'stock-b118' and shelf_id is null;
update public.stock_records set shelf_id = 'shelf-w-a1' where id = 'stock-c102' and shelf_id is null;
update public.stock_records set shelf_id = 'shelf-s-a2' where id = 'stock-b221' and shelf_id is null;
update public.stock_records set shelf_id = 'shelf-c-a2' where id = 'stock-d405' and shelf_id is null;
update public.stock_records set shelf_id = 'shelf-n-a2' where id = 'stock-e090' and shelf_id is null;
update public.stock_records set shelf_id = 'shelf-w-b1' where id = 'stock-f301' and shelf_id is null;
update public.stock_records set shelf_id = 'shelf-s-b1' where id = 'stock-g512' and shelf_id is null;
update public.stock_records set shelf_id = 'shelf-c-b1' where id = 'stock-h118' and shelf_id is null;

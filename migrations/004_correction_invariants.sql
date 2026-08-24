-- Corrections reclassify stock between lots at one physical location.
-- Physical transfers/imports keep the original distinct-endpoint invariant.
alter table public.movements
  drop constraint if exists movements_distinct_endpoints;

alter table public.movements
  drop constraint if exists movements_endpoint_semantics;

alter table public.movements
  add constraint movements_endpoint_semantics check (
    (
      kind = 'correction'
      and corrects_movement_id is not null
      and origin_location_id is not null
      and destination_location_id = origin_location_id
    )
    or
    (
      kind in ('transfer', 'import')
      and corrects_movement_id is null
      and (
        origin_location_id is null
        or destination_location_id is null
        or origin_location_id <> destination_location_id
      )
    )
  );

-- Canonical opening balances are auditable movements, never magic stock fields.
alter table public.movements
  drop constraint if exists movements_kind_check;

alter table public.movements
  add constraint movements_kind_check check (
    kind in ('transfer', 'correction', 'import', 'opening_balance')
  );

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
    or
    (
      kind = 'opening_balance'
      and corrects_movement_id is null
      and origin_location_id is null
      and destination_location_id is not null
      and status = 'completed'
      and reception_status = 'not_applicable'
      and received_total is null
      and received_unit is null
      and received_at is null
      and reception_idempotency_key is null
      and reception_payload_fingerprint is null
      and data ? 'source'
      and jsonb_typeof(data->'source') = 'string'
      and char_length(data->>'source') between 1 and 120
    )
  );

create or replace function public.assert_opening_balance_has_items()
returns trigger
language plpgsql
as $$
declare
  target_id text;
begin
  foreach target_id in array array_remove(array[
    case when tg_op <> 'INSERT' then old.movement_id end,
    case when tg_op <> 'DELETE' then new.movement_id end
  ], null)
  loop
    if exists (
      select 1 from public.movements movement
      where movement.id = target_id and movement.kind = 'opening_balance'
    ) and not exists (
      select 1 from public.movement_items item where item.movement_id = target_id
    ) then
      raise exception 'opening_balance % requiere al menos un movement_item', target_id
        using errcode = '23514';
    end if;
  end loop;
  return null;
end;
$$;

create or replace function public.assert_opening_balance_movement_has_items()
returns trigger
language plpgsql
as $$
begin
  if new.kind = 'opening_balance' and not exists (
    select 1 from public.movement_items item where item.movement_id = new.id
  ) then
    raise exception 'opening_balance % requiere al menos un movement_item', new.id
      using errcode = '23514';
  end if;
  return null;
end;
$$;

create constraint trigger movements_opening_balance_has_items
after insert or update of kind on public.movements
deferrable initially deferred
for each row execute function public.assert_opening_balance_movement_has_items();

create constraint trigger movement_items_keep_opening_balance_nonempty
after insert or update of movement_id or delete on public.movement_items
deferrable initially deferred
for each row execute function public.assert_opening_balance_has_items();

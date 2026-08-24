alter table public.movements
  add column reception_idempotency_key text,
  add column reception_payload_fingerprint text;

alter table public.movements
  add constraint movements_reception_idempotency_pair check (
    (reception_idempotency_key is null and reception_payload_fingerprint is null)
    or
    (reception_idempotency_key is not null and reception_payload_fingerprint is not null)
  ),
  add constraint movements_reception_idempotency_key_length check (
    reception_idempotency_key is null
    or char_length(reception_idempotency_key) between 16 and 200
  ),
  add constraint movements_reception_fingerprint_format check (
    reception_payload_fingerprint is null
    or reception_payload_fingerprint ~ '^[0-9a-f]{64}$'
  );

create unique index movements_reception_idempotency_key_unique
  on public.movements (reception_idempotency_key)
  where reception_idempotency_key is not null;

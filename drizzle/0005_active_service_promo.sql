-- Keep only one active promotion per service to avoid quote/booking mismatches.
WITH ranked AS (
  SELECT
    id,
    service_id,
    ROW_NUMBER() OVER (
      PARTITION BY service_id
      ORDER BY updated_at DESC NULLS LAST, created_at DESC, id DESC
    ) AS rn
  FROM service_promotions
  WHERE is_active = true
)
UPDATE service_promotions AS sp
SET
  is_active = false,
  updated_at = now()
FROM ranked
WHERE sp.id = ranked.id
  AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS service_promotions_active_per_service_idx
ON service_promotions (service_id)
WHERE is_active = true;

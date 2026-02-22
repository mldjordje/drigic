WITH category_seed ("name", "sort_order") AS (
  VALUES
    ('Hijaluronski fileri', 1),
    ('Botox', 2),
    ('Skinbusteri', 3),
    ('Kolagen stimulatori', 4),
    ('Polinukleotidi i Egzozomi', 5),
    ('Lipoliza', 6),
    ('Hemijski piling', 7),
    ('Dermapen', 8),
    ('PRP', 9),
    ('Mezoterapija', 10)
),
updated_categories AS (
  UPDATE "service_categories" AS sc
  SET "sort_order" = seed."sort_order",
      "is_active" = true,
      "updated_at" = now()
  FROM category_seed AS seed
  WHERE lower(sc."name") = lower(seed."name")
  RETURNING sc."id"
)
INSERT INTO "service_categories" ("name", "sort_order", "is_active", "created_at", "updated_at")
SELECT seed."name", seed."sort_order", true, now(), now()
FROM category_seed AS seed
WHERE NOT EXISTS (
  SELECT 1
  FROM "service_categories" AS sc
  WHERE lower(sc."name") = lower(seed."name")
);

WITH service_seed (
  "name",
  "category_name",
  "price_eur",
  "duration_min",
  "supports_ml",
  "max_ml",
  "description"
) AS (
  VALUES
    ('Hijaluronski filer', 'Hijaluronski fileri', 180, 30, true, 5, 'Hijaluronski filer tretman (obavezno biranje brenda i kolicine).'),
    ('Botoks I regija', 'Botox', 120, 30, false, 1, 'Botox tretman - jedna regija.'),
    ('Botoks II regije', 'Botox', 160, 30, false, 1, 'Botox tretman - dve regije.'),
    ('Botoks III regije', 'Botox', 200, 30, false, 1, 'Botox tretman - tri regije.'),
    ('Full Face botox', 'Botox', 320, 45, false, 1, 'Botox tretman - full face pristup.'),
    ('Dermapen', 'Dermapen', 85, 30, false, 1, 'Dermapen tretman.')
),
category_ref AS (
  SELECT
    lower(sc."name") AS "category_key",
    min(sc."id"::text)::uuid AS "category_id"
  FROM "service_categories" AS sc
  GROUP BY lower(sc."name")
),
updated_services AS (
  UPDATE "services" AS s
  SET "category_id" = cr."category_id",
      "body_area_id" = NULL,
      "description" = seed."description",
      "kind" = 'single',
      "color_hex" = '#8e939b',
      "supports_ml" = seed."supports_ml",
      "max_ml" = seed."max_ml",
      "extra_ml_discount_percent" = 0,
      "price_rsd" = seed."price_eur",
      "duration_min" = seed."duration_min",
      "is_active" = true,
      "is_vip" = false,
      "updated_at" = now()
  FROM service_seed AS seed
  JOIN category_ref AS cr ON cr."category_key" = lower(seed."category_name")
  WHERE lower(s."name") = lower(seed."name")
  RETURNING s."id"
)
INSERT INTO "services" (
  "category_id",
  "body_area_id",
  "name",
  "description",
  "kind",
  "color_hex",
  "supports_ml",
  "max_ml",
  "extra_ml_discount_percent",
  "price_rsd",
  "duration_min",
  "is_active",
  "is_vip",
  "created_at",
  "updated_at"
)
SELECT
  cr."category_id",
  NULL,
  seed."name",
  seed."description",
  'single',
  '#8e939b',
  seed."supports_ml",
  seed."max_ml",
  0,
  seed."price_eur",
  seed."duration_min",
  true,
  false,
  now(),
  now()
FROM service_seed AS seed
JOIN category_ref AS cr ON cr."category_key" = lower(seed."category_name")
WHERE NOT EXISTS (
  SELECT 1
  FROM "services" AS s
  WHERE lower(s."name") = lower(seed."name")
);

UPDATE "services"
SET "is_active" = false,
    "updated_at" = now()
WHERE lower("name") IN (
  'hijaluronski filer 0.5ml',
  'hijaluronski filer 0.7ml'
);

UPDATE "service_categories"
SET "is_active" = false,
    "updated_at" = now();

UPDATE "services"
SET "is_active" = false,
    "updated_at" = now();

WITH category_seed ("name", "sort_order") AS (
  VALUES
    ('Hijaluronski fileri', 1),
    ('Botox', 2),
    ('Skinbusteri', 3),
    ('Kolagen stimulatori', 4),
    ('Polinukleotidi i Egzozomi', 5),
    ('Lipoliza', 6),
    ('Hemijski piling', 7),
    ('PRP', 8),
    ('Mezoterapija', 9)
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

WITH service_seed ("name", "category_name", "price_eur", "duration_min", "description") AS (
  VALUES
    ('Hijaluronski filer 0.5ml', 'Hijaluronski fileri', 120, 30, 'Hijaluronski filer tretman.'),
    ('Hijaluronski filer 0.7ml', 'Hijaluronski fileri', 170, 30, 'Hijaluronski filer tretman.'),
    ('Korekcija podocnjaka filerom', 'Hijaluronski fileri', 200, 30, 'Korekcija podocnjaka filerom.'),
    ('Hijaluronidaza 1ml', 'Hijaluronski fileri', 100, 30, 'Hijaluronidaza tretman.'),
    ('Lip flip', 'Botox', 60, 30, 'Botox tretman - Lip flip.'),
    ('Gummy smile', 'Botox', 80, 30, 'Botox tretman - Gummy smile.'),
    ('Nefertiti lift (Botox vrata)', 'Botox', 200, 30, 'Botox tretman vrata.'),
    ('PRS LOLA', 'Skinbusteri', 200, 30, 'Skinbuster tretman.'),
    ('Aquashine skinbuster', 'Skinbusteri', 180, 30, 'Skinbuster tretman.'),
    ('Profhilo', 'Skinbusteri', 220, 30, 'Skinbuster tretman.'),
    ('Profhilo struktura', 'Skinbusteri', 280, 30, 'Skinbuster tretman.'),
    ('Jalupro Super Hydro', 'Skinbusteri', 180, 30, 'Skinbuster tretman.'),
    ('Jalupro Young Eye', 'Skinbusteri', 180, 30, 'Skinbuster tretman.'),
    ('Viscoderm', 'Skinbusteri', 160, 30, 'Skinbuster tretman.'),
    ('Harmonyca kolagen stimulator', 'Kolagen stimulatori', 500, 60, 'Kolagen stimulator tretman.'),
    ('Aesplla kolagen stimulator', 'Kolagen stimulatori', 400, 60, 'Kolagen stimulator tretman.'),
    ('Polinukleotidi', 'Polinukleotidi i Egzozomi', 180, 30, 'Polinukleotid tretman.'),
    ('Lipoliza 1 doza', 'Lipoliza', 50, 30, 'Lipoliza tretman.'),
    ('Lemon Bottle', 'Lipoliza', 90, 30, 'Lipoliza tretman.'),
    ('PRX hemijski piling', 'Hemijski piling', 50, 30, 'Hemijski piling tretman.'),
    ('Dermapen', 'Hemijski piling', 85, 30, 'Dermapen tretman.'),
    ('PRP', 'PRP', 120, 30, 'PRP tretman.'),
    ('PRP 3 tretmana', 'PRP', 300, 30, 'PRP paket od 3 tretmana (pojedinacna rezervacija).'),
    ('Mezoterapija lice', 'Mezoterapija', 70, 30, 'Mezoterapija lica.'),
    ('Mezoterapija podocnjaka', 'Mezoterapija', 50, 30, 'Mezoterapija podocnjaka.')
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
      "supports_ml" = false,
      "max_ml" = 1,
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
  false,
  1,
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

UPDATE "service_categories"
SET "is_active" = true,
    "updated_at" = now()
WHERE lower("name") = lower('Akcije i paketi');

WITH category_ref AS (
  SELECT min("id"::text)::uuid AS "id"
  FROM "service_categories"
  WHERE lower("name") = lower('Akcije i paketi')
),
fallback_category_ref AS (
  SELECT min("id"::text)::uuid AS "id"
  FROM "service_categories"
  WHERE lower("name") = lower('Hijaluronski fileri')
),
target_category AS (
  SELECT coalesce(category_ref."id", fallback_category_ref."id") AS "id"
  FROM category_ref
  CROSS JOIN fallback_category_ref
),
service_seed (
  "name",
  "description",
  "price_eur",
  "duration_min",
  "supports_ml",
  "max_ml",
  "show_in_face_booking"
) AS (
  VALUES
    ('1ml hijalurona', 'Promotivna ponuda za 1ml hijalurona.', 180, 30, false, 1, true),
    ('Botox 3 regije', 'Botox tretman za tri regije.', 240, 30, false, 1, true),
    ('Kolagen stimulator Juvelook za podocnjake', 'Juvelook tretman za podocnjake.', 200, 30, false, 1, true),
    ('Polinukleotidi Mastelli Plinest', 'Polinukleotid tretman Mastelli Plinest.', 200, 30, false, 1, true),
    ('Botox protiv hiperhidroze', 'Botox tretman protiv hiperhidroze.', 350, 30, false, 1, false),
    ('Lola/Aquashine skinbuster', 'Lola ili Aquashine skinbuster tretman.', 210, 30, false, 1, true),
    ('Kolagen stimulator Juvelook ili Lenisna FULL FACE', 'Kolagen stimulator Juvelook ili Lenisna full face.', 360, 30, false, 1, true),
    ('Lenisna(PDLLA) kolagen stimulator full face', 'Lenisna PDLLA kolagen stimulator full face.', 440, 30, false, 1, true),
    ('Full Face botox', 'Botox tretman - full face pristup.', 450, 30, false, 1, true)
),
updated_services AS (
  UPDATE "services" AS s
  SET "category_id" = target_category."id",
      "description" = seed."description",
      "kind" = 'single',
      "supports_ml" = seed."supports_ml",
      "max_ml" = seed."max_ml",
      "extra_ml_discount_percent" = 0,
      "price_rsd" = seed."price_eur",
      "duration_min" = seed."duration_min",
      "is_active" = true,
      "show_in_face_booking" = seed."show_in_face_booking",
      "show_in_body_booking" = false,
      "updated_at" = now()
  FROM service_seed AS seed
  CROSS JOIN target_category
  WHERE lower(s."name") = lower(seed."name")
  RETURNING s."id"
)
INSERT INTO "services" (
  "category_id",
  "name",
  "description",
  "kind",
  "supports_ml",
  "max_ml",
  "extra_ml_discount_percent",
  "price_rsd",
  "duration_min",
  "is_active",
  "is_vip",
  "show_in_face_booking",
  "show_in_body_booking",
  "created_at",
  "updated_at"
)
SELECT
  target_category."id",
  seed."name",
  seed."description",
  'single',
  seed."supports_ml",
  seed."max_ml",
  0,
  seed."price_eur",
  seed."duration_min",
  true,
  false,
  seed."show_in_face_booking",
  false,
  now(),
  now()
FROM service_seed AS seed
CROSS JOIN target_category
WHERE NOT EXISTS (
  SELECT 1
  FROM "services" AS s
  WHERE lower(s."name") = lower(seed."name")
);

WITH promo_seed ("service_name", "title", "promo_price_eur") AS (
  VALUES
    ('1ml hijalurona', 'Majska akcija', 180),
    ('Botox 3 regije', 'Majska akcija', 180),
    ('Kolagen stimulator Juvelook za podocnjake', 'Majska akcija', 150),
    ('Polinukleotidi Mastelli Plinest', 'Majska akcija', 160),
    ('Botox protiv hiperhidroze', 'Majska akcija', 250)
),
service_ref AS (
  SELECT s."id", lower(s."name") AS "name_key"
  FROM "services" AS s
)
UPDATE "service_promotions" AS sp
SET "is_active" = false,
    "updated_at" = now()
FROM promo_seed AS seed
JOIN service_ref AS sr ON sr."name_key" = lower(seed."service_name")
WHERE sp."service_id" = sr."id"
  AND sp."is_active" = true;

WITH promo_seed ("service_name", "title", "promo_price_eur") AS (
  VALUES
    ('1ml hijalurona', 'Majska akcija', 180),
    ('Botox 3 regije', 'Majska akcija', 180),
    ('Kolagen stimulator Juvelook za podocnjake', 'Majska akcija', 150),
    ('Polinukleotidi Mastelli Plinest', 'Majska akcija', 160),
    ('Botox protiv hiperhidroze', 'Majska akcija', 250)
),
service_ref AS (
  SELECT s."id", lower(s."name") AS "name_key"
  FROM "services" AS s
)
INSERT INTO "service_promotions" (
  "service_id",
  "title",
  "promo_price_rsd",
  "starts_at",
  "ends_at",
  "is_active",
  "created_at",
  "updated_at"
)
SELECT
  sr."id",
  seed."title",
  seed."promo_price_eur",
  NULL,
  NULL,
  true,
  now(),
  now()
FROM promo_seed AS seed
JOIN service_ref AS sr ON sr."name_key" = lower(seed."service_name");

WITH target_category AS (
  SELECT min("id"::text)::uuid AS "id"
  FROM "service_categories"
  WHERE lower("name") = lower('Akcije i paketi')
),
package_seed ("name", "description", "price_eur", "duration_min") AS (
  VALUES
    ('Regular paket: 1ml hijalurona + Botox 3 regije', '1ml hijalurona + Botox 3 regije.', 440, 30),
    ('Regular paket: Botox 3 regije + Lola/Aquashine skinbuster', 'Botox 3 regije + Lola/Aquashine skinbuster.', 450, 30),
    ('Regular paket: Botox 3 regije + kolagen stimulator Juvelook ili Lenisna FULL FACE', 'Botox 3 regije + kolagen stimulator Juvelook ili Lenisna full face.', 600, 45),
    ('Regular paket: 3 i vise ml hijalurona', '3 i vise ml hijalurona po 160 EUR / 1ml.', 480, 45),
    ('Premium paket: Triple lifting concept opcija 1', 'Harmonyca kolagen stimulator + Botox 3 regije + 2ml hijalurona.', 1240, 60),
    ('Premium paket: Triple lifting concept opcija 2', 'Lenisna(PDLLA) kolagen stimulator full face + Botox 3 regije + 2ml hijalurona.', 980, 60),
    ('Premium paket: Full face Botox', 'Full face Botox.', 450, 30)
),
updated_packages AS (
  UPDATE "services" AS s
  SET "category_id" = target_category."id",
      "description" = seed."description",
      "kind" = 'package',
      "supports_ml" = false,
      "max_ml" = 1,
      "extra_ml_discount_percent" = 0,
      "price_rsd" = seed."price_eur",
      "duration_min" = seed."duration_min",
      "is_active" = true,
      "show_in_face_booking" = false,
      "show_in_body_booking" = false,
      "updated_at" = now()
  FROM package_seed AS seed
  CROSS JOIN target_category
  WHERE lower(s."name") = lower(seed."name")
  RETURNING s."id"
)
INSERT INTO "services" (
  "category_id",
  "name",
  "description",
  "kind",
  "supports_ml",
  "max_ml",
  "extra_ml_discount_percent",
  "price_rsd",
  "duration_min",
  "is_active",
  "is_vip",
  "show_in_face_booking",
  "show_in_body_booking",
  "created_at",
  "updated_at"
)
SELECT
  target_category."id",
  seed."name",
  seed."description",
  'package',
  false,
  1,
  0,
  seed."price_eur",
  seed."duration_min",
  true,
  false,
  false,
  false,
  now(),
  now()
FROM package_seed AS seed
CROSS JOIN target_category
WHERE NOT EXISTS (
  SELECT 1
  FROM "services" AS s
  WHERE lower(s."name") = lower(seed."name")
);

WITH promo_seed ("service_name", "title", "promo_price_eur") AS (
  VALUES
    ('Regular paket: 1ml hijalurona + Botox 3 regije', 'Majska akcija', 350),
    ('Regular paket: Botox 3 regije + Lola/Aquashine skinbuster', 'Majska akcija', 350),
    ('Regular paket: Botox 3 regije + kolagen stimulator Juvelook ili Lenisna FULL FACE', 'Majska akcija', 420),
    ('Premium paket: Triple lifting concept opcija 1', 'Majska akcija', 950),
    ('Premium paket: Triple lifting concept opcija 2', 'Majska akcija', 700),
    ('Premium paket: Full face Botox', 'Majska akcija', 300)
),
service_ref AS (
  SELECT s."id", lower(s."name") AS "name_key"
  FROM "services" AS s
)
UPDATE "service_promotions" AS sp
SET "is_active" = false,
    "updated_at" = now()
FROM promo_seed AS seed
JOIN service_ref AS sr ON sr."name_key" = lower(seed."service_name")
WHERE sp."service_id" = sr."id"
  AND sp."is_active" = true;

WITH promo_seed ("service_name", "title", "promo_price_eur") AS (
  VALUES
    ('Regular paket: 1ml hijalurona + Botox 3 regije', 'Majska akcija', 350),
    ('Regular paket: Botox 3 regije + Lola/Aquashine skinbuster', 'Majska akcija', 350),
    ('Regular paket: Botox 3 regije + kolagen stimulator Juvelook ili Lenisna FULL FACE', 'Majska akcija', 420),
    ('Premium paket: Triple lifting concept opcija 1', 'Majska akcija', 950),
    ('Premium paket: Triple lifting concept opcija 2', 'Majska akcija', 700),
    ('Premium paket: Full face Botox', 'Majska akcija', 300)
),
service_ref AS (
  SELECT s."id", lower(s."name") AS "name_key"
  FROM "services" AS s
)
INSERT INTO "service_promotions" (
  "service_id",
  "title",
  "promo_price_rsd",
  "starts_at",
  "ends_at",
  "is_active",
  "created_at",
  "updated_at"
)
SELECT
  sr."id",
  seed."title",
  seed."promo_price_eur",
  NULL,
  NULL,
  true,
  now(),
  now()
FROM promo_seed AS seed
JOIN service_ref AS sr ON sr."name_key" = lower(seed."service_name");

WITH package_items_seed ("package_name", "service_name", "quantity", "sort_order") AS (
  VALUES
    ('Regular paket: 1ml hijalurona + Botox 3 regije', '1ml hijalurona', 1, 0),
    ('Regular paket: 1ml hijalurona + Botox 3 regije', 'Botox 3 regije', 1, 1),
    ('Regular paket: Botox 3 regije + Lola/Aquashine skinbuster', 'Botox 3 regije', 1, 0),
    ('Regular paket: Botox 3 regije + Lola/Aquashine skinbuster', 'Lola/Aquashine skinbuster', 1, 1),
    ('Regular paket: Botox 3 regije + kolagen stimulator Juvelook ili Lenisna FULL FACE', 'Botox 3 regije', 1, 0),
    ('Regular paket: Botox 3 regije + kolagen stimulator Juvelook ili Lenisna FULL FACE', 'Kolagen stimulator Juvelook ili Lenisna FULL FACE', 1, 1),
    ('Regular paket: 3 i vise ml hijalurona', '1ml hijalurona', 3, 0),
    ('Premium paket: Triple lifting concept opcija 1', 'Harmonyca kolagen stimulator', 1, 0),
    ('Premium paket: Triple lifting concept opcija 1', 'Botox 3 regije', 1, 1),
    ('Premium paket: Triple lifting concept opcija 1', '1ml hijalurona', 2, 2),
    ('Premium paket: Triple lifting concept opcija 2', 'Lenisna(PDLLA) kolagen stimulator full face', 1, 0),
    ('Premium paket: Triple lifting concept opcija 2', 'Botox 3 regije', 1, 1),
    ('Premium paket: Triple lifting concept opcija 2', '1ml hijalurona', 2, 2),
    ('Premium paket: Full face Botox', 'Full Face botox', 1, 0)
),
package_ref AS (
  SELECT "id", lower("name") AS "name_key"
  FROM "services"
  WHERE "kind" = 'package'
),
service_ref AS (
  SELECT "id", lower("name") AS "name_key"
  FROM "services"
  WHERE "kind" = 'single'
),
package_ids AS (
  SELECT DISTINCT pr."id"
  FROM package_items_seed AS seed
  JOIN package_ref AS pr ON pr."name_key" = lower(seed."package_name")
)
DELETE FROM "service_package_items" AS spi
USING package_ids AS pi
WHERE spi."package_service_id" = pi."id";

WITH package_items_seed ("package_name", "service_name", "quantity", "sort_order") AS (
  VALUES
    ('Regular paket: 1ml hijalurona + Botox 3 regije', '1ml hijalurona', 1, 0),
    ('Regular paket: 1ml hijalurona + Botox 3 regije', 'Botox 3 regije', 1, 1),
    ('Regular paket: Botox 3 regije + Lola/Aquashine skinbuster', 'Botox 3 regije', 1, 0),
    ('Regular paket: Botox 3 regije + Lola/Aquashine skinbuster', 'Lola/Aquashine skinbuster', 1, 1),
    ('Regular paket: Botox 3 regije + kolagen stimulator Juvelook ili Lenisna FULL FACE', 'Botox 3 regije', 1, 0),
    ('Regular paket: Botox 3 regije + kolagen stimulator Juvelook ili Lenisna FULL FACE', 'Kolagen stimulator Juvelook ili Lenisna FULL FACE', 1, 1),
    ('Regular paket: 3 i vise ml hijalurona', '1ml hijalurona', 3, 0),
    ('Premium paket: Triple lifting concept opcija 1', 'Harmonyca kolagen stimulator', 1, 0),
    ('Premium paket: Triple lifting concept opcija 1', 'Botox 3 regije', 1, 1),
    ('Premium paket: Triple lifting concept opcija 1', '1ml hijalurona', 2, 2),
    ('Premium paket: Triple lifting concept opcija 2', 'Lenisna(PDLLA) kolagen stimulator full face', 1, 0),
    ('Premium paket: Triple lifting concept opcija 2', 'Botox 3 regije', 1, 1),
    ('Premium paket: Triple lifting concept opcija 2', '1ml hijalurona', 2, 2),
    ('Premium paket: Full face Botox', 'Full Face botox', 1, 0)
),
package_ref AS (
  SELECT "id", lower("name") AS "name_key"
  FROM "services"
  WHERE "kind" = 'package'
),
service_ref AS (
  SELECT "id", lower("name") AS "name_key"
  FROM "services"
  WHERE "kind" = 'single'
)
INSERT INTO "service_package_items" (
  "package_service_id",
  "service_id",
  "quantity",
  "sort_order",
  "created_at",
  "updated_at"
)
SELECT
  pr."id",
  sr."id",
  seed."quantity",
  seed."sort_order",
  now(),
  now()
FROM package_items_seed AS seed
JOIN package_ref AS pr ON pr."name_key" = lower(seed."package_name")
JOIN service_ref AS sr ON sr."name_key" = lower(seed."service_name");

ALTER TABLE "services"
ADD COLUMN "show_in_face_booking" boolean DEFAULT true NOT NULL;

ALTER TABLE "services"
ADD COLUMN "show_in_body_booking" boolean DEFAULT false NOT NULL;

UPDATE "services"
SET "show_in_face_booking" = true,
    "show_in_body_booking" = false
WHERE "kind" = 'single';

UPDATE "services" AS s
SET "show_in_face_booking" = false,
    "show_in_body_booking" = true
FROM "service_categories" AS c
WHERE s."category_id" = c."id"
  AND s."kind" = 'single'
  AND LOWER(COALESCE(s."name", '') || ' ' || COALESCE(c."name", '')) LIKE ANY (
    ARRAY[
      '%lipoliza%',
      '%strija%',
      '%dekolte%',
      '%vrat%',
      '%infuz%',
      '%telo%',
      '%body%'
    ]
  );

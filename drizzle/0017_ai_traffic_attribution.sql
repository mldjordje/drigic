ALTER TABLE "site_page_views"
  ADD COLUMN IF NOT EXISTS "referrer_host" varchar(255),
  ADD COLUMN IF NOT EXISTS "traffic_source" varchar(255),
  ADD COLUMN IF NOT EXISTS "traffic_channel" varchar(64),
  ADD COLUMN IF NOT EXISTS "utm_source" varchar(255),
  ADD COLUMN IF NOT EXISTS "utm_medium" varchar(255),
  ADD COLUMN IF NOT EXISTS "utm_campaign" varchar(255),
  ADD COLUMN IF NOT EXISTS "is_ai_referral" boolean DEFAULT false NOT NULL;

CREATE INDEX IF NOT EXISTS "site_page_views_traffic_source_idx"
  ON "site_page_views" ("traffic_source");

CREATE INDEX IF NOT EXISTS "site_page_views_ai_referral_idx"
  ON "site_page_views" ("is_ai_referral");

UPDATE "site_page_views"
SET
  "referrer_host" = CASE
    WHEN COALESCE("referrer", '') = '' THEN NULL
    ELSE lower(split_part(split_part("referrer", '://', 2), '/', 1))
  END,
  "traffic_source" = CASE
    WHEN COALESCE("referrer", '') = '' THEN 'Direct / Unknown'
    WHEN lower("referrer") ~ '(chatgpt\.com|openai\.com)' THEN 'ChatGPT'
    WHEN lower("referrer") ~ 'perplexity\.ai' THEN 'Perplexity'
    WHEN lower("referrer") ~ '(claude\.ai|anthropic\.com)' THEN 'Claude'
    WHEN lower("referrer") ~ '(gemini\.google\.com|bard\.google\.com)' THEN 'Gemini'
    WHEN lower("referrer") ~ '(copilot\.microsoft\.com|bing\.com/chat)' THEN 'Microsoft Copilot'
    WHEN lower("referrer") ~ '(^|[./])google\.' THEN 'Google'
    WHEN lower("referrer") ~ 'bing\.com' THEN 'Bing'
    WHEN lower("referrer") ~ 'instagram\.com' THEN 'Instagram'
    WHEN lower("referrer") ~ 'facebook\.com' THEN 'Facebook'
    WHEN lower("referrer") ~ 'tiktok\.com' THEN 'TikTok'
    ELSE lower(split_part(split_part("referrer", '://', 2), '/', 1))
  END,
  "traffic_channel" = CASE
    WHEN COALESCE("referrer", '') = '' THEN 'Direct'
    WHEN lower("referrer") ~ '(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|anthropic\.com|gemini\.google\.com|bard\.google\.com|copilot\.microsoft\.com|bing\.com/chat)' THEN 'AI'
    WHEN lower("referrer") ~ '(^|[./])(google\.|bing\.com|yahoo\.|duckduckgo\.com)' THEN 'Organic Search'
    WHEN lower("referrer") ~ '(instagram\.com|facebook\.com|tiktok\.com|linkedin\.com|youtube\.com|youtu\.be)' THEN 'Social'
    ELSE 'Referral'
  END,
  "is_ai_referral" = lower(COALESCE("referrer", '')) ~ '(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|anthropic\.com|gemini\.google\.com|bard\.google\.com|copilot\.microsoft\.com|bing\.com/chat)'
WHERE "traffic_source" IS NULL;

INSERT INTO "Game" ("code", "name", "description", "published", "createdAt", "updatedAt")
SELECT
  'spin-the-bottle',
  'Spin the Bottle',
  'Server-synced bottle spinner with party modes and a shared mobile-friendly target reveal.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Game" WHERE "code" = 'spin-the-bottle'
);

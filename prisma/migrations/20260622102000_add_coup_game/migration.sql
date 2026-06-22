INSERT INTO "Game" ("code", "name", "description", "published", "createdAt", "updatedAt")
SELECT
  'coup',
  'Coup',
  'Fast bluffing and deduction game where players protect hidden influence, challenge claims, and force coups.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Game" WHERE "code" = 'coup'
);

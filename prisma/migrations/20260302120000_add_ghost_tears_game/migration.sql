INSERT INTO "Game" ("code", "name", "description", "published", "createdAt", "updatedAt")
SELECT
  'ghost-tears',
  'Ghost Tears',
  'Build a letter chain, challenge the previous player, and judge with correct or wrong while drinks and points update each round.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Game" WHERE "code" = 'ghost-tears'
);

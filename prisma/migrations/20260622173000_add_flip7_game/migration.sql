INSERT INTO "Game" ("code", "name", "description", "published", "createdAt", "updatedAt")
SELECT
  'flip-7',
  'Flip 7',
  'Push-your-luck card game where players hit, stay, freeze rivals, and chase seven unique numbers.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Game" WHERE "code" = 'flip-7'
);

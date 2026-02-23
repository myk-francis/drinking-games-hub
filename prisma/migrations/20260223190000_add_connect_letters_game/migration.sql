INSERT INTO "Game" ("code", "name", "description", "published", "createdAt", "updatedAt")
SELECT
  'connect-the-letters',
  'Connect the Letters',
  'Two players duel each round: buzz first, opponent has 10 seconds to answer, then judge with right/wrong and swap on misses.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Game" WHERE "code" = 'connect-the-letters'
);

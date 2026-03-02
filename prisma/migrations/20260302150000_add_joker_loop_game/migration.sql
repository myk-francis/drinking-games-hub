INSERT INTO "Game" ("code", "name", "description", "published", "createdAt", "updatedAt")
SELECT
  'joker-loop',
  'Joker Loop',
  'Each player reorders hidden cards, marks ready, and the next player draws one. Remove all pairs each round and avoid ending with the Joker.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Game" WHERE "code" = 'joker-loop'
);

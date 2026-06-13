INSERT INTO "Game" ("code", "name", "description", "published", "createdAt", "updatedAt")
SELECT
  'poker',
  'Poker',
  'Play a simplified Texas Hold''em game with the app dealing, blinds increasing every five rounds, and points or drinks after each hand.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Game" WHERE "code" = 'poker'
);

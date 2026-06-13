INSERT INTO "Game" ("code", "name", "description", "published", "createdAt", "updatedAt")
SELECT
  'blackjack',
  'Blackjack',
  'Play against the app dealer, hit or stand, and beat 21 without busting.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Game" WHERE "code" = 'blackjack'
);

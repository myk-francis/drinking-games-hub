INSERT INTO "Game" ("code", "name", "description", "published", "createdAt", "updatedAt")
SELECT
  'uno',
  'Uno',
  'Match colors, numbers, and action cards in a turn-based Uno table. First player out scores the point while everyone else drinks.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Game" WHERE "code" = 'uno'
);

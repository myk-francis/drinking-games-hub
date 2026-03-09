INSERT INTO "Game" ("code", "name", "description", "published", "createdAt", "updatedAt")
SELECT
  'ride-the-bus',
  'Ride the Bus',
  'Clear the four-step card ladder, then the player with the most resets rides the bus until they finish a perfect run.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Game" WHERE "code" = 'ride-the-bus'
);

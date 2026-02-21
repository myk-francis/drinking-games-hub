INSERT INTO "Game" ("code", "name", "description", "published", "createdAt", "updatedAt")
SELECT
  'guess-the-number',
  'Guess The Number',
  'Each player chooses a secret number from 0 to 100. Take turns as target while others guess and receive higher/lower hints.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Game" WHERE "code" = 'guess-the-number'
);

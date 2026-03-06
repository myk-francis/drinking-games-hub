INSERT INTO "Game" ("code", "name", "description", "published", "createdAt", "updatedAt")
SELECT
  'who-am-i',
  'Who Am I',
  'See everyone else''s card, hide your own, guess your word out loud, then award the winner and reshuffle for the next round.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Game" WHERE "code" = 'who-am-i'
);

INSERT INTO "Question" ("text", "gameId", "createdAt", "updatedAt")
SELECT prompts."text", g."id", NOW(), NOW()
FROM (
  VALUES
    ('Apple'),
    ('Banana'),
    ('Orange'),
    ('Pizza'),
    ('Burger'),
    ('Ice Cream'),
    ('Coffee'),
    ('Popcorn'),
    ('Pancake'),
    ('Cupcake'),
    ('Cat'),
    ('Dog'),
    ('Lion'),
    ('Tiger'),
    ('Elephant'),
    ('Monkey'),
    ('Rabbit'),
    ('Horse'),
    ('Dolphin'),
    ('Penguin'),
    ('Teacher'),
    ('Doctor'),
    ('Chef'),
    ('Farmer'),
    ('Pilot'),
    ('Singer'),
    ('Dancer'),
    ('Driver'),
    ('Painter'),
    ('Firefighter'),
    ('School'),
    ('Beach'),
    ('Airport'),
    ('Hospital'),
    ('Library'),
    ('Market'),
    ('Restaurant'),
    ('Cinema'),
    ('Park'),
    ('Hotel'),
    ('Football'),
    ('Basketball'),
    ('Tennis'),
    ('Swimming'),
    ('Running'),
    ('Cycling'),
    ('Chess'),
    ('Karaoke'),
    ('Dancing'),
    ('Camping'),
    ('Phone'),
    ('Laptop'),
    ('Camera'),
    ('Television'),
    ('Headphones'),
    ('Keyboard'),
    ('Backpack'),
    ('Bicycle'),
    ('Toothbrush'),
    ('Umbrella'),
    ('Sun'),
    ('Moon'),
    ('Star'),
    ('Cloud'),
    ('Rain'),
    ('Rainbow'),
    ('Mountain'),
    ('River'),
    ('Forest'),
    ('Ocean'),
    ('Spider-Man'),
    ('Batman'),
    ('Superman'),
    ('Harry Potter'),
    ('Elsa'),
    ('Mickey Mouse'),
    ('SpongeBob'),
    ('Shrek'),
    ('Pikachu'),
    ('Mario')
) AS prompts("text")
JOIN "Game" g ON g."code" = 'who-am-i'
WHERE NOT EXISTS (
  SELECT 1
  FROM "Question" q
  WHERE q."gameId" = g."id"
    AND q."text" = prompts."text"
);

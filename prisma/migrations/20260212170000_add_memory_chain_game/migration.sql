INSERT INTO "Game" ("code", "name", "description", "published", "createdAt", "updatedAt")
SELECT
  'memory-chain',
  'Memory Chain',
  'Remember the sequence of hidden words. Pick cards in order; one miss resets the board and passes the turn.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Game" WHERE "code" = 'memory-chain'
);

INSERT INTO "Question" ("text", "gameId", "createdAt", "updatedAt")
SELECT words."text", g."id", NOW(), NOW()
FROM (
  VALUES
    ('Anchor'),
    ('Lantern'),
    ('Falcon'),
    ('Pebble'),
    ('Velvet'),
    ('Maple'),
    ('Comet'),
    ('Harbor'),
    ('Saffron'),
    ('Riddle'),
    ('Tundra'),
    ('Piano'),
    ('Orbit'),
    ('Willow'),
    ('Canyon'),
    ('Jasmine'),
    ('Nimbus'),
    ('Quartz'),
    ('Rocket'),
    ('Sphinx'),
    ('Temple'),
    ('Voyage'),
    ('Whistle'),
    ('Yonder'),
    ('Zephyr'),
    ('Apricot'),
    ('Beacon'),
    ('Crimson'),
    ('Dynamo'),
    ('Ember'),
    ('Fjord'),
    ('Galaxy'),
    ('Horizon'),
    ('Icicle'),
    ('Jigsaw'),
    ('Kernel'),
    ('Lagoon'),
    ('Marble'),
    ('Nectar'),
    ('Olive'),
    ('Prism'),
    ('Quiver'),
    ('Ripple'),
    ('Summit'),
    ('Thistle'),
    ('Umber'),
    ('Vortex'),
    ('Warden'),
    ('Xenon'),
    ('Yucca'),
    ('Zenith'),
    ('Aurora'),
    ('Blizzard'),
    ('Cascade'),
    ('Domino'),
    ('Eclipse'),
    ('Fable'),
    ('Glacier'),
    ('Harpoon'),
    ('Inkwell')
) AS words("text")
JOIN "Game" g ON g."code" = 'memory-chain'
WHERE NOT EXISTS (
  SELECT 1
  FROM "Question" q
  WHERE q."gameId" = g."id"
    AND q."text" = words."text"
);

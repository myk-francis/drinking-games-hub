INSERT INTO "Game" ("code", "name", "description", "published", "createdAt", "updatedAt")
SELECT
  'taboo-lite',
  'Taboo Lite',
  'Describe the target word without using forbidden words. Fast pair-based rounds with a timer.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Game" WHERE "code" = 'taboo-lite'
);

INSERT INTO "Question" ("text", "gameId", "answer", "createdAt", "updatedAt")
SELECT cards."target", g."id", cards."forbidden", NOW(), NOW()
FROM (
  VALUES
    ('Airport', 'plane, flight, terminal, luggage'),
    ('Pirate', 'ship, ocean, treasure, captain'),
    ('Volcano', 'lava, erupt, mountain, ash'),
    ('Chef', 'cook, kitchen, food, restaurant'),
    ('Dentist', 'teeth, mouth, drill, doctor'),
    ('Laptop', 'computer, keyboard, screen, mouse'),
    ('Kangaroo', 'australia, jump, pouch, animal'),
    ('Rainbow', 'colors, sky, rain, arc'),
    ('Zombie', 'dead, brain, horror, undead'),
    ('Jungle', 'forest, trees, wild, animals'),
    ('Superhero', 'cape, powers, villain, save'),
    ('Clock', 'time, watch, hours, minutes'),
    ('Robot', 'machine, ai, metal, program'),
    ('Snowman', 'snow, winter, carrot, cold'),
    ('Firefighter', 'fire, truck, rescue, helmet'),
    ('Astronaut', 'space, moon, rocket, nasa'),
    ('Bakery', 'bread, cake, oven, pastry'),
    ('Detective', 'clues, crime, investigate, police'),
    ('Museum', 'art, history, exhibit, gallery'),
    ('Island', 'water, beach, palm, ocean'),
    ('Helicopter', 'blades, fly, pilot, chopper'),
    ('Doctor', 'hospital, patient, medicine, nurse'),
    ('Bicycle', 'bike, wheels, pedal, ride'),
    ('Cowboy', 'horse, west, hat, ranch'),
    ('Mermaid', 'sea, tail, ocean, fish'),
    ('Sunglasses', 'sun, eyes, shades, wear'),
    ('Backpack', 'bag, school, straps, carry'),
    ('Popcorn', 'movie, snack, butter, corn'),
    ('Guitar', 'music, strings, instrument, play'),
    ('Piano', 'keys, instrument, music, play'),
    ('Ice Cream', 'cold, cone, dessert, scoop'),
    ('Tornado', 'wind, storm, funnel, weather'),
    ('Castle', 'king, queen, tower, fort'),
    ('Vampire', 'blood, night, bite, coffin'),
    ('Dragon', 'fire, wings, fantasy, monster'),
    ('Compass', 'north, direction, map, navigation'),
    ('Lighthouse', 'sea, light, ship, coast'),
    ('Parachute', 'jump, sky, fall, canopy'),
    ('Referee', 'whistle, game, rules, sport'),
    ('Statue', 'stone, sculpture, monument, art'),
    ('Battery', 'power, charge, energy, electric'),
    ('Cactus', 'desert, plant, spikes, dry'),
    ('Passport', 'travel, country, visa, border'),
    ('Campfire', 'wood, flames, smoke, marshmallow'),
    ('Telescope', 'stars, space, lens, observe'),
    ('Submarine', 'underwater, navy, ocean, vessel'),
    ('Pyramid', 'egypt, triangle, pharaoh, tomb'),
    ('Violin', 'strings, bow, instrument, music'),
    ('Microscope', 'science, cells, lens, lab'),
    ('Treasure', 'gold, chest, pirate, map')
) AS cards("target", "forbidden")
JOIN "Game" g ON g."code" = 'taboo-lite'
WHERE NOT EXISTS (
  SELECT 1
  FROM "Question" q
  WHERE q."gameId" = g."id"
    AND q."text" = cards."target"
);

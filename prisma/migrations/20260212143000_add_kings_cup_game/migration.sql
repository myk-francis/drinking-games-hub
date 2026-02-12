INSERT INTO "Game" ("code", "name", "description", "published", "createdAt", "updatedAt")
SELECT
  'kings-cup',
  'Kings Cup',
  'Classic card-based drinking game with card rank rules.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Game" WHERE "code" = 'kings-cup'
);

INSERT INTO "Question" ("text", "gameId", "edition", "createdAt", "updatedAt")
SELECT prompts."text", g."id", prompts."edition", NOW(), NOW()
FROM (
  VALUES
    ('Start a waterfall. Everyone drinks; each person can stop only after the player before them stops.', 1),
    ('Pick any player to drink 2 sips.', 2),
    ('You drink 2 sips.', 3),
    ('Everyone touches the floor. Last player drinks 2 sips.', 4),
    ('All guys drink 2 sips.', 5),
    ('All girls drink 2 sips.', 6),
    ('Everyone points to the sky. Last player drinks 2 sips.', 7),
    ('Choose a mate. Whenever you drink, your mate drinks too.', 8),
    ('Rhyme time: pick a word, go around with rhymes. First fail drinks 3 sips.', 9),
    ('Choose a category. Go around naming items in it. First fail drinks 3 sips.', 10),
    ('Create a new house rule. Anyone who breaks it drinks 2 sips.', 11),
    ('You are Question Master. Anyone who answers your question drinks 2 sips.', 12),
    ('Pour some drink into the center cup.', 13),
    ('Waterfall round: reverse order this time. Last to stop drinks 2 extra sips.', 1),
    ('Choose two players. They both drink 2 sips.', 2),
    ('You and one player of your choice each drink 1 sip.', 3),
    ('Floor game: last player to crouch drinks 2 sips.', 4),
    ('All players with short sleeves drink 1 sip.', 5),
    ('All players wearing dark colors drink 1 sip.', 6),
    ('Hands up game: last player drinks 2 sips.', 7),
    ('Pick a mate and swap one sip each whenever one drinks.', 8),
    ('Rhyme with the word "party". First miss drinks 3 sips.', 9),
    ('Category is "movies". First repeat or blank drinks 3 sips.', 10),
    ('Add a new mini-rule until game ends.', 11),
    ('Question Master is active this round too.', 12),
    ('Add a splash to the center cup.', 13),
    ('Final waterfall variant: nobody can talk during waterfall. Talker drinks extra.', 1),
    ('Pick the loudest player to drink 2 sips.', 2),
    ('You drink 1 sip and assign 1 sip to another player.', 3),
    ('Floor challenge: last one down drinks 3 sips.', 4),
    ('All players named by the current player drink 1 sip.', 5),
    ('All players to the left of you drink 1 sip.', 6),
    ('Heaven challenge: last hand up drinks 3 sips.', 7),
    ('Choose a mate for the rest of this game.', 8),
    ('Rhyme with "drink". First fail drinks 3 sips.', 9),
    ('Category is "countries". First fail drinks 3 sips.', 10),
    ('Make a rule: no first names allowed. Breaker drinks 2 sips.', 11),
    ('Question Master returns. Catch someone answering and they drink.', 12),
    ('Pour another splash into center cup.', 13),
    ('Waterfall sprint: quick sips only, no pauses. Breaker drinks extra.', 1),
    ('Pick a player who must take 3 sips.', 2),
    ('You take 2 sips immediately.', 3),
    ('Touch-floor freeze: last player drinks 2 sips.', 4),
    ('All players with phones on table drink 1 sip.', 5),
    ('All players who laughed in the last minute drink 1 sip.', 6),
    ('Hands-to-sky race. Last player drinks 2 sips.', 7),
    ('Choose a mate; both take a sip now.', 8),
    ('Rhyme with "night". First fail drinks 2 sips.', 9),
    ('Category is "foods". First fail drinks 2 sips.', 10),
    ('New rule: no pointing. Breaker drinks 2 sips.', 11),
    ('Question Master rule stays active until next Queen appears.', 12),
    ('Pour into center cup. If this is the last King, drink the cup and end game.', 13)
) AS prompts("text", "edition")
JOIN "Game" g ON g."code" = 'kings-cup'
WHERE NOT EXISTS (
  SELECT 1
  FROM "Question" q
  WHERE q."gameId" = g."id"
    AND q."text" = prompts."text"
);

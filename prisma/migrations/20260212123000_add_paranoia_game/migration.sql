INSERT INTO "Game" ("code", "name", "description", "published", "createdAt", "updatedAt")
SELECT
  'paranoia',
  'Paranoia',
  'Anonymous group voting game. Others vote, current player reveals the result.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Game" WHERE "code" = 'paranoia'
);

INSERT INTO "Question" ("text", "gameId", "createdAt", "updatedAt")
SELECT prompts."text", g."id"
  , NOW()
  , NOW()
FROM (
  VALUES
    ('Who in this room would survive longest in a zombie apocalypse?'),
    ('Who is most likely to accidentally send a text to the wrong person?'),
    ('Who could become famous overnight for something random?'),
    ('Who is most likely to laugh at the worst possible moment?'),
    ('Who is most likely to cancel plans at the last minute?'),
    ('Who would be the best secret agent?'),
    ('Who is most likely to forget their own birthday plan?'),
    ('Who is most likely to start a business and actually make it work?'),
    ('Who would be the first to get caught in a lie?'),
    ('Who is most likely to become a reality TV villain?'),
    ('Who is most likely to lose their phone this month?'),
    ('Who would be the worst person to be stranded with?'),
    ('Who is most likely to go viral for a cringe moment?'),
    ('Who in this room would win an argument most often?'),
    ('Who is most likely to date someone wildly out of their type?'),
    ('Who is most likely to become everyone''s emergency contact?'),
    ('Who would spend money the fastest in a mall?'),
    ('Who is most likely to cry during a commercial?'),
    ('Who would be the best at keeping a serious face in chaos?'),
    ('Who is most likely to start drama without meaning to?'),
    ('Who is most likely to ghost the group chat for a week?'),
    ('Who would be first to move to another country on impulse?'),
    ('Who is most likely to become a morning person suddenly?'),
    ('Who is most likely to become a meme in this group?'),
    ('Who would be most likely to forget where they parked?'),
    ('Who is most likely to order food for everyone correctly?'),
    ('Who is most likely to get a tattoo at 2 AM?'),
    ('Who is most likely to run a marathon with zero training?'),
    ('Who is most likely to become a strict parent?'),
    ('Who is most likely to leave a party without saying goodbye?'),
    ('Who would get the most warnings in a reality show?'),
    ('Who is most likely to laugh at their own joke first?'),
    ('Who is most likely to lose track of time completely?'),
    ('Who is most likely to start a podcast next month?'),
    ('Who would most likely win a karaoke competition?'),
    ('Who is most likely to text their ex after midnight?'),
    ('Who is most likely to become a motivational speaker?'),
    ('Who is most likely to argue with customer service politely but forever?'),
    ('Who is most likely to bring snacks and still steal yours?'),
    ('Who is most likely to become famous for a cooking fail?'),
    ('Who is most likely to flirt without realizing it?'),
    ('Who is most likely to become a millionaire first?'),
    ('Who is most likely to miss an important call while scrolling?'),
    ('Who is most likely to befriend a stranger in five minutes?'),
    ('Who is most likely to show up overdressed to a casual event?'),
    ('Who is most likely to keep a secret the longest?'),
    ('Who is most likely to buy something weird online at night?'),
    ('Who is most likely to become famous for giving great advice?'),
    ('Who is most likely to survive a week without their phone?'),
    ('Who is most likely to become the group planner permanently?')
) AS prompts("text")
JOIN "Game" g ON g."code" = 'paranoia'
WHERE NOT EXISTS (
  SELECT 1
  FROM "Question" q
  WHERE q."gameId" = g."id"
    AND q."text" = prompts."text"
);

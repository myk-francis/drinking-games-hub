INSERT INTO "Game" ("code", "name", "description", "published", "createdAt", "updatedAt")
SELECT
  'bad-choices',
  'Bad Choices',
  'Targeted yes-or-no party game where you play to your reads and race to empty your hand first.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Game" WHERE "code" = 'bad-choices'
);

WITH target_game AS (
  SELECT "id" FROM "Game" WHERE "code" = 'bad-choices'
),
lie_people(subject) AS (
  SELECT * FROM unnest(ARRAY[
    'a friend about why you were late',
    'your family about where you were',
    'a date about being busy',
    'a coworker about finishing something',
    'someone you were texting about seeing their message',
    'your boss about why you missed a call',
    'a roommate about who made the mess',
    'someone you liked about being free',
    'an ex about how well you were doing',
    'a stranger to avoid a conversation',
    'a classmate about doing the reading',
    'a neighbor about a noise you made',
    'a teammate about being ready',
    'someone in the group chat about why you went silent',
    'a service worker just to avoid awkwardness'
  ]::text[])
),
uncomfortable_situations(subject) AS (
  SELECT * FROM unnest(ARRAY[
    'an event you did not want to attend',
    'a plan you regretted agreeing to',
    'a person you were trying to avoid',
    'a call you did not want to answer',
    'a party where you knew almost no one',
    'a family function you were dreading',
    'a date that was going badly',
    'a group project meeting you hated',
    'a conversation that felt too serious',
    'a social event that drained you',
    'a last-minute favor you did not want to do',
    'a reunion with someone awkward',
    'a work hangout you were over instantly',
    'a double date you wanted to escape',
    'an after-party you wanted no part of'
  ]::text[])
),
secret_behaviors(subject) AS (
  SELECT * FROM unnest(ARRAY[
    'looked someone up online before meeting them',
    'muted a friend without telling them',
    'read a message and pretended you never saw it',
    'checked who viewed your story more than once',
    'saved a screenshot just in case drama started',
    'rehearsed an argument in your head',
    'stalked an ex after promising you were over it',
    'changed your route to avoid someone',
    'pretended not to know a song everyone else knew',
    'laughed at a joke you did not understand',
    'hid your real opinion to keep the peace',
    'left a place without saying goodbye',
    'blamed traffic when you had not even left yet',
    'kept a backup plan in case your main plan fell through',
    'waited to reply on purpose to look less available'
  ]::text[])
),
social_risks(subject) AS (
  SELECT * FROM unnest(ARRAY[
    'send a risky text after midnight',
    'go on a reality dating show',
    'hook up with someone in this group',
    'fake confidence in front of a crowd',
    'sing karaoke completely sober',
    'flirt with someone who intimidated you',
    'let your friends set up your dating profile',
    'post a bold story just to see who reacts',
    'admit you were jealous to someone''s face',
    'start a hard conversation in public',
    'ask someone why they really ghosted you',
    'crash a party where you knew one person',
    'introduce yourself first in a room full of strangers',
    'be brutally honest on a first date',
    'take the mic at a wedding if dared'
  ]::text[])
),
messy_choices(subject) AS (
  SELECT * FROM unnest(ARRAY[
    'an old situationship texted you out of nowhere',
    'someone attractive wanted gossip about your friend',
    'you could get away with a tiny lie',
    'you found out two friends were talking behind each other''s backs',
    'your ex suddenly looked much better than before',
    'a date asked for total honesty',
    'you were bored and someone you should not text was online',
    'you saw a friend making a terrible decision',
    'someone asked you to keep a secret you hated',
    'you had to choose between being nice and being honest',
    'you realized you had been accidentally leading someone on',
    'a friend wanted your opinion on their messy relationship',
    'you knew a rumor was true',
    'someone blamed you for something half your fault',
    'you had one chance to leave a situation cleanly'
  ]::text[])
),
harmless_crimes(subject) AS (
  SELECT * FROM unnest(ARRAY[
    'stolen fries off someone else''s plate',
    're-gifted something and hoped no one noticed',
    'kept change that was not really yours',
    'used someone else''s streaming password without asking',
    'pretended not to see a message because replying felt like work',
    'taken credit for an idea you only improved a little',
    'copied someone''s wording because yours sounded weak',
    'let someone believe you were more organized than you are',
    'used a fake excuse to cancel last minute',
    'broken something minor and stayed quiet about it',
    'opened a message preview just to avoid the pressure of replying',
    'peeked at a gift before the occasion',
    'told a small lie to make a story better',
    'acted like you remembered someone when you absolutely did not',
    'watched someone struggle instead of helping immediately'
  ]::text[])
),
people(subject) AS (
  SELECT * FROM unnest(ARRAY[
    'a friend',
    'your boss',
    'a first date',
    'an ex',
    'a family member',
    'a roommate',
    'someone in the group chat',
    'someone you had a crush on',
    'a coworker',
    'a stranger',
    'a neighbor',
    'a teammate',
    'a sibling',
    'someone you were texting',
    'someone who annoyed you'
  ]::text[])
),
topics(subject) AS (
  SELECT * FROM unnest(ARRAY[
    'your actual plans',
    'how much money you had',
    'who you were with',
    'how much you liked someone',
    'why you were upset',
    'whether you were jealous',
    'what you were doing that night',
    'whether you had seen their message',
    'how serious you were being',
    'your real first impression',
    'whether you were free',
    'how much effort you put in',
    'why you went quiet',
    'what you really thought of the plan',
    'whether you actually remembered them'
  ]::text[])
),
dares(subject) AS (
  SELECT * FROM unnest(ARRAY[
    'for a lot of money',
    'to save yourself embarrassment',
    'to impress someone you liked',
    'to protect a friend',
    'if the story would be legendary',
    'if nobody could prove it later',
    'if it made the night more fun',
    'if it got you out of trouble',
    'if your whole friend group encouraged it',
    'if it meant avoiding an awkward explanation'
  ]::text[])
),
social_risks_bonus(subject) AS (
  SELECT * FROM unnest(ARRAY[
    'send a risky text after midnight',
    'go on a reality dating show',
    'hook up with someone in this group',
    'fake confidence in front of a crowd',
    'sing karaoke completely sober',
    'flirt with someone who intimidated you',
    'let your friends set up your dating profile',
    'post a bold story just to see who reacts',
    'admit you were jealous to someone''s face',
    'start a hard conversation in public'
  ]::text[])
),
prompts("text", "answer") AS (
  SELECT format('Have you ever lied to %s?', subject), NULL FROM lie_people
  UNION ALL
  SELECT format('Would you fake being sick to get out of %s?', subject), NULL FROM uncomfortable_situations
  UNION ALL
  SELECT format('Have you ever %s?', subject), NULL FROM secret_behaviors
  UNION ALL
  SELECT format('Would you %s?', subject), NULL FROM social_risks
  UNION ALL
  SELECT format('Would you be honest if %s?', subject), NULL FROM messy_choices
  UNION ALL
  SELECT format('Have you ever %s?', subject), NULL FROM harmless_crimes
  UNION ALL
  SELECT format('Would you lie to %s about %s?', people.subject, topics.subject), NULL
  FROM people CROSS JOIN topics
  UNION ALL
  SELECT format('Would you %s %s?', social_risks_bonus.subject, dares.subject), NULL
  FROM social_risks_bonus CROSS JOIN dares
  UNION ALL
  VALUES
    ('Action Card: Skip the next player''s turn.', 'SKIP'),
    ('Action Card: Pick a player to skip their next turn.', 'SKIP'),
    ('Action Card: Block the next player''s turn.', 'SKIP'),
    ('Action Card: Choose a player to draw 1 card.', 'DRAW_ONE'),
    ('Action Card: Target a player and make them draw 1 card.', 'DRAW_ONE'),
    ('Action Card: Hand a draw 1 penalty to any player.', 'DRAW_ONE'),
    ('Action Card: Choose a player to draw 2 cards.', 'DRAW_TWO'),
    ('Action Card: Target a player and make them draw 2 cards.', 'DRAW_TWO'),
    ('Action Card: Hit any player with a draw 2.', 'DRAW_TWO'),
    ('All Play: Ask everyone else this card. Majority yes means you discard it.', 'ALL_PLAY'),
    ('All Play: Everyone except you answers. Win the majority yes to discard.', 'ALL_PLAY'),
    ('All Play: The whole table answers. If yes wins, the card is gone.', 'ALL_PLAY')
)
INSERT INTO "Question" ("text", "gameId", "answer", "createdAt", "updatedAt")
SELECT prompts."text", target_game."id", prompts."answer", NOW(), NOW()
FROM prompts
CROSS JOIN target_game
WHERE NOT EXISTS (
  SELECT 1
  FROM "Question" q
  WHERE q."gameId" = target_game."id"
    AND q."text" = prompts."text"
    AND COALESCE(q."answer", '') = COALESCE(prompts."answer", '')
);

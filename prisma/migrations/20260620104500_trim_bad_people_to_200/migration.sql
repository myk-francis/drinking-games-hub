DELETE FROM "Question"
WHERE "id" IN (
  SELECT q."id"
  FROM "Question" q
  JOIN "Game" g ON g."id" = q."gameId"
  WHERE g."code" = 'bad-people'
    AND q."text" IN (
      'Who would make the worst fake witness in court?',
      'Who would absolutely become a menace with a verified account?'
    )
);

INSERT INTO "Parms" ("type", "name", "value", "createdAt")
SELECT 'MOVIE_CATEGORY', 'All Movies', 0, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Parms" WHERE "type" = 'MOVIE_CATEGORY' AND "value" = 0
);

INSERT INTO "Parms" ("type", "name", "value", "createdAt")
SELECT 'MOVIE_CATEGORY', 'Action & Adventure', 1, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Parms" WHERE "type" = 'MOVIE_CATEGORY' AND "value" = 1
);

INSERT INTO "Parms" ("type", "name", "value", "createdAt")
SELECT 'MOVIE_CATEGORY', 'Comedy', 2, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Parms" WHERE "type" = 'MOVIE_CATEGORY' AND "value" = 2
);

INSERT INTO "Parms" ("type", "name", "value", "createdAt")
SELECT 'MOVIE_CATEGORY', 'Animation & Family', 3, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Parms" WHERE "type" = 'MOVIE_CATEGORY' AND "value" = 3
);

INSERT INTO "Parms" ("type", "name", "value", "createdAt")
SELECT 'MOVIE_CATEGORY', 'Horror & Thriller', 4, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Parms" WHERE "type" = 'MOVIE_CATEGORY' AND "value" = 4
);

INSERT INTO "Game" ("code", "name", "description", "published", "createdAt", "updatedAt")
SELECT
  'guess-the-movie',
  'Guess The Movie',
  'Buzz first, everyone else sees the answer, and the buzzing player has 30 seconds to decide if they got the movie right.',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Game" WHERE "code" = 'guess-the-movie'
);

INSERT INTO "Question" ("text", "answer", "edition", "gameId", "createdAt", "updatedAt")
SELECT prompts."text", prompts."answer", prompts."edition", g."id", NOW(), NOW()
FROM (
  VALUES
    ('A young lion prince runs away after tragedy and later returns to reclaim Pride Rock.', 'The Lion King', 3),
    ('A clownfish father crosses the ocean to find his captured son with the help of a forgetful blue fish.', 'Finding Nemo', 3),
    ('A family of superheroes hides in suburbia until a new villain forces them back into action.', 'The Incredibles', 3),
    ('A princess with icy powers isolates herself while her sister tries to save their kingdom.', 'Frozen', 3),
    ('A cowboy doll and a space ranger learn to work together after jealousy starts their rivalry.', 'Toy Story', 3),
    ('A friendly ogre rescues a princess and ends up falling in love with her.', 'Shrek', 3),
    ('A rat secretly becomes a top chef in Paris by guiding a clumsy kitchen worker.', 'Ratatouille', 3),
    ('A martial-arts-loving panda is chosen as the unlikely Dragon Warrior.', 'Kung Fu Panda', 3),
    ('A teenager learns he is a wizard and attends a magical school.', 'Harry Potter and the Sorcerer''s Stone', 3),
    ('A boy enters a magical chocolate factory owned by an eccentric inventor.', 'Charlie and the Chocolate Factory', 3),
    ('A girl sails across the ocean with a demigod to save her island.', 'Moana', 3),
    ('A boy travels through the Land of the Dead and uncovers a family secret tied to music.', 'Coco', 3),
    ('A young woman in a magical family struggles because she seems to have no gift.', 'Encanto', 3),
    ('Two monsters discover that a human child has entered their scare-powered city.', 'Monsters, Inc.', 3),
    ('An old widower flies his house with balloons and unexpectedly becomes an explorer again.', 'Up', 3),
    ('A young girl''s emotions are personified as she adjusts to a new city.', 'Inside Out', 3),
    ('A lonely trash-compacting robot falls in love and helps humans return to Earth.', 'WALL-E', 3),
    ('A street thief finds a magic lamp and pretends to be a prince to impress a princess.', 'Aladdin', 3),
    ('A book-loving woman becomes trapped in a castle with a cursed beast.', 'Beauty and the Beast', 3),
    ('A rabbit cop and a fox con artist uncover a conspiracy in a city run by animals.', 'Zootopia', 3),
    ('A supervillain adopts three girls while plotting to steal the moon.', 'Despicable Me', 3),
    ('A young Viking bonds with a dragon and challenges his village''s beliefs.', 'How to Train Your Dragon', 3),
    ('A race car learns humility after getting stranded in a small desert town.', 'Cars', 3),
    ('A young woman disguises herself as a man to take her father''s place in the army.', 'Mulan', 3),
    ('A princess with magical hair escapes her tower with a wanted thief.', 'Tangled', 3),
    ('A mermaid longs to live on land and makes a dangerous deal with a sea witch.', 'The Little Mermaid', 3),
    ('A teenage robotics genius teams up with his inflatable healthcare robot to stop a masked villain.', 'Big Hero 6', 3),
    ('Zoo animals shipped away from New York find themselves stranded in the wild.', 'Madagascar', 3),
    ('Two pampered pets discover a hidden city adventure after getting lost in New York.', 'The Secret Life of Pets', 3),
    ('A swashbuckling cat faces his mortality while chasing a wish-granting star.', 'Puss in Boots: The Last Wish', 3),
    ('A team of heroes tries to stop a purple titan from wiping out half the universe.', 'Avengers: Infinity War', 1),
    ('A fed-up office worker starts an underground club with a charismatic soap maker.', 'Fight Club', 1),
    ('A thief enters people''s dreams to plant an idea inside a target''s mind.', 'Inception', 1),
    ('A retired assassin returns after gangsters kill his dog and steal his car.', 'John Wick', 1),
    ('A reluctant hero in Wakanda must protect his nation and claim the throne.', 'Black Panther', 1),
    ('An archaeologist hunts for a powerful relic while fighting Nazis.', 'Raiders of the Lost Ark', 1),
    ('A park filled with cloned dinosaurs becomes a disaster after security fails.', 'Jurassic Park', 1),
    ('A man discovers he is living inside a simulated reality controlled by machines.', 'The Matrix', 1),
    ('A masked vigilante battles chaos in Gotham against a criminal mastermind.', 'The Dark Knight', 1),
    ('A treasure hunter races around the world to find a lost pirate fortune.', 'Pirates of the Caribbean: The Curse of the Black Pearl', 1),
    ('A former cop escorts a war rig across a desert while fleeing a tyrant''s army.', 'Mad Max: Fury Road', 1),
    ('A Roman general becomes a slave and fights his way toward revenge in the arena.', 'Gladiator', 1),
    ('An IMF agent chases stolen plutonium while a brutal operative hunts him across the globe.', 'Mission: Impossible - Fallout', 1),
    ('A teenage Spider-Man faces villains from other universes after a spell goes wrong.', 'Spider-Man: No Way Home', 1),
    ('A newly promoted secret agent must stop a terrorist banker in a deadly poker game.', 'Casino Royale', 1),
    ('A soldier relives the same alien invasion day until he learns how to win.', 'Edge of Tomorrow', 1),
    ('An aging fighter pilot returns to train a new class for a near-impossible mission.', 'Top Gun: Maverick', 1),
    ('An archaeologist races to find the Holy Grail with his stubborn father.', 'Indiana Jones and the Last Crusade', 1),
    ('A New York cop battles terrorists inside a Los Angeles skyscraper.', 'Die Hard', 1),
    ('A band of criminals in space protects a mysterious orb from a fanatic warlord.', 'Guardians of the Galaxy', 1),
    ('A cyborg protector returns to defend a boy who will lead humanity''s resistance.', 'Terminator 2: Judgment Day', 1),
    ('James Bond goes rogue after a cyberterrorist targets intelligence agents worldwide.', 'Skyfall', 1),
    ('Earth''s mightiest heroes unite after a demigod steals a powerful cube.', 'The Avengers', 1),
    ('Superheroes split into opposing sides after political oversight divides the team.', 'Captain America: Civil War', 1),
    ('A spy with amnesia tries to uncover his identity while dodging assassins.', 'The Bourne Identity', 1),
    ('A paraplegic marine joins an alien world and finds himself torn between two sides.', 'Avatar', 1),
    ('An aging mutant protects a young girl while being hunted across the country.', 'Logan', 1),
    ('A city bus will explode if its speed drops below a deadly limit.', 'Speed', 1),
    ('A teenage archer volunteers to take her sister''s place in a televised fight to the death.', 'The Hunger Games', 1),
    ('A rebel team steals the plans to a planet-destroying weapon.', 'Rogue One: A Star Wars Story', 1),
    ('A group of friends wakes up in Las Vegas and tries to piece together a wild night.', 'The Hangover', 2),
    ('Two detectives investigate a murder mystery in a wealthy family estate.', 'Knives Out', 2),
    ('A man relives the same day over and over while covering a weather event.', 'Groundhog Day', 2),
    ('A teenager pretends to be sick and spends a perfect day avoiding school.', 'Ferris Bueller''s Day Off', 2),
    ('Three men and a woman fake a beauty pageant mission to rob a casino.', 'Miss Congeniality', 2),
    ('A woman accidentally becomes pregnant after a one-night stand with an immature man.', 'Knocked Up', 2),
    ('A strict fashion magazine editor turns one assistant''s life upside down.', 'The Devil Wears Prada', 2),
    ('A foul-mouthed teddy bear comes to life and refuses to grow up.', 'Ted', 2),
    ('Two best friends race to stop an upcoming wedding after realizing one is in love with the bride.', 'My Best Friend''s Wedding', 2),
    ('A small-town cop and an overeager officer uncover a ridiculous conspiracy.', 'Hot Fuzz', 2),
    ('Two high school friends try to cram four years of partying into one night before graduation.', 'Superbad', 2),
    ('A new student is pulled into the ruthless social politics of a teenage clique.', 'Mean Girls', 2),
    ('A woman asks her chaotic friends to be bridesmaids and everything goes badly.', 'Bridesmaids', 2),
    ('Two immature adult brothers are forced to live together and compete for attention.', 'Step Brothers', 2),
    ('Two cops go undercover at a high school and discover they are not cool anymore.', '21 Jump Street', 2),
    ('A boy left alone during Christmas defends his house from burglars with booby traps.', 'Home Alone', 2),
    ('A fashion-loving law student surprises everyone by excelling at Harvard Law.', 'Legally Blonde', 2),
    ('A substitute teacher forms a band with his students to chase rock-star dreams.', 'School of Rock', 2),
    ('Two dimwitted friends go on a road trip to return a briefcase to its owner.', 'Dumb and Dumber', 2),
    ('A shy man tries to lose his virginity with the help of his overconfident coworkers.', 'The 40-Year-Old Virgin', 2),
    ('Two friends crash weddings for fun until one of them falls in love.', 'Wedding Crashers', 2),
    ('A clueless male model becomes entangled in a ridiculous assassination plot.', 'Zoolander', 2),
    ('A clever student turns a false rumor into social success and chaos.', 'Easy A', 2),
    ('A legendary African prince visits Queens, New York, to find love and independence.', 'Coming to America', 2),
    ('Two best friends make a final attempt to enjoy high school before graduation.', 'Booksmart', 2),
    ('A professor joins his wealthy girlfriend''s family in Singapore and gets a culture shock.', 'Crazy Rich Asians', 2),
    ('An awkward teenager becomes an unlikely icon in a very strange small town.', 'Napoleon Dynamite', 2),
    ('A pompous news anchor battles a rival station while trying to stay famous.', 'Anchorman: The Legend of Ron Burgundy', 2),
    ('Actors filming a war movie end up in a real conflict without realizing it.', 'Tropic Thunder', 2),
    ('A perfectionist hotel concierge becomes wrapped up in theft, prison, and a pastry-based escape.', 'The Grand Budapest Hotel', 2),
    ('A family is haunted after moving into a suburban home built on disturbed ground.', 'Poltergeist', 4),
    ('A writer isolated in a snowy hotel slowly loses his mind.', 'The Shining', 4),
    ('A couple''s beach vacation turns into survival horror after they visit a remote village.', 'Midsommar', 4),
    ('A mother and her children are terrorized by a creature that attacks when heard.', 'A Quiet Place', 4),
    ('A young woman visits her boyfriend''s family and uncovers a disturbing secret.', 'Get Out', 4),
    ('A babysitter discovers that the caller threatening her is inside the house.', 'When a Stranger Calls', 4),
    ('A cursed videotape kills viewers seven days after they watch it.', 'The Ring', 4),
    ('A group of friends uses a spirit board and unleashes something dangerous.', 'Ouija', 4),
    ('A family tries to survive after moving into a house stalked by paranormal investigators'' worst nightmare.', 'The Conjuring', 4),
    ('A masked killer targets teenagers in a town with a dark secret.', 'Scream', 4),
    ('After a family tragedy, a grieving household becomes the center of a terrifying supernatural plan.', 'Hereditary', 4),
    ('A shape-shifting clown feeds on children and returns to torment a small town.', 'It', 4),
    ('A girl''s possession forces priests to perform a desperate exorcism.', 'The Exorcist', 4),
    ('A masked murderer escapes on Halloween night and stalks babysitters.', 'Halloween', 4),
    ('A spaceship crew answers a distress signal and finds a deadly creature aboard.', 'Alien', 4),
    ('A motel owner with a disturbing secret targets a woman on the run.', 'Psycho', 4),
    ('A family vacation becomes a nightmare when deadly doubles emerge from the shadows.', 'Us', 4),
    ('A family investigates a haunting and discovers a malevolent entity tied to the afterlife.', 'Insidious', 4),
    ('Residents of a lonely desert town are threatened by a terrifying mystery in the sky.', 'Nope', 4),
    ('A single mother and her son are haunted by a sinister figure from a pop-up book.', 'The Babadook', 4),
    ('Two men wake up in a trap and learn they are being tested by a sadistic killer.', 'Saw', 4),
    ('A possessed doll brings evil into the lives of everyone who owns it.', 'Annabelle', 4),
    ('A true-crime writer discovers home videos linked to a supernatural serial killer.', 'Sinister', 4),
    ('Student filmmakers enter the woods to document a legend and vanish.', 'The Blair Witch Project', 4),
    ('A murdered artist returns as an urban legend tied to a mirror ritual.', 'Candyman', 4),
    ('A woman living in a dark mansion begins to suspect her house is haunted.', 'The Others', 4),
    ('A teenager repeatedly escapes death, only for fate to come after the survivors.', 'Final Destination', 4),
    ('A therapist notices patients wearing eerie smiles before a violent curse spreads.', 'Smile', 4),
    ('A couple records strange events in their home as an unseen force grows stronger.', 'Paranormal Activity', 4),
    ('Young adults visit a remote cabin and discover a larger horror scenario controlling everything.', 'The Cabin in the Woods', 4)
) AS prompts("text", "answer", "edition")
JOIN "Game" g ON g."code" = 'guess-the-movie'
WHERE NOT EXISTS (
  SELECT 1
  FROM "Question" q
  WHERE q."gameId" = g."id"
    AND q."answer" = prompts."answer"
);

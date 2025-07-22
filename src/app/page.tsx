"use client";
import React, { useState, useEffect } from "react";
import {
  Users,
  Share2,
  Play,
  Home,
  Trophy,
  Zap,
  Heart,
  Brain,
  Dice1,
  Music,
  Target,
  Clock,
  Shuffle,
  Star,
} from "lucide-react";

const DrinkingGamesApp = () => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [playerInput, setPlayerInput] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [scores, setScores] = useState({});
  const [gameState, setGameState] = useState({});
  const [showShareLink, setShowShareLink] = useState(false);

  const gameData = {
    "never-have-i-ever": {
      title: "Never Have I Ever",
      icon: <Heart className="w-6 h-6" />,
      description:
        "Classic confession game. Players drink if they've done the statement.",
      color: "from-pink-500 to-rose-500",
      statements: [
        "Never have I ever skipped class or work to stay in bed",
        "Never have I ever lied about my age",
        "Never have I ever had a crush on a teacher or boss",
        "Never have I ever pretended to be sick to avoid something",
        "Never have I ever sung karaoke in public",
        "Never have I ever been in a food fight",
        "Never have I ever forgotten someone's name right after being introduced",
        "Never have I ever stalked an ex on social media",
        "Never have I ever laughed so hard I cried",
        "Never have I ever had a one-night stand",
        "Never have I ever gone skinny dipping",
        "Never have I ever broken a bone",
        "Never have I ever been arrested or detained",
        "Never have I ever cheated on a test or exam",
        "Never have I ever eaten something off the floor",
        "Never have I ever lied on my resume",
        "Never have I ever had a celebrity crush meet-and-greet",
        "Never have I ever been kicked out of a bar or club",
        "Never have I ever accidentally sent a text to the wrong person",
        "Never have I ever pretended to understand something I didn't",
      ],
    },
    "truth-or-drink": {
      title: "Truth or Drink",
      icon: <Brain className="w-6 h-6" />,
      description:
        "Answer personal questions or take a drink. No dares, just truths!",
      color: "from-blue-500 to-purple-500",
      questions: [
        "What's the most embarrassing thing you've ever done on a date?",
        "Have you ever pretended to like a gift you actually hated?",
        "What's your most irrational fear?",
        "Have you ever lied to get out of a social event?",
        "What's the worst haircut you've ever had?",
        "Have you ever had a crush on a friend's partner?",
        "What's the most childish thing you still do?",
        "Have you ever snooped through someone's phone?",
        "What's your most embarrassing childhood memory?",
        "Have you ever pretended to know something you didn't?",
        "What's the worst advice you've ever given someone?",
        "Have you ever laughed at completely the wrong moment?",
        "What's your guilty pleasure that you're embarrassed about?",
        "What's the most ridiculous thing you believed as a child?",
        "Have you ever had an imaginary friend as an adult?",
        "What's the weirdest thing you've ever eaten?",
        "Have you ever been caught in a really awkward lie?",
        "What's your most embarrassing autocorrect fail?",
        "Have you ever pretended to be someone else online?",
        "What's the strangest dream you remember having?",
      ],
    },
    "most-likely": {
      title: "Most Likely To",
      icon: <Users className="w-6 h-6" />,
      description:
        "Vote on who's most likely to do something. Person with most votes drinks!",
      color: "from-green-500 to-teal-500",
      prompts: [
        "Most likely to become famous overnight",
        "Most likely to survive a zombie apocalypse",
        "Most likely to marry someone they just met in Vegas",
        "Most likely to become a millionaire before 30",
        "Most likely to get lost in their own neighborhood",
        "Most likely to eat something expired and not notice",
        "Most likely to become a crazy cat person",
        "Most likely to accidentally dye their hair the wrong color",
        "Most likely to trip on a completely flat surface",
        "Most likely to forget their own birthday",
        "Most likely to become a reality TV star",
        "Most likely to get kicked out of a library for being too loud",
        "Most likely to adopt 10 dogs at once",
        "Most likely to win the lottery and immediately lose the ticket",
        "Most likely to become a professional sleeper",
        "Most likely to start a cult accidentally",
        "Most likely to become a hermit and live in the woods",
        "Most likely to invent something completely useless but popular",
        "Most likely to get arrested for something completely ridiculous",
        "Most likely to become a viral meme",
      ],
    },
    categories: {
      title: "Categories",
      icon: <Target className="w-6 h-6" />,
      description: "Name items in a category. First to fail drinks!",
      color: "from-orange-500 to-red-500",
      categories: [
        "Types of pizza toppings",
        "Things you find in a bathroom",
        "Board games",
        "Things that are red",
        "Movie genres",
        "Things you take on vacation",
        "Types of shoes",
        "Things that make you happy",
        "School subjects",
        "Things you find at the beach",
        "Types of weather",
        "Things in a kitchen",
        "Musical instruments",
        "Things that are round",
        "Types of transportation",
        "Superheroes",
        "Types of candy",
        "Things you wear",
        "Animals that start with 'B'",
        "Things you do in summer",
        "Types of drinks",
        "Things that smell good",
        "Jobs that start with 'T'",
        "Things you find in a garage",
        "Types of pasta",
      ],
    },
    "rhyme-time": {
      title: "Rhyme Time",
      icon: <Music className="w-6 h-6" />,
      description: "Keep the rhyme going! Break the chain and drink.",
      color: "from-purple-500 to-pink-500",
      startWords: [
        "cat",
        "dog",
        "fun",
        "sun",
        "tree",
        "bee",
        "car",
        "star",
        "book",
        "look",
        "play",
        "day",
        "night",
        "light",
        "run",
        "gun",
        "love",
        "dove",
        "time",
        "rhyme",
        "game",
        "name",
        "song",
        "long",
        "dance",
        "chance",
        "dream",
        "cream",
        "fire",
        "wire",
        "blue",
        "true",
      ],
    },
    "higher-lower": {
      title: "Higher or Lower",
      icon: <Dice1 className="w-6 h-6" />,
      description:
        "Guess if the next card is higher or lower. Wrong guess = drink!",
      color: "from-indigo-500 to-blue-500",
      cards: ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"],
    },
    "charades-drink": {
      title: "Charades & Drink",
      icon: <Zap className="w-6 h-6" />,
      description: "Act out prompts. Team that guesses wrong drinks!",
      color: "from-yellow-500 to-orange-500",
      prompts: [
        "Drunk giraffe trying to dance",
        "Robot having an existential crisis",
        "Penguin at a job interview",
        "Zombie trying to order coffee",
        "Superhero afraid of heights",
        "Cat stuck in a washing machine",
        "Alien learning to drive",
        "Vampire at the dentist",
        "Ninja in a library",
        "Pirate at a yoga class",
        "Ghost trying to use a smartphone",
        "Dinosaur on a first date",
        "Wizard stuck in traffic",
        "Mermaid at a desert",
        "Dragon with allergies",
      ],
    },
    "word-association": {
      title: "Word Association",
      icon: <Brain className="w-6 h-6" />,
      description: "Say related words quickly. Hesitate too long = drink!",
      color: "from-cyan-500 to-blue-500",
      startWords: [
        "Ocean",
        "Fire",
        "Music",
        "Food",
        "Travel",
        "Love",
        "Time",
        "Dream",
        "Winter",
        "Summer",
        "Night",
        "Morning",
        "Adventure",
        "Mystery",
        "Magic",
      ],
    },
    countdown: {
      title: "Countdown Game",
      icon: <Clock className="w-6 h-6" />,
      description: "Count down from 21. Say multiple numbers and drink!",
      color: "from-red-500 to-pink-500",
      rules:
        "Players take turns counting down from 21. You can say 1, 2, or 3 consecutive numbers. Whoever says '1' drinks!",
    },
    "two-truths-lie": {
      title: "Two Truths & A Lie",
      icon: <Shuffle className="w-6 h-6" />,
      description: "Guess the lie. Wrong guesses drink!",
      color: "from-emerald-500 to-green-500",
      prompts: [
        "Tell about your most embarrassing moments",
        "Share your childhood fears and adventures",
        "Describe your weirdest food experiences",
        "Talk about your dating disasters",
        "Share your travel mishaps",
        "Describe your workplace awkwardness",
      ],
    },
    "speed-questions": {
      title: "Speed Questions",
      icon: <Zap className="w-6 h-6" />,
      description: "Answer rapid-fire questions. Hesitate = drink!",
      color: "from-violet-500 to-purple-500",
      questions: [
        "Favorite color?",
        "First pet's name?",
        "Dream vacation?",
        "Biggest fear?",
        "Favorite food?",
        "Last movie watched?",
        "Celebrity crush?",
        "Favorite song?",
        "Dream job?",
        "Weird talent?",
        "Last text sent?",
        "Favorite season?",
        "Spirit animal?",
        "Last lie told?",
        "Guilty pleasure?",
        "Worst habit?",
      ],
    },
    "story-building": {
      title: "Story Building",
      icon: <Star className="w-6 h-6" />,
      description: "Build a story together. Break the flow = drink!",
      color: "from-teal-500 to-cyan-500",
      starters: [
        "Once upon a time in a magical forest...",
        "It was a dark and stormy night when...",
        "The spaceship landed in the middle of the city and...",
        "Sarah opened the mysterious box and discovered...",
        "The last person on Earth heard a knock at the door...",
        "The time machine malfunctioned and suddenly...",
      ],
    },
  };

  useEffect(() => {
    loadFromURL();
  }, []);

  const loadFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    const game = params.get("game");
    const playersParam = params.get("players");

    if (game && gameData[game]) {
      setSelectedGame(game);
    }

    if (playersParam) {
      const playerList = playersParam.split(",").filter((p) => p.trim());
      setPlayers(playerList);
      const initialScores = {};
      playerList.forEach((player) => {
        initialScores[player] = { points: 0, drinks: 0 };
      });
      setScores(initialScores);
    }
  };

  const selectGame = (gameType) => {
    setSelectedGame(gameType);
  };

  const addPlayer = () => {
    if (playerInput.trim() && !players.includes(playerInput.trim())) {
      const newPlayer = playerInput.trim();
      setPlayers([...players, newPlayer]);
      setScores((prev) => ({
        ...prev,
        [newPlayer]: { points: 0, drinks: 0 },
      }));
      setPlayerInput("");
    }
  };

  const removePlayer = (playerToRemove) => {
    setPlayers(players.filter((p) => p !== playerToRemove));
    const newScores = { ...scores };
    delete newScores[playerToRemove];
    setScores(newScores);
  };

  const generateShareLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("game", selectedGame);
    url.searchParams.set("players", players.join(","));

    navigator.clipboard.writeText(url.toString()).then(() => {
      setShowShareLink(true);
      setTimeout(() => setShowShareLink(false), 3000);
    });
  };

  const startGame = () => {
    setGameStarted(true);
    setCurrentPlayerIndex(0);
    setGameState({
      usedContent: [],
      currentCard: null,
      countdownNumber: 21,
      storyParts: [],
    });
  };

  const endGame = () => {
    setGameStarted(false);
    setSelectedGame(null);
    setGameState({});
  };

  const nextPlayer = () => {
    setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
  };

  const addDrink = (player) => {
    setScores((prev) => ({
      ...prev,
      [player]: { ...prev[player], drinks: prev[player].drinks + 1 },
    }));
  };

  const addPoint = (player) => {
    setScores((prev) => ({
      ...prev,
      [player]: { ...prev[player], points: prev[player].points + 1 },
    }));
  };

  const GameCard = ({ game, gameKey, selected, onClick }) => (
    <div
      onClick={() => onClick(gameKey)}
      className={`relative overflow-hidden rounded-xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
        selected ? "ring-4 ring-white shadow-2xl scale-105" : "hover:shadow-lg"
      }`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-90`}
      ></div>
      <div className="relative z-10 text-white">
        <div className="flex items-center justify-between mb-3">
          {game.icon}
          {selected && (
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          )}
        </div>
        <h3 className="text-xl font-bold mb-2">{game.title}</h3>
        <p className="text-sm opacity-90 leading-relaxed">{game.description}</p>
      </div>
    </div>
  );

  const PlayerScore = ({ player }) => (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
      <div className="font-bold text-lg text-white mb-1">{player}</div>
      <div className="text-2xl font-bold text-emerald-400 mb-1">
        {scores[player]?.points || 0} pts
      </div>
      <div className="text-sm text-orange-300">
        {scores[player]?.drinks || 0} drinks
      </div>
    </div>
  );

  const GameContent = () => {
    const game = gameData[selectedGame];
    const currentPlayer = players[currentPlayerIndex];

    const getRandomContent = (contentArray, used) => {
      const unused = contentArray.filter((item) => !used.includes(item));
      if (unused.length === 0)
        return contentArray[Math.floor(Math.random() * contentArray.length)];
      return unused[Math.floor(Math.random() * unused.length)];
    };

    const renderGameSpecificContent = () => {
      switch (selectedGame) {
        case "never-have-i-ever":
          const statement = getRandomContent(
            game.statements,
            gameState.usedContent || []
          );
          return (
            <div className="text-center">
              <div className="text-2xl mb-6 text-white leading-relaxed">
                {statement}
              </div>
              <p className="text-lg text-white/80 mb-6">
                Players who have done this, take a drink! 🍻
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                {players.map((player) => (
                  <button
                    key={player}
                    onClick={() => addDrink(player)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors"
                  >
                    {player} drinks
                  </button>
                ))}
              </div>
            </div>
          );

        case "truth-or-drink":
          const question = getRandomContent(
            game.questions,
            gameState.usedContent || []
          );
          return (
            <div className="text-center">
              <div className="text-xl text-emerald-400 mb-4">
                👤 {currentPlayer}'s Turn
              </div>
              <div className="text-xl mb-6 text-white leading-relaxed">
                {question}
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    addPoint(currentPlayer);
                    nextPlayer();
                  }}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Answered Truthfully
                </button>
                <button
                  onClick={() => {
                    addDrink(currentPlayer);
                    nextPlayer();
                  }}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Took a Drink
                </button>
              </div>
            </div>
          );

        case "most-likely":
          const prompt = getRandomContent(
            game.prompts,
            gameState.usedContent || []
          );
          return (
            <div className="text-center">
              <div className="text-2xl mb-6 text-white leading-relaxed">
                {prompt}
              </div>
              <p className="text-lg text-white/80 mb-6">
                Everyone point to who you think is most likely! 👉
              </p>
              <div className="flex gap-3 justify-center flex-wrap mb-4">
                {players.map((player) => (
                  <button
                    key={player}
                    onClick={() => addDrink(player)}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white transition-colors"
                  >
                    Vote: {player}
                  </button>
                ))}
              </div>
            </div>
          );

        case "higher-lower":
          if (!gameState.currentCard) {
            setGameState((prev) => ({
              ...prev,
              currentCard:
                game.cards[Math.floor(Math.random() * game.cards.length)],
            }));
            return <div>Loading...</div>;
          }

          const guessCard = (isHigher) => {
            const currentIndex = game.cards.indexOf(gameState.currentCard);
            const nextCard =
              game.cards[Math.floor(Math.random() * game.cards.length)];
            const nextIndex = game.cards.indexOf(nextCard);

            const wasHigher = nextIndex > currentIndex;
            const wasCorrect =
              (isHigher && wasHigher) ||
              (!isHigher && !wasHigher) ||
              nextIndex === currentIndex;

            if (wasCorrect) {
              addPoint(currentPlayer);
            } else {
              addDrink(currentPlayer);
            }

            setGameState((prev) => ({ ...prev, currentCard: nextCard }));
            nextPlayer();
          };

          return (
            <div className="text-center">
              <div className="text-xl text-emerald-400 mb-4">
                👤 {currentPlayer}'s Turn
              </div>
              <div className="text-6xl mb-6 text-white font-bold">
                {gameState.currentCard}
              </div>
              <p className="text-lg text-white/80 mb-6">
                Will the next card be higher or lower?
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => guessCard(true)}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Higher ⬆️
                </button>
                <button
                  onClick={() => guessCard(false)}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Lower ⬇️
                </button>
              </div>
            </div>
          );

        default:
          return (
            <div className="text-center">
              <div className="text-xl text-emerald-400 mb-4">
                👤 {currentPlayer}'s Turn
              </div>
              <div className="text-xl mb-6 text-white">
                Game in progress! Use the action buttons below.
              </div>
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={() => {
                    addPoint(currentPlayer);
                    nextPlayer();
                  }}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Success
                </button>
                <button
                  onClick={() => {
                    addDrink(currentPlayer);
                    nextPlayer();
                  }}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition-colors"
                >
                  Failed - Drink!
                </button>
              </div>
            </div>
          );
      }
    };

    return (
      <div className="min-h-64 flex items-center justify-center">
        {renderGameSpecificContent()}
      </div>
    );
  };

  if (gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-2">
              🍻 {gameData[selectedGame]?.title}
            </h1>
            <p className="text-white/70">Round in progress</p>
          </div>

          {/* Scoreboard */}
          <div className="mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {players.map((player) => (
                <PlayerScore key={player} player={player} />
              ))}
            </div>
          </div>

          {/* Game Content */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-6 border border-white/20">
            <GameContent />
          </div>

          {/* Controls */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={endGame}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition-colors"
            >
              <Home className="w-5 h-5" />
              End Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            🍻 Drinking Games Hub
          </h1>
          <p className="text-xl text-white/80">
            Choose your game, invite friends, and let the fun begin!
          </p>
        </div>

        {/* Game Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Choose Your Game
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(gameData).map(([key, game]) => (
              <GameCard
                key={key}
                game={game}
                gameKey={key}
                selected={selectedGame === key}
                onClick={selectGame}
              />
            ))}
          </div>
        </div>

        {/* Player Setup */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold mb-6 text-center">Add Players</h2>

          <div className="mb-6">
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={playerInput}
                onChange={(e) => setPlayerInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addPlayer()}
                placeholder="Enter player name"
                className="flex-1 px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={addPlayer}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold transition-colors"
              >
                Add
              </button>
            </div>

            {players.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {players.map((player) => (
                  <div
                    key={player}
                    className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2"
                  >
                    <span>{player}</span>
                    <button
                      onClick={() => removePlayer(player)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={startGame}
              disabled={!selectedGame || players.length < 2}
              className="flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
            >
              <Play className="w-5 h-5" />
              Start Game
            </button>

            <button
              onClick={generateShareLink}
              className="flex items-center gap-2 px-8 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-semibold transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Share Link
            </button>
          </div>

          {showShareLink && (
            <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-center">
              <p className="text-green-300">Link copied to clipboard! 🎉</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrinkingGamesApp;

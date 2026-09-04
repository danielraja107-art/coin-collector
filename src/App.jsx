import { useEffect, useRef, useState } from "react";
import CoinGame from "./game/CoinGame";
import "./App.css";

function App() {
  const gameContainerRef = useRef(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!gameContainerRef.current) return;

    const game = new CoinGame(
      gameContainerRef.current,
      (newScore) => {
        setScore(newScore);
      }
    );

    game.start();

    return () => {
      game.destroy();
    };
  }, []);

  return (
    <div className="game">
      <div className="ui">
        <h1>🪙 Coin Collector</h1>

        <div className="score">
          Score: {score}
        </div>

        <div className="controls">
          WASD / Arrow Keys to Move
        </div>
      </div>

      <div
        ref={gameContainerRef}
        className="game-container"
      />
    </div>
  );
}

export default App;
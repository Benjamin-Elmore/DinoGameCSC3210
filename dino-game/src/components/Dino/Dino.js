import React, { useCallback, useEffect, useRef, useState } from "react";
import "./Dino.css";

import sun from "./img/sun-bw.png";
import moon from "./img/moon-bw.png";
import cloud from "./img/cloud-bw.png";

const achievements = [
  { jumpsRequired: 5, message: "Rookie Jumper!" },
  { jumpsRequired: 10, message: "Cactus Dodger!" },
  { jumpsRequired: 25, message: "Dino Master!" },
];

// Visible cactus pixels within the 47 x 73 source image. These ratios remove
// the image's built-in white padding from collision detection.
const cactusVisibleBounds = {
  left: 9 / 47,
  right: 39 / 47,
  top: 7 / 73,
  bottom: 1,
};

function Dino() {
  const dinoRef = useRef(null);
  const cactusRef = useRef(null);
  const meteorRef = useRef(null);

  const [score, setScore] = useState(0);
  const [cactusJumps, setCactusJumps] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [isNight, setIsNight] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isMeteorActive, setIsMeteorActive] = useState(false);
  const [gameSession, setGameSession] = useState(0);

  const jump = useCallback(
    (event) => {
      if (event.code !== "Space" && event.code !== "ArrowUp") {
        return;
      }

      event.preventDefault();

      const dino = dinoRef.current;
      if (!dino || isGameOver || dino.classList.contains("jump")) {
        return;
      }

      dino.classList.add("jump");
    },
    [isGameOver]
  );

  useEffect(() => {
    document.addEventListener("keydown", jump);
    return () => document.removeEventListener("keydown", jump);
  }, [jump]);

  useEffect(() => {
    if (isGameOver) {
      return undefined;
    }

    const scoreTimer = window.setInterval(() => {
      setScore((currentScore) => currentScore + 1);
    }, 100);

    return () => window.clearInterval(scoreTimer);
  }, [isGameOver]);

  useEffect(() => {
    if (isGameOver) {
      return undefined;
    }

    const collisionTimer = window.setInterval(() => {
      const dino = dinoRef.current;
      const cactus = cactusRef.current;
      const meteor = meteorRef.current;

      if (!dino || !cactus) {
        return;
      }

      const dinoBox = dino.getBoundingClientRect();
      const cactusBox = cactus.getBoundingClientRect();
      const meteorBox = meteor?.getBoundingClientRect();
      const cactusHitBox = {
        left: cactusBox.left + cactusBox.width * cactusVisibleBounds.left,
        right: cactusBox.left + cactusBox.width * cactusVisibleBounds.right,
        top: cactusBox.top + cactusBox.height * cactusVisibleBounds.top,
        bottom: cactusBox.top + cactusBox.height * cactusVisibleBounds.bottom,
      };

      const hitCactus =
        dinoBox.left < cactusHitBox.right &&
        dinoBox.right > cactusHitBox.left &&
        dinoBox.top < cactusHitBox.bottom &&
        dinoBox.bottom > cactusHitBox.top;

      const hitMeteor =
        meteorBox &&
        dinoBox.left < meteorBox.right &&
        dinoBox.right > meteorBox.left &&
        dinoBox.top < meteorBox.bottom &&
        dinoBox.bottom > meteorBox.top;

      if (hitCactus || hitMeteor) {
        setIsGameOver(true);
        return;
      }

    }, 20);

    return () => window.clearInterval(collisionTimer);
  }, [isGameOver]);

  useEffect(() => {
    if (!isGameOver && score > 0 && score % 200 === 0) {
      setIsMeteorActive(true);
    }
  }, [score, isGameOver]);

  useEffect(() => {
    const earnedAchievement = achievements.find(
      (achievement) => achievement.jumpsRequired === cactusJumps
    );

    if (!earnedAchievement) {
      return;
    }

    setUnlockedAchievements((currentUnlocked) => {
      if (currentUnlocked.includes(earnedAchievement.message)) {
        return currentUnlocked;
      }

      return [...currentUnlocked, earnedAchievement.message];
    });
  }, [cactusJumps]);

  const restartGame = () => {
    dinoRef.current?.classList.remove("jump");
    setScore(0);
    setCactusJumps(0);
    setUnlockedAchievements([]);
    setIsNight(false);
    setIsGameOver(false);
    setIsMeteorActive(false);
    setGameSession((currentSession) => currentSession + 1);
  };

  const handleCactusPass = () => {
    if (!isGameOver) {
      setCactusJumps((currentJumps) => currentJumps + 1);
    }
  };

  return (
    <>
      <div
        key={gameSession}
        className={`game ${isNight ? "night" : ""} ${
          isGameOver ? "game-over" : ""
        }`}
      >
        <div className="sky" aria-hidden="true">
          <img className="celestial" src={isNight ? moon : sun} alt="" />
          <img className="cloud cloud-one" src={cloud} alt="" />
          <img className="cloud cloud-two" src={cloud} alt="" />
        </div>

        <div>Score: {score}</div>
        <div>Cactus jumps: {cactusJumps}</div>

        {isGameOver && (
          <div className="game-over-message">
            <strong>Game Over!</strong>
            <div>Your score: {score}</div>
            <button type="button" onClick={restartGame}>
              Restart
            </button>
          </div>
        )}

        <div
          id="dino"
          ref={dinoRef}
          onAnimationEnd={(event) => event.currentTarget.classList.remove("jump")}
        ></div>
        <div
          id="cactus"
          ref={cactusRef}
          onAnimationIteration={handleCactusPass}
        ></div>
        {isMeteorActive && (
          <div
            id="meteor"
            ref={meteorRef}
            aria-hidden="true"
            onAnimationEnd={() => setIsMeteorActive(false)}
          ></div>
        )}
      </div>

      <button
        type="button"
        onClick={(event) => {
          setIsNight((currentMode) => !currentMode);
          event.currentTarget.blur();
        }}
      >
        {isNight ? "Switch to day" : "Switch to night"}
      </button>

      <div className="achievements">
        {unlockedAchievements.map((achievement) => (
          <div key={achievement}>{achievement}</div>
        ))}
      </div>
    </>
  );
}

export default Dino;

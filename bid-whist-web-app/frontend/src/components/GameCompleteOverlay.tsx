import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface GameCompleteOverlayProps {
  handCompleteData: any;
  handAssignments: any[];
  totalPoints: Record<string, number>;
}

export default function GameCompleteOverlay({
  handCompleteData,
  handAssignments,
  totalPoints,
}: GameCompleteOverlayProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const winner = handCompleteData.winner || "Us";
  const winningTeamPlayers = handCompleteData.winningTeamPlayers || [];
  const losingTeamPlayers = handCompleteData.losingTeamPlayers || [];
  const winningScore = handCompleteData.teamScores?.[winner] || 0;
  const losingTeam = winner === "Us" ? "Them" : "Us";
  const losingScore = handCompleteData.teamScores?.[losingTeam] || 0;
  
  // Check if Reddy or Oatmeal are on the winning team
  const hasReddyWon = winningTeamPlayers.some((name: string) => 
    name.toLowerCase().includes("reddy")
  );
  const hasOatmealWon = winningTeamPlayers.some((name: string) => 
    name.toLowerCase().includes("oatmeal")
  );
  
  // Check if Reddy or Oatmeal are on the losing team
  const hasReddyLost = losingTeamPlayers.some((name: string) => 
    name.toLowerCase().includes("reddy")
  );
  const hasOatmealLost = losingTeamPlayers.some((name: string) => 
    name.toLowerCase().includes("oatmeal")
  );

  useEffect(() => {
    // Trigger confetti animation
    setShowConfetti(true);
    
    // Play custom audio if Reddy or Oatmeal won/lost
    const playAudioSequence = async () => {
      const audioFiles: string[] = [];
      
      // Add winning audio files
      if (hasReddyWon && hasOatmealWon) {
        // Both on winning team - play both
        audioFiles.push("/audio/reddy-win.mp3", "/audio/oatmeal-win.mp3");
      } else if (hasReddyWon) {
        audioFiles.push("/audio/reddy-win.mp3");
      } else if (hasOatmealWon) {
        audioFiles.push("/audio/oatmeal-win.mp3");
      }
      
      // Add losing audio files
      if (hasReddyLost && hasOatmealLost) {
        // Both on losing team - play both
        audioFiles.push("/audio/reddy-lose.mp3", "/audio/oatmeal-lose.mp3");
      } else if (hasReddyLost) {
        audioFiles.push("/audio/reddy-lose.mp3");
      } else if (hasOatmealLost) {
        audioFiles.push("/audio/oatmeal-lose.mp3");
      }
      
      // Play audio files sequentially
      for (const audioFile of audioFiles) {
        try {
          const audio = new Audio(audioFile);
          audioRef.current = audio;
          await audio.play();
          // Wait for audio to finish before playing next
          await new Promise((resolve) => {
            audio.onended = resolve;
          });
        } catch (err) {
          console.log("Audio playback failed:", err);
        }
      }
    };
    
    playAudioSequence();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [hasReddyWon, hasOatmealWon, hasReddyLost, hasOatmealLost]);

  // Confetti particles
  const confettiColors = ["#fbbf24", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#10b981"];
  const confettiParticles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
  }));

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {confettiParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: particle.color,
                left: `${particle.x}%`,
                top: "-10%",
              }}
              initial={{ y: 0, opacity: 1, rotate: 0 }}
              animate={{
                y: window.innerHeight + 100,
                opacity: 0,
                rotate: 360,
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: "easeIn",
              }}
            />
          ))}
        </div>
      )}

      {/* Main Win Screen */}
      <motion.div
        className="text-white p-12 rounded-3xl shadow-2xl max-w-4xl border-4"
        style={{
          backgroundColor: "rgba(17, 24, 39, 0.97)",
          borderColor: winner === "Us" ? "#c084fc" : "#93c5fd",
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        {/* Trophy Animation */}
        <motion.div
          className="text-center mb-6"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.div
            className="text-8xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            🏆
          </motion.div>
        </motion.div>

        {/* Winner Announcement */}
        <motion.h2
          className="text-5xl font-bold text-center mb-4"
          style={{ color: winner === "Us" ? "#c084fc" : "#93c5fd" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Team {winner} Wins!
        </motion.h2>

        {/* Winning Players */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="text-2xl font-bold text-yellow-300 mb-2">
            {winningTeamPlayers.join(" & ")}
          </div>
          <div className="text-lg opacity-80" style={{ color: "#ffffff" }}>
            Victory at {winningScore} points!
          </div>
        </motion.div>

        {/* Final Scores */}
        <motion.div
          className="grid grid-cols-2 gap-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <div
            className={`p-6 rounded-lg border-4 ${
              winner === "Us" ? "border-purple-400 bg-purple-900/50" : "border-purple-400/30 bg-purple-900/20"
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold mb-2" style={{ color: "#c084fc" }}>
                Us
              </div>
              <div className="text-5xl font-bold" style={{ color: "#fcd34d" }}>
                {handCompleteData.teamScores?.Us || 0}
              </div>
              {winner === "Us" && (
                <motion.div
                  className="text-3xl mt-2"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  ⭐
                </motion.div>
              )}
            </div>
          </div>
          <div
            className={`p-6 rounded-lg border-4 ${
              winner === "Them" ? "border-blue-400 bg-blue-900/50" : "border-blue-400/30 bg-blue-900/20"
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold mb-2" style={{ color: "#93c5fd" }}>
                Them
              </div>
              <div className="text-5xl font-bold" style={{ color: "#fcd34d" }}>
                {handCompleteData.teamScores?.Them || 0}
              </div>
              {winner === "Them" && (
                <motion.div
                  className="text-3xl mt-2"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  ⭐
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Last Hand Summary */}
        <motion.div
          className="bg-black/30 p-4 rounded-lg mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <div className="text-center text-sm mb-2 opacity-70" style={{ color: "#ffffff" }}>
            Final Hand
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-sm" style={{ color: "#c084fc" }}>Us</div>
              <div className="font-bold" style={{ color: "#ffffff" }}>
                {handCompleteData.tricksWon?.Us || 0} tricks
              </div>
              <div className="text-sm" style={{ color: "#4ade80" }}>
                +{handCompleteData.pointsScored?.Us || 0} pts
              </div>
            </div>
            <div>
              <div className="text-sm" style={{ color: "#93c5fd" }}>Them</div>
              <div className="font-bold" style={{ color: "#ffffff" }}>
                {handCompleteData.tricksWon?.Them || 0} tricks
              </div>
              <div className="text-sm" style={{ color: "#4ade80" }}>
                +{handCompleteData.pointsScored?.Them || 0} pts
              </div>
            </div>
          </div>
        </motion.div>

        {/* Total Points Across All Games */}
        <motion.div
          className="bg-black/50 p-4 rounded-lg border-2 border-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          <div className="text-center text-sm mb-2 opacity-70" style={{ color: "#ffffff" }}>
            Total Points (All Games)
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-sm" style={{ color: "#c084fc" }}>Us</div>
              <div className="text-xl font-bold" style={{ color: "#ffffff" }}>{totalPoints.Us}</div>
            </div>
            <div>
              <div className="text-sm" style={{ color: "#93c5fd" }}>Them</div>
              <div className="text-xl font-bold" style={{ color: "#ffffff" }}>{totalPoints.Them}</div>
            </div>
          </div>
        </motion.div>

        {/* Special Message for Reddy/Oatmeal */}
        {(hasReddyWon || hasOatmealWon) && (
          <motion.div
            className="mt-6 text-center text-xl font-bold text-yellow-300"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5 }}
          >
            🎉 {hasReddyWon && hasOatmealWon 
              ? "Reddy & Oatmeal take the crown!" 
              : hasReddyWon 
                ? "Reddy takes the crown!" 
                : "Oatmeal takes the crown!"} 🎉
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

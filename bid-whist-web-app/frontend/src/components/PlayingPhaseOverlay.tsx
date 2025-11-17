import React from "react";
import Card from "./Card";

interface PlayingPhaseOverlayProps {
  trumpSuit: string;
  trickNumber: number;
  tricksWon: Record<string, number>;
  handAssignments: any[];
  bidWinnerHandId: string;
  winningBid: number;
  lastTrick: any[];
  lastTrickWinner: string | null;
  currentTrick: any[];
  activeHand: any;
  trickWinnerHandId: string | null;
  showTrickComplete: boolean;
  handleDropOnCenter: (e: React.DragEvent) => void;
  teamScores?: Record<string, number>;
}

export default function PlayingPhaseOverlay({
  trumpSuit,
  trickNumber,
  tricksWon,
  handAssignments,
  bidWinnerHandId,
  winningBid,
  lastTrick,
  lastTrickWinner,
  currentTrick,
  activeHand,
  trickWinnerHandId,
  showTrickComplete,
  handleDropOnCenter,
  teamScores = { Us: 0, Them: 0 },
}: PlayingPhaseOverlayProps) {
  // Determine bidding team
  const bidWinnerHand = handAssignments.find(
    (h: any) => `${h.playerId}_hand_${h.handIndex}` === bidWinnerHandId
  );
  const biddingTeam = bidWinnerHand?.team || "";
  const tricksNeeded = 6 + winningBid;
  const defendingTricksNeeded = 8 - winningBid;

  return (
    <>
      {/* Trump indicator - left of player's cards */}
      <div
        className="absolute text-center bg-black/80 px-6 py-4 rounded-lg border-2 border-yellow-400/50 z-20"
        style={{ bottom: "2vh", left: "10vw", color: "#ffffff" }}
      >
        <div className="text-sm mb-2" style={{ opacity: 0.7 }}>
          Trump
        </div>
        {trumpSuit === "no-trump" ? (
          <Card suit="hearts" rank="NO_TRUMP" faceUp width={90} height={135} />
        ) : (
          <Card
            suit={trumpSuit as "hearts" | "diamonds" | "clubs" | "spades"}
            rank="K"
            faceUp
            width={90}
            height={135}
          />
        )}
      </div>

      {/* Game Score - top right */}
      <div
        className="absolute text-center bg-black/80 px-8 py-5 rounded-lg border-2 border-yellow-400/50 z-20"
        style={{ top: "2vh", right: "10%", color: "#ffffff" }}
      >
        <div className="font-bold mb-3" style={{ fontSize: "1.75rem", color: "#ffffff" }}>
          Game Score
        </div>
        <div className="grid grid-cols-2 gap-6" style={{ fontSize: "1.25rem" }}>
          <div>
            <div className="font-bold mb-1" style={{ color: "#c084fc" }}>Us</div>
            <div className="text-4xl font-bold" style={{ color: "#fcd34d" }}>
              {teamScores.Us}
            </div>
          </div>
          <div>
            <div className="font-bold mb-1" style={{ color: "#93c5fd" }}>Them</div>
            <div className="text-4xl font-bold" style={{ color: "#fcd34d" }}>
              {teamScores.Them}
            </div>
          </div>
        </div>
      </div>

      {/* Trick info - top left */}
      <div
        className="absolute text-center bg-black/80 px-6 py-4 rounded-lg border-2 border-yellow-400/50 z-20"
        style={{ top: "2vh", right: "75%", color: "#ffffff" }}
      >
        <div className="font-bold" style={{ fontSize: "2.25rem" }}>
          Trick {trickNumber}/13
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4" style={{ fontSize: "1.25rem" }}>
          <div>
            <div className="font-bold text-purple-300">Us</div>
            <div className="text-sm opacity-80 mb-1">
              {handAssignments
                .filter((h: any) => h.team === "Us")
                .map((h: any) => h.playerName)
                .join(", ")}
            </div>
            <div className="text-2xl font-bold text-yellow-300">{tricksWon.Us}</div>
            {biddingTeam && (
              <div className="text-xs opacity-70 mt-1">
                Need {biddingTeam === "Us" ? tricksNeeded : defendingTricksNeeded}
              </div>
            )}
          </div>
          <div>
            <div className="font-bold text-blue-300">Them</div>
            <div className="text-sm opacity-80 mb-1">
              {handAssignments
                .filter((h: any) => h.team === "Them")
                .map((h: any) => h.playerName)
                .join(", ")}
            </div>
            <div className="text-2xl font-bold text-yellow-300">{tricksWon.Them}</div>
            {biddingTeam && (
              <div className="text-xs opacity-70 mt-1">
                Need {biddingTeam === "Them" ? tricksNeeded : defendingTricksNeeded}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Last Trick - bottom right */}
      {lastTrick.length === 4 && (
        <div
          className="absolute bg-black/80 px-6 py-5 rounded-lg border-2 border-white/30 z-20"
          style={{ bottom: "2vh", right: "2vw", color: "#ffffff" }}
        >
          <div className="text-xl mb-3 text-center font-semibold" style={{ opacity: 0.85 }}>
            Last Trick
          </div>
          <div className="flex gap-2">
            {lastTrick.map((play: any, idx: number) => {
              const isWinner = play.handId === lastTrickWinner;
              return (
                <div
                  key={idx}
                  style={{
                    filter: isWinner
                      ? "drop-shadow(0 0 10px rgba(251, 191, 36, 1))"
                      : "none",
                    opacity: isWinner ? 1 : 0.75,
                  }}
                >
                  <Card
                    suit={play.card.suit}
                    rank={play.card.rank}
                    faceUp
                    width={60}
                    height={90}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Played cards in center - DROP ZONE */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="relative pointer-events-auto flex items-center justify-center"
          onDragOver={(e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragEnter={(e: React.DragEvent) => {
            console.log("🎯 Drag entered drop zone");
          }}
          onDrop={(e: React.DragEvent) => {
            console.log("🎯 Drop event fired in PlayingPhaseOverlay");
            handleDropOnCenter(e);
          }}
          style={{
            width: "500px",
            height: "500px",
            // Visual debug border (can be removed later)
            border: "2px dashed rgba(251, 191, 36, 0.2)",
            borderRadius: "50%",
          }}
        >
          {currentTrick.map((play: any, idx: number) => {
            // Position cards based on relative position to active player
            const activeHandGlobalIndex = activeHand
              ? handAssignments.findIndex(
                  (h: any) =>
                    h.playerId === activeHand.playerId &&
                    h.handIndex === activeHand.handIndex
                )
              : 0;

            // Calculate relative position (0=you, 1=left, 2=across, 3=right)
            const relativePosition = (play.handIndex - activeHandGlobalIndex + 4) % 4;

            // Stack cards in center but offset toward the player who played them
            const stackOffset = idx * 3;
            const positions = [
              {
                top: "50%",
                left: "50%",
                transform: `translate(-50%, calc(-50% + ${stackOffset}px + 40px))`,
              }, // Bottom
              {
                top: "50%",
                left: "50%",
                transform: `translate(calc(-50% - 40px - ${stackOffset}px), -50%)`,
              }, // Left
              {
                top: "50%",
                left: "50%",
                transform: `translate(-50%, calc(-50% - ${stackOffset}px - 40px))`,
              }, // Top
              {
                top: "50%",
                left: "50%",
                transform: `translate(calc(-50% + 40px + ${stackOffset}px), -50%)`,
              }, // Right
            ];
            const pos = positions[relativePosition] || positions[0];

            const isWinner = showTrickComplete && play.handId === trickWinnerHandId;

            // Calculate position to move towards winner
            let animateStyle = {};
            if (showTrickComplete && trickWinnerHandId) {
              const winnerPlay = currentTrick.find(
                (p: any) => p.handId === trickWinnerHandId
              );
              if (winnerPlay) {
                const winnerRelativePosition =
                  (winnerPlay.handIndex - activeHandGlobalIndex + 4) % 4;
                const winnerPos = positions[winnerRelativePosition];
                const offsetX =
                  (idx - currentTrick.findIndex((p: any) => p.handId === trickWinnerHandId)) *
                  5;
                animateStyle = {
                  ...winnerPos,
                  left: winnerPos.left ? `calc(${winnerPos.left} + ${offsetX}px)` : undefined,
                  opacity: isWinner ? 1 : 0.7,
                };
              }
            }

            return (
              <div
                key={idx}
                className="absolute transition-all duration-1000 ease-in-out"
                style={{
                  ...(showTrickComplete ? animateStyle : pos),
                  filter: isWinner
                    ? "drop-shadow(0 0 20px rgba(251, 191, 36, 1)) drop-shadow(0 0 40px rgba(251, 191, 36, 0.6)) brightness(1.3)"
                    : showTrickComplete
                    ? "brightness(0.8)"
                    : "none",
                  transform: showTrickComplete
                    ? isWinner
                      ? "scale(1.15)"
                      : "scale(0.95)"
                    : pos.transform || "",
                  zIndex: isWinner ? 10 : 1,
                }}
              >
                <Card
                  suit={play.card.suit}
                  rank={play.card.rank}
                  faceUp
                  width={90}
                  height={135}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

import React, { useEffect, useRef } from "react";
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
  phase?: string;
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
  phase = "PLAYING",
}: PlayingPhaseOverlayProps) {
  // Determine bidding team
  const bidWinnerHand = handAssignments.find(
    (h: any) => `${h.playerId}_hand_${h.handIndex}` === bidWinnerHandId
  );
  const biddingTeam = bidWinnerHand?.team || "";
  const tricksNeeded = 6 + winningBid;
  const defendingTricksNeeded = 8 - winningBid;

  const isHandComplete = phase === "HAND_COMPLETE" || phase === "GAME_COMPLETE";

  // Track previous trick length to detect new cards
  const prevTrickLength = useRef(currentTrick.length);

  // Preload/reuse audio instance
  const playAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!playAudio.current) {
      playAudio.current = new Audio("/audio/card-played.mp3");
    }
  }, []);

  // Detect when a new card is added
  useEffect(() => {
    if (currentTrick.length > prevTrickLength.current) {
      // A card was just played!
      playAudio.current?.play().catch(() => {
        // Silently fail if audio can't play (e.g., autoplay restrictions)
      });
    }
    prevTrickLength.current = currentTrick.length;
  }, [currentTrick]);

  return (
    <>
      {/* Trump indicator - left of player's cards - hide during hand complete */}
      {!isHandComplete && (
        <div
          className="absolute z-20"
          style={{ bottom: "2vh", left: "2vw" }}
        >
          <div
            className="text-sm md:text-base font-bold mb-1 text-center"
            style={{
              color: "#fcd34d",
              textShadow: "0 2px 4px rgba(0,0,0,0.8)"
            }}
          >
            Trump
          </div>
          {trumpSuit === "no-trump" ? (
            <Card suit="hearts" rank="NO_TRUMP" faceUp width={55} height={83} className="md:w-[70px] md:h-[105px] lg:w-[80px] lg:h-[120px]" />
          ) : (
            <Card
              suit={trumpSuit as "hearts" | "diamonds" | "clubs" | "spades"}
              rank="K"
              faceUp
              width={55}
              height={83}
              className="md:w-[70px] md:h-[105px] lg:w-[80px] lg:h-[120px]"
            />
          )}
        </div>
      )}

      {/* Game Score - top right-center - hide during hand complete */}
      {!isHandComplete && (
        <div
          className="absolute text-center z-20"
          style={{ top: "1vh", right: "15%" }}
        >
          <div
            className="font-bold mb-1 text-sm md:text-lg lg:text-xl"
            style={{
              color: "#fcd34d",
              textShadow: "0 2px 4px rgba(0,0,0,0.8)"
            }}
          >
            Score
          </div>
          <div className="grid grid-cols-2 gap-2 md:gap-3 lg:gap-6 text-xs md:text-sm">
            <div>
              <div
                className="font-bold"
                style={{
                  color: "#c084fc",
                  textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                }}
              >
                Us
              </div>
              <div
                className="text-xl md:text-3xl lg:text-4xl font-bold"
                style={{
                  color: "#fcd34d",
                  textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                }}
              >
                {teamScores.Us}
              </div>
            </div>
            <div>
              <div
                className="font-bold"
                style={{
                  color: "#93c5fd",
                  textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                }}
              >
                Them
              </div>
              <div
                className="text-xl md:text-3xl lg:text-4xl font-bold"
                style={{
                  color: "#fcd34d",
                  textShadow: "0 2px 4px rgba(0,0,0,0.8)"
                }}
              >
                {teamScores.Them}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Center logo */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-0"
        style={{ color: "rgba(255, 255, 255, 0.15)" }}
      >
        <div className="text-9xl md:text-9xl lg:text-[12rem] mb-2 md:mb-4">🐱</div>
        <div
          className="font-bold text-6xl md:text-8xl lg:text-9xl"
          style={{
            color: "rgba(255, 255, 255, 0.15)",
            fontFamily: "serif",
            lineHeight: 1,
          }}
        >
          Meow Meow
        </div>
        <div
          className="text-3xl md:text-4xl lg:text-5xl mt-1 md:mt-2"
          style={{
            color: "rgba(255, 255, 255, 0.15)",
            fontFamily: "serif",
          }}
        >
          Publishing
        </div>
      </div>

      {/* Trick info - top left-center - hide during hand complete */}
      {!isHandComplete && (
        <div
          className="absolute text-center bg-black/80 px-2 py-1 md:px-3 md:py-2 lg:px-6 lg:py-4 rounded-md md:rounded-lg border border-yellow-400/50 md:border-2 z-20"
          style={{ top: "1vh", left: "15%", color: "#ffffff" }}
        >
          <div className="font-bold text-sm md:text-xl lg:text-3xl">
            Trick {trickNumber}/13
          </div>
          <div className="mt-1 md:mt-2 lg:mt-3 grid grid-cols-2 gap-1 md:gap-2 lg:gap-4 text-xs">
            <div>
              <div className="font-bold text-purple-300">Us</div>
              <div className="text-xs opacity-80 mb-1 hidden lg:block">
                {handAssignments
                  .filter((h: any) => h.team === "Us")
                  .map((h: any) => h.playerName)
                  .join(", ")}
              </div>
              <div className="text-sm md:text-lg lg:text-2xl font-bold text-yellow-300">
                {tricksWon.Us}
                {biddingTeam && (
                  <span className="text-xs md:text-sm opacity-70">
                    /{biddingTeam === "Us" ? tricksNeeded : defendingTricksNeeded}
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="font-bold text-blue-300">Them</div>
              <div className="text-xs opacity-80 mb-1 hidden lg:block">
                {handAssignments
                  .filter((h: any) => h.team === "Them")
                  .map((h: any) => h.playerName)
                  .join(", ")}
              </div>
              <div className="text-sm md:text-lg lg:text-2xl font-bold text-yellow-300">
                {tricksWon.Them}
                {biddingTeam && (
                  <span className="text-xs md:text-sm opacity-70">
                    /{biddingTeam === "Them" ? tricksNeeded : defendingTricksNeeded}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Trick Display */}
      {lastTrick.length === 4 && (
        <div
          className="absolute bg-black/90 px-3 py-2 md:px-4 md:py-3 lg:px-6 lg:py-5 rounded-md md:rounded-lg border border-yellow-400/50 md:border-2 z-50"
          style={{ bottom: "2vh", right: "2vw", color: "#ffffff" }}
        >
          <div className="text-xs md:text-sm lg:text-xl mb-1 md:mb-2 lg:mb-3 text-center font-semibold" style={{ opacity: 0.85 }}>
            Last{" "}
            {(() => {
              // Find the winner's team
              const winnerPlay = lastTrick.find((play: any) => play.handId === lastTrickWinner);
              if (winnerPlay) {
                const winnerHand = handAssignments.find(
                  (h: any) => `${h.playerId}_hand_${h.handIndex}` === winnerPlay.handId
                );
                if (winnerHand) {
                  const team = winnerHand.team;
                  const teamColor = team === "Us" ? "#c084fc" : "#93c5fd";
                  return (
                    <span style={{ color: teamColor }}>
                      ({team})
                    </span>
                  );
                }
              }
              return null;
            })()}
          </div>
          <div className="flex gap-1">
            {lastTrick.map((play: any, idx: number) => {
              const isWinner = play.handId === lastTrickWinner;
              return (
                <div
                  key={idx}
                  style={{
                    transform: isWinner ? "scale(1.05)" : "scale(1)",
                    filter: isWinner
                      ? "drop-shadow(0 0 8px rgba(251, 191, 36, 0.8)) brightness(1.2)"
                      : "none",
                    transition: "all 0.3s",
                  }}
                >
                  <Card
                    suit={play.card.suit}
                    rank={play.card.rank}
                    faceUp
                    width={40}
                    height={60}
                    className="md:w-[50px] md:h-[75px] lg:w-[60px] lg:h-[90px]"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Winner seat glow */}
      {showTrickComplete && trickWinnerHandId && (() => {
        // Compute winner's relative position
        const getRelativePositionFromHandId = (handId: string | null) => {
          if (!handId || !activeHand) return null;
          const activeIndex = handAssignments.findIndex((h: any) =>
            h.playerId === activeHand.playerId &&
            h.handIndex === activeHand.handIndex
          );
          const winner = handAssignments.find((h: any) => `${h.playerId}_hand_${h.handIndex}` === handId);
          if (!winner) return null;
          const winnerIndex = handAssignments.indexOf(winner);
          return (winnerIndex - activeIndex + 4) % 4; // 0=you,1=left,2=across,3=right
        };

        const winnerPosition = getRelativePositionFromHandId(trickWinnerHandId);

        return winnerPosition !== null ? (
          <div className="pointer-events-none absolute inset-0">
            {[
              { pos: 0, className: "bottom-4 left-1/2 -translate-x-1/2" },
              { pos: 1, className: "left-4 top-1/2 -translate-y-1/2" },
              { pos: 2, className: "top-4 left-1/2 -translate-x-1/2" },
              { pos: 3, className: "right-4 top-1/2 -translate-y-1/2" },
            ].map((slot, i) => (
              <div
                key={i}
                className={`absolute w-40 h-40 rounded-full transition-all duration-700 ${slot.className} ${winnerPosition === i ? "bg-yellow-400/20 blur-2xl scale-125" : "scale-75 opacity-0"
                  }`}
                style={{ pointerEvents: "none" }}
                aria-hidden
              />
            ))}
          </div>
        ) : null;
      })()}

      {/* Played cards in center - DROP ZONE - hide during hand complete */}
      {!isHandComplete && (
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
              width: "220px",
              height: "220px",
              // Visual debug border (can be removed later)
              border: "2px dashed rgba(251, 191, 36, 0.2)",
              borderRadius: "50%",
            }}
            className="md:w-[320px] md:h-[320px] lg:w-[500px] lg:h-[500px]"
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
                    width={50}
                    height={75}
                    className="md:w-[60px] md:h-[90px] lg:w-[90px] lg:h-[135px]"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

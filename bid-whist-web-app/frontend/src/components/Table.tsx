import React from "react";
import Card from "./Card";
import PlayingPhaseOverlay from "./PlayingPhaseOverlay";

interface TableProps {
  phase: string;
  handAssignments: any[];
  playerHands: Record<string, any[]>;
  currentUserId: string | null;
  currentPlayerIndex: number;
  activeHand: any;
  displayCards: any[];
  draggedIndex: number | null;
  isMyTurnToPlay: boolean;
  handleDragStart: (e: React.DragEvent, idx: number, card: any) => void;
  handleDragOver: (e: React.DragEvent, idx: number) => void;
  handleDragEnd: () => void;
  handleDrop: (e: React.DragEvent) => void;
  handleCardDoubleClick: (card: any) => void;
  getPlayerName: (position: "ACROSS" | "LEFT" | "RIGHT") => string;
  trumpSuit?: string;
  trickNumber?: number;
  tricksWon?: Record<string, number>;
  bidWinnerHandId?: string;
  winningBid?: number;
  lastTrick?: any[];
  lastTrickWinner?: string | null;
  currentTrick?: any[];
  trickWinnerHandId?: string | null;
  showTrickComplete?: boolean;
  handleDropOnCenter?: (e: React.DragEvent) => void;
  teamScores?: Record<string, number>;
}

export default function Table({
  phase,
  handAssignments,
  playerHands,
  currentUserId,
  currentPlayerIndex,
  activeHand,
  displayCards,
  draggedIndex,
  isMyTurnToPlay,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  handleDrop,
  handleCardDoubleClick,
  getPlayerName,
  trumpSuit = "",
  trickNumber = 1,
  tricksWon = { Us: 0, Them: 0 },
  bidWinnerHandId = "",
  winningBid = 0,
  lastTrick = [],
  lastTrickWinner = null,
  currentTrick = [],
  trickWinnerHandId = null,
  showTrickComplete = false,
  handleDropOnCenter,
  teamScores = { Us: 0, Them: 0 },
}: TableProps) {
  const showCards = phase === "BIDDING" || phase === "PLAYING" || phase === "TRUMP_SELECTION";

  return (
    <div
      className="relative flex items-center justify-center w-[95vw] h-[95vh] md:w-[90vw] md:h-[90vh] lg:w-[88vw] lg:h-[88vh]"
    >
      {/* Table Surface */}
      <div
        className="absolute rounded-[40px] md:rounded-[60px] lg:rounded-[80px] shadow-2xl"
        style={{
          width: "100%",
          height: "100%",
          background: "#0b4d0b",
          border: "8px solid #2c1f07",
          boxShadow:
            "inset 0 0 90px rgba(0,0,0,0.85), inset 0 0 40px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.5)",
        }}
        className="md:border-[12px] lg:border-[18px]"
      />

      {/* Meow Meow Publishing Logo */}
      <div
        className="absolute text-center"
        style={{
          opacity: 0.4,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        <div className="text-8xl md:text-8xl lg:text-9xl mb-2 md:mb-4">🐱</div>
        <div
          className="font-bold text-5xl md:text-6xl lg:text-7xl"
          style={{
            color: "#ffffff",
            fontFamily: "serif",
            lineHeight: 1,
          }}
        >
          Meow Meow
        </div>
        <div
          className="text-2xl md:text-3xl lg:text-4xl mt-1 md:mt-2"
          style={{
            color: "#ffffff",
            fontFamily: "serif",
          }}
        >
          Publishing
        </div>
      </div>

      {/* YOU (Bottom) */}
      <div className="absolute bottom-[2vh] left-1/2 -translate-x-1/2 flex flex-col items-center text-white">
        <div className="flex mb-2 transition-opacity duration-500" style={{ opacity: 1 }}>
          {displayCards.length > 0 ? (
            displayCards.map((card: any, idx: number) => (
              <div
                key={`${card.suit}-${card.rank}-${idx}`}
                className={`cursor-pointer touch-target ${phase === "PLAYING" && !isMyTurnToPlay ? "opacity-70" : ""
                  }`}
                draggable={true}
                onDragStart={(e: React.DragEvent) => handleDragStart(e, idx, card)}
                onDragOver={(e: React.DragEvent) => handleDragOver(e, idx)}
                onDragEnd={() => handleDragEnd()}
                onDrop={(e: React.DragEvent) => handleDrop(e)}
                onTouchStart={(e: React.TouchEvent) => {
                  if (phase === "PLAYING" && isMyTurnToPlay) {
                    handleDragStart(e as any, idx, card);
                  }
                }}
                onTouchMove={(e: React.TouchEvent) => {
                  if (phase === "PLAYING" && isMyTurnToPlay) {
                    e.preventDefault();
                  }
                }}
                onTouchEnd={(e: React.TouchEvent) => {
                  if (phase === "PLAYING" && isMyTurnToPlay) {
                    handleDragEnd();
                  }
                }}
                onDoubleClick={() => handleCardDoubleClick(card)}
                style={{
                  marginLeft: idx === 0 ? 0 : "-28px",
                  opacity: draggedIndex === idx ? 0.5 : 1,
                  transition: "all 0.2s",
                  position: "relative",
                  zIndex: idx,
                  filter:
                    phase === "PLAYING" && isMyTurnToPlay
                      ? "drop-shadow(0 0 8px rgba(251, 191, 36, 0.8)) brightness(1.1)"
                      : "none",
                }}
                className="md:-ml-8 lg:-ml-10"
              >
                <Card suit={card.suit} rank={card.rank} faceUp width={70} height={105} className="md:w-20 md:h-[120px] lg:w-[100px] lg:h-[150px]" />
              </div>
            ))
          ) : (
            showCards && <div className="text-gray-400">No cards</div>
          )}
        </div>
        <div className="text-lg md:text-xl lg:text-2xl font-bold mt-2" style={{ color: "#ffffff" }}>
          {activeHand ? `${activeHand.playerName} (You)` : "You"}
          {phase === "PLAYING" && isMyTurnToPlay && (
            <span className="ml-2 text-yellow-300">← Your Turn!</span>
          )}
        </div>
      </div>

      {/* ACROSS (Top) */}
      <div className="absolute top-[2vh] left-1/2 -translate-x-1/2 flex flex-col items-center text-white">
        <div className="text-lg md:text-xl lg:text-2xl font-bold mb-2" style={{ color: "#ffffff" }}>
          {getPlayerName("ACROSS")}
          {phase === "PLAYING" &&
            handAssignments.length > 0 &&
            (() => {
              const activeHandGlobalIndex = activeHand
                ? handAssignments.findIndex(
                  (h: any) =>
                    h.playerId === activeHand.playerId &&
                    h.handIndex === activeHand.handIndex
                )
                : handAssignments.findIndex((h: any) => h.playerId === currentUserId);
              const acrossIndex = (activeHandGlobalIndex + 2) % 4;
              return (
                acrossIndex === currentPlayerIndex && (
                  <span className="ml-2 text-yellow-300 animate-pulse">👈</span>
                )
              );
            })()}
        </div>

        {showCards &&
          (() => {
            const activeHandGlobalIndex = activeHand
              ? handAssignments.findIndex(
                (h: any) =>
                  h.playerId === activeHand.playerId && h.handIndex === activeHand.handIndex
              )
              : handAssignments.findIndex((h: any) => h.playerId === currentUserId);
            const acrossIndex = (activeHandGlobalIndex + 2) % 4;
            const acrossHand = handAssignments[acrossIndex];
            const acrossHandId = acrossHand
              ? `${acrossHand.playerId}_hand_${acrossHand.handIndex}`
              : "";
            const cardCount = playerHands[acrossHandId]?.length ?? 13;

            return (
              <div className="flex justify-center items-center">
                {Array.from({ length: cardCount }).map((_, i) => (
                  <div key={i} style={{ marginLeft: i === 0 ? 0 : "-24px" }} className="md:-ml-8 lg:-ml-10">
                    <Card faceUp={false} width={45} height={68} className="md:w-12 md:h-[72px] lg:w-[60px] lg:h-[90px]" />
                  </div>
                ))}
              </div>
            );
          })()}
      </div>

      {/* LEFT */}
      <div className="absolute left-[2vw] top-[40%] -translate-y-1/2 flex flex-col items-center text-white">
        <div className="text-lg md:text-xl lg:text-2xl font-bold mb-2 writing-vertical-rl" style={{ color: "#ffffff" }}>
          {getPlayerName("LEFT")}
          {phase === "PLAYING" &&
            handAssignments.length > 0 &&
            (() => {
              const activeHandGlobalIndex = activeHand
                ? handAssignments.findIndex(
                  (h: any) =>
                    h.playerId === activeHand.playerId &&
                    h.handIndex === activeHand.handIndex
                )
                : handAssignments.findIndex((h: any) => h.playerId === currentUserId);
              const leftIndex = (activeHandGlobalIndex + 1) % 4;
              return (
                leftIndex === currentPlayerIndex && (
                  <span className="ml-2 text-yellow-300 animate-pulse">👈</span>
                )
              );
            })()}
        </div>

        {showCards &&
          (() => {
            const activeHandGlobalIndex = activeHand
              ? handAssignments.findIndex(
                (h: any) =>
                  h.playerId === activeHand.playerId && h.handIndex === activeHand.handIndex
              )
              : handAssignments.findIndex((h: any) => h.playerId === currentUserId);
            const leftIndex = (activeHandGlobalIndex + 1) % 4;
            const leftHand = handAssignments[leftIndex];
            const leftHandId = leftHand
              ? `${leftHand.playerId}_hand_${leftHand.handIndex}`
              : "";
            const cardCount = playerHands[leftHandId]?.length ?? 13;

            return (
              <div className="flex flex-col items-center">
                {Array.from({ length: cardCount }).map((_, i) => (
                  <div key={i} style={{ marginTop: i === 0 ? 0 : "-40px" }} className="md:-mt-[45px] lg:-mt-[50px]">
                    <div className="transform -rotate-90">
                      <Card faceUp={false} width={35} height={53} className="md:w-[50px] md:h-[75px] lg:w-[60px] lg:h-[90px]" />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
      </div>

      {/* RIGHT */}
      <div className="absolute right-[2vw] top-[40%] -translate-y-1/2 flex flex-col items-center text-white">
        <div className="text-lg md:text-xl lg:text-2xl font-bold mb-2 writing-vertical-rl" style={{ color: "#ffffff" }}>
          {getPlayerName("RIGHT")}
          {phase === "PLAYING" &&
            handAssignments.length > 0 &&
            (() => {
              const activeHandGlobalIndex = activeHand
                ? handAssignments.findIndex(
                  (h: any) =>
                    h.playerId === activeHand.playerId &&
                    h.handIndex === activeHand.handIndex
                )
                : handAssignments.findIndex((h: any) => h.playerId === currentUserId);
              const rightIndex = (activeHandGlobalIndex + 3) % 4;
              return (
                rightIndex === currentPlayerIndex && (
                  <span className="ml-2 text-yellow-300 animate-pulse">👈</span>
                )
              );
            })()}
        </div>

        {showCards &&
          (() => {
            const activeHandGlobalIndex = activeHand
              ? handAssignments.findIndex(
                (h: any) =>
                  h.playerId === activeHand.playerId && h.handIndex === activeHand.handIndex
              )
              : handAssignments.findIndex((h: any) => h.playerId === currentUserId);
            const rightIndex = (activeHandGlobalIndex + 3) % 4;
            const rightHand = handAssignments[rightIndex];
            const rightHandId = rightHand
              ? `${rightHand.playerId}_hand_${rightHand.handIndex}`
              : "";
            const cardCount = playerHands[rightHandId]?.length ?? 13;

            return (
              <div className="flex flex-col items-center">
                {Array.from({ length: cardCount }).map((_, i) => (
                  <div key={i} style={{ marginTop: i === 0 ? 0 : "-40px" }} className="md:-mt-[45px] lg:-mt-[50px]">
                    <div className="transform rotate-90">
                      <Card faceUp={false} width={35} height={53} className="md:w-[50px] md:h-[75px] lg:w-[60px] lg:h-[90px]" />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
      </div>

      {/* PLAYING PHASE INFO */}
      {(phase === "PLAYING" || phase === "HAND_COMPLETE" || phase === "GAME_COMPLETE") && (
        <PlayingPhaseOverlay
          phase={phase}
          trumpSuit={trumpSuit}
          trickNumber={trickNumber}
          tricksWon={tricksWon}
          handAssignments={handAssignments}
          bidWinnerHandId={bidWinnerHandId}
          winningBid={winningBid}
          lastTrick={lastTrick}
          lastTrickWinner={lastTrickWinner}
          currentTrick={currentTrick}
          activeHand={activeHand}
          trickWinnerHandId={trickWinnerHandId}
          showTrickComplete={showTrickComplete}
          handleDropOnCenter={handleDropOnCenter}
          teamScores={teamScores}
        />
      )}
    </div>
  );
}

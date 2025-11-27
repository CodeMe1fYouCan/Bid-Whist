import React, { useState, useEffect } from "react";
import Card from "./Card";
import PlayingPhaseOverlay from "./PlayingPhaseOverlay";
import { useResponsiveCardSize } from "../hooks/useResponsiveCardSize";

interface TableProps {
  phase: string;
  trumpSuit: string | null;
  trickNumber: number;
  tricksWon: { Us: number; Them: number };
  handAssignments: any[];
  currentPlayerIndex: number;
  activeHand: any;
  displayCards: any[];
  draggedIndex: number | null;
  isMyTurnToPlay: boolean;
  playerHands: Record<string, any[]>;
  currentUserId: string | null;
  handleDragStart: (e: React.DragEvent, idx: number, card: any) => void;
  handleDragOver: (e: React.DragEvent, idx: number) => void;
  handleDragEnd: () => void;
  handleDrop: (e: React.DragEvent) => void;
  handleCardDoubleClick: (card: any) => void;
  getPlayerName: (position: "ACROSS" | "LEFT" | "RIGHT") => string;
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
  const {
    playerCardWidth,
    playerCardHeight,
    opponentCardWidth,
    opponentCardHeight,
    windowWidth,
    windowHeight,
    isMobile
  } = useResponsiveCardSize();

  // Helper to calculate card overlap
  const getCardStyle = (index: number, totalCards: number, isHorizontal: boolean) => {
    if (totalCards <= 1) return isHorizontal ? { marginLeft: 0 } : { marginTop: 0 };

    if (isHorizontal) {
      // Player (Bottom) or Across (Top)
      const cardWidth = isMobile ? playerCardWidth : (index === 0 ? playerCardWidth : opponentCardWidth);
      // Note: Across hand uses opponentCardWidth, Player uses playerCardWidth. 
      // We'll simplify: pass the actual card width being used for this hand.

      // Let's refine this: we'll calculate the margin based on the specific hand's card width.
      // But we can't easily pass it here without changing signature.
      // Let's assume standard logic:
      // Player hand (bottom) is the critical one.
      // Across hand (top) is also horizontal.

      // We'll handle the "which hand" logic in the render loop, 
      // but here we calculate the offset.

      return {}; // Placeholder, we will implement inline or better helper below
    }
    return {};
  };

  // Better approach: Calculate overlap for a specific hand configuration
  const calculateOverlap = (totalCards: number, cardWidth: number, availableSpace: number, defaultVisible: number) => {
    if (totalCards <= 1) return 0;

    // Adjust card width for scaling if on mobile
    const effectiveCardWidth = isMobile ? cardWidth * 0.75 : cardWidth;

    const requiredSpace = (totalCards - 1) * defaultVisible + effectiveCardWidth;
    if (requiredSpace <= availableSpace) return -(cardWidth - defaultVisible);

    // Squeeze
    const squeezedVisible = (availableSpace - effectiveCardWidth) / (totalCards - 1);
    return -(cardWidth - squeezedVisible);
  };

  // Helper function to get hand ID based on position relative to active hand
  const getHandId = (position: "LEFT" | "RIGHT" | "ACROSS"): string => {
    const activeHandGlobalIndex = activeHand
      ? handAssignments.findIndex(
        (h: any) => h.playerId === activeHand.playerId && h.handIndex === activeHand.handIndex
      )
      : handAssignments.findIndex((h: any) => h.playerId === currentUserId);

    let targetIndex: number;
    switch (position) {
      case "ACROSS":
        targetIndex = (activeHandGlobalIndex + 2) % 4;
        break;
      case "LEFT":
        targetIndex = (activeHandGlobalIndex + 1) % 4;
        break;
      case "RIGHT":
        targetIndex = (activeHandGlobalIndex + 3) % 4;
        break;
    }

    const targetHand = handAssignments[targetIndex];
    return targetHand ? `${targetHand.playerId}_hand_${targetHand.handIndex}` : "";
  };

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


      {/* YOU (Bottom) */}
      <div className="absolute bottom-[2vh] left-1/2 -translate-x-1/2 flex flex-col items-center text-white" style={{ width: '90vw', maxWidth: '1000px' }}>
        <div className="flex mb-2 transition-opacity duration-500 justify-center" style={{ opacity: 1, width: '100%' }}>
          {displayCards.length > 0 ? (
            (() => {
              const overlap = calculateOverlap(
                displayCards.length,
                playerCardWidth,
                Math.min(windowWidth * 0.9, 1000),
                isMobile ? 30 : 40
              );

              return displayCards.map((card: any, idx: number) => (
                <div
                  key={`${card.suit}-${card.rank}-${idx}`}
                  className={`cursor-pointer touch-target ${phase === "PLAYING" && !isMyTurnToPlay ? "opacity-70" : ""}`}
                  draggable={!isMobile}
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
                    marginLeft: idx === 0 ? 0 : `${overlap}px`,
                    opacity: draggedIndex === idx ? 0.5 : 1,
                    transition: "all 0.2s",
                    position: "relative",
                    zIndex: idx,
                    filter:
                      phase === "PLAYING" && isMyTurnToPlay
                        ? "drop-shadow(0 0 8px rgba(251, 191, 36, 0.8)) brightness(1.1)"
                        : "none",
                  }}
                  className="scale-75 origin-bottom md:scale-100"
                >
                  <Card
                    suit={card.suit}
                    rank={card.rank}
                    faceUp
                    width={playerCardWidth}
                    height={playerCardHeight}
                  />
                </div>
              ));
            })()
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

            // ACROSS (Top) - Hide during bidding to make room for overlay
            if (phase === "BIDDING") return null;

            const acrossIndex = (activeHandGlobalIndex + 2) % 4;
            const acrossHand = handAssignments[acrossIndex];
            const acrossHandId = acrossHand
              ? `${acrossHand.playerId}_hand_${acrossHand.handIndex}`
              : "";
            const cardCount = playerHands[acrossHandId]?.length ?? 13;

            return (
              <div className="flex justify-center items-center" style={{ width: '80vw', maxWidth: '600px' }}>
                {(() => {
                  const overlap = calculateOverlap(
                    cardCount,
                    opponentCardWidth,
                    Math.min(windowWidth * 0.8, 600),
                    isMobile ? 20 : 30
                  );
                  return Array.from({ length: cardCount }).map((_, i) => (
                    <div key={i} style={{ marginLeft: i === 0 ? 0 : `${overlap}px` }} className="scale-75 origin-top md:scale-100">
                      <Card faceUp={false} width={opponentCardWidth} height={opponentCardHeight} />
                    </div>
                  ));
                })()}
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

        {/* LEFT - Hide during bidding */}
        {phase !== "BIDDING" && (() => {
          const leftHandId = getHandId("LEFT");
          const cardCount = playerHands[leftHandId]?.length ?? 13;

          return (
            <div className="flex flex-col items-center" style={{ height: isMobile ? '50vh' : '60vh', maxHeight: isMobile ? '400px' : '500px' }}>
              {(() => {
                const overlap = calculateOverlap(
                  cardCount,
                  opponentCardHeight, // Use HEIGHT because cards are rotated 90deg, so height is the "stacking dimension"
                  Math.min(windowHeight * (isMobile ? 0.5 : 0.6), isMobile ? 400 : 500),
                  isMobile ? 12 : 25 // Tighter default visible for vertical stacks
                );
                return Array.from({ length: cardCount }).map((_, i) => (
                  <div key={i} style={{ marginTop: i === 0 ? 0 : `${overlap}px` }} className={`origin-left md:scale-100 ${isMobile ? "scale-60" : "scale-75"}`}>
                    <div className="transform -rotate-90">
                      <Card faceUp={false} width={opponentCardWidth} height={opponentCardHeight} />
                    </div>
                  </div>
                ));
              })()}
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

        {/* RIGHT - Hide during bidding */}
        {phase !== "BIDDING" && (() => {
          const rightHandId = getHandId("RIGHT");
          const cardCount = playerHands[rightHandId]?.length ?? 13;

          return (
            <div className="flex flex-col items-center" style={{ height: isMobile ? '50vh' : '60vh', maxHeight: isMobile ? '400px' : '500px' }}>
              {(() => {
                const overlap = calculateOverlap(
                  cardCount,
                  opponentCardHeight, // Use HEIGHT because cards are rotated 90deg
                  Math.min(windowHeight * (isMobile ? 0.5 : 0.6), isMobile ? 400 : 500),
                  isMobile ? 12 : 25
                );
                return Array.from({ length: cardCount }).map((_, i) => (
                  <div key={i} style={{ marginTop: i === 0 ? 0 : `${overlap}px` }} className={`origin-right md:scale-100 ${isMobile ? "scale-60" : "scale-75"}`}>
                    <div className="transform rotate-90">
                      <Card faceUp={false} width={opponentCardWidth} height={opponentCardHeight} />
                    </div>
                  </div>
                ));
              })()}
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

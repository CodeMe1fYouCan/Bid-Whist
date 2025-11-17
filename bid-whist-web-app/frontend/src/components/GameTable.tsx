import React from "react";
import Card from "./Card";

interface GameTableProps {
  handAssignments: any[];
  playerHands: Record<string, any[]>;
  currentUserId: string | null;
  phase: string;
  dealerGuesses?: Record<string, number>;
  guessInput?: Record<string, string>;
  setGuessInput?: (input: Record<string, string>) => void;
  handleGuessSubmit?: (handId: string) => void;
  currentBidderIndex?: number;
  bids?: any[];
  highestBid?: number;
  dealerIndex?: number;
  handleBid?: (handId: string, bidAmount: number | string) => void;
  handleTrumpSelection?: (trumpSuit: string) => void;
  trumpSuit?: string;
  currentPlayerIndex?: number;
  currentTrick?: any[];
  tricksWon?: Record<string, number>;
  trickNumber?: number;
  handleCardPlay?: (handId: string, card: any) => void;
  trickWinnerHandId?: string | null;
  showTrickComplete?: boolean;
  lastTrick?: any[];
  lastTrickWinner?: string | null;
  bidWinnerHandId?: string;
  winningBid?: number;
}

export default function GameTable({
  handAssignments,
  playerHands,
  currentUserId,
  phase,
  dealerGuesses = {},
  guessInput = {},
  setGuessInput,
  handleGuessSubmit,
  currentBidderIndex = 0,
  bids = [],
  highestBid = 0,
  dealerIndex = 0,
  handleBid,
  handleTrumpSelection,
  trumpSuit = "",
  currentPlayerIndex = 0,
  currentTrick = [],
  tricksWon = { Us: 0, Them: 0 },
  trickNumber = 1,
  handleCardPlay,
  trickWinnerHandId = null,
  showTrickComplete = false,
  lastTrick = [],
  lastTrickWinner = null,
  bidWinnerHandId = "",
  winningBid = 0,
}: GameTableProps) {
  const showCards = phase === "BIDDING" || phase === "PLAYING" || phase === "TRUMP_SELECTION";
  const [bidInput, setBidInput] = React.useState<string>("");
  const [sortedCards, setSortedCards] = React.useState<Record<string, any[]>>({});
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  /** Find user’s hands */
  const myHandAssignments = handAssignments.filter(
    (h: any) => h.playerId === currentUserId
  );

  // Determine which hand should be shown at the bottom (active hand)
  // During bidding/playing, show the current active hand if it belongs to the user
  let activeHandIndex = 0; // Default to first hand
  if ((phase === "BIDDING" || phase === "TRUMP_SELECTION") && handAssignments.length > 0) {
    const currentHand = handAssignments[currentBidderIndex];
    if (currentHand && currentHand.playerId === currentUserId) {
      // Find which of my hands is currently active
      activeHandIndex = myHandAssignments.findIndex(
        (h: any) => h.handIndex === currentHand.handIndex
      );
      if (activeHandIndex === -1) activeHandIndex = 0;
    }
  } else if (phase === "PLAYING" && handAssignments.length > 0) {
    const currentHand = handAssignments[currentPlayerIndex];
    console.log("🎮 PLAYING phase - currentPlayerIndex:", currentPlayerIndex, "currentHand:", currentHand);
    if (currentHand && currentHand.playerId === currentUserId) {
      // Find which of my hands is currently active based on the global currentPlayerIndex
      // handIndex is a string, so convert for comparison
      activeHandIndex = myHandAssignments.findIndex(
        (h: any) => h.playerId === currentHand.playerId && String(h.handIndex) === String(currentHand.handIndex)
      );
      console.log("   Found activeHandIndex:", activeHandIndex, "in myHandAssignments:", myHandAssignments);
      if (activeHandIndex === -1) {
        console.log("   ⚠️ Could not find matching hand, defaulting to 0");
        activeHandIndex = 0;
      }
    }
  }

  // Get the active hand's cards
  const activeHand = myHandAssignments[activeHandIndex] || myHandAssignments[0];
  const activeHandId = activeHand ? `${activeHand.playerId}_hand_${activeHand.handIndex}` : "";
  const myCards: any[] = [];
  if (showCards && activeHand) {
    myCards.push(...(playerHands[activeHandId] || []));
  }

  // Sort cards by suit and rank (default order) - update when playerHands changes
  React.useEffect(() => {
    console.log("🃏 Card sorting effect triggered:", {
      myCardsLength: myCards.length,
      activeHandId,
      cardsInHand: playerHands[activeHandId]?.length
    });
    
    if (myCards.length > 0 && activeHandId) {
      const suitOrder = { hearts: 0, spades: 1, diamonds: 2, clubs: 3 };
      const rankOrder = { 'A': 13, 'K': 12, 'Q': 11, 'J': 10, '10': 9, '9': 8, '8': 7, '7': 6, '6': 5, '5': 4, '4': 3, '3': 2, '2': 1 };
      
      const sorted = [...myCards].sort((a, b) => {
        const suitDiff = suitOrder[a.suit as keyof typeof suitOrder] - suitOrder[b.suit as keyof typeof suitOrder];
        if (suitDiff !== 0) return suitDiff;
        return (rankOrder[b.rank as keyof typeof rankOrder] || 0) - (rankOrder[a.rank as keyof typeof rankOrder] || 0);
      });
      
      console.log("   Setting sorted cards:", sorted.length, "cards");
      setSortedCards(prev => ({ ...prev, [activeHandId]: sorted }));
    } else if (myCards.length === 0 && activeHandId) {
      // Clear sorted cards when hand is empty
      console.log("   Clearing sorted cards");
      setSortedCards(prev => ({ ...prev, [activeHandId]: [] }));
    }
  }, [myCards.length, activeHandId, playerHands]);

  const displayCards = (activeHandId && sortedCards[activeHandId]) ? sortedCards[activeHandId] : myCards;

  // Check if it's my turn to play
  const isMyTurnToPlay = phase === "PLAYING" && handAssignments.length > 0 && 
    handAssignments[currentPlayerIndex]?.playerId === currentUserId;

  // Handle double-click to play card during playing phase
  const handleCardDoubleClick = (card: any) => {
    if (phase === "PLAYING" && isMyTurnToPlay && handleCardPlay && activeHandId) {
      console.log("🎴 Playing card:", {
        activeHandId,
        activeHand,
        currentPlayerIndex,
        handAssignments,
        card
      });
      handleCardPlay(activeHandId, card);
      // Don't remove locally - wait for server to send updated playerHands
    }
  };

  // Drag and drop handlers
  const [draggedCard, setDraggedCard] = React.useState<any>(null);

  const handleDragStart = (index: number, card: any) => {
    setDraggedIndex(index);
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index || !activeHandId) return;
    
    const newCards = [...displayCards];
    const draggedCardData = newCards[draggedIndex];
    newCards.splice(draggedIndex, 1);
    newCards.splice(index, 0, draggedCardData);
    
    setSortedCards(prev => ({ ...prev, [activeHandId]: newCards }));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDraggedCard(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedIndex(null);
    setDraggedCard(null);
  };

  // Handle drop on center to play card
  const handleDropOnCenter = (e: React.DragEvent) => {
    e.preventDefault();
    if (phase === "PLAYING" && isMyTurnToPlay && draggedCard && handleCardPlay && activeHandId) {
      handleCardPlay(activeHandId, draggedCard);
      // Don't remove locally - wait for server to send updated playerHands
    }
    setDraggedIndex(null);
    setDraggedCard(null);
  };

  /** Helper to get player name by position */
  const getPlayerName = (position: "ACROSS" | "LEFT" | "RIGHT") => {
    if (handAssignments.length !== 4) return position;
    
    // Find the active hand's index in the full hand assignments
    const activeHandGlobalIndex = activeHand 
      ? handAssignments.findIndex((h: any) => 
          h.playerId === activeHand.playerId && h.handIndex === activeHand.handIndex
        )
      : handAssignments.findIndex((h: any) => h.playerId === currentUserId);
    
    if (activeHandGlobalIndex === -1) return position;
    
    // Map positions relative to active hand (index 0 = active hand, 1 = left, 2 = across, 3 = right)
    let targetIndex;
    switch (position) {
      case "LEFT":
        targetIndex = (activeHandGlobalIndex + 1) % 4;
        break;
      case "ACROSS":
        targetIndex = (activeHandGlobalIndex + 2) % 4;
        break;
      case "RIGHT":
        targetIndex = (activeHandGlobalIndex + 3) % 4;
        break;
      default:
        return position;
    }
    
    return handAssignments[targetIndex]?.playerName || position;
  };

  return (
    <div className="w-screen h-screen overflow-hidden flex items-center justify-center bg-black relative z-0">
      {/* BACKGROUND */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, rgba(70,70,70,1) 0%, rgba(0,0,0,0.4) 80%)",
        }}
      />

      {/* TABLE */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: "88vw", height: "88vh" }}
      >
        <div
          className="absolute rounded-[80px] shadow-2xl"
          style={{
            width: "100%",
            height: "100%",
            background: "#0b4d0b",
            border: "18px solid #2c1f07",
            boxShadow:
              "inset 0 0 90px rgba(0,0,0,0.85), inset 0 0 40px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.5)",
          }}
        />

        {/* YOU (Bottom) */}
        <div className="absolute bottom-[2vh] left-1/2 -translate-x-1/2 flex flex-col items-center text-white">
          <div className="flex mb-2">
            {displayCards.length > 0 ? (
              displayCards.map((card: any, idx: number) => (
                <div 
                  key={`${card.suit}-${card.rank}-${idx}`} 
                  className={`cursor-move ${phase === "PLAYING" && !isMyTurnToPlay ? "opacity-70" : ""}`}
                  draggable={true}
                  onDragStart={() => handleDragStart(idx, card)}
                  onDragOver={(e: React.DragEvent) => handleDragOver(e, idx)}
                  onDragEnd={() => handleDragEnd()}
                  onDrop={(e: React.DragEvent) => handleDrop(e)}
                  onDoubleClick={() => handleCardDoubleClick(card)}
                  style={{ 
                    marginLeft: idx === 0 ? 0 : '-30px',
                    opacity: draggedIndex === idx ? 0.5 : 1,
                    transition: 'all 0.2s',
                    position: 'relative',
                    zIndex: idx,
                    filter: phase === "PLAYING" && isMyTurnToPlay ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8)) brightness(1.1)' : 'none'
                  }}
                >
                  <Card suit={card.suit} rank={card.rank} faceUp width={80} height={120} />
                </div>
              ))
            ) : (
              showCards && <div className="text-gray-400">No cards</div>
            )}
          </div>
          <div className="text-2xl font-bold mt-2" style={{ color: '#ffffff' }}>
            {activeHand ? `${activeHand.playerName} (You)` : 'You'}
            {phase === "PLAYING" && isMyTurnToPlay && <span className="ml-2 text-yellow-300">← Your Turn!</span>}
          </div>
        </div>

        {/* ACROSS (Top) */}
        <div className="absolute top-[2vh] left-1/2 -translate-x-1/2 flex flex-col items-center text-white">
          <div className="text-2xl font-bold mb-2" style={{ color: '#ffffff' }}>
            {getPlayerName("ACROSS")}
            {phase === "PLAYING" && handAssignments.length > 0 && (() => {
              const activeHandGlobalIndex = activeHand 
                ? handAssignments.findIndex((h: any) => 
                    h.playerId === activeHand.playerId && h.handIndex === activeHand.handIndex
                  )
                : handAssignments.findIndex((h: any) => h.playerId === currentUserId);
              const acrossIndex = (activeHandGlobalIndex + 2) % 4;
              return acrossIndex === currentPlayerIndex && (
                <span className="ml-2 text-yellow-300 animate-pulse">👈</span>
              );
            })()}
          </div>

          {showCards && (() => {
            const activeHandGlobalIndex = activeHand 
              ? handAssignments.findIndex((h: any) => 
                  h.playerId === activeHand.playerId && h.handIndex === activeHand.handIndex
                )
              : handAssignments.findIndex((h: any) => h.playerId === currentUserId);
            const acrossIndex = (activeHandGlobalIndex + 2) % 4;
            const acrossHand = handAssignments[acrossIndex];
            const acrossHandId = acrossHand ? `${acrossHand.playerId}_hand_${acrossHand.handIndex}` : "";
            const cardCount = playerHands[acrossHandId]?.length || 13;
            
            return (
              <div className="flex">
                {Array.from({ length: cardCount }).map((_, i) => (
                  <div key={i} className="-ml-10 first:ml-0"> 
                    <Card faceUp={false} width={60} height={90} />
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* LEFT */}
        <div className="absolute left-[2vw] top-1/2 -translate-y-1/2 flex flex-col items-center text-white">
          <div className="text-2xl font-bold mb-2 writing-vertical-rl" style={{ color: '#ffffff' }}>
            {getPlayerName("LEFT")}
            {phase === "PLAYING" && handAssignments.length > 0 && (() => {
              const activeHandGlobalIndex = activeHand 
                ? handAssignments.findIndex((h: any) => 
                    h.playerId === activeHand.playerId && h.handIndex === activeHand.handIndex
                  )
                : handAssignments.findIndex((h: any) => h.playerId === currentUserId);
              const leftIndex = (activeHandGlobalIndex + 1) % 4;
              return leftIndex === currentPlayerIndex && (
                <span className="ml-2 text-yellow-300 animate-pulse">👈</span>
              );
            })()}
          </div>

          {showCards && (() => {
            const activeHandGlobalIndex = activeHand 
              ? handAssignments.findIndex((h: any) => 
                  h.playerId === activeHand.playerId && h.handIndex === activeHand.handIndex
                )
              : handAssignments.findIndex((h: any) => h.playerId === currentUserId);
            const leftIndex = (activeHandGlobalIndex + 1) % 4;
            const leftHand = handAssignments[leftIndex];
            const leftHandId = leftHand ? `${leftHand.playerId}_hand_${leftHand.handIndex}` : "";
            const cardCount = playerHands[leftHandId]?.length || 13;
            
            return (
              <div className="flex flex-col items-center">
                {Array.from({ length: cardCount }).map((_, i) => (
                  <div key={i} style={{ marginTop: i === 0 ? 0 : '-50px' }}> 
                    <div className="transform -rotate-90">
                      <Card faceUp={false} width={60} height={90} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* RIGHT */}
        <div className="absolute right-[2vw] top-1/2 -translate-y-1/2 flex flex-col items-center text-white">
          <div className="text-2xl font-bold mb-2 writing-vertical-rl" style={{ color: '#ffffff' }}>
            {getPlayerName("RIGHT")}
            {phase === "PLAYING" && handAssignments.length > 0 && (() => {
              const activeHandGlobalIndex = activeHand 
                ? handAssignments.findIndex((h: any) => 
                    h.playerId === activeHand.playerId && h.handIndex === activeHand.handIndex
                  )
                : handAssignments.findIndex((h: any) => h.playerId === currentUserId);
              const rightIndex = (activeHandGlobalIndex + 3) % 4;
              return rightIndex === currentPlayerIndex && (
                <span className="ml-2 text-yellow-300 animate-pulse">👈</span>
              );
            })()}
          </div>

          {showCards && (() => {
            const activeHandGlobalIndex = activeHand 
              ? handAssignments.findIndex((h: any) => 
                  h.playerId === activeHand.playerId && h.handIndex === activeHand.handIndex
                )
              : handAssignments.findIndex((h: any) => h.playerId === currentUserId);
            const rightIndex = (activeHandGlobalIndex + 3) % 4;
            const rightHand = handAssignments[rightIndex];
            const rightHandId = rightHand ? `${rightHand.playerId}_hand_${rightHand.handIndex}` : "";
            const cardCount = playerHands[rightHandId]?.length || 13;
            
            return (
              <div className="flex flex-col items-center">
                {Array.from({ length: cardCount }).map((_, i) => (
                  <div key={i} style={{ marginTop: i === 0 ? 0 : '-50px' }}>
                    <div className="transform rotate-90">
                      <Card faceUp={false} width={60} height={90} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* PLAYING PHASE INFO */}
        {phase === "PLAYING" && (
          <>
            {/* Trump indicator - left of player's cards */}
            <div className="absolute text-center bg-black/80 px-6 py-4 rounded-lg border-2 border-yellow-400/50 z-20" style={{ bottom: '2vh', left: '10vw', color: '#ffffff' }}>
              <div className="text-sm mb-2" style={{ opacity: 0.7 }}>Trump</div>
              {trumpSuit === "no-trump" ? (
                <div className="font-bold" style={{ fontSize: '2.25rem', color: '#fbbf24' }}>No Trump</div>
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

            {/* Trick info - top left */}
            <div className="absolute text-center bg-black/80 px-6 py-4 rounded-lg border-2 border-yellow-400/50 z-20" style={{ top: '2vh', left: '8vw', color: '#ffffff' }}>
              <div className="font-bold" style={{ fontSize: '2.25rem' }}>Trick {trickNumber}/13</div>
              <div className="mt-3 grid grid-cols-2 gap-4" style={{ fontSize: '1.25rem' }}>
                {(() => {
                  // Determine bidding team
                  const bidWinnerHand = handAssignments.find((h: any) => 
                    `${h.playerId}_hand_${h.handIndex}` === bidWinnerHandId
                  );
                  const biddingTeam = bidWinnerHand?.team || "";
                  const tricksNeeded = 6 + winningBid;
                  const defendingTricksNeeded = 8 - winningBid; // 14 total - (6 + bid)
                  
                  return (
                    <>
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
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Last Trick - bottom right */}
            {lastTrick.length === 4 && (
              <div className="absolute bg-black/80 px-6 py-5 rounded-lg border-2 border-white/30 z-20" style={{ bottom: '2vh', right: '2vw', color: '#ffffff' }}>
                <div className="text-xl mb-3 text-center font-semibold" style={{ opacity: 0.85 }}>Last Trick</div>
                <div className="flex gap-2">
                  {lastTrick.map((play: any, idx: number) => {
                    const isWinner = play.handId === lastTrickWinner;
                    return (
                      <div 
                        key={idx}
                        style={{
                          filter: isWinner ? 'drop-shadow(0 0 10px rgba(251, 191, 36, 1))' : 'none',
                          opacity: isWinner ? 1 : 0.75
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

            {/* Played cards in center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="relative w-96 h-96 pointer-events-auto flex items-center justify-center"
                onDragOver={(e: React.DragEvent) => e.preventDefault()}
                onDrop={handleDropOnCenter}
              >
                {/* Meow Meow Publishing Logo - shows when no cards played */}
                {currentTrick.length === 0 && (
                  <div className="text-center" style={{ opacity: 0.25 }}>
                    <div style={{ fontSize: '8rem', marginBottom: '1rem' }}>🐱</div>
                    <div className="font-bold" style={{ fontSize: '4rem', color: '#ffffff', fontFamily: 'serif', lineHeight: 1 }}>
                      Meow Meow
                    </div>
                    <div style={{ fontSize: '2.5rem', color: '#ffffff', fontFamily: 'serif', marginTop: '0.5rem' }}>
                      Publishing
                    </div>
                  </div>
                )}
                
                {currentTrick.map((play: any, idx: number) => {
                  // Position cards in a diamond pattern: bottom, left, top, right
                  const positions = [
                    { bottom: "10%", left: "50%", transform: "translateX(-50%)" }, // Bottom (player 0)
                    { top: "50%", left: "10%", transform: "translateY(-50%)" },    // Left (player 1)
                    { top: "10%", left: "50%", transform: "translateX(-50%)" },    // Top (player 2)
                    { top: "50%", right: "10%", transform: "translateY(-50%)" },   // Right (player 3)
                  ];
                  const pos = positions[play.handIndex] || positions[0];
                  
                  const isWinner = showTrickComplete && play.handId === trickWinnerHandId;
                  
                  // Calculate position to move towards winner
                  let animateStyle = {};
                  if (showTrickComplete && trickWinnerHandId) {
                    const winnerPlay = currentTrick.find((p: any) => p.handId === trickWinnerHandId);
                    if (winnerPlay) {
                      const winnerPos = positions[winnerPlay.handIndex];
                      // Slide all cards to winner's position with slight offset for stacking effect
                      const offsetX = (idx - currentTrick.findIndex((p: any) => p.handId === trickWinnerHandId)) * 5;
                      animateStyle = {
                        ...winnerPos,
                        left: winnerPos.left ? `calc(${winnerPos.left} + ${offsetX}px)` : undefined,
                        right: winnerPos.right ? `calc(${winnerPos.right} - ${offsetX}px)` : undefined,
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
                          ? 'drop-shadow(0 0 20px rgba(251, 191, 36, 1)) drop-shadow(0 0 40px rgba(251, 191, 36, 0.6)) brightness(1.3)' 
                          : showTrickComplete 
                          ? 'brightness(0.8)' 
                          : 'none',
                        transform: showTrickComplete 
                          ? (isWinner ? 'scale(1.15)' : 'scale(0.95)') 
                          : (pos.transform || ''),
                        zIndex: isWinner ? 10 : 1
                      }}
                    >
                      <Card 
                        suit={play.card.suit} 
                        rank={play.card.rank} 
                        faceUp 
                        width={70} 
                        height={105} 
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* DEALER REVEAL OVERLAY */}
        {phase === "DEALER_REVEAL" && (() => {
          const targetNumber = (window as any).dealerRevealData?.targetNumber;
          const guesses = (window as any).dealerRevealData?.guesses || {};
          const dealerHandId = (window as any).dealerRevealData?.dealerHandId;
          
          return (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-white p-10 rounded-3xl shadow-2xl max-w-5xl max-h-[85vh] overflow-y-auto border-4 border-white/20" style={{ backgroundColor: 'rgba(17, 24, 39, 0.97)', fontSize: '1.1rem' }}>
                <div className="space-y-6">
                  <h2 className="text-4xl font-bold text-center" style={{ color: '#ffffff' }}>Dealer Selected!</h2>
                  
                  <div className="text-center">
                    <div className="text-2xl mb-4" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Target Number:
                    </div>
                    <div className="text-6xl font-bold mb-6" style={{ color: '#fbbf24' }}>
                      {targetNumber}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {handAssignments.map((hand: any) => {
                      const handId = `${hand.playerId}_hand_${hand.handIndex}`;
                      const guess = guesses[handId];
                      const isDealer = handId === dealerHandId;
                      const diff = Math.abs(guess - targetNumber);
                      
                      // Find Faye's team
                      const fayeHand = handAssignments.find((h: any) => h.playerName?.toLowerCase() === 'faye');
                      const fayeTeam = fayeHand?.team;
                      const nameColor = hand.team === fayeTeam ? '#c4b5fd' : '#60a5fa';

                      return (
                        <div
                          key={handId}
                          className={`p-4 rounded-lg border-2 ${
                            isDealer
                              ? "border-green-400 bg-green-900/30"
                              : "border-white/30 bg-white/10"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="font-bold text-lg" style={{ color: nameColor }}>
                              {hand.playerName?.toLowerCase() === 'faye' && '💜 '}
                              {hand.playerName}
                              {isDealer && <span className="ml-2 text-green-400">👑 DEALER</span>}
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>
                                {guess}
                              </div>
                              <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                {diff === 0 ? 'Perfect!' : `Off by ${diff}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* DEALER SELECTION OVERLAY */}
        {phase === "DEALER_SELECTION" && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-white p-10 rounded-3xl shadow-2xl max-w-5xl max-h-[85vh] overflow-y-auto border-4 border-white/20" style={{ backgroundColor: 'rgba(17, 24, 39, 0.97)', fontSize: '1.1rem' }}>
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-center" style={{ color: '#ffffff' }}>Dealer Selection</h2>
                <p className="text-center text-lg" style={{ color: '#ffffff' }}>
                  Each hand must guess a number 1–100. Closest becomes the dealer.
                </p>

                <div className="space-y-4">
                  {handAssignments.map((hand: any) => {
                    const handId = `${hand.playerId}_hand_${hand.handIndex}`;
                    const isMine = hand.playerId === currentUserId;
                    const done = dealerGuesses[handId] !== undefined;
                    
                    // Find Faye's team
                    const fayeHand = handAssignments.find((h: any) => h.playerName?.toLowerCase() === 'faye');
                    const fayeTeam = fayeHand?.team;
                    const isFayeTeam = hand.team === fayeTeam;
                    
                    // Color: purple for Faye's team, blue for opposing team
                    const nameColor = isFayeTeam ? '#c4b5fd' : '#60a5fa';

                    return (
                      <div
                        key={handId}
                        className={`p-4 rounded-lg border-2 ${
                          isMine
                            ? "border-yellow-400 bg-yellow-900/30"
                            : "border-white/30 bg-white/10"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-bold" style={{ color: nameColor }}>
                              {hand.playerName?.toLowerCase() === 'faye' && '💜 '}
                              {hand.playerName} — Hand {parseInt(hand.handIndex) + 1}
                              {isMine && <span className="text-yellow-300 ml-2">(You)</span>}
                            </div>
                            <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Team: {hand.team}</div>
                          </div>

                          {done ? (
                            <span className="font-bold" style={{ color: '#4ade80' }}>✓ Guessed</span>
                          ) : isMine ? (
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={guessInput[handId] || ""}
                                onChange={(e) =>
                                  setGuessInput?.({
                                    ...guessInput,
                                    [handId]: e.target.value,
                                  })
                                }
                                className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                placeholder="1–100"
                              />
                              <button
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-bold disabled:bg-gray-600"
                                disabled={
                                  !guessInput[handId] ||
                                  parseInt(guessInput[handId]) < 1 ||
                                  parseInt(guessInput[handId]) > 100
                                }
                                onClick={() => handleGuessSubmit?.(handId)}
                              >
                                Submit
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Waiting…</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  {Object.keys(dealerGuesses).length} / {handAssignments.length} hands guessed
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BIDDING PHASE OVERLAY */}
        {phase === "BIDDING" && (() => {
          const currentBidder = handAssignments[currentBidderIndex];
          const currentHandId = `${currentBidder?.playerId}_hand_${currentBidder?.handIndex}`;
          const isMyTurn = currentBidder?.playerId === currentUserId;
          const isDealer = currentBidderIndex === dealerIndex;
          // Dealer can match highest bid (but minimum is 1), others must beat it
          const minBid = highestBid === 0 ? 1 : (isDealer ? highestBid : highestBid + 1);
          const bidValue = parseInt(bidInput);
          const canBid = bidValue >= minBid && bidValue <= 7;
          
          console.log("🎯 Bidding state:", {
            currentBidderIndex,
            dealerIndex,
            isDealer,
            highestBid,
            minBid,
            bidInput,
            bidValue,
            canBid
          });
          
          // Find Faye's team for color coding
          const fayeHand = handAssignments.find((h: any) => h.playerName?.toLowerCase() === 'faye');
          const fayeTeam = fayeHand?.team;
          
          // Check if everyone else has passed (can't pass if you're the last one)
          const passCount = bids.filter((b: any) => b.amount === "pass").length;
          const canPass = !(passCount === 3 && highestBid === 0);

          return (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-white p-10 rounded-3xl shadow-2xl max-w-3xl max-h-[85vh] overflow-y-auto border-4 border-white/20" style={{ backgroundColor: 'rgba(17, 24, 39, 0.97)', fontSize: '1.1rem' }}>
                <div className="space-y-6">
                  <h2 className="text-4xl font-bold text-center" style={{ color: '#ffffff' }}>Bidding Phase</h2>
                  
                  {/* Current Bidder */}
                  <div className="text-center">
                    <div className="text-xl" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Current Bidder:</div>
                    <div className="text-3xl font-bold" style={{ color: currentBidder?.team === fayeTeam ? '#c4b5fd' : '#60a5fa' }}>
                      {currentBidder?.playerName?.toLowerCase() === 'faye' && '💜 '}
                      {currentBidder?.playerName} - Hand {parseInt(currentBidder?.handIndex) + 1}
                      {isDealer && <span className="ml-2 text-yellow-300">👑 Dealer</span>}
                      {isMyTurn && <span className="ml-2">(Your Turn!)</span>}
                    </div>
                    <div className="mt-1" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      Highest Bid: {highestBid === 0 ? "None" : highestBid}
                    </div>
                  </div>

                  {/* Bid Input (only show if it's my turn) */}
                  {isMyTurn && (
                    <div className="bg-yellow-900/20 border-2 border-yellow-400 rounded-lg p-6">
                      <div className="text-center mb-4">
                        <div className="text-lg font-bold" style={{ color: '#ffffff' }}>Your Turn to Bid</div>
                        <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                          Minimum bid: {minBid} (Range: 1-7)
                          {isDealer && <span className="block text-yellow-300 mt-1">👑 As dealer, you can match the highest bid</span>}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-3 items-center">
                        <div className="flex gap-3">
                          <input
                            type="number"
                            min={minBid}
                            max="7"
                            value={bidInput}
                            onChange={(e) => setBidInput(e.target.value)}
                            className={`w-32 px-4 py-3 rounded text-white text-center text-xl ${
                              bidInput && !canBid 
                                ? 'bg-red-900 border-2 border-red-500' 
                                : 'bg-gray-700 border border-gray-600'
                            }`}
                            placeholder={`${minBid}-7`}
                          />
                          <button
                            onClick={() => handleBid?.(currentHandId, bidValue)}
                            disabled={!canBid}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-bold text-lg"
                          >
                            Bid
                          </button>
                          <button
                            onClick={() => handleBid?.(currentHandId, "pass")}
                            disabled={!canPass}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-bold text-lg"
                          >
                            Pass
                          </button>
                        </div>
                        {bidInput && !canBid && (
                          <div className="text-red-400 text-sm font-semibold">
                            {bidValue < minBid 
                              ? `Bid must be at least ${minBid}` 
                              : bidValue > 7 
                              ? 'Bid cannot exceed 7' 
                              : 'Invalid bid'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bid History */}
                  <div>
                    <h3 className="text-xl font-bold mb-3" style={{ color: '#ffffff' }}>Bid History</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {bids.length === 0 ? (
                        <div className="text-center py-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>No bids yet</div>
                      ) : (
                        bids.map((bid: any, idx: number) => {
                          const hand = handAssignments[bid.handIndex];
                          const handColor = hand?.team === fayeTeam ? '#c4b5fd' : '#60a5fa';
                          return (
                            <div
                              key={idx}
                              className="p-3 bg-white/10 rounded border border-white/30"
                            >
                              <span className="font-bold" style={{ color: handColor }}>
                                {hand?.playerName?.toLowerCase() === 'faye' && '💜 '}
                                {hand?.playerName} - Hand {parseInt(hand?.handIndex) + 1}:
                              </span>
                              <span className="ml-2" style={{ color: bid.amount === "pass" ? "#f87171" : "#4ade80" }}>
                                {bid.amount === "pass" ? "Passed" : `Bid ${bid.amount}`}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TRUMP SELECTION OVERLAY */}
        {phase === "TRUMP_SELECTION" && (() => {
          const bidWinner = handAssignments.find((h: any, idx: number) => {
            const handId = `${h.playerId}_hand_${h.handIndex}`;
            // Check if this is the bid winner based on currentBidderIndex or stored state
            return idx === currentBidderIndex;
          });
          const isMyTurn = bidWinner?.playerId === currentUserId;

          const trumpOptions = [
            { value: "hearts", suit: "hearts" as const, rank: "K" },
            { value: "diamonds", suit: "diamonds" as const, rank: "K" },
            { value: "clubs", suit: "clubs" as const, rank: "K" },
            { value: "spades", suit: "spades" as const, rank: "K" },
            { value: "no-trump", suit: "hearts" as const, rank: "NO_TRUMP" },
          ];

          return (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-white p-10 rounded-3xl shadow-2xl max-w-5xl max-h-[80vh] overflow-y-auto border-4 border-white/20" style={{ backgroundColor: 'rgba(17, 24, 39, 0.97)', fontSize: '1.15rem' }}>
                <div className="space-y-7">
                  <h2 className="text-5xl font-bold text-center" style={{ color: '#ffffff' }}>Trump Selection</h2>
                  
                  {/* Bid Winner Info */}
                  <div className="text-center">
                    <div className="text-2xl" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Bid Winner:</div>
                    <div className="text-4xl font-bold mt-2" style={{ color: '#fbbf24' }}>
                      {bidWinner?.playerName} - Hand {parseInt(bidWinner?.handIndex || "0") + 1}
                      {isMyTurn && <span className="ml-2">(Your Turn!)</span>}
                    </div>
                    <div className="mt-2 text-xl" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      Winning Bid: {highestBid}
                    </div>
                  </div>

                  {/* Trump Selection (only show if it's my turn) */}
                  {isMyTurn ? (
                    <div className="bg-yellow-900/20 border-2 border-yellow-400 rounded-lg p-7">
                      <div className="text-center mb-5">
                        <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>Select Trump Suit</div>
                        <div className="text-lg mt-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                          Click a card to choose trump
                        </div>
                      </div>
                      
                      <div className="flex justify-center gap-5 flex-wrap">
                        {trumpOptions.map((option) => (
                          <div
                            key={option.value}
                            className="relative cursor-pointer transform transition-transform hover:scale-110 hover:-translate-y-2"
                            onClick={() => handleTrumpSelection?.(option.value)}
                          >
                            <Card 
                              suit={option.suit} 
                              rank={option.rank} 
                              faceUp={true} 
                              width={120} 
                              height={180}
                            />
                            <div className="text-center mt-3 text-base font-bold" style={{ color: '#ffffff' }}>
                              {option.value === "no-trump" ? "No Trump" : option.value.charAt(0).toUpperCase() + option.value.slice(1)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-3xl font-semibold mb-3" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                        Waiting for trump selection...
                      </div>
                      <div className="text-xl" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {bidWinner?.playerName} is choosing the trump suit
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

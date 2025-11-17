import React from "react";
import Card from "./Card";
import Table from "./Table";
import DealerReveal from "./DealerReveal";
import DealerSelectionOverlay from "./DealerSelectionOverlay";
import BiddingPhaseOverlay from "./BiddingPhaseOverlay";
import TrumpSelectionOverlay from "./TrumpSelectionOverlay";
import PlayingPhaseOverlay from "./PlayingPhaseOverlay";
import HandCompleteOverlay from "./HandCompleteOverlay";

interface GameBoardProps {
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
  handCompleteData?: any;
  readyPlayers?: string[];
  totalPoints?: Record<string, number>;
  onHandCompleteReady?: () => void;
}

export default function GameBoard({
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
  handCompleteData = null,
  readyPlayers = [],
  totalPoints = { Us: 0, Them: 0 },
  onHandCompleteReady,
}: GameBoardProps) {
  const showCards = phase === "BIDDING" || phase === "PLAYING" || phase === "TRUMP_SELECTION" || phase === "HAND_COMPLETE";
  const [bidInput, setBidInput] = React.useState<string>("");
  const [sortedCards, setSortedCards] = React.useState<Record<string, any[]>>({});
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [delayedActiveHandIndex, setDelayedActiveHandIndex] = React.useState<number>(0);
  const handSwitchTimeoutRef = React.useRef<number | null>(null);

  /** Find user’s hands */
  const myHandAssignments = handAssignments.filter(
    (h: any) => h.playerId === currentUserId
  );

  // Determine which hand should be shown at the bottom (active hand)
  // During bidding/playing, show the current active hand if it belongs to the user
  let targetActiveHandIndex = 0; // Default to first hand
  if ((phase === "BIDDING" || phase === "TRUMP_SELECTION") && handAssignments.length > 0) {
    const currentHand = handAssignments[currentBidderIndex];
    if (currentHand && currentHand.playerId === currentUserId) {
      // Find which of my hands is currently active
      targetActiveHandIndex = myHandAssignments.findIndex(
        (h: any) => h.handIndex === currentHand.handIndex
      );
      if (targetActiveHandIndex === -1) targetActiveHandIndex = 0;
    }
  } else if (phase === "PLAYING" && handAssignments.length > 0) {
    const currentHand = handAssignments[currentPlayerIndex];
    console.log("🎮 PLAYING phase - currentPlayerIndex:", currentPlayerIndex, "currentHand:", currentHand);
    if (currentHand && currentHand.playerId === currentUserId) {
      // Find which of my hands is currently active based on the global currentPlayerIndex
      // handIndex is a string, so convert for comparison
      targetActiveHandIndex = myHandAssignments.findIndex(
        (h: any) => h.playerId === currentHand.playerId && String(h.handIndex) === String(currentHand.handIndex)
      );
      console.log("   Found targetActiveHandIndex:", targetActiveHandIndex, "in myHandAssignments:", myHandAssignments);
      if (targetActiveHandIndex === -1) {
        console.log("   ⚠️ Could not find matching hand, defaulting to 0");
        targetActiveHandIndex = 0;
      }
    } else {
      // Not my turn - look ahead to find the next hand that belongs to me
      let foundNextHand = false;
      for (let i = 1; i <= 4; i++) {
        const nextPlayerIndex = (currentPlayerIndex + i) % 4;
        const nextHand = handAssignments[nextPlayerIndex];
        if (nextHand && nextHand.playerId === currentUserId) {
          // Found my next hand!
          const nextHandIndex = myHandAssignments.findIndex(
            (h: any) => String(h.handIndex) === String(nextHand.handIndex)
          );
          if (nextHandIndex !== -1) {
            targetActiveHandIndex = nextHandIndex;
            foundNextHand = true;
            console.log("   Not my turn, but found next hand at index:", targetActiveHandIndex, "in", i, "turns");
            break;
          }
        }
      }
      if (!foundNextHand) {
        // Keep current view if we can't find a next hand
        targetActiveHandIndex = delayedActiveHandIndex;
        console.log("   Not my turn, keeping current view at index:", targetActiveHandIndex);
      }
    }
  }

  // Apply delayed hand switching with smooth transition
  React.useEffect(() => {
    if (targetActiveHandIndex !== delayedActiveHandIndex) {
      // Clear any existing timeout
      if (handSwitchTimeoutRef.current) {
        clearTimeout(handSwitchTimeoutRef.current);
      }

      // Determine if we should delay the switch
      const currentHand = handAssignments[currentPlayerIndex];
      const isMyTurn = currentHand && currentHand.playerId === currentUserId;
      
      // Apply delay when:
      // 1. It's currently my turn and I have multiple hands (switching after playing)
      // 2. It's not my turn but the target hand is mine (switching to next hand I'll play)
      const shouldDelay = phase === "PLAYING" && myHandAssignments.length > 1 && (
        isMyTurn || 
        myHandAssignments.some((h: any) => {
          const targetHand = myHandAssignments[targetActiveHandIndex];
          return targetHand && String(h.handIndex) === String(targetHand.handIndex);
        })
      );
      
      if (shouldDelay) {
        console.log("⏱️ Scheduling hand switch from", delayedActiveHandIndex, "to", targetActiveHandIndex, "in 2.5s");
        handSwitchTimeoutRef.current = setTimeout(() => {
          console.log("✅ Switching to hand index:", targetActiveHandIndex);
          setDelayedActiveHandIndex(targetActiveHandIndex);
        }, 2500); // 2.5 second delay
      } else {
        // Immediate switch for bidding/trump selection or first load
        console.log("⚡ Immediate switch to hand index:", targetActiveHandIndex);
        setDelayedActiveHandIndex(targetActiveHandIndex);
      }
    }

    return () => {
      if (handSwitchTimeoutRef.current) {
        clearTimeout(handSwitchTimeoutRef.current);
      }
    };
  }, [targetActiveHandIndex, delayedActiveHandIndex, currentPlayerIndex, handAssignments, currentUserId, myHandAssignments.length, phase]);

  const activeHandIndex = delayedActiveHandIndex;

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
      // Check if next player is also mine and switch proactively
      scheduleHandSwitchAfterPlay();
      // Don't remove locally - wait for server to send updated playerHands
    }
  };

  // Drag and drop handlers
  const [draggedCard, setDraggedCard] = React.useState<any>(null);

  const handleDragStart = (e: React.DragEvent, index: number, card: any) => {
    console.log("🎴 Drag start:", card);
    setDraggedIndex(index);
    setDraggedCard(card);
    // Set drag data for better browser compatibility
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(card));
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

  // Helper to schedule hand switch after playing a card
  const scheduleHandSwitchAfterPlay = () => {
    if (myHandAssignments.length <= 1) return; // Only one hand, no need to switch
    
    // Check if the next player in turn order is also controlled by me
    const nextPlayerIndex = (currentPlayerIndex + 1) % 4;
    const nextHand = handAssignments[nextPlayerIndex];
    
    if (nextHand && nextHand.playerId === currentUserId) {
      // Next hand is mine! Schedule a switch
      const nextHandIndex = myHandAssignments.findIndex(
        (h: any) => String(h.handIndex) === String(nextHand.handIndex)
      );
      
      if (nextHandIndex !== -1 && nextHandIndex !== delayedActiveHandIndex) {
        console.log("⏱️ Next player is also mine, scheduling switch to hand index:", nextHandIndex);
        
        // Clear any existing timeout
        if (handSwitchTimeoutRef.current) {
          clearTimeout(handSwitchTimeoutRef.current);
        }
        
        // Schedule the switch with a delay
        handSwitchTimeoutRef.current = setTimeout(() => {
          console.log("✅ Switching to next hand:", nextHandIndex);
          setDelayedActiveHandIndex(nextHandIndex);
        }, 2500);
      }
    }
  };

  // Handle drop on center to play card
  const handleDropOnCenter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("🎯 Drop on center!", {
      phase,
      isMyTurnToPlay,
      draggedCard,
      activeHandId
    });
    if (phase === "PLAYING" && isMyTurnToPlay && draggedCard && handleCardPlay && activeHandId) {
      console.log("✅ Playing card via drop");
      handleCardPlay(activeHandId, draggedCard);
      // Check if next player is also mine and switch proactively
      scheduleHandSwitchAfterPlay();
      // Don't remove locally - wait for server to send updated playerHands
    } else {
      console.log("❌ Cannot play card:", {
        phase,
        isMyTurnToPlay,
        hasDraggedCard: !!draggedCard,
        hasHandleCardPlay: !!handleCardPlay,
        activeHandId
      });
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
      <Table
        phase={phase}
        handAssignments={handAssignments}
        playerHands={playerHands}
        currentUserId={currentUserId}
        currentPlayerIndex={currentPlayerIndex || 0}
        activeHand={activeHand}
        displayCards={displayCards}
        draggedIndex={draggedIndex}
        isMyTurnToPlay={isMyTurnToPlay}
        handleDragStart={handleDragStart}
        handleDragOver={handleDragOver}
        handleDragEnd={handleDragEnd}
        handleDrop={handleDrop}
        handleCardDoubleClick={handleCardDoubleClick}
        getPlayerName={getPlayerName}
        trumpSuit={trumpSuit}
        trickNumber={trickNumber}
        tricksWon={tricksWon}
        bidWinnerHandId={bidWinnerHandId}
        winningBid={winningBid}
        lastTrick={lastTrick}
        lastTrickWinner={lastTrickWinner}
        currentTrick={currentTrick}
        trickWinnerHandId={trickWinnerHandId}
        showTrickComplete={showTrickComplete}
        handleDropOnCenter={handleDropOnCenter}
      />

      {/* DEALER REVEAL OVERLAY */}
      {phase === "DEALER_REVEAL" && (() => {
        const targetNumber = (window as any).dealerRevealData?.targetNumber;
        const guesses = (window as any).dealerRevealData?.guesses || {};
        const dealerHandId = (window as any).dealerRevealData?.dealerHandId;
        
        return (
          <DealerReveal
            targetNumber={targetNumber}
            guesses={guesses}
            dealerHandId={dealerHandId}
            handAssignments={handAssignments}
            currentUserId={currentUserId}
          />
        );
      })()}

      {/* DEALER SELECTION OVERLAY */}
      {phase === "DEALER_SELECTION" && (
        <DealerSelectionOverlay
          handAssignments={handAssignments}
          dealerGuesses={dealerGuesses}
          guessInput={guessInput}
          setGuessInput={setGuessInput}
          handleGuessSubmit={handleGuessSubmit}
          currentUserId={currentUserId}
        />
      )}

      {/* BIDDING PHASE OVERLAY */}
      {phase === "BIDDING" && (
        <BiddingPhaseOverlay
          handAssignments={handAssignments}
          currentBidderIndex={currentBidderIndex || 0}
          bids={bids || []}
          highestBid={highestBid || 0}
          dealerIndex={dealerIndex || 0}
          currentUserId={currentUserId}
          handleBid={handleBid}
        />
      )}

      {/* TRUMP SELECTION OVERLAY */}
      {phase === "TRUMP_SELECTION" && (
        <TrumpSelectionOverlay
          bidWinnerHandId={bidWinnerHandId || ""}
          currentBidderIndex={currentBidderIndex || 0}
          handAssignments={handAssignments}
          currentUserId={currentUserId}
          handleTrumpSelection={handleTrumpSelection}
        />
      )}

      {/* HAND COMPLETE / GAME COMPLETE OVERLAY */}
      {(phase === "HAND_COMPLETE" || phase === "GAME_COMPLETE") && handCompleteData && (
        <HandCompleteOverlay
          phase={phase}
          handCompleteData={handCompleteData}
          handAssignments={handAssignments}
          currentUserId={currentUserId}
          readyPlayers={readyPlayers || []}
          totalPoints={totalPoints || { Us: 0, Them: 0 }}
          onHandCompleteReady={onHandCompleteReady}
        />
      )}
    </div>
  );
}

import React from "react";
import Table from "./Table";
import DealerReveal from "./DealerReveal";
import DealerSelectionOverlay from "./DealerSelectionOverlay";
import BiddingPhaseOverlay from "./BiddingPhaseOverlay";
import TrumpSelectionOverlay from "./TrumpSelectionOverlay";
import HandCompleteOverlay from "./HandCompleteOverlay";
import type {
  CoreGameState,
  DealerPhaseState,
  BiddingPhaseState,
  TrumpPhaseState,
  PlayingPhaseState,
  CompletePhaseState,
} from "../types/gamePhases";

// Combined props interface
interface GameBoardProps
  extends CoreGameState,
    DealerPhaseState,
    BiddingPhaseState,
    TrumpPhaseState,
    PlayingPhaseState,
    CompletePhaseState {}

export default function GameBoard(props: GameBoardProps) {
  // Destructure only frequently accessed props to avoid repetitive props.x
  const { handAssignments, playerHands, currentUserId, phase } = props;
  
  const showCards = phase === "BIDDING" || phase === "PLAYING" || phase === "TRUMP_SELECTION" || phase === "HAND_COMPLETE";
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
    const currentHand = handAssignments[props.currentBidderIndex ?? 0];
    if (currentHand && currentHand.playerId === currentUserId) {
      // Find which of my hands is currently active
      targetActiveHandIndex = myHandAssignments.findIndex(
        (h: any) => h.handIndex === currentHand.handIndex
      );
      if (targetActiveHandIndex === -1) targetActiveHandIndex = 0;
    }
  } else if (phase === "PLAYING" && handAssignments.length > 0) {
    const currentHand = handAssignments[props.currentPlayerIndex ?? 0];
    console.log("🎮 PLAYING phase - currentPlayerIndex:", props.currentPlayerIndex, "currentHand:", currentHand);
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
        const nextPlayerIndex = ((props.currentPlayerIndex ?? 0) + i) % 4;
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
      const currentHand = handAssignments[props.currentPlayerIndex ?? 0];
      const isMyTurn = currentHand && currentHand.playerId === currentUserId;
      
      // Apply 2.5s delay when in PLAYING phase and switching between my hands
      const shouldDelay = phase === "PLAYING" && myHandAssignments.length > 1;
      
      if (shouldDelay) {
        console.log("⏱️ Scheduling hand switch from", delayedActiveHandIndex, "to", targetActiveHandIndex, "in 1.5s");
        handSwitchTimeoutRef.current = setTimeout(() => {
          console.log("✅ Switching to hand index:", targetActiveHandIndex);
          setDelayedActiveHandIndex(targetActiveHandIndex);
        }, 1500); // 1.5 second delay
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
  }, [targetActiveHandIndex, delayedActiveHandIndex, props.currentPlayerIndex, handAssignments, currentUserId, myHandAssignments.length, phase]);

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
    handAssignments[props.currentPlayerIndex ?? 0]?.playerId === currentUserId;

  // Handle double-click to play card during playing phase
  const handleCardDoubleClick = (card: any) => {
    if (phase === "PLAYING" && isMyTurnToPlay && props.handleCardPlay && activeHandId) {
      console.log("🎴 Playing card:", {
        activeHandId,
        activeHand,
        currentPlayerIndex: props.currentPlayerIndex,
        handAssignments,
        card
      });
      props.handleCardPlay(activeHandId, card);
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
    const nextPlayerIndex = ((props.currentPlayerIndex ?? 0) + 1) % 4;
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
        }, 1500);
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
    if (phase === "PLAYING" && isMyTurnToPlay && draggedCard && props.handleCardPlay && activeHandId) {
      console.log("✅ Playing card via drop");
      props.handleCardPlay(activeHandId, draggedCard);
      // Check if next player is also mine and switch proactively
      scheduleHandSwitchAfterPlay();
      // Don't remove locally - wait for server to send updated playerHands
    } else {
      console.log("❌ Cannot play card:", {
        phase,
        isMyTurnToPlay,
        hasDraggedCard: !!draggedCard,
        hasHandleCardPlay: !!props.handleCardPlay,
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
        currentPlayerIndex={props.currentPlayerIndex ?? 0}
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
        trumpSuit={props.trumpSuit}
        trickNumber={props.trickNumber}
        tricksWon={props.tricksWon}
        bidWinnerHandId={props.bidWinnerHandId}
        winningBid={props.winningBid}
        lastTrick={props.lastTrick}
        lastTrickWinner={props.lastTrickWinner}
        currentTrick={props.currentTrick}
        trickWinnerHandId={props.trickWinnerHandId}
        showTrickComplete={props.showTrickComplete}
        handleDropOnCenter={handleDropOnCenter}
        teamScores={props.teamScores}
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
          currentUserId={currentUserId}
          dealerGuesses={props.dealerGuesses}
          guessInput={props.guessInput}
          setGuessInput={props.setGuessInput}
          handleGuessSubmit={props.handleGuessSubmit}
        />
      )}

      {/* BIDDING PHASE OVERLAY */}
      {phase === "BIDDING" && (
        <BiddingPhaseOverlay
          handAssignments={handAssignments}
          currentUserId={currentUserId}
          currentBidderIndex={props.currentBidderIndex ?? 0}
          bids={props.bids ?? []}
          highestBid={props.highestBid ?? 0}
          dealerIndex={props.dealerIndex ?? 0}
          handleBid={props.handleBid}
        />
      )}

      {/* TRUMP SELECTION OVERLAY */}
      {phase === "TRUMP_SELECTION" && (
        <TrumpSelectionOverlay
          handAssignments={handAssignments}
          currentUserId={currentUserId}
          bidWinnerHandId={props.bidWinnerHandId ?? ""}
          currentBidderIndex={props.currentBidderIndex ?? 0}
          handleTrumpSelection={props.handleTrumpSelection}
          trumpSuit={props.trumpSuit}
        />
      )}

      {/* HAND COMPLETE / GAME COMPLETE OVERLAY */}
      {(phase === "HAND_COMPLETE" || phase === "GAME_COMPLETE") && props.handCompleteData && (
        <HandCompleteOverlay
          phase={phase}
          handAssignments={handAssignments}
          currentUserId={currentUserId}
          handCompleteData={props.handCompleteData}
          readyPlayers={props.readyPlayers ?? []}
          totalPoints={props.totalPoints ?? { Us: 0, Them: 0 }}
          onHandCompleteReady={props.onHandCompleteReady}
        />
      )}
    </div>
  );
}

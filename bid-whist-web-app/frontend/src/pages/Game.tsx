import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useWebSocket from "../hooks/useWebSocket";
import BiddingPhaseOverlay from "../components/BiddingPhaseOverlay";
import GameBoard from "../components/GameBoard";
import DealingAnimation from "../components/DealingAnimation";

// ... (imports remain the same)

// ... (inside Game component)

// Render phase-specific overlay
import { playMeowSound, playGetAttentionSound, playOverTrumpSound } from "../utils/soundEffects";
import { getWebSocketUrl } from "../config";

const Game = () => {
  const { roomCode: rawRoomCode } = useParams<{ roomCode: string }>();
  const roomCode = (rawRoomCode || "").toUpperCase();

  const [phase, setPhase] = useState("BIDDING");
  const [players, setPlayers] = useState<any[]>([]);
  const [handAssignments, setHandAssignments] = useState<any[]>([]);
  const [dealerGuesses, setDealerGuesses] = useState<Record<string, number>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [guessInput, setGuessInput] = useState<Record<string, string>>({});
  const [playerHands, setPlayerHands] = useState<Record<string, any[]>>({});
  const [currentBidderIndex, setCurrentBidderIndex] = useState<number>(0);
  const [bids, setBids] = useState<any[]>([]);
  const [highestBid, setHighestBid] = useState<number>(0);
  const [dealerIndex, setDealerIndex] = useState<number>(0);
  const [bidWinnerHandId, setBidWinnerHandId] = useState<string>("");
  const [bidWinnerIndex, setBidWinnerIndex] = useState<number>(0);
  const [winningBid, setWinningBid] = useState<number>(0);
  const [trumpSuit, setTrumpSuit] = useState<string>("");
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [currentTrick, setCurrentTrick] = useState<any[]>([]);
  const [tricksWon, setTricksWon] = useState<Record<string, number>>({ Us: 0, Them: 0 });
  const [trickNumber, setTrickNumber] = useState<number>(1);
  const [trickWinnerHandId, setTrickWinnerHandId] = useState<string | null>(null);
  const [showTrickComplete, setShowTrickComplete] = useState(false);
  const [lastTrick, setLastTrick] = useState<any[]>([]);
  const [lastTrickWinner, setLastTrickWinner] = useState<string | null>(null);
  const [handCompleteData, setHandCompleteData] = useState<any>(null);
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);
  const [totalPoints, setTotalPoints] = useState<Record<string, number>>({ Us: 0, Them: 0 });
  const [teamScores, setTeamScores] = useState<Record<string, number>>({ Us: 0, Them: 0 });
  const [portraitWarningDismissed, setPortraitWarningDismissed] = useState(false);

  // Derived state
  const myPlayerIndex = players.findIndex(p => p.id === currentUserId);
  const isReady = players[myPlayerIndex]?.isReady || false;

  const joinedRef = useRef(false);
  const currentTrickRef = useRef<any[]>([]);

  const { sendMessage, messages, isConnected } = useWebSocket(
    getWebSocketUrl(roomCode)
  );

  /* Load current user */
  useEffect(() => {
    const stored = sessionStorage.getItem(`room_${roomCode}_user`);
    if (stored) setCurrentUserId(JSON.parse(stored).id);
  }, [roomCode]);

  /* Send PLAYER_JOINED when connected to get game  /* Join Room on Connect */
  useEffect(() => {
    if (!isConnected) {
      // Reset joined state so we re-join when connection is restored
      joinedRef.current = false;
      return;
    }

    if (currentUserId && !joinedRef.current) {
      const stored = sessionStorage.getItem(`room_${roomCode}_user`);
      const playerData = sessionStorage.getItem(`room_${roomCode}_player`);
      const user = stored ? JSON.parse(stored) : {};

      let playerInfo: any = {
        id: currentUserId,
        name: user.name || "Unknown",
        isReady: true,
        handCount: 1,
        handTeams: { 0: "Us" },
        handNames: { 0: user.name || "Unknown" }
      };

      // Try to get the full player data if available
      if (playerData) {
        const fullPlayer = JSON.parse(playerData);
        playerInfo = {
          ...playerInfo,
          handCount: fullPlayer.handCount || 1,
          handTeams: fullPlayer.handTeams || { 0: "Us" },
          handNames: fullPlayer.handNames || { 0: user.name }
        };
      }

      sendMessage(JSON.stringify({
        type: "PLAYER_JOINED",
        player: playerInfo
      }));
      console.log("Game page: Sent PLAYER_JOINED to get game state");
      joinedRef.current = true;
    }
  }, [isConnected, currentUserId, roomCode, sendMessage]);

  // Inactivity Timer Logic
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const isMyTurn =
      (phase === "BIDDING" && currentBidderIndex === myPlayerIndex) ||
      (phase === "PLAYING" && currentPlayerIndex === myPlayerIndex) ||
      (phase === "HAND_COMPLETE" && !isReady);

    if (isMyTurn) {
      console.log("⏳ Starting 20s inactivity timer...");
      timer = setTimeout(() => {
        console.log("⏰ Inactivity timeout! Playing attention sound.");
        playGetAttentionSound();
      }, 20000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
        // console.log("⏳ Timer cleared");
      }
    };
  }, [phase, currentBidderIndex, currentPlayerIndex, myPlayerIndex, isReady]);

  /* Auto-dismiss portrait warning if landscape is detected */
  useEffect(() => {
    const checkOrientation = () => {
      // If we detect landscape via JS, auto-dismiss the warning
      if (window.innerWidth > window.innerHeight) {
        setPortraitWarningDismissed(true);
      }
    };

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    // Check immediately
    checkOrientation();

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  /* WS Message Handler */
  /* WS Message Handler */
  // Track how many messages we've processed to avoid skipping any if they arrive in batches
  const processedMessageCount = useRef(0);

  useEffect(() => {
    if (messages.length <= processedMessageCount.current) return;

    // Process all new messages
    const newMessages = messages.slice(processedMessageCount.current);
    processedMessageCount.current = messages.length;

    newMessages.forEach(msgJson => {
      try {
        const data = JSON.parse(msgJson);
        console.log("🎮 Game page received:", data.type, data);

        if (data.phase) setPhase(data.phase);
        if (data.players) setPlayers(data.players);
        if (data.handAssignments) {
          console.log("📋 Received handAssignments:", data.handAssignments);
          setHandAssignments(data.handAssignments);
        }
        if (data.playerHands) {
          console.log("📇 Updating playerHands:", data.playerHands);
          setPlayerHands(data.playerHands);
        }
        if (data.currentBidderIndex !== undefined) setCurrentBidderIndex(data.currentBidderIndex);
        if (data.bids) setBids(data.bids);
        if (data.highestBid !== undefined) setHighestBid(data.highestBid);
        if (data.dealerIndex !== undefined) setDealerIndex(data.dealerIndex);
        if (data.totalPoints) setTotalPoints(data.totalPoints);
        if (data.teamScores) setTeamScores(data.teamScores);
        if (data.bidWinnerHandId) setBidWinnerHandId(data.bidWinnerHandId);
        if (data.bidWinnerIndex !== undefined) setBidWinnerIndex(data.bidWinnerIndex);
        if (data.winningBid !== undefined) setWinningBid(data.winningBid);
        if (data.trumpSuit) setTrumpSuit(data.trumpSuit);
        if (data.currentPlayerIndex !== undefined) setCurrentPlayerIndex(data.currentPlayerIndex);
        if (data.tricksWon) setTricksWon(data.tricksWon);
        if (data.trickNumber !== undefined) setTrickNumber(data.trickNumber);

        if (data.type === "PLAYING_PHASE" || data.type === "PLAYING") {
          // Handle both new phase start and reconnection
          console.log("📥 PLAYING phase message received");
          console.log("   data.playedCards:", data.playedCards);
          console.log("   playedCards length:", data.playedCards?.length);

          if (data.playedCards && data.playedCards.length > 0) {
            console.log("   ✓ Setting currentTrick with existing cards:", data.playedCards);
            setCurrentTrick(data.playedCards);
            currentTrickRef.current = data.playedCards;
          } else {
            console.log("   ✓ Clearing currentTrick (no cards in play)");
            setCurrentTrick([]);
            currentTrickRef.current = [];
          }
        }

        // Also handle if playedCards comes in any message during PLAYING phase
        if (data.phase === "PLAYING" && data.playedCards && data.playedCards.length > 0) {
          console.log("📥 Received playedCards in PLAYING phase message:", data.playedCards);
          setCurrentTrick(data.playedCards);
          currentTrickRef.current = data.playedCards;
        }

        if (data.type === "CARD_PLAYED") {
          console.log("📥 CARD_PLAYED received:", data);

          // Play sound effects
          if (data.isOverTrump) {
            console.log("🐱⬆️ Over-trump detected! Playing high-pitch meow");
            playOverTrumpSound();
          } else if (data.isTrumpCut) {
            console.log("🐱 Trump cut detected! Playing meow sound");
            playMeowSound();
          }

          if (data.playedCards) {
            console.log("   Setting currentTrick to:", data.playedCards);
            setCurrentTrick(data.playedCards);
            currentTrickRef.current = data.playedCards; // Keep ref in sync

            // After animation, clear the trick and save to last trick
            // We use a timeout to allow the user to see the played card before clearing
            // Only do this if the trick is complete (4 cards)
            const completedTrick = data.playedCards;
            if (completedTrick.length === 4) {
              // Trigger animation immediately
              console.log("✨ Trick complete! Triggering animation for winner:", data.winnerHandId);
              setTrickWinnerHandId(data.winnerHandId);
              setShowTrickComplete(true);

              setTimeout(() => {
                // Only clear if these are still the current cards (simple check)
                if (currentTrickRef.current === completedTrick) {
                  console.log("   Setting lastTrick to:", completedTrick);
                  setLastTrick(completedTrick);
                  setLastTrickWinner(data.winnerHandId);
                  setCurrentTrick([]);
                  currentTrickRef.current = []; // Clear ref too
                  setTrickWinnerHandId(null);
                  setShowTrickComplete(false);
                }
              }, 1500);
            }
          }

          if (data.type === "PLAY_ERROR") {
            alert(data.message || "Invalid play!");
          }
        }

        if (data.type === "HAND_COMPLETE") {
          console.log("📋 HAND_COMPLETE received:", data);
          console.log("   Setting handCompleteData to:", data);
          setHandCompleteData(data);
          setReadyPlayers([]);
        }

        if (data.type === "HAND_COMPLETE_READY_UPDATE") {
          console.log("✓ Ready update:", data);
          setReadyPlayers(data.readyPlayers || []);
        }

        if (data.type === "GAME_COMPLETE") {
          console.log("🏆 GAME_COMPLETE received:", data);
          setHandCompleteData(data);
        }

        if (data.type === "DEALER_GUESS_UPDATE") {
          setDealerGuesses(data.guesses || {});
        }
        if (data.type === "DEALER_REVEAL") {
          setDealerGuesses(data.guesses || {});
          // Store reveal data globally for the reveal component
          (window as any).dealerRevealData = {
            targetNumber: data.targetNumber,
            guesses: data.guesses,
            dealerHandId: data.dealerHandId
          };
        }
      } catch (e) {
        console.error("Error processing message:", e);
      }
    });
  }, [messages]);

  /* Build handAssignments if server doesn't send them */
  useEffect(() => {
    if (handAssignments.length === 0 && players.length > 0) {
      console.log("🔨 Building handAssignments from players:", players);
      const built: any[] = [];
      players.forEach((p) => {
        for (let i = 0; i < p.handCount; i++) {
          const team = p.handTeams?.[i] || "Us";
          built.push({
            playerId: p.id,
            playerName: p.name,
            handIndex: i.toString(),
            team: team,
          });
        }
      });
      console.log("🔨 Built handAssignments:", built);
      setHandAssignments(built);
    }
  }, [players, handAssignments.length]);

  const handleGuessSubmit = (handId: string) => {
    const guess = parseInt(guessInput[handId] || "0");
    if (guess >= 1 && guess <= 100) {
      sendMessage(JSON.stringify({ type: "DEALER_GUESS", handId, guess }));
    }
  };

  const handleBid = (handId: string, bidAmount: number | string) => {
    console.log(`📤 Placing bid: handId=${handId}, amount=${bidAmount}`);
    sendMessage(JSON.stringify({ type: "PLACE_BID", handId, bidAmount }));
  };

  const handleTrumpSelection = (trumpSuit: string) => {
    console.log(`📤 Selecting trump: ${trumpSuit}`);
    sendMessage(JSON.stringify({ type: "SELECT_TRUMP", trumpSuit }));
  };

  const handleCardPlay = (handId: string, card: any) => {
    console.log(`📤 Playing card: handId=${handId}, card=`, card);
    console.log(`   Current trick before play:`, currentTrick);
    sendMessage(JSON.stringify({ type: "PLAY_CARD", handId, card }));
  };

  const handleHandCompleteReady = () => {
    console.log("📤 Sending HAND_COMPLETE_READY");
    sendMessage(JSON.stringify({ type: "HAND_COMPLETE_READY", playerId: currentUserId }));
  };

  // Render phase-specific overlay
  const renderPhaseOverlay = () => {
    if (phase === "DEALING") {
      return (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ pointerEvents: 'none' }}>
          <motion.div
            className="bg-transparent"
            style={{ pointerEvents: 'auto' }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
          >
            <DealingAnimation dealerIndex={dealerIndex} />
          </motion.div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* Portrait Orientation Warning for Mobile */}
      {!portraitWarningDismissed && (
        <div id="portrait-warning" style={{ display: 'none' }}>
          <div className="rotate-icon">📱 ↻</div>
          <h2>Please Rotate Your Device</h2>
          <p>For the best card game experience, please rotate your device to landscape mode.</p>
          <p className="text-sm mt-2 opacity-80">
            Can't rotate? Check if rotation lock is enabled in Control Center.
          </p>
          <button
            onClick={() => setPortraitWarningDismissed(true)}
            className="mt-6 px-8 py-3 bg-amber-500 hover:bg-amber-600 rounded-full text-base font-bold border-2 border-white shadow-lg transition-all transform hover:scale-105"
            style={{ color: '#000' }}
          >
            Continue Anyway
          </button>
        </div>
      )}

      <GameBoard
        handAssignments={handAssignments}
        playerHands={playerHands}
        currentUserId={currentUserId}
        phase={phase}
        dealerGuesses={dealerGuesses}
        guessInput={guessInput}
        setGuessInput={setGuessInput}
        handleGuessSubmit={handleGuessSubmit}
        currentBidderIndex={currentBidderIndex}
        bids={bids}
        highestBid={highestBid}
        dealerIndex={dealerIndex}
        handleBid={handleBid}
        handleTrumpSelection={handleTrumpSelection}
        trumpSuit={trumpSuit}
        currentPlayerIndex={currentPlayerIndex}
        currentTrick={currentTrick}
        tricksWon={tricksWon}
        trickNumber={trickNumber}
        handleCardPlay={handleCardPlay}
        trickWinnerHandId={trickWinnerHandId}
        showTrickComplete={showTrickComplete}
        lastTrick={lastTrick}
        lastTrickWinner={lastTrickWinner}
        bidWinnerHandId={bidWinnerHandId}
        winningBid={winningBid}
        handCompleteData={handCompleteData}
        readyPlayers={readyPlayers}
        totalPoints={totalPoints}
        teamScores={teamScores}
        onHandCompleteReady={handleHandCompleteReady}
      />

      {/* Render phase-specific overlays */}
      {renderPhaseOverlay()}
    </>
  );
};

export default Game;

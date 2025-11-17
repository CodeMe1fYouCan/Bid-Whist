import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useWebSocket from "../hooks/useWebSocket";
import DealerSelection from "../components/DealerSelection";
import BiddingPhase from "../components/BiddingPhase";
import TrumpSelection from "../components/TrumpSelection";
import GameTable from "../components/GameTable";
import HandComplete from "../components/HandComplete";

const Game = () => {
  const { roomCode: rawRoomCode } = useParams<{ roomCode: string }>();
  const roomCode = (rawRoomCode || "").toUpperCase();

  const [phase, setPhase] = useState("DEALER_SELECTION");
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
  
  const joinedRef = useRef(false);
  const currentTrickRef = useRef<any[]>([]);

  const { sendMessage, messages, isConnected } = useWebSocket(
    `ws://localhost:8080/room/${roomCode}`
  );

  /* Load current user */
  useEffect(() => {
    const stored = sessionStorage.getItem(`room_${roomCode}_user`);
    if (stored) setCurrentUserId(JSON.parse(stored).id);
  }, [roomCode]);

  /* Send PLAYER_JOINED when connected to get game state - ONCE */
  useEffect(() => {
    if (!isConnected || !currentUserId || joinedRef.current) return;
    
    const stored = sessionStorage.getItem(`room_${roomCode}_user`);
    if (stored) {
      const user = JSON.parse(stored);
      sendMessage(JSON.stringify({
        type: "PLAYER_JOINED",
        player: {
          id: user.id,
          name: user.name,
          isReady: true,
          handCount: 1,
          team: "Us"
        }
      }));
      console.log("Game page: Sent PLAYER_JOINED to get game state");
      joinedRef.current = true;
    }
  }, [isConnected, currentUserId, roomCode, sendMessage]);

  /* WS Message Handler */
  useEffect(() => {
    if (!messages.length) return;
    const data = JSON.parse(messages[messages.length - 1]);
    console.log("🎮 Game page received:", data.type, data);

    if (data.phase) setPhase(data.phase);
    if (data.players) setPlayers(data.players);
    if (data.handAssignments) setHandAssignments(data.handAssignments);
    if (data.playerHands) {
      console.log("📇 Updating playerHands:", data.playerHands);
      setPlayerHands(data.playerHands);
    }
    if (data.currentBidderIndex !== undefined) setCurrentBidderIndex(data.currentBidderIndex);
    if (data.bids) setBids(data.bids);
    if (data.highestBid !== undefined) setHighestBid(data.highestBid);
    if (data.dealerIndex !== undefined) setDealerIndex(data.dealerIndex);
    if (data.totalPoints) setTotalPoints(data.totalPoints);
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
      if (data.playedCards) {
        console.log("   Setting currentTrick to:", data.playedCards);
        setCurrentTrick(data.playedCards);
        currentTrickRef.current = data.playedCards; // Keep ref in sync
      } else {
        console.log("   ⚠️ No playedCards in message!");
      }
    }
    
    if (data.type === "TRICK_COMPLETE") {
      console.log("🏆 TRICK_COMPLETE received:", data);
      
      // Use the completed trick from server (more reliable than ref)
      const completedTrick = data.completedTrick || currentTrickRef.current || [];
      console.log("   Completed trick:", completedTrick);
      
      // Show all 4 cards with winner highlighted
      setTrickWinnerHandId(data.winnerHandId);
      setShowTrickComplete(true);
      
      // After animation, clear the trick and save to last trick
      setTimeout(() => {
        console.log("   Setting lastTrick to:", completedTrick);
        setLastTrick(completedTrick);
        setLastTrickWinner(data.winnerHandId);
        setCurrentTrick([]);
        currentTrickRef.current = []; // Clear ref too
        setTrickWinnerHandId(null);
        setShowTrickComplete(false);
      }, 2500);
    }
    
    if (data.type === "PLAY_ERROR") {
      alert(data.message || "Invalid play!");
    }
    
    if (data.type === "HAND_COMPLETE") {
      console.log("📋 HAND_COMPLETE received:", data);
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
  }, [messages]);

  /* Build handAssignments if server doesn't send them */
  useEffect(() => {
    if (handAssignments.length === 0 && players.length > 0) {
      const built: any[] = [];
      players.forEach((p) => {
        for (let i = 0; i < p.handCount; i++) {
          built.push({
            playerId: p.id,
            playerName: p.name,
            handIndex: i.toString(),
            team: p.team,
          });
        }
      });
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
    if (phase === "PLAYING") return null;

    let content = null;
    
    if (phase === "DEALER_SELECTION") {
      content = (
        <DealerSelection
          handAssignments={handAssignments}
          dealerGuesses={dealerGuesses}
          guessInput={guessInput}
          setGuessInput={setGuessInput}
          handleGuessSubmit={handleGuessSubmit}
          currentUserId={currentUserId}
        />
      );
    } else if (phase === "BIDDING") {
      content = (
        <BiddingPhase
          handAssignments={handAssignments}
          currentBidderIndex={currentBidderIndex}
          bids={bids}
          highestBid={highestBid}
          currentUserId={currentUserId}
          handleBid={handleBid}
        />
      );
    } else if (phase === "TRUMP_SELECTION") {
      content = (
        <TrumpSelection
          bidWinnerHandId={bidWinnerHandId}
          bidWinnerIndex={bidWinnerIndex}
          winningBid={winningBid}
          handAssignments={handAssignments}
          currentUserId={currentUserId}
          handleTrumpSelection={handleTrumpSelection}
        />
      );
    } else if (phase === "DEALING") {
      content = <div className="text-2xl text-white">Dealing Cards…</div>;
    } else {
      content = <div className="text-2xl text-white">{phase}</div>;
    }

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ pointerEvents: 'none' }}>
        <motion.div
          className="bg-black text-white p-8 rounded-3xl shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto"
          style={{ 
            pointerEvents: 'auto',
            backgroundColor: 'rgba(0, 0, 0, 0.95)'
          }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
        >
          {content}
        </motion.div>
      </div>
    );
  };

  return (
    <>
      <GameTable
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
      />
      
      {phase === "DEALING" && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="text-2xl text-white">Dealing Cards…</div>
        </div>
      )}
      
      {(phase === "HAND_COMPLETE" || phase === "GAME_COMPLETE") && handCompleteData && (
        <HandComplete
          tricksWon={handCompleteData.tricksWon || {}}
          pointsScored={handCompleteData.pointsScored || {}}
          teamScores={handCompleteData.teamScores || {}}
          totalPoints={totalPoints}
          biddingTeam={handCompleteData.biddingTeam || "Us"}
          tricksNeeded={handCompleteData.tricksNeeded || 0}
          biddingTeamTricks={handCompleteData.biddingTeamTricks || 0}
          handAssignments={handAssignments}
          currentUserId={currentUserId}
          readyPlayers={readyPlayers}
          onReady={handleHandCompleteReady}
        />
      )}
    </>
  );
};

export default Game;

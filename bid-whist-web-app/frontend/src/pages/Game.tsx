import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useWebSocket from "../hooks/useWebSocket";
import DealerSelection from "../components/DealerSelection";
import BiddingPhase from "../components/BiddingPhase";
import GameTable from "../components/GameTable";

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
  
  const joinedRef = useRef(false);

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
    if (data.playerHands) setPlayerHands(data.playerHands);
    if (data.currentBidderIndex !== undefined) setCurrentBidderIndex(data.currentBidderIndex);
    if (data.bids) setBids(data.bids);
    if (data.highestBid !== undefined) setHighestBid(data.highestBid);
    
    if (data.type === "DEALER_GUESS_UPDATE") {
      setDealerGuesses(data.guesses || {});
    }
    if (data.type === "DEALER_SELECTED") {
      setDealerGuesses(data.guesses || {});
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
        handleBid={handleBid}
      />
      
      {phase === "DEALING" && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="text-2xl text-white">Dealing Cards…</div>
        </div>
      )}
    </>
  );
};

export default Game;

import React, { useState, useEffect, useRef } from "react";
import { useParams, useHistory } from "react-router-dom";
import useWebSocket from "../hooks/useWebSocket";
import { isValidRoomCode } from "../utils/roomCodeValidator";
import { removeUserFromRoom } from "../utils/roomManager";

/** FULLY VALID + STYLED ROOM COMPONENT */
const Room: React.FC = () => {
  const { roomCode: raw } = useParams<{ roomCode: string }>();
  const roomCode = (raw || "").toUpperCase();
  const history = useHistory();

  const [players, setPlayers] = useState([]);
  const [hands, setHands] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [handCount, setHandCount] = useState(1);
  const [team, setTeam] = useState("Us");
  const [isReady, setIsReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [copied, setCopied] = useState(false);

  const joinedRef = useRef(false);

  const { sendMessage, messages, isConnected } = useWebSocket(
    isValidRoomCode(roomCode) ? `ws://localhost:8080/room/${roomCode}` : ""
  );

  /** AUTO-REJOIN SESSION */
  useEffect(() => {
    const stored = sessionStorage.getItem(`room_${roomCode}_user`);
    if (stored) setCurrentUser(JSON.parse(stored));
  }, [roomCode]);

  /** SEND JOIN MESSAGE */
  useEffect(() => {
    if (!currentUser || !isConnected || joinedRef.current) return;

    sendMessage(
      JSON.stringify({
        type: "PLAYER_JOINED",
        player: {
          id: currentUser.id,
          name: currentUser.name,
          isReady: false,
          handCount,
          team,
        },
      })
    );

    joinedRef.current = true;
  }, [currentUser, isConnected]);

  /** HANDLE SERVER MESSAGES */
  useEffect(() => {
    if (!messages.length) return;
    const data = JSON.parse(messages[messages.length - 1]);
    
    console.log("📨 Room received message:", data.type, data);

    switch (data.type) {
      case "ROOM_STATE":
        setPlayers(data.players);
        console.log("👥 Players updated:", data.players);
        break;

      case "UPDATE_HANDS":
        setHands(data.hands);
        break;

      case "DEALER_SELECTION":
      case "GAME_STARTED":
        console.log("🎮 Game starting! Navigating to game page...");
        setGameStarted(true);
        history.push(`/game/${roomCode}`);
        break;
        
      default:
        console.log("⚠️ Unhandled message type:", data.type);
    }
  }, [messages]);

  /** UPDATE HAND COUNT */
  const handleHandCount = (count) => {
    setHandCount(count);
    if (!currentUser) return;

    sendMessage(
      JSON.stringify({
        type: "UPDATE_HAND_COUNT",
        playerId: currentUser.id,
        handCount: count,
      })
    );
  };

  /** CHANGE TEAM */
  const handleTeam = (newTeam) => {
    setTeam(newTeam);
    if (!currentUser) return;

    sendMessage(
      JSON.stringify({
        type: "UPDATE_TEAM",
        playerId: currentUser.id,
        team: newTeam,
      })
    );
  };

  /** READY TOGGLE */
  const handleReady = () => {
    const next = !isReady;
    setIsReady(next);

    if (!currentUser) return;

    sendMessage(
      JSON.stringify({
        type: "TOGGLE_READY",
        playerId: currentUser.id,
        isReady: next,
      })
    );
  };

  /** BUTTON STYLES */
  const disabled = isReady;
  const selectedBtn =
    "opacity-80 bg-purple-600 text-white cursor-default shadow-md";
  const selectableBtn = "bg-gray-200 text-gray-700 hover:bg-gray-300";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-8 rounded-2xl space-y-8">
        {/* HEADER */}
        <header className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <h1 className="text-4xl font-extrabold text-purple-300 tracking-wide">Room {roomCode}</h1>
            <p className="text-gray-300 mt-1 text-sm">Signed in as <span className="font-semibold text-white">{currentUser?.name}</span></p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-white bg-purple-600 px-4 py-2 rounded-lg font-mono tracking-widest shadow-lg">{roomCode}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(roomCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-bold transition"
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </header>

        {/* PLAYER SETTINGS */}
        <section className="space-y-6">

          {/* HAND COUNT */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Number of Hands</h2>
            <div className="flex gap-3">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => handleHandCount(n)}
                  disabled={isReady}
                  className={`px-5 py-2 rounded-xl font-bold transition shadow-md backdrop-blur-lg border border-white/20
                    ${handCount === n ? "bg-gray-500 text-white opacity-70 cursor-not-allowed" : "bg-white/20 text-gray-200 hover:bg-white/30"}
                    ${isReady ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* TEAM SELECT */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Team Selection</h2>
            <div className="flex gap-3">
              {["Us", "Them"].map((t) => (
                <button
                  key={t}
                  onClick={() => handleTeam(t)}
                  disabled={isReady}
                  className={`px-5 py-2 rounded-xl font-bold transition shadow-md backdrop-blur-lg border border-white/20
                    ${team === t ? "bg-gray-500 text-white opacity-70 cursor-not-allowed" : "bg-white/20 text-gray-200 hover:bg-white/30"}
                    ${isReady ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* GAME START STATUS */}
        <section className="bg-white/5 p-4 rounded-xl border border-white/10">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Game Start Requirements</h3>
          <div className="space-y-1 text-xs text-gray-400">
            {(() => {
              const totalHands = players.reduce((sum, p) => sum + p.handCount, 0);
              const usHands = players.filter(p => p.team === "Us").reduce((sum, p) => sum + p.handCount, 0);
              const themHands = players.filter(p => p.team === "Them").reduce((sum, p) => sum + p.handCount, 0);
              const allReady = players.length > 0 && players.every(p => p.isReady);
              
              return (
                <>
                  <div className={allReady ? "text-green-400" : "text-yellow-400"}>
                    ✓ All players ready: {allReady ? "Yes" : "No"}
                  </div>
                  <div className={totalHands === 4 ? "text-green-400" : "text-yellow-400"}>
                    ✓ Total hands = 4: {totalHands}/4
                  </div>
                  <div className={usHands === 2 && themHands === 2 ? "text-green-400" : "text-yellow-400"}>
                    ✓ Teams balanced: Us={usHands}, Them={themHands} (need 2 each)
                  </div>
                </>
              );
            })()}
          </div>
        </section>

        {/* PLAYERS */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-2">Players</h2>
          <div className="space-y-4">
            {players.map((p) => (
              <div
                key={p.id}
                className={`p-4 rounded-xl border backdrop-blur-xl shadow-md flex justify-between items-center transition
                  ${p.team === "Us" ? "border-blue-400 bg-blue-400/10" : "border-red-400 bg-red-400/10"}`}
              >
                <div>
                  <div className="flex items-center gap-2 text-white text-lg font-semibold">
                    {p.name}
                    {p.id === currentUser?.id && (
                      <span className="text-xs bg-purple-600 px-2 py-1 rounded-full">You</span>
                    )}
                  </div>
                  <div className="text-gray-300 text-sm">
                    {p.handCount} hand{p.handCount !== 1 ? "s" : ""} — {p.team}
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-lg text-sm font-bold shadow-md
                    ${p.isReady ? "bg-green-600 text-white" : "bg-gray-500 text-white"}`}
                >
                  {p.isReady ? "Ready" : "Not Ready"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* READY BUTTON */}
        <button
          onClick={handleReady}
          className={`w-full py-4 rounded-xl text-xl font-bold shadow-xl transition
            ${isReady ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-600 hover:bg-green-700"}`}
        >
          {isReady ? "UNREADY" : "READY"}
        </button>
      </div>
    </div>
  );
};

export default Room;

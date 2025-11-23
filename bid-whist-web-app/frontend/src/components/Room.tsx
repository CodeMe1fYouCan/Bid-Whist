import React, { useState, useEffect, useRef } from "react";
import { useParams, useHistory } from "react-router-dom";
import useWebSocket from "../hooks/useWebSocket";
import { isValidRoomCode } from "../utils/roomCodeValidator";
import { removeUserFromRoom } from "../utils/roomManager";
import { getWebSocketUrl } from "../config";

/** FULLY VALID + STYLED ROOM COMPONENT */
const Room: React.FC = () => {
  const { roomCode: raw } = useParams<{ roomCode: string }>();
  const roomCode = (raw || "").toUpperCase();
  const history = useHistory();

  const [players, setPlayers] = useState([]);
  const [hands, setHands] = useState({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [handCount, setHandCount] = useState(1);
  const [handTeams, setHandTeams] = useState<Record<number, string>>({ 0: "Us" });
  const [handCharacters, setHandCharacters] = useState<Record<number, 'reddy' | 'oatmeal'>>({ 1: "reddy", 2: "oatmeal" });
  const [isReady, setIsReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [copied, setCopied] = useState(false);

  const joinedRef = useRef(false);

  const { sendMessage, messages, isConnected } = useWebSocket(
    isValidRoomCode(roomCode) ? getWebSocketUrl(roomCode) : ""
  );

  /** AUTO-REJOIN SESSION */
  useEffect(() => {
    const stored = sessionStorage.getItem(`room_${roomCode}_user`);
    if (stored) setCurrentUser(JSON.parse(stored));
  }, [roomCode]);

  /** SEND JOIN MESSAGE */
  useEffect(() => {
    if (!currentUser || !isConnected || joinedRef.current) return;

    // Build hand names: first hand is player's name, others are character choices
    const handNames: Record<number, string> = { 0: currentUser.name };
    if (handCount >= 2) handNames[1] = handCharacters[1] === 'reddy' ? 'Reddy' : 'Oatmeal';
    if (handCount >= 3) handNames[2] = handCharacters[2] === 'reddy' ? 'Reddy' : 'Oatmeal';

    sendMessage(
      JSON.stringify({
        type: "PLAYER_JOINED",
        player: {
          id: currentUser.id,
          name: currentUser.name,
          isReady: false,
          handCount,
          handTeams,
          handNames,
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
        // Save current player data to sessionStorage for game page
        if (currentUser) {
          const myPlayer = players.find(p => p.id === currentUser.id);
          if (myPlayer) {
            sessionStorage.setItem(`room_${roomCode}_player`, JSON.stringify(myPlayer));
          }
        }
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

    // Initialize teams and characters for new hands
    const newHandTeams = { ...handTeams };
    const newHandCharacters = { ...handCharacters };
    for (let i = 0; i < count; i++) {
      if (newHandTeams[i] === undefined) {
        newHandTeams[i] = "Us";
      }
      // Only set character for hands 2 and 3 (index 1 and 2)
      if (i > 0 && newHandCharacters[i] === undefined) {
        // Alternate between Reddy and Oatmeal for additional hands
        newHandCharacters[i] = i === 1 ? "reddy" : "oatmeal";
      }
    }
    setHandTeams(newHandTeams);
    setHandCharacters(newHandCharacters);

    if (!currentUser) return;

    sendMessage(
      JSON.stringify({
        type: "UPDATE_HAND_COUNT",
        playerId: currentUser.id,
        handCount: count,
      })
    );
  };

  /** CHANGE TEAM FOR SPECIFIC HAND */
  const handleTeam = (handIndex, newTeam) => {
    setHandTeams(prev => ({ ...prev, [handIndex]: newTeam }));
    if (!currentUser) return;

    sendMessage(
      JSON.stringify({
        type: "UPDATE_TEAM",
        playerId: currentUser.id,
        handIndex: handIndex,
        team: newTeam,
      })
    );
  };

  /** CHANGE CHARACTER FOR SPECIFIC HAND */
  const handleCharacter = (handIndex: number, character: 'reddy' | 'oatmeal') => {
    setHandCharacters(prev => ({ ...prev, [handIndex]: character }));

    if (!currentUser) return;

    const characterName = character === 'reddy' ? 'Reddy' : 'Oatmeal';

    sendMessage(
      JSON.stringify({
        type: "UPDATE_HAND_NAME",
        playerId: currentUser.id,
        handIndex: handIndex,
        handName: characterName,
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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden smoky-bar-bg">
      {/* Animated Smoke Wisps */}
      <div className="smoke-wisp" style={{ left: '10%', animationDelay: '0s' }}></div>
      <div className="smoke-wisp" style={{ left: '30%', animationDelay: '5s' }}></div>
      <div className="smoke-wisp" style={{ left: '60%', animationDelay: '10s' }}></div>
      <div className="smoke-wisp" style={{ left: '85%', animationDelay: '15s' }}></div>

      {/* Floating Card Suits */}
      <div className="absolute top-10 left-10 text-9xl float-animation opacity-60" style={{ animationDelay: '0s' }}>🎴</div>
      <div className="absolute top-20 right-20 text-9xl float-animation opacity-60" style={{ animationDelay: '2s' }}>♠️</div>
      <div className="absolute bottom-20 left-20 text-9xl float-animation opacity-60" style={{ animationDelay: '4s' }}>♥️</div>
      <div className="absolute bottom-10 right-10 text-9xl float-animation opacity-60" style={{ animationDelay: '1s' }}>♦️</div>

      <div className="glass-card rounded-3xl p-10 max-w-6xl w-full z-10 shadow-2xl">
        {/* HEADER */}
        <header className="flex flex-col items-center border-b-4 border-white/40 pb-6 mb-8">
          <h1 className="text-9xl font-bold text-center mb-4" style={{ fontSize: '100px', lineHeight: '1.1', color: '#FFFFFF', textShadow: '0 0 20px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.7), 4px 4px 8px rgba(0,0,0,1)' }}>
            🎴 Room {roomCode}
          </h1>
          <p className="text-center text-2xl mb-6 font-bold px-6 py-3 rounded-xl inline-block" style={{ color: '#FFFFFF', textShadow: '0 0 15px rgba(0,0,0,0.9), 2px 2px 6px rgba(0,0,0,1)', backgroundColor: 'rgba(0,0,0,0.8)' }}>
            Playing as {currentUser?.name}
          </p>

          <div className="flex items-center gap-4">
            <span className="text-white bg-black/80 px-8 py-4 rounded-2xl font-mono tracking-widest shadow-2xl text-4xl font-bold" style={{ letterSpacing: '0.3em' }}>
              {roomCode}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(roomCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="px-6 py-4 text-white rounded-2xl text-2xl font-bold transition shadow-2xl"
              style={{
                background: 'linear-gradient(to right, #f59e0b, #d97706)',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #d97706, #b45309)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(245, 158, 11, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #f59e0b, #d97706)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.3)';
              }}
            >
              {copied ? "✓ Copied" : "Copy Code"}
            </button>
          </div>
        </header>

        {/* PLAYER SETTINGS */}
        <section className="space-y-8 mb-8">
          {/* HAND COUNT */}
          <div>
            <h2 className="text-4xl font-bold mb-4 text-center px-6 py-3 rounded-xl inline-block" style={{ color: '#FFFFFF', textShadow: '0 0 15px rgba(0,0,0,0.9), 2px 2px 6px rgba(0,0,0,1)', backgroundColor: 'rgba(0,0,0,0.8)' }}>
              Number of Hands
            </h2>
            <div className="flex gap-4 justify-center mt-4">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => handleHandCount(n)}
                  disabled={isReady}
                  className="px-10 py-5 rounded-2xl font-bold transition shadow-2xl text-3xl min-w-[120px]"
                  style={{
                    height: '70px',
                    background: handCount === n
                      ? 'linear-gradient(to right, #f59e0b, #d97706)'
                      : 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    opacity: isReady ? 0.4 : 1,
                    cursor: isReady ? 'not-allowed' : 'pointer',
                    boxShadow: handCount === n ? '0 0 30px rgba(245, 158, 11, 0.5)' : 'none',
                    border: handCount === n ? 'none' : '2px solid rgba(255, 255, 255, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isReady && handCount !== n) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isReady && handCount !== n) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* HAND CONFIGURATION */}
          <div>
            <h2 className="text-4xl font-bold mb-4 text-center px-6 py-3 rounded-xl inline-block" style={{ color: '#FFFFFF', textShadow: '0 0 15px rgba(0,0,0,0.9), 2px 2px 6px rgba(0,0,0,1)', backgroundColor: 'rgba(0,0,0,0.8)' }}>
              Hand Configuration
            </h2>
            <div className="space-y-4 mt-4">
              {Array.from({ length: handCount }, (_, i) => (
                <div key={i} className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border-3 border-white/30 shadow-xl">
                  <div className="flex flex-col gap-4">
                    {/* Hand Name */}
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold px-4 py-2 rounded-lg" style={{ color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.8)', minWidth: '120px' }}>
                        Hand {i + 1}:
                      </span>
                      {i === 0 ? (
                        <span className="text-3xl font-bold" style={{ color: '#FFFFFF', textShadow: '0 0 10px rgba(0,0,0,0.9)' }}>{currentUser?.name}</span>
                      ) : (
                        <div className="flex gap-3">
                          {[
                            { value: 'reddy', label: '🐱 Reddy', color: 'from-orange-500 to-red-500' },
                            { value: 'oatmeal', label: '🦙 Oatmeal', color: 'from-amber-500 to-yellow-500' }
                          ].map((char) => (
                            <button
                              key={char.value}
                              onClick={() => handleCharacter(i, char.value as 'reddy' | 'oatmeal')}
                              disabled={isReady}
                              className="px-8 py-3 rounded-xl font-bold transition shadow-xl text-2xl"
                              style={{
                                height: '60px',
                                background: handCharacters[i] === char.value
                                  ? 'linear-gradient(to right, #f59e0b, #d97706)'
                                  : 'rgba(255, 255, 255, 0.15)',
                                color: '#FFFFFF',
                                opacity: isReady ? 0.4 : 1,
                                cursor: isReady ? 'not-allowed' : 'pointer',
                                boxShadow: handCharacters[i] === char.value ? '0 0 30px rgba(245, 158, 11, 0.5)' : 'none',
                                border: handCharacters[i] === char.value ? 'none' : '2px solid rgba(255, 255, 255, 0.3)'
                              }}
                              onMouseEnter={(e) => {
                                if (!isReady && handCharacters[i] !== char.value) {
                                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isReady && handCharacters[i] !== char.value) {
                                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }
                              }}
                            >
                              {char.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Team Selection */}
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold px-4 py-2 rounded-lg" style={{ color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.8)', minWidth: '120px' }}>
                        Team:
                      </span>
                      <div className="flex gap-3">
                        {["Us", "Them"].map((t) => (
                          <button
                            key={t}
                            onClick={() => handleTeam(i, t)}
                            disabled={isReady}
                            className="px-10 py-3 rounded-xl font-bold transition shadow-xl text-2xl min-w-[140px]"
                            style={{
                              height: '60px',
                              background: handTeams[i] === t
                                ? 'linear-gradient(to right, #f59e0b, #d97706)'
                                : 'rgba(255, 255, 255, 0.15)',
                              color: '#FFFFFF',
                              opacity: isReady ? 0.4 : 1,
                              cursor: isReady ? 'not-allowed' : 'pointer',
                              boxShadow: handTeams[i] === t ? '0 0 30px rgba(245, 158, 11, 0.5)' : 'none',
                              border: handTeams[i] === t ? 'none' : '2px solid rgba(255, 255, 255, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                              if (!isReady && handTeams[i] !== t) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                                e.currentTarget.style.transform = 'scale(1.05)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isReady && handTeams[i] !== t) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }
                            }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GAME START STATUS */}
        <section className="bg-black/60 backdrop-blur-sm p-6 rounded-2xl border-3 border-white/30 mb-8">
          <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: '#FFFFFF', textShadow: '0 0 10px rgba(0,0,0,0.9)' }}>
            Game Start Requirements
          </h3>
          <div className="space-y-2 text-xl font-bold">
            {(() => {
              // Calculate total hands using local state for current user, server state for others
              let totalHands = 0;
              let usHands = 0;
              let themHands = 0;

              players.forEach(p => {
                // Use local state for current user
                const isCurrentUser = currentUser && p.id === currentUser.id;
                // console.log(`Checking player ${p.name} (${p.id}). Is current? ${isCurrentUser}. Local handCount: ${handCount}`);

                if (isCurrentUser) {
                  totalHands += handCount;
                  for (let i = 0; i < handCount; i++) {
                    const team = handTeams[i] || "Us";
                    if (team === "Us") usHands++;
                    else themHands++;
                  }
                } else {
                  // Use server state for other players
                  totalHands += p.handCount || 0;
                  for (let i = 0; i < (p.handCount || 0); i++) {
                    const team = p.handTeams?.[i] || "Us";
                    if (team === "Us") usHands++;
                    else themHands++;
                  }
                }
              });

              // Check if all players are ready (use local state for current user)
              const allReady = players.length > 0 && players.every(p => {
                if (currentUser && p.id === currentUser.id) {
                  return isReady;
                }
                return p.isReady;
              });

              return (
                <>
                  <div className={`px-4 py-2 rounded-lg ${allReady ? "bg-green-600/80" : "bg-yellow-600/80"}`} style={{ color: '#FFFFFF' }}>
                    ✓ All players ready: {allReady ? "Yes" : "No"}
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${totalHands === 4 ? "bg-green-600/80" : "bg-yellow-600/80"}`} style={{ color: '#FFFFFF' }}>
                    ✓ Total hands = 4: {totalHands}/4
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${usHands === 2 && themHands === 2 ? "bg-green-600/80" : "bg-yellow-600/80"}`} style={{ color: '#FFFFFF' }}>
                    ✓ Teams balanced: Us={usHands}, Them={themHands} (need 2 each)
                  </div>
                </>
              );
            })()}
          </div>
        </section>

        {/* PLAYERS */}
        <section className="mb-8">
          <h2 className="text-4xl font-bold mb-6 text-center px-6 py-3 rounded-xl inline-block" style={{ color: '#FFFFFF', textShadow: '0 0 15px rgba(0,0,0,0.9), 2px 2px 6px rgba(0,0,0,1)', backgroundColor: 'rgba(0,0,0,0.8)' }}>
            Players
          </h2>
          <div className="space-y-4 mt-4">
            {players.map((p) => (
              <div
                key={p.id}
                className="p-6 rounded-2xl border-3 border-white/30 backdrop-blur-sm shadow-2xl bg-white/10"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`text-3xl font-bold ${p.isReady ? 'text-green-400' : ''}`} style={{ color: p.isReady ? '#4ade80' : '#FFFFFF', textShadow: p.isReady ? '0 0 20px rgba(74, 222, 128, 0.8), 0 0 10px rgba(74, 222, 128, 0.6)' : '0 0 10px rgba(0,0,0,0.9)' }}>
                      {p.name}
                    </span>
                    {p.id === currentUser?.id && (
                      <span className="text-xl bg-purple-600 px-4 py-2 rounded-full font-bold" style={{ color: '#FFFFFF' }}>You</span>
                    )}
                    {p.isReady && (
                      <span className="text-2xl bg-green-500 px-3 py-1 rounded-full font-bold" style={{ color: '#FFFFFF' }}>✓</span>
                    )}
                  </div>
                  <span
                    className={`px-6 py-3 rounded-xl text-2xl font-bold shadow-xl
                      ${p.isReady ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gradient-to-r from-gray-500 to-gray-600"}`}
                    style={{ color: '#FFFFFF' }}
                  >
                    {p.isReady ? "✓ Ready" : "Not Ready"}
                  </span>
                </div>
                <div className="space-y-2">
                  {Array.from({ length: p.handCount }, (_, i) => {
                    const team = p.handTeams?.[i] || "Us";
                    const handName = p.handNames?.[i] || (i === 0 ? p.name : "");
                    return (
                      <div key={i} className="flex items-center gap-3 text-xl font-bold px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                        <span style={{ color: '#FFFFFF' }}>Hand {i + 1}:</span>
                        {handName && (
                          <span style={{ color: '#FFFFFF' }}>
                            {handName === 'Reddy' && '🐱 '}
                            {handName === 'Oatmeal' && '🦙 '}
                            {handName}
                          </span>
                        )}
                        <span style={{ color: '#888' }}>-</span>
                        <span className={team === "Us" ? "text-blue-400" : "text-red-400"} style={{ fontWeight: 'bold' }}>
                          {team}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* READY BUTTON */}
        <button
          onClick={handleReady}
          className="w-full py-6 rounded-2xl text-4xl font-bold shadow-2xl transition"
          style={{
            height: '80px',
            background: isReady
              ? 'linear-gradient(to right, #eab308, #ca8a04)'
              : 'linear-gradient(to right, #f59e0b, #d97706)',
            color: '#FFFFFF',
            textShadow: '0 0 10px rgba(0,0,0,0.8), 2px 2px 4px rgba(0,0,0,1)',
            boxShadow: isReady
              ? '0 0 30px rgba(234, 179, 8, 0.4), 0 4px 20px rgba(0,0,0,0.3)'
              : '0 0 30px rgba(245, 158, 11, 0.4), 0 4px 20px rgba(0,0,0,0.3)'
          }}
          onMouseEnter={(e) => {
            if (isReady) {
              e.currentTarget.style.background = 'linear-gradient(to right, #ca8a04, #a16207)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(234, 179, 8, 0.6), 0 4px 25px rgba(0,0,0,0.4)';
            } else {
              e.currentTarget.style.background = 'linear-gradient(to right, #d97706, #b45309)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(245, 158, 11, 0.6), 0 4px 25px rgba(0,0,0,0.4)';
            }
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            if (isReady) {
              e.currentTarget.style.background = 'linear-gradient(to right, #eab308, #ca8a04)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(234, 179, 8, 0.4), 0 4px 20px rgba(0,0,0,0.3)';
            } else {
              e.currentTarget.style.background = 'linear-gradient(to right, #f59e0b, #d97706)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(245, 158, 11, 0.4), 0 4px 20px rgba(0,0,0,0.3)';
            }
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isReady ? "🔄 UNREADY" : "✓ READY TO PLAY"}
        </button>
      </div>
    </div>
  );
};

export default Room;

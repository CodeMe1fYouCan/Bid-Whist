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
  handleBid?: (handId: string, bidAmount: number | string) => void;
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
  handleBid,
}: GameTableProps) {
  const showCards = phase === "BIDDING" || phase === "PLAYING";

  /** Find user’s hands */
  const myHandAssignments = handAssignments.filter(
    (h: any) => h.playerId === currentUserId
  );

  // My first hand cards
  const myCards: any[] = [];
  if (showCards && myHandAssignments.length > 0) {
    const firstHand = myHandAssignments[0];
    const handId = `${firstHand.playerId}_hand_${firstHand.handIndex}`;
    myCards.push(...(playerHands[handId] || []));
  }

  /** Helper to get player name by position */
  const getPlayerName = (position: "ACROSS" | "LEFT" | "RIGHT") => {
    // 4-seat mapping: [You, Left, Across, Right]
    const others = handAssignments
      .filter((h) => h.playerId !== currentUserId)
      .reduce((acc: any, h: any) => {
        if (!acc[h.playerId]) acc[h.playerId] = [];
        acc[h.playerId].push(h);
        return acc;
      }, {});

    const ids = Object.keys(others);

    if (ids.length !== 3) return position; // Fallback

    const [left, across, right] = ids;

    switch (position) {
      case "LEFT":
        return others[left][0]?.playerName || "Left";
      case "ACROSS":
        return others[across][0]?.playerName || "Across";
      case "RIGHT":
        return others[right][0]?.playerName || "Right";
    }
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
            {myCards.length > 0 ? (
              myCards.map((card: any, idx: number) => (
                <div key={idx} className="-ml-6 first:ml-0">
                  <Card suit={card.suit} rank={card.rank} faceUp width={60} height={90} />
                </div>
              ))
            ) : (
              showCards && <div className="text-gray-400">No cards</div>
            )}
          </div>
          <div className="text-xl font-bold mt-2">You</div>
        </div>

        {/* ACROSS (Top) */}
{showCards && (
  <div className="absolute top-[2vh] left-1/2 -translate-x-1/2 flex flex-col items-center text-white">
    <div className="text-xl font-bold mb-2">{getPlayerName("ACROSS")}</div>

    <div className="flex">
      {Array.from({ length: 13 }).map((_, i) => (
        <div key={i} className="-ml-10 first:ml-0"> 
          <Card faceUp={false} width={60} height={90} />
        </div>
      ))}
    </div>
  </div>
)}

        {/* LEFT */}
{showCards && (
  <div className="absolute left-[2vw] top-1/2 -translate-y-1/2 flex flex-col items-center text-white">
    <div className="text-xl font-bold mb-2 rotate-180 writing-vertical-rl">
      {getPlayerName("LEFT")}
    </div>

    <div className="flex flex-col items-center">
      {Array.from({ length: 13 }).map((_, i) => (
        <div key={i} style={{ marginTop: i === 0 ? 0 : '-50px' }}> 
          <div className="transform -rotate-90">
            <Card faceUp={false} width={60} height={90} />
          </div>
        </div>
      ))}
    </div>
  </div>
)}

        {/* RIGHT */}
{showCards && (
  <div className="absolute right-[2vw] top-1/2 -translate-y-1/2 flex flex-col items-center text-white">
    <div className="text-xl font-bold mb-2 writing-vertical-rl">
      {getPlayerName("RIGHT")}
    </div>

    <div className="flex flex-col items-center">
      {Array.from({ length: 13 }).map((_, i) => (
        <div key={i} style={{ marginTop: i === 0 ? 0 : '-50px' }}>
          <div className="transform rotate-90">
            <Card faceUp={false} width={60} height={90} />
          </div>
        </div>
      ))}
    </div>
  </div>
)}

        {/* CENTER TRICK */}
        {phase === "PLAYING" && (
          <div className="absolute inset-0 flex items-center justify-center text-white pointer-events-none">
            <div className="w-48 h-48 rounded-full border-2 border-white/20 flex items-center justify-center">
              <div className="text-lg opacity-50">Center</div>
            </div>
          </div>
        )}

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
                            <div className="font-bold" style={{ color: '#ffffff' }}>
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
          const [bidInput, setBidInput] = React.useState<string>("");
          const minBid = highestBid + 1;
          const bidValue = parseInt(bidInput);
          const canBid = bidValue >= minBid && bidValue <= 7;

          return (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-white p-10 rounded-3xl shadow-2xl max-w-3xl max-h-[85vh] overflow-y-auto border-4 border-white/20" style={{ backgroundColor: 'rgba(17, 24, 39, 0.97)', fontSize: '1.1rem' }}>
                <div className="space-y-6">
                  <h2 className="text-4xl font-bold text-center" style={{ color: '#ffffff' }}>Bidding Phase</h2>
                  
                  {/* Current Bidder */}
                  <div className="text-center">
                    <div className="text-xl" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Current Bidder:</div>
                    <div className="text-3xl font-bold text-yellow-400">
                      {currentBidder?.playerName} - Hand {parseInt(currentBidder?.handIndex) + 1}
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
                        </div>
                      </div>
                      
                      <div className="flex gap-3 justify-center">
                        <input
                          type="number"
                          min={minBid}
                          max="7"
                          value={bidInput}
                          onChange={(e) => setBidInput(e.target.value)}
                          className="w-32 px-4 py-3 bg-gray-700 border border-gray-600 rounded text-white text-center text-xl"
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
                          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded font-bold text-lg"
                        >
                          Pass
                        </button>
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
                          return (
                            <div
                              key={idx}
                              className="p-3 bg-white/10 rounded border border-white/30"
                            >
                              <span className="font-bold" style={{ color: '#ffffff' }}>
                                {hand?.playerName} - Hand {parseInt(hand?.handIndex) + 1}:
                              </span>
                              <span className={`ml-2 ${bid.amount === "pass" ? "text-red-400" : "text-green-400"}`}>
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
      </div>
    </div>
  );
}

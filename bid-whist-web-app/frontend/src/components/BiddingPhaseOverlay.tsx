import React from "react";
import type { BiddingPhaseState } from "../types/gamePhases";

interface BiddingPhaseOverlayProps extends Omit<BiddingPhaseState, 'bidWinnerHandId' | 'winningBid'> {
  handAssignments: any[];
  currentUserId: string | null;
  currentBidderIndex: number;
  bids: any[];
  highestBid: number;
  dealerIndex: number;
  teamScores?: Record<string, number>;
  pointsToWin?: number;
}

export default function BiddingPhaseOverlay({
  handAssignments,
  currentBidderIndex,
  bids,
  highestBid,
  dealerIndex,
  currentUserId,
  handleBid,
  teamScores,
  pointsToWin = 11,
}: BiddingPhaseOverlayProps) {
  const [bidInput, setBidInput] = React.useState<string>("");

  const currentBidder = handAssignments[currentBidderIndex];
  const currentHandId = `${currentBidder?.playerId}_hand_${currentBidder?.handIndex}`;
  const isMyTurn = currentBidder?.playerId === currentUserId;
  const isDealer = currentBidderIndex === dealerIndex;

  // Dealer can match highest bid (but minimum is 1), others must beat it
  const minBid = highestBid === 0 ? 1 : isDealer ? highestBid : highestBid + 1;
  const bidValue = parseInt(bidInput);
  const canBid = bidValue >= minBid && bidValue <= 7;

  // Find Faye's team for color coding
  const fayeHand = handAssignments.find(
    (h: any) => h.playerName?.toLowerCase() === "faye"
  );
  const fayeTeam = fayeHand?.team;

  // Check if everyone else has passed (can't pass if you're the last one)
  const passCount = bids.filter((b: any) => b.amount === "pass").length;
  const canPass = !(passCount === 3 && highestBid === 0);

  return (
    <>
      {/* Game Score - top right */}
      {teamScores && (
        <div
          className="absolute text-center bg-black/80 px-8 py-5 rounded-lg border-2 border-yellow-400/50 z-20"
          style={{ top: "8vh", right: "15%", color: "#ffffff" }}
        >
          <div className="font-bold mb-3" style={{ fontSize: "1.75rem", color: "#ffffff" }}>
            Game Score
          </div>
          <div className="grid grid-cols-2 gap-6" style={{ fontSize: "1.25rem" }}>
            <div>
              <div className="font-bold mb-1" style={{ color: "#c084fc" }}>Us</div>
              <div className="text-4xl font-bold" style={{ color: "#fcd34d" }}>
                {teamScores.Us || 0}
              </div>
            </div>
            <div>
              <div className="font-bold mb-1" style={{ color: "#93c5fd" }}>Them</div>
              <div className="text-4xl font-bold" style={{ color: "#fcd34d" }}>
                {teamScores.Them || 0}
              </div>
            </div>
          </div>
          <div className="text-center text-sm mt-3 opacity-70" style={{ color: "#ffffff" }}>
            First to {pointsToWin} wins
          </div>
        </div>
      )}

      {/* Bidding Overlay - centered */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div
          className="text-white p-10 rounded-3xl shadow-2xl max-w-3xl max-h-[85vh] overflow-y-auto border-4 border-white/20 pointer-events-auto"
          style={{ backgroundColor: "rgba(17, 24, 39, 0.97)", fontSize: "1.1rem" }}
        >
        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-center" style={{ color: "#ffffff" }}>
            Bidding Phase
          </h2>

          {/* Current Bidder */}
          <div className="text-center">
            <div className="text-xl" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
              Current Bidder:
            </div>
            <div
              className="text-3xl font-bold"
              style={{
                color: currentBidder?.team === fayeTeam ? "#c4b5fd" : "#60a5fa",
              }}
            >
              {currentBidder?.playerName?.toLowerCase() === "faye" && "💜 "}
              {currentBidder?.playerName} - Hand {parseInt(currentBidder?.handIndex) + 1}
              {isDealer && <span className="ml-2 text-yellow-300">👑 Dealer</span>}
              {isMyTurn && <span className="ml-2">(Your Turn!)</span>}
            </div>
            <div className="mt-1" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
              Highest Bid: {highestBid === 0 ? "None" : highestBid}
            </div>
          </div>

          {/* Bid Input (only show if it's my turn) */}
          {isMyTurn && (
            <div className="bg-yellow-900/20 border-2 border-yellow-400 rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="text-lg font-bold" style={{ color: "#ffffff" }}>
                  Your Turn to Bid
                </div>
                <div className="text-sm" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                  Minimum bid: {minBid} (Range: 1-7)
                  {isDealer && (
                    <span className="block text-yellow-300 mt-1">
                      👑 As dealer, you can match the highest bid
                    </span>
                  )}
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
                        ? "bg-red-900 border-2 border-red-500"
                        : "bg-gray-700 border border-gray-600"
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
                      ? "Bid cannot exceed 7"
                      : "Invalid bid"}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bid History */}
          <div>
            <h3 className="text-xl font-bold mb-3" style={{ color: "#ffffff" }}>
              Bid History
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {bids.length === 0 ? (
                <div
                  className="text-center py-4"
                  style={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  No bids yet
                </div>
              ) : (
                bids.map((bid: any, idx: number) => {
                  const hand = handAssignments[bid.handIndex];
                  const handColor = hand?.team === fayeTeam ? "#c4b5fd" : "#60a5fa";
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-white/10 rounded border border-white/30"
                    >
                      <span className="font-bold" style={{ color: handColor }}>
                        {hand?.playerName?.toLowerCase() === "faye" && "💜 "}
                        {hand?.playerName} - Hand {parseInt(hand?.handIndex) + 1}:
                      </span>
                      <span
                        className="ml-2"
                        style={{ color: bid.amount === "pass" ? "#f87171" : "#4ade80" }}
                      >
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
    </>
  );
}

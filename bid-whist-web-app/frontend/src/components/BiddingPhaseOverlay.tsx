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
          className="absolute text-center bg-black/80 px-3 py-2 md:px-8 md:py-5 rounded-lg border-2 border-yellow-400/50 z-20"
          style={{ top: "5vh", right: "5%", color: "#ffffff" }}
        >
          <div className="font-bold mb-1 md:mb-3 text-base md:text-xl lg:text-2xl" style={{ color: "#ffffff" }}>
            Game Score
          </div>
          <div className="grid grid-cols-2 gap-2 md:gap-6 text-sm md:text-base">
            <div>
              <div className="font-bold mb-1" style={{ color: "#c084fc" }}>Us</div>
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold" style={{ color: "#fcd34d" }}>
                {teamScores.Us || 0}
              </div>
            </div>
            <div>
              <div className="font-bold mb-1" style={{ color: "#93c5fd" }}>Them</div>
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold" style={{ color: "#fcd34d" }}>
                {teamScores.Them || 0}
              </div>
            </div>
          </div>
          <div className="text-center text-xs md:text-sm mt-2 md:mt-3 opacity-70" style={{ color: "#ffffff" }}>
            First to {pointsToWin} wins
          </div>
        </div>
      )}

      {/* Bidding Overlay - positioned at top on mobile, centered on desktop */}
      <div
        className="fixed z-50 top-[2vh] left-1/2 -translate-x-1/2 text-white p-3 md:p-8 md:text-lg lg:p-10 rounded-2xl md:rounded-3xl shadow-2xl w-[60vw] md:w-auto md:max-w-2xl lg:max-w-3xl max-h-[50vh] md:max-h-[85vh] overflow-y-auto border-2 md:border-4 border-white/20 pointer-events-auto md:relative md:top-auto md:left-auto md:translate-x-0 md:flex md:items-center md:justify-center md:inset-0 md:bg-transparent md:pointer-events-none"
        style={{ backgroundColor: "rgba(17, 24, 39, 0.97)", fontSize: "0.85rem" }}
      >
        <div className="space-y-2 md:space-y-6">
          <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-center" style={{ color: "#ffffff" }}>
            Bidding Phase
          </h2>

          {/* Current Bidder */}
          <div className="text-center">
            <div className="text-sm md:text-xl" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
              Current Bidder:
            </div>
            <div
              className="text-lg md:text-2xl lg:text-3xl font-bold"
              style={{
                color: currentBidder?.team === fayeTeam ? "#c4b5fd" : "#60a5fa",
              }}
            >
              {currentBidder?.playerName?.toLowerCase() === "faye" && "💜 "}
              {currentBidder?.playerName} - Hand {parseInt(currentBidder?.handIndex) + 1}
            </div>
          </div>

          {/* Highest Bid */}
          <div className="text-center">
            <div className="text-sm md:text-xl" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
              Highest Bid:
            </div>
            <div className="text-lg md:text-2xl lg:text-3xl font-bold text-yellow-400">
              {highestBid > 0 ? highestBid : "None"}
            </div>
          </div>

          {/* Bidding Input (only show if it's my turn) */}
          {isMyTurn && (
            <div className="bg-yellow-900/20 border-2 border-yellow-400 rounded-lg p-3 md:p-6">
              <div className="space-y-2 md:space-y-4">
                <div className="flex items-center gap-2 md:gap-4">
                  <label className="text-sm md:text-lg font-bold" style={{ color: "#ffffff" }}>
                    Your Bid:
                  </label>
                  <input
                    type="number"
                    min={minBid}
                    max="7"
                    value={bidInput}
                    onChange={(e) => setBidInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 md:px-4 md:py-2 bg-gray-800 border-2 border-gray-600 rounded text-white text-sm md:text-lg font-bold focus:border-yellow-400 focus:outline-none"
                    placeholder={`Min: ${minBid}`}
                  />
                </div>
                <div className="flex gap-2 md:gap-4">
                  <button
                    onClick={() => {
                      console.log("Bid button clicked", { currentHandId, bidValue });
                      if (handleBid) {
                        handleBid(currentHandId, bidValue);
                      } else {
                        console.error("handleBid is undefined");
                      }
                    }}
                    disabled={!canBid}
                    className="px-4 md:px-6 py-1.5 md:py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-bold text-sm md:text-lg touch-target"
                  >
                    Bid
                  </button>
                  <button
                    onClick={() => {
                      console.log("Pass button clicked", { currentHandId });
                      if (handleBid) {
                        handleBid(currentHandId, "pass");
                      } else {
                        console.error("handleBid is undefined");
                      }
                    }}
                    disabled={!canPass}
                    className="px-4 md:px-6 py-1.5 md:py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-bold text-sm md:text-lg touch-target"
                  >
                    Pass
                  </button>
                </div>
                {bidInput && !canBid && (
                  <div className="text-red-400 text-xs md:text-sm font-semibold">
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

          {/* Bid History - Compact on mobile */}
          <div>
            <h3 className="text-base md:text-xl font-bold mb-1 md:mb-3" style={{ color: "#ffffff" }}>
              Bid History
            </h3>
            <div className="space-y-1 md:space-y-2 max-h-20 md:max-h-64 overflow-y-auto">
              {bids.length === 0 ? (
                <div
                  className="text-center py-2 md:py-4 text-xs md:text-base"
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
                      className="p-1.5 md:p-3 bg-white/10 rounded border border-white/30 text-xs md:text-base"
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
    </>
  );
}

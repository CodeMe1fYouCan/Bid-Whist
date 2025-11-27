import React from "react";
import type { BiddingPhaseState } from "../types/gamePhases";
import { useResponsiveCardSize } from "../hooks/useResponsiveCardSize";

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
  const { isMobile } = useResponsiveCardSize();

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
        <div className={isMobile ? "space-y-2" : "space-y-2 md:space-y-4"}>
          {/* Title - hide on mobile to save space */}
          {!isMobile && (
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center" style={{ color: "#ffffff" }}>
              Bidding Phase
            </h2>
          )}

          {/* Compact header: Current Bidder | Highest Bid */}
          <div className={`flex items-center justify-center gap-3 md:gap-6 ${isMobile ? "text-xs" : "text-sm md:text-base"}`}>
            <div className="flex items-center gap-1.5">
              <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Current:</span>
              <span
                className="font-bold"
                style={{
                  color: currentBidder?.team === fayeTeam ? "#c4b5fd" : "#60a5fa",
                }}
              >
                {currentBidder?.playerName?.toLowerCase() === "faye" && "💜 "}
                {currentBidder?.playerName}
              </span>
            </div>
            <div className="text-white/30">|</div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Highest:</span>
              <span className="font-bold text-yellow-400">
                {highestBid > 0 ? highestBid : "None"}
              </span>
            </div>
          </div>

          {/* Bidding Input (only show if it's my turn) */}
          {isMyTurn && (
            <div className="bg-yellow-900/20 border-2 border-yellow-400 rounded-lg p-3 md:p-6">
              <div className="space-y-3">
                <div className={`text-center font-bold text-white ${isMobile ? "text-sm mb-2" : "text-base md:text-lg mb-3"}`}>
                  Select your bid:
                </div>
                <div className={`grid grid-cols-7 ${isMobile ? "gap-1.5" : "gap-2"}`}>
                  {[1, 2, 3, 4, 5, 6, 7].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleBid && handleBid(currentHandId, amt)}
                      disabled={amt < minBid}
                      className={`rounded-lg font-bold shadow-lg transition-all active:scale-95 ${amt < minBid
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed opacity-50"
                        : "bg-blue-600 text-white hover:bg-blue-500 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1"
                        } ${isMobile ? "py-2.5 text-base" : "py-3 md:py-4 text-lg md:text-xl"}`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleBid && handleBid(currentHandId, "pass")}
                  disabled={!canPass}
                  className={`w-full rounded-lg font-bold shadow-lg transition-all active:scale-95 ${!canPass
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed opacity-50"
                    : "bg-red-600 text-white hover:bg-red-500 border-b-4 border-red-800 active:border-b-0 active:translate-y-1"
                    } ${isMobile ? "py-3 text-lg" : "py-4 text-xl md:text-2xl"}`}
                >
                  PASS
                </button>
                {!canPass && (
                  <div className={`text-center text-red-400 font-semibold ${isMobile ? "text-xs" : "text-sm"}`}>
                    Cannot pass (everyone else passed)
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bid History - Compact on mobile */}
          <div>
            <h3 className={`font-bold mb-1 md:mb-3 ${isMobile ? "text-sm" : "text-base md:text-xl"}`} style={{ color: "#ffffff" }}>
              Bid History
            </h3>
            <div className="flex flex-wrap gap-2 max-h-20 md:max-h-32 overflow-y-auto">
              {bids.length === 0 ? (
                <div
                  className={`text-center w-full ${isMobile ? "py-1 text-xs" : "py-2 md:py-4 text-xs md:text-base"}`}
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
                      className={isMobile
                        ? "px-2 py-1 bg-white/10 rounded border border-white/30 text-xs whitespace-nowrap"
                        : "px-3 py-1.5 md:px-4 md:py-2 bg-white/10 rounded border border-white/30 text-xs md:text-base whitespace-nowrap"
                      }
                    >
                      <span className="font-bold" style={{ color: handColor }}>
                        {hand?.playerName?.toLowerCase() === "faye" && "💜 "}
                        {hand?.playerName}:
                      </span>
                      <span
                        className="ml-1"
                        style={{ color: bid.amount === "pass" ? "#f87171" : "#4ade80" }}
                      >
                        {bid.amount === "pass" ? "Pass" : bid.amount}
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

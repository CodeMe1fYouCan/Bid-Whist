import { useState } from "react";

interface BiddingPhaseProps {
  handAssignments: any[];
  currentBidderIndex: number;
  bids: any[];
  highestBid: number;
  currentUserId: string | null;
  handleBid: (handId: string, bidAmount: number | string) => void;
}

export default function BiddingPhase({
  handAssignments,
  currentBidderIndex,
  bids,
  highestBid,
  currentUserId,
  handleBid,
}: BiddingPhaseProps) {
  const [bidInput, setBidInput] = useState<string>("");

  if (!handAssignments.length) {
    return <div className="text-white">Loading…</div>;
  }

  const currentBidder = handAssignments[currentBidderIndex];
  const currentHandId = `${currentBidder?.playerId}_hand_${currentBidder?.handIndex}`;
  const isMyTurn = currentBidder?.playerId === currentUserId;

  const minBid = highestBid + 1;
  const bidValue = parseInt(bidInput);
  const canBid = bidValue >= minBid && bidValue <= 7;

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-3xl font-bold text-center">Bidding Phase</h2>
      
      {/* Current Bidder */}
      <div className="text-center">
        <div className="text-lg text-gray-300">Current Bidder:</div>
        <div className="text-2xl font-bold text-yellow-400">
          {currentBidder?.playerName} - Hand {parseInt(currentBidder?.handIndex) + 1}
          {isMyTurn && <span className="ml-2">(Your Turn!)</span>}
        </div>
        <div className="text-gray-400 mt-1">
          Highest Bid: {highestBid === 0 ? "None" : highestBid}
        </div>
      </div>

      {/* Bid Input (only show if it's my turn) */}
      {isMyTurn && (
        <div className="bg-yellow-900/20 border-2 border-yellow-400 rounded-lg p-6">
          <div className="text-center mb-4">
            <div className="text-lg font-bold">Your Turn to Bid</div>
            <div className="text-sm text-gray-300">
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
              onClick={() => handleBid(currentHandId, bidValue)}
              disabled={!canBid}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-bold text-lg"
            >
              Bid
            </button>
            <button
              onClick={() => handleBid(currentHandId, "pass")}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded font-bold text-lg"
            >
              Pass
            </button>
          </div>
        </div>
      )}

      {/* Bid History */}
      <div>
        <h3 className="text-xl font-bold mb-3">Bid History</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {bids.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No bids yet</div>
          ) : (
            bids.map((bid: any, idx: number) => {
              const hand = handAssignments[bid.handIndex];
              return (
                <div
                  key={idx}
                  className="p-3 bg-gray-800/50 rounded border border-gray-700"
                >
                  <span className="font-bold">
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
  );
}

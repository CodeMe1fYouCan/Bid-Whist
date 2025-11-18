import React from "react";
import Card from "./Card";
import type { TrumpPhaseState } from "../types/gamePhases";

interface TrumpSelectionOverlayProps extends TrumpPhaseState {
  bidWinnerHandId: string;
  currentBidderIndex: number;
  handAssignments: any[];
  currentUserId: string | null;
}

export default function TrumpSelectionOverlay({
  bidWinnerHandId,
  currentBidderIndex,
  handAssignments,
  currentUserId,
  handleTrumpSelection,
}: TrumpSelectionOverlayProps) {
  const bidWinner = handAssignments.find((h: any) => {
    const handId = `${h.playerId}_hand_${h.handIndex}`;
    return handId === bidWinnerHandId;
  });
  const isMyTurn = bidWinner?.playerId === currentUserId;

  const trumpOptions = [
    { value: "hearts", suit: "hearts" as const, rank: "K" },
    { value: "diamonds", suit: "diamonds" as const, rank: "K" },
    { value: "clubs", suit: "clubs" as const, rank: "K" },
    { value: "spades", suit: "spades" as const, rank: "K" },
    { value: "no-trump", suit: "hearts" as const, rank: "NO_TRUMP" },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <div
        className="text-white p-10 rounded-3xl shadow-2xl max-w-5xl max-h-[80vh] overflow-y-auto border-4 border-white/20"
        style={{ backgroundColor: "rgba(17, 24, 39, 0.97)", fontSize: "1.15rem" }}
      >
        <div className="space-y-7">
          <h2 className="text-5xl font-bold text-center" style={{ color: "#ffffff" }}>
            Trump Selection
          </h2>

          {/* Bid Winner Info */}
          <div className="text-center">
            <div className="text-2xl" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
              Bid Winner:
            </div>
            <div className="text-4xl font-bold mt-2" style={{ color: "#fbbf24" }}>
              {bidWinner?.playerName} - Hand {parseInt(bidWinner?.handIndex || "0") + 1}
              {isMyTurn && <span className="ml-2">(Your Turn!)</span>}
            </div>
          </div>

          {/* Trump Options */}
          {isMyTurn ? (
            <div>
              <div
                className="text-center text-2xl mb-6 font-semibold"
                style={{ color: "rgba(255, 255, 255, 0.95)" }}
              >
                Select Trump Suit:
              </div>
              <div className="flex justify-center gap-6 flex-wrap">
                {trumpOptions.map((option) => (
                  <div
                    key={option.value}
                    className="relative cursor-pointer transform transition-transform hover:scale-110 hover:-translate-y-2"
                    onClick={() => handleTrumpSelection?.(option.value)}
                  >
                    <Card
                      suit={option.suit}
                      rank={option.rank}
                      faceUp={true}
                      width={120}
                      height={180}
                    />
                    <div
                      className="text-center mt-3 text-base font-bold"
                      style={{ color: "#ffffff" }}
                    >
                      {option.value === "no-trump"
                        ? "No Trump"
                        : option.value.charAt(0).toUpperCase() + option.value.slice(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div
                className="text-3xl font-semibold mb-3"
                style={{ color: "rgba(255, 255, 255, 0.95)" }}
              >
                Waiting for trump selection...
              </div>
              <div className="text-xl" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
                {bidWinner?.playerName} is choosing the trump suit
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

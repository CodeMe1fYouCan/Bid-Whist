import { useResponsiveCardSize } from "../hooks/useResponsiveCardSize";

interface TrumpSelectionProps {
  bidWinnerHandId: string;
  bidWinnerIndex: number;
  winningBid: number;
  handAssignments: any[];
  currentUserId: string | null;
  handleTrumpSelection: (trumpSuit: string) => void;
}

export default function TrumpSelection({
  bidWinnerHandId,
  bidWinnerIndex,
  winningBid,
  handAssignments,
  currentUserId,
  handleTrumpSelection,
}: TrumpSelectionProps) {
  const { isMobile } = useResponsiveCardSize();

  if (!handAssignments.length) {
    return <div className="text-white">Loading…</div>;
  }

  const bidWinner = handAssignments[bidWinnerIndex];
  const isMyTurn = bidWinner?.playerId === currentUserId;

  const trumpOptions = [
    { value: "hearts", label: "♥ Hearts", color: "text-red-500" },
    { value: "diamonds", label: "♦ Diamonds", color: "text-red-500" },
    { value: "clubs", label: "♣ Clubs", color: "text-gray-300" },
    { value: "spades", label: "♠ Spades", color: "text-gray-300" },
    { value: "no-trump", label: "No Trump", color: "text-yellow-400" },
  ];

  return (
    <div
      className={`fixed z-50 left-1/2 -translate-x-1/2 text-white rounded-2xl md:rounded-3xl shadow-2xl border-2 md:border-4 border-white/20 pointer-events-auto md:relative md:top-auto md:left-auto md:translate-x-0 md:flex md:items-center md:justify-center md:inset-0 md:bg-transparent md:pointer-events-none ${isMobile
          ? "top-0 w-[95vw] max-h-[35vh] p-2.5 overflow-y-auto rounded-t-none"
          : "top-[2vh] w-[60vw] md:w-auto md:max-w-2xl lg:max-w-3xl max-h-[55vh] md:max-h-[85vh] p-4 md:p-8 md:text-lg lg:p-10 overflow-y-auto"
        }`}
      style={{ backgroundColor: "rgba(17, 24, 39, 0.97)", fontSize: isMobile ? "0.85rem" : "0.9rem" }}
    >
      <div className={isMobile ? "space-y-2" : "space-y-3 md:space-y-6"}>
        {/* Title - hide on mobile */}
        {!isMobile && (
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center" style={{ color: "#ffffff" }}>
            Trump Selection
          </h2>
        )}

        {/* Compact header */}
        {isMobile ? (
          <div className="flex items-center justify-center gap-2 text-xs">
            <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Winner:</span>
            <span className="font-bold text-yellow-400">
              {bidWinner?.playerName}
            </span>
            <span className="text-white/30">|</span>
            <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Bid:</span>
            <span className="font-bold text-yellow-400">{winningBid}</span>
            {isMyTurn && <span className="ml-1 text-green-400 font-bold">✓ Your Turn</span>}
          </div>
        ) : (
          <div className="text-center">
            <div className="text-base md:text-xl" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
              Bid Winner:
            </div>
            <div className="font-bold text-yellow-400 text-xl md:text-2xl lg:text-3xl">
              {bidWinner?.playerName} - Hand {parseInt(bidWinner?.handIndex) + 1}
              {isMyTurn && <span className="ml-2">(Your Turn!)</span>}
            </div>
            <div className="mt-1 text-sm md:text-base" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
              Winning Bid: {winningBid}
            </div>
          </div>
        )}

        {/* Trump Selection (only show if it's my turn) */}
        {isMyTurn ? (
          <div className={`bg-yellow-900/20 border-2 border-yellow-400 rounded-lg ${isMobile ? "p-2" : "p-4 md:p-6"}`}>
            {!isMobile && (
              <div className="text-center mb-3 md:mb-4">
                <div className="text-lg font-bold" style={{ color: "#ffffff" }}>
                  Select Trump Suit
                </div>
                <div className="text-sm" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                  Choose the trump suit for this hand
                </div>
              </div>
            )}

            <div className={`grid grid-cols-1 ${isMobile ? "gap-1.5" : "gap-3"}`}>
              {trumpOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleTrumpSelection(option.value)}
                  className={`rounded-lg font-bold transition-all active:scale-95 ${option.color} ${isMobile
                      ? "px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 border-b-4 border-gray-900 active:border-b-0 active:translate-y-1"
                      : "px-6 py-4 text-xl bg-gray-700 hover:bg-gray-600"
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={`text-center ${isMobile ? "text-xs" : "text-lg"}`} style={{ color: "rgba(255, 255, 255, 0.7)" }}>
            Waiting for {bidWinner?.playerName} to select trump...
          </div>
        )}
      </div>
    </div>
  );
}

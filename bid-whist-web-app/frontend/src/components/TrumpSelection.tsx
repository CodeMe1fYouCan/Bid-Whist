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
      className="fixed z-50 top-[2vh] left-1/2 -translate-x-1/2 text-white p-4 md:p-8 md:text-lg lg:p-10 rounded-2xl md:rounded-3xl shadow-2xl w-[60vw] md:w-auto md:max-w-2xl lg:max-w-3xl max-h-[55vh] md:max-h-[85vh] overflow-y-auto border-2 md:border-4 border-white/20 pointer-events-auto md:relative md:top-auto md:left-auto md:translate-x-0 md:flex md:items-center md:justify-center md:inset-0 md:bg-transparent md:pointer-events-none"
      style={{ backgroundColor: "rgba(17, 24, 39, 0.97)", fontSize: "0.9rem" }}
    >
      <div className="space-y-3 md:space-y-6">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center" style={{ color: "#ffffff" }}>
          Trump Selection
        </h2>

        {/* Bid Winner Info */}
        <div className="text-center">
          <div className="text-base md:text-xl" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
            Bid Winner:
          </div>
          <div className="text-xl md:text-2xl lg:text-3xl font-bold text-yellow-400">
            {bidWinner?.playerName} - Hand {parseInt(bidWinner?.handIndex) + 1}
            {isMyTurn && <span className="ml-2">(Your Turn!)</span>}
          </div>
          <div className="mt-1 text-sm md:text-base" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
            Winning Bid: {winningBid}
          </div>
        </div>

        {/* Trump Selection (only show if it's my turn) */}
        {isMyTurn ? (
          <div className="bg-yellow-900/20 border-2 border-yellow-400 rounded-lg p-4 md:p-6">
            <div className="text-center mb-3 md:mb-4">
              <div className="text-lg font-bold" style={{ color: "#ffffff" }}>
                Select Trump Suit
              </div>
              <div className="text-sm" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                Choose the trump suit for this hand
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {trumpOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleTrumpSelection(option.value)}
                  className={`px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-xl transition-colors ${option.color}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-lg" style={{ color: "rgba(255, 255, 255, 0.7)" }}>
            Waiting for {bidWinner?.playerName} to select trump...
          </div>
        )}
      </div>
    </div>
  );
}

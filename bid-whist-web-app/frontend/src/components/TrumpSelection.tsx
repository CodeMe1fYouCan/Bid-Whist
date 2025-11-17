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
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-3xl font-bold text-center">Trump Selection</h2>
      
      {/* Bid Winner Info */}
      <div className="text-center">
        <div className="text-lg text-gray-300">Bid Winner:</div>
        <div className="text-2xl font-bold text-yellow-400">
          {bidWinner?.playerName} - Hand {parseInt(bidWinner?.handIndex) + 1}
          {isMyTurn && <span className="ml-2">(Your Turn!)</span>}
        </div>
        <div className="text-gray-400 mt-1">
          Winning Bid: {winningBid}
        </div>
      </div>

      {/* Trump Selection (only show if it's my turn) */}
      {isMyTurn ? (
        <div className="bg-yellow-900/20 border-2 border-yellow-400 rounded-lg p-6">
          <div className="text-center mb-4">
            <div className="text-lg font-bold">Select Trump Suit</div>
            <div className="text-sm text-gray-300">
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
        <div className="text-center text-gray-400 text-lg">
          Waiting for {bidWinner?.playerName} to select trump...
        </div>
      )}
    </div>
  );
}

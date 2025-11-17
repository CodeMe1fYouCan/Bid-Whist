interface DealerSelectionProps {
  handAssignments: any[];
  dealerGuesses: Record<string, number>;
  guessInput: Record<string, string>;
  setGuessInput: (input: Record<string, string>) => void;
  handleGuessSubmit: (handId: string) => void;
  currentUserId: string | null;
}

export default function DealerSelection({
  handAssignments,
  dealerGuesses,
  guessInput,
  setGuessInput,
  handleGuessSubmit,
  currentUserId,
}: DealerSelectionProps) {
  if (!handAssignments.length) {
    return <div className="text-white">Loading hands…</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-center">Dealer Selection</h2>
      <p className="text-center text-gray-300">
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
                  ? "border-yellow-400 bg-yellow-900/20"
                  : "border-gray-600 bg-gray-800/50"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold">
                    {hand.playerName} — Hand {parseInt(hand.handIndex) + 1}
                    {isMine && <span className="text-yellow-300 ml-2">(You)</span>}
                  </div>
                  <div className="text-gray-400 text-sm">Team: {hand.team}</div>
                </div>

                {done ? (
                  <span className="text-green-400 font-bold">✓ Guessed</span>
                ) : isMine ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={guessInput[handId] || ""}
                      onChange={(e) =>
                        setGuessInput({
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
                      onClick={() => handleGuessSubmit(handId)}
                    >
                      Submit
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-500">Waiting…</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-gray-400">
        {Object.keys(dealerGuesses).length} / {handAssignments.length} hands guessed
      </div>
    </div>
  );
}

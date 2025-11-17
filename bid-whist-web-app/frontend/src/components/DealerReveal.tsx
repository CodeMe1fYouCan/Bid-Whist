import React from "react";

interface DealerRevealProps {
  targetNumber: number;
  guesses: Record<string, number>;
  dealerHandId: string;
  handAssignments: any[];
  currentUserId: string | null;
}

export default function DealerReveal({
  targetNumber,
  guesses,
  dealerHandId,
  handAssignments,
  currentUserId,
}: DealerRevealProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <div
        className="text-white p-10 rounded-3xl shadow-2xl max-w-5xl max-h-[85vh] overflow-y-auto border-4 border-white/20"
        style={{ backgroundColor: "rgba(17, 24, 39, 0.97)", fontSize: "1.1rem" }}
      >
        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-center" style={{ color: "#ffffff" }}>
            Dealer Selected!
          </h2>

          <div className="text-center">
            <div className="text-2xl mb-4" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
              Target Number:
            </div>
            <div className="text-6xl font-bold mb-6" style={{ color: "#fbbf24" }}>
              {targetNumber}
            </div>
          </div>

          <div className="space-y-3">
            {handAssignments.map((hand: any) => {
              const handId = `${hand.playerId}_hand_${hand.handIndex}`;
              const guess = guesses[handId];
              const isDealer = handId === dealerHandId;
              const diff = Math.abs(guess - targetNumber);

              // Find Faye's team
              const fayeHand = handAssignments.find((h: any) => h.playerName?.toLowerCase() === "faye");
              const fayeTeam = fayeHand?.team;
              const nameColor = hand.team === fayeTeam ? "#c4b5fd" : "#60a5fa";

              return (
                <div
                  key={handId}
                  className={`p-4 rounded-lg border-2 ${
                    isDealer
                      ? "border-green-400 bg-green-900/30"
                      : "border-white/30 bg-white/10"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-bold text-lg" style={{ color: nameColor }}>
                      {hand.playerName?.toLowerCase() === "faye" && "💜 "}
                      {hand.playerName}
                      {hand.playerId === currentUserId && (
                        <span className="ml-2 text-sm bg-purple-600 px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm opacity-70">Guessed</div>
                        <div className="text-2xl font-bold">{guess}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm opacity-70">Difference</div>
                        <div
                          className={`text-2xl font-bold ${
                            isDealer ? "text-green-400" : "text-gray-400"
                          }`}
                        >
                          {diff}
                        </div>
                      </div>
                      {isDealer && (
                        <div className="text-4xl">👑</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center text-xl" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
            Dealing cards...
          </div>
        </div>
      </div>
    </div>
  );
}

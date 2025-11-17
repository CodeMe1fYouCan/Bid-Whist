import React from "react";

interface HandCompleteProps {
  tricksWon: Record<string, number>;
  pointsScored: Record<string, number>;
  teamScores: Record<string, number>;
  totalPoints?: Record<string, number>;
  biddingTeam: string;
  tricksNeeded: number;
  biddingTeamTricks: number;
  handAssignments: any[];
  currentUserId: string | null;
  readyPlayers?: string[];
  onReady: () => void;
}

export default function HandComplete({
  tricksWon,
  pointsScored,
  teamScores,
  totalPoints = { Us: 0, Them: 0 },
  biddingTeam,
  tricksNeeded,
  biddingTeamTricks,
  handAssignments,
  currentUserId,
  readyPlayers = [],
  onReady,
}: HandCompleteProps) {
  const defendingTeam = biddingTeam === "Us" ? "Them" : "Us";
  const bidMade = biddingTeamTricks >= tricksNeeded;
  const isReady = readyPlayers.includes(currentUserId || "");

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-2xl max-w-2xl border-4 border-yellow-400/50">
        <h2 className="text-4xl font-bold text-center mb-6 text-yellow-300">
          Hand Complete!
        </h2>

        {/* Bid Result */}
        <div className="mb-6 text-center">
          <div className="text-xl mb-2">
            Team <span className="font-bold text-purple-300">{biddingTeam}</span> bid{" "}
            <span className="font-bold">{tricksNeeded - 6}</span> and needed{" "}
            <span className="font-bold">{tricksNeeded}</span> tricks
          </div>
          <div className="text-2xl font-bold">
            They won <span className="text-yellow-300">{biddingTeamTricks}</span> tricks
          </div>
          <div className={`text-3xl font-bold mt-2 ${bidMade ? "text-green-400" : "text-red-400"}`}>
            {bidMade ? "✓ Bid Made!" : "✗ Bid Failed"}
          </div>
        </div>

        {/* Tricks Won */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-purple-900/30 p-4 rounded-lg border-2 border-purple-400/50">
            <div className="text-center">
              <div className="text-lg font-bold text-purple-300">Us</div>
              <div className="text-sm opacity-80 mb-2">
                {handAssignments
                  .filter((h: any) => h.team === "Us")
                  .map((h: any) => h.playerName)
                  .join(", ")}
              </div>
              <div className="text-3xl font-bold">{tricksWon.Us} tricks</div>
              <div className="text-xl text-yellow-300 mt-1">+{pointsScored.Us} points</div>
            </div>
          </div>
          <div className="bg-blue-900/30 p-4 rounded-lg border-2 border-blue-400/50">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-300">Them</div>
              <div className="text-sm opacity-80 mb-2">
                {handAssignments
                  .filter((h: any) => h.team === "Them")
                  .map((h: any) => h.playerName)
                  .join(", ")}
              </div>
              <div className="text-3xl font-bold">{tricksWon.Them} tricks</div>
              <div className="text-xl text-yellow-300 mt-1">+{pointsScored.Them} points</div>
            </div>
          </div>
        </div>

        {/* Game Scores */}
        <div className="mb-6 bg-black/30 p-4 rounded-lg">
          <div className="text-center text-lg mb-2 font-bold">Game Score</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-purple-300 font-bold">Us</div>
              <div className="text-2xl font-bold text-yellow-300">{teamScores.Us}</div>
            </div>
            <div className="text-center">
              <div className="text-blue-300 font-bold">Them</div>
              <div className="text-2xl font-bold text-yellow-300">{teamScores.Them}</div>
            </div>
          </div>
        </div>

        {/* Total Points Across All Games */}
        <div className="mb-6 bg-black/50 p-4 rounded-lg border-2 border-white/20">
          <div className="text-center text-sm mb-2 opacity-70">Total Points (All Games)</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-purple-300 text-sm">Us</div>
              <div className="text-xl font-bold">{totalPoints.Us}</div>
            </div>
            <div className="text-center">
              <div className="text-blue-300 text-sm">Them</div>
              <div className="text-xl font-bold">{totalPoints.Them}</div>
            </div>
          </div>
        </div>

        {/* Ready Status */}
        <div className="text-center mb-4">
          <div className="text-sm opacity-70 mb-2">
            {readyPlayers.length} / {handAssignments.length > 0 ? new Set(handAssignments.map((h: any) => h.playerId)).size : 0} players ready
          </div>
          <button
            onClick={onReady}
            disabled={isReady}
            className={`px-8 py-4 rounded-lg font-bold text-xl ${
              isReady
                ? "bg-green-600 cursor-default"
                : "bg-yellow-500 hover:bg-yellow-600 text-black"
            }`}
          >
            {isReady ? "✓ Ready" : "Ready for Next Hand"}
          </button>
        </div>
      </div>
    </div>
  );
}

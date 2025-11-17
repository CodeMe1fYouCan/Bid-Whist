import React from "react";
import type { CompletePhaseState } from "../types/gamePhases";

interface HandCompleteOverlayProps extends Omit<CompletePhaseState, 'teamScores'> {
  phase: string;
  handAssignments: any[];
  currentUserId: string | null;
  handCompleteData: any;
  readyPlayers: string[];
  totalPoints: Record<string, number>;
}

export default function HandCompleteOverlay({
  phase,
  handCompleteData,
  handAssignments,
  currentUserId,
  readyPlayers,
  totalPoints,
  onHandCompleteReady,
}: HandCompleteOverlayProps) {
  const bidMade =
    (handCompleteData.biddingTeamTricks || 0) >= (handCompleteData.tricksNeeded || 0);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <div
        className="text-white p-12 rounded-3xl shadow-2xl max-w-4xl border-4 border-yellow-400/50"
        style={{ backgroundColor: "rgba(17, 24, 39, 0.97)" }}
      >
        <h2 className="text-4xl font-bold text-center mb-6 text-yellow-300">
          {phase === "GAME_COMPLETE" ? "Game Complete!" : "Hand Complete!"}
        </h2>

        {/* Bid Result */}
        <div className="mb-6 text-center" style={{ color: "#ffffff" }}>
          <div className="text-xl mb-2" style={{ color: "#ffffff" }}>
            Team{" "}
            <span className="font-bold text-purple-300">
              {handCompleteData.biddingTeam}
            </span>{" "}
            bid <span className="font-bold" style={{ color: "#ffffff" }}>{Math.max(1, (handCompleteData.tricksNeeded || 7) - 6)}</span>{" "}
            and needed <span className="font-bold" style={{ color: "#ffffff" }}>{Math.max(7, handCompleteData.tricksNeeded || 7)}</span>{" "}
            tricks
          </div>
          <div className="text-2xl font-bold" style={{ color: "#ffffff" }}>
            They won{" "}
            <span className="text-yellow-300">
              {handCompleteData.biddingTeamTricks || 0}
            </span>{" "}
            tricks
          </div>
          <div
            className={`text-3xl font-bold mt-2 ${
              bidMade ? "text-green-400" : "text-red-400"
            }`}
          >
            {bidMade ? "✓ Bid Made!" : "✗ Bid Failed"}
          </div>
        </div>

        {/* Tricks Won */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-purple-900/30 p-4 rounded-lg border-2 border-purple-400/50">
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: "#c084fc" }}>Us</div>
              <div className="text-sm opacity-80 mb-2" style={{ color: "#ffffff" }}>
                {handAssignments
                  .filter((h: any) => h.team === "Us")
                  .map((h: any) => h.playerName)
                  .join(", ")}
              </div>
              <div className="text-3xl font-bold" style={{ color: "#ffffff" }}>
                {handCompleteData.tricksWon?.Us || 0} tricks
              </div>
              <div className="text-xl mt-1" style={{ color: "#4ade80" }}>
                +{handCompleteData.pointsScored?.Us || 0} points
              </div>
            </div>
          </div>
          <div className="bg-blue-900/30 p-4 rounded-lg border-2 border-blue-400/50">
            <div className="text-center">
              <div className="text-lg font-bold" style={{ color: "#93c5fd" }}>Them</div>
              <div className="text-sm opacity-80 mb-2" style={{ color: "#ffffff" }}>
                {handAssignments
                  .filter((h: any) => h.team === "Them")
                  .map((h: any) => h.playerName)
                  .join(", ")}
              </div>
              <div className="text-3xl font-bold" style={{ color: "#ffffff" }}>
                {handCompleteData.tricksWon?.Them || 0} tricks
              </div>
              <div className="text-xl mt-1" style={{ color: "#4ade80" }}>
                +{handCompleteData.pointsScored?.Them || 0} points
              </div>
            </div>
          </div>
        </div>

        {/* Game Scores */}
        <div className="mb-6 bg-black/30 p-4 rounded-lg">
          <div className="text-center text-lg mb-2 font-bold" style={{ color: "#ffffff" }}>Game Score</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="font-bold" style={{ color: "#c084fc" }}>Us</div>
              <div className="text-2xl font-bold" style={{ color: "#fcd34d" }}>
                {handCompleteData.teamScores?.Us || 0}
              </div>
            </div>
            <div className="text-center">
              <div className="font-bold" style={{ color: "#93c5fd" }}>Them</div>
              <div className="text-2xl font-bold" style={{ color: "#fcd34d" }}>
                {handCompleteData.teamScores?.Them || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Total Points */}
        <div className="mb-6 bg-black/50 p-4 rounded-lg border-2 border-white/20">
          <div className="text-center text-sm mb-2 opacity-70" style={{ color: "#ffffff" }}>
            Total Points (All Games)
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-sm" style={{ color: "#c084fc" }}>Us</div>
              <div className="text-xl font-bold" style={{ color: "#ffffff" }}>{totalPoints.Us}</div>
            </div>
            <div className="text-center">
              <div className="text-sm" style={{ color: "#93c5fd" }}>Them</div>
              <div className="text-xl font-bold" style={{ color: "#ffffff" }}>{totalPoints.Them}</div>
            </div>
          </div>
        </div>

        {/* Ready Button */}
        {phase === "HAND_COMPLETE" && (
          <div className="text-center">
            <div className="text-sm opacity-70 mb-2" style={{ color: "#ffffff" }}>
              {readyPlayers.length} /{" "}
              {handAssignments.length > 0
                ? new Set(handAssignments.map((h: any) => h.playerId)).size
                : 0}{" "}
              players ready
            </div>
            <button
              onClick={onHandCompleteReady}
              disabled={readyPlayers.indexOf(currentUserId || "") !== -1}
              className={`px-8 py-4 rounded-lg font-bold text-xl ${
                readyPlayers.indexOf(currentUserId || "") !== -1
                  ? "bg-green-600 cursor-default"
                  : "bg-yellow-500 hover:bg-yellow-600"
              }`}
              style={{
                color: readyPlayers.indexOf(currentUserId || "") !== -1 ? "#ffffff" : "#000000"
              }}
            >
              {readyPlayers.indexOf(currentUserId || "") !== -1
                ? "✓ Ready"
                : "Ready for Next Hand"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

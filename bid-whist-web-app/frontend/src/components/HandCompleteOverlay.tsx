import React from "react";
import type { CompletePhaseState } from "../types/gamePhases";
import GameCompleteOverlay from "./GameCompleteOverlay";

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
  // If game is complete, show the special game complete overlay
  if (phase === "GAME_COMPLETE") {
    return (
      <GameCompleteOverlay
        handCompleteData={handCompleteData}
        handAssignments={handAssignments}
        totalPoints={totalPoints}
      />
    );
  }

  const bidMade =
    (handCompleteData.biddingTeamTricks || 0) >= (handCompleteData.tricksNeeded || 0);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none p-2">
      <div
        className="text-white p-4 md:p-10 lg:p-12 rounded-xl md:rounded-3xl shadow-2xl w-full max-w-sm md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto border-2 md:border-4 border-yellow-400/50 pointer-events-auto"
        style={{
          backgroundColor: "rgba(17, 24, 39, 0.97)"
        }}
      >
        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-center mb-3 md:mb-6 text-yellow-300">
          {phase === "GAME_COMPLETE" ? "Game Complete!" : "Hand Complete!"}
        </h2>

        {/* Bid Result */}
        <div className="mb-3 md:mb-6 text-center" style={{ color: "#ffffff" }}>
          <div className="text-sm md:text-lg lg:text-xl mb-1 md:mb-2" style={{ color: "#ffffff" }}>
            <span className="font-bold" style={{ color: handCompleteData.biddingTeam === "Us" ? "#c084fc" : "#93c5fd" }}>
              {handCompleteData.biddingTeam}
            </span>{" "}
            bid <span className="font-bold" style={{ color: "#ffffff" }}>{Math.max(1, (handCompleteData.tricksNeeded || 7) - 6)}</span>{" "}
            and needed <span className="font-bold" style={{ color: "#ffffff" }}>{Math.max(7, handCompleteData.tricksNeeded || 7)}</span>{" "}
            tricks
          </div>
          <div className="text-lg md:text-2xl font-bold" style={{ color: "#ffffff" }}>
            They won{" "}
            <span className="text-yellow-300">
              {handCompleteData.biddingTeamTricks || 0}
            </span>{" "}
            tricks
          </div>
          <div
            className={`text-xl md:text-3xl font-bold mt-1 md:mt-2 ${bidMade ? "text-green-400" : "text-red-400"
              }`}
          >
            {bidMade ? "✓ Bid Made!" : "✗ Bid Failed"}
          </div>
        </div>

        {/* Tricks Won */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 mb-3 md:mb-6">
          <div className="bg-purple-900/30 p-2 md:p-4 rounded-lg border-2 border-purple-400/50">
            <div className="text-center">
              <div className="text-sm md:text-lg font-bold" style={{ color: "#c084fc" }}>Us</div>
              <div className="text-xs md:text-sm opacity-80 mb-1 md:mb-2 hidden md:block" style={{ color: "#ffffff" }}>
                {handAssignments
                  .filter((h: any) => h.team === "Us")
                  .map((h: any) => h.playerName)
                  .join(", ")}
              </div>
              <div className="text-xl md:text-3xl font-bold" style={{ color: "#ffffff" }}>
                {handCompleteData.tricksWon?.Us || 0} tricks
              </div>
              <div className="text-base md:text-xl mt-1" style={{ color: "#4ade80" }}>
                +{handCompleteData.pointsScored?.Us || 0} points
              </div>
            </div>
          </div>
          <div className="bg-blue-900/30 p-2 md:p-4 rounded-lg border-2 border-blue-400/50">
            <div className="text-center">
              <div className="text-sm md:text-lg font-bold" style={{ color: "#93c5fd" }}>Them</div>
              <div className="text-xs md:text-sm opacity-80 mb-1 md:mb-2 hidden md:block" style={{ color: "#ffffff" }}>
                {handAssignments
                  .filter((h: any) => h.team === "Them")
                  .map((h: any) => h.playerName)
                  .join(", ")}
              </div>
              <div className="text-xl md:text-3xl font-bold" style={{ color: "#ffffff" }}>
                {handCompleteData.tricksWon?.Them || 0} tricks
              </div>
              <div className="text-base md:text-xl mt-1" style={{ color: "#4ade80" }}>
                +{handCompleteData.pointsScored?.Them || 0} points
              </div>
            </div>
          </div>
        </div>



        {/* Total Points */}
        <div className="mb-3 md:mb-6 bg-black/50 p-3 md:p-4 rounded-lg border-2 border-white/20">
          <div className="text-center text-xs md:text-sm mb-1 md:mb-2 opacity-70" style={{ color: "#ffffff" }}>
            Total Points (All Games)
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="text-center">
              <div className="text-xs md:text-sm" style={{ color: "#c084fc" }}>Us</div>
              <div className="text-lg md:text-xl font-bold" style={{ color: "#ffffff" }}>{totalPoints.Us}</div>
            </div>
            <div className="text-center">
              <div className="text-xs md:text-sm" style={{ color: "#93c5fd" }}>Them</div>
              <div className="text-lg md:text-xl font-bold" style={{ color: "#ffffff" }}>{totalPoints.Them}</div>
            </div>
          </div>
        </div>

        {/* Ready Button */}
        {phase === "HAND_COMPLETE" && (
          <div className="text-center">
            <div className="text-xs md:text-sm opacity-70 mb-2" style={{ color: "#ffffff" }}>
              {readyPlayers.length} /{" "}
              {handAssignments.length > 0
                ? new Set(handAssignments.map((h: any) => h.playerId)).size
                : 0}{" "}
              players ready
            </div>
            <button
              onClick={onHandCompleteReady}
              disabled={readyPlayers.indexOf(currentUserId || "") !== -1}
              className={`px-6 md:px-8 py-3 md:py-4 rounded-lg font-bold text-lg md:text-xl touch-target ${readyPlayers.indexOf(currentUserId || "") !== -1
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

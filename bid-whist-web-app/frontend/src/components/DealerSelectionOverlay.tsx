import React from "react";
import type { DealerPhaseState } from "../types/gamePhases";

interface DealerSelectionOverlayProps extends DealerPhaseState {
  handAssignments: any[];
  currentUserId: string | null;
}

export default function DealerSelectionOverlay({
  handAssignments,
  dealerGuesses = {},
  guessInput = {},
  setGuessInput,
  handleGuessSubmit,
  currentUserId,
}: DealerSelectionOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <div
        className="text-white p-4 md:p-8 lg:p-10 rounded-2xl md:rounded-3xl shadow-2xl max-w-sm md:max-w-3xl lg:max-w-5xl max-h-[85vh] overflow-y-auto border-2 md:border-4 border-white/20"
        style={{ backgroundColor: "rgba(17, 24, 39, 0.97)", fontSize: "1rem" }}
      >
        <div className="space-y-3 md:space-y-6">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center" style={{ color: "#ffffff" }}>
            Dealer Selection
          </h2>
          <p className="text-center text-sm md:text-base lg:text-lg" style={{ color: "#ffffff" }}>
            Each hand must guess a number 1–100. Closest becomes the dealer.
          </p>

          <div className="space-y-2 md:space-y-4">
            {handAssignments.map((hand: any) => {
              const handId = `${hand.playerId}_hand_${hand.handIndex}`;
              const isMine = hand.playerId === currentUserId;
              const done = dealerGuesses[handId] !== undefined;

              // Find Faye's team
              const fayeHand = handAssignments.find(
                (h: any) => h.playerName?.toLowerCase() === "faye"
              );
              const fayeTeam = fayeHand?.team;
              const isFayeTeam = hand.team === fayeTeam;

              // Color: purple for Faye's team, blue for opposing team
              const nameColor = isFayeTeam ? "#c4b5fd" : "#60a5fa";

              return (
                <div
                  key={handId}
                  className={`p-3 md:p-4 rounded-lg border-2 ${isMine
                      ? "border-yellow-400 bg-yellow-900/30"
                      : "border-white/30 bg-white/10"
                    }`}
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 md:gap-0">
                    <div>
                      <div className="font-bold text-base md:text-lg" style={{ color: nameColor }}>
                        {hand.playerName?.toLowerCase() === "faye" && "💜 "}
                        {hand.playerName} — Hand {parseInt(hand.handIndex) + 1}
                        {isMine && <span className="text-yellow-300 ml-2">(You)</span>}
                      </div>
                      <div className="text-xs md:text-sm" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                        Team: {hand.team}
                      </div>
                    </div>

                    {done ? (
                      <span className="font-bold" style={{ color: "#4ade80" }}>
                        ✓ Guessed
                      </span>
                    ) : isMine ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={guessInput[handId] || ""}
                          onChange={(e) =>
                            setGuessInput?.({
                              ...guessInput,
                              [handId]: e.target.value,
                            })
                          }
                          className="w-20 md:w-24 px-2 md:px-3 py-2 md:py-3 bg-gray-700 border border-gray-600 rounded text-white text-center touch-target"
                          placeholder="1–100"
                        />
                        <button
                          className="px-3 md:px-4 py-2 md:py-3 bg-green-600 hover:bg-green-700 rounded font-bold disabled:bg-gray-600 touch-target text-sm md:text-base"
                          disabled={
                            !guessInput[handId] ||
                            parseInt(guessInput[handId]) < 1 ||
                            parseInt(guessInput[handId]) > 100
                          }
                          onClick={() => handleGuessSubmit?.(handId)}
                        >
                          Submit
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: "rgba(255, 255, 255, 0.8)" }}>Waiting…</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center text-base md:text-lg" style={{ color: "#ffffff" }}>
            {Object.keys(dealerGuesses).length} / {handAssignments.length} hands guessed
          </div>
        </div>
      </div>
    </div>
  );
}

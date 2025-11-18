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
        className="text-white p-10 rounded-3xl shadow-2xl max-w-5xl max-h-[85vh] overflow-y-auto border-4 border-white/20"
        style={{ backgroundColor: "rgba(17, 24, 39, 0.97)", fontSize: "1.1rem" }}
      >
        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-center" style={{ color: "#ffffff" }}>
            Dealer Selection
          </h2>
          <p className="text-center text-lg" style={{ color: "#ffffff" }}>
            Each hand must guess a number 1–100. Closest becomes the dealer.
          </p>

          <div className="space-y-4">
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
                  className={`p-4 rounded-lg border-2 ${
                    isMine
                      ? "border-yellow-400 bg-yellow-900/30"
                      : "border-white/30 bg-white/10"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold" style={{ color: nameColor }}>
                        {hand.playerName?.toLowerCase() === "faye" && "💜 "}
                        {hand.playerName} — Hand {parseInt(hand.handIndex) + 1}
                        {isMine && <span className="text-yellow-300 ml-2">(You)</span>}
                      </div>
                      <div className="text-sm" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
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

          <div className="text-center text-lg" style={{ color: "#ffffff" }}>
            {Object.keys(dealerGuesses).length} / {handAssignments.length} hands guessed
          </div>
        </div>
      </div>
    </div>
  );
}

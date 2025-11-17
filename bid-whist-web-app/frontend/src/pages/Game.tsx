import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * COMPLETE Game.tsx UI REWRITE
 * - Casino table (rounded rectangle)
 * - Black felt vignette background
 * - Table always visible across all phases
 * - Phases shown as overlays only
 * - Zero scrolling layout
 */

const Game = () => {
  const [phase] = useState("BIDDING");

  return (
    <div className="w-screen h-screen overflow-hidden flex items-center justify-center bg-black relative">
      {/* CASINO TABLE */}
      <div className="relative w-full max-w-5xl mx-auto aspect-square rounded-3xl shadow-xl overflow-hidden" style={{ backgroundColor: '#0a5f0a' }}>
        {/* Felt Vignette */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: "radial-gradient(circle at center, rgba(15, 61, 15, 0.3), rgba(0, 0, 0, 0.6))",
          }}
        />

        {/* PLAYER POSITIONS */}
        {/* YOU */}
        <div className="absolute bottom-6 flex flex-col items-center text-white">
          <div className="text-xl font-bold mb-2">You</div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-14 h-20 bg-white rounded shadow"
              />
            ))}
          </div>
        </div>

        {/* ACROSS */}
        <div className="absolute top-6 flex flex-col items-center text-white">
          <div className="text-xl font-bold mb-2">Across</div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-14 h-20 bg-gray-300 rounded shadow"
              />
            ))}
          </div>
        </div>

        {/* LEFT */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white flex flex-col items-center">
          <div className="text-xl font-bold mb-3">Left</div>
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-14 h-20 bg-gray-300 rounded shadow"
              />
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white flex flex-col items-center">
          <div className="text-xl font-bold mb-3">Right</div>
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-14 h-20 bg-gray-300 rounded shadow"
              />
            ))}
          </div>
        </div>

        {/* CENTER TRICK */}
        <div className="absolute text-white text-center">
          <div className="text-lg opacity-70">Trick</div>
        </div>

        {/* PHASE OVERLAYS */}
        <AnimatePresence>{renderPhaseOverlay(phase)}</AnimatePresence>
      </div>
    </div>
  );
};

function renderPhaseOverlay(phase: string) {
  const base = "absolute inset-0 flex items-center justify-center pointer-events-none";

  const panel = (
    <motion.div
      className="pointer-events-auto bg-black/70 text-white p-8 rounded-3xl shadow-2xl backdrop-blur-xl"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      {phaseContent(phase)}
    </motion.div>
  );

  return <div className={base}>{panel}</div>;
}

function phaseContent(phase: string) {
  switch (phase) {
    case "DEALER_SELECTION":
      return <div className="text-2xl">Select the Dealer…</div>;
    case "DEALING":
      return <div className="text-2xl">Dealing Cards…</div>;
    case "BIDDING":
      return (
        <div className="flex flex-col gap-4">
          <div className="text-2xl font-bold mb-4">Place Your Bid</div>
          <div className="flex gap-3 flex-wrap justify-center">
            {[3, 4, 5, 6, 7].map((bid) => (
              <button
                key={bid}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition-colors"
              >
                {bid}
              </button>
            ))}
          </div>
          <button className="mt-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold transition-colors">
            Pass
          </button>
        </div>
      );
    case "TRUMP_SELECTION":
      return (
        <div className="flex flex-col gap-4">
          <div className="text-2xl font-bold mb-4">Choose Trump Suit</div>
          <div className="flex gap-4 justify-center">
            {['♥ Hearts', '♦ Diamonds', '♣ Clubs', '♠ Spades'].map((suit) => (
              <button
                key={suit}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg transition-colors"
              >
                {suit}
              </button>
            ))}
          </div>
          <div className="flex gap-4 justify-center mt-2">
            <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors">
              Uptown
            </button>
            <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors">
              Downtown
            </button>
          </div>
        </div>
      );
    case "HAND_COMPLETE":
      return <div className="text-2xl">Hand Complete</div>;
    case "GAME_COMPLETE":
      return <div className="text-2xl">Game Over</div>;
    default:
      return null;
  }
}

export default Game;


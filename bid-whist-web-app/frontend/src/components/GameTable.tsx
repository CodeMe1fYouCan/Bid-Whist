import Card from "./Card";

interface GameTableProps {
  handAssignments: any[];
  playerHands: Record<string, any[]>;
  currentUserId: string | null;
  phase: string;
}

export default function GameTable({
  handAssignments,
  playerHands,
  currentUserId,
  phase,
}: GameTableProps) {
  // Find which hands belong to current user
  const myHandAssignments = handAssignments.filter(
    (h: any) => h.playerId === currentUserId
  );

  // Get cards for my hands
  const myCards: any[] = [];
  myHandAssignments.forEach((hand: any) => {
    const handId = `${hand.playerId}_hand_${hand.handIndex}`;
    const cards = playerHands[handId] || [];
    myCards.push(...cards);
  });

  return (
    <div className="w-screen h-screen overflow-hidden flex items-center justify-center bg-black relative">
      {/* VIGNETTE BACKGROUND */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at center, rgba(70,70,70,1) 0%, rgba(0,0,0,0.4) 80%)",
        }}
      />

      {/* CASINO TABLE */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: "88vw", height: "88vh" }}
      >
        <div
          className="absolute rounded-[80px] shadow-2xl"
          style={{
            width: "100%",
            height: "100%",
            background: "#0b4d0b",
            border: "18px solid #2c1f07",
            boxShadow:
              "inset 0 0 90px rgba(0,0,0,0.85), inset 0 0 40px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.5)",
          }}
        >
          {/* Inner Felt Vignette */}
          <div
            className="absolute inset-0 rounded-[70px] pointer-events-none border-[3px] border-yellow-800/40"
            style={{
              background:
                "radial-gradient(circle at center, rgba(0,0,0,0.15), rgba(0,0,0,0.45))",
            }}
          />

          {/* Brass Nameplate */}
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 rounded-md text-black font-bold tracking-wider"
            style={{
              background: "linear-gradient(135deg, #d4aa70, #b88a4a, #e0c28a)",
              boxShadow:
                "0 0 10px rgba(0,0,0,0.5), inset 0 0 4px rgba(255,255,255,0.4)",
              border: "2px solid #6b4f1d",
            }}
          >
            Meow Meow Publishing
          </div>
        </div>

        {/* MY CARDS (Bottom) */}
        <div className="absolute bottom-6 flex flex-col items-center text-white">
          <div className="flex gap-2 mb-2">
            {myCards.length > 0 ? (
              myCards.map((card: any, idx: number) => (
                <Card
                  key={idx}
                  suit={card.suit}
                  rank={card.rank}
                  faceUp={true}
                  width={60}
                  height={90}
                />
              ))
            ) : (
              <div className="text-gray-500">No cards yet</div>
            )}
          </div>
          <div className="text-xl font-bold">You</div>
        </div>

        {/* ACROSS (Top) */}
        <div className="absolute top-6 flex flex-col items-center text-white">
          <div className="text-xl font-bold mb-2">Across</div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card
                key={i}
                suit="hearts"
                rank="A"
                faceUp={false}
                width={60}
                height={90}
              />
            ))}
          </div>
        </div>

        {/* LEFT */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white flex flex-col items-center">
          <div className="text-xl font-bold mb-3">Left</div>
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card
                key={i}
                suit="hearts"
                rank="A"
                faceUp={false}
                width={60}
                height={90}
              />
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white flex flex-col items-center">
          <div className="text-xl font-bold mb-3">Right</div>
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card
                key={i}
                suit="hearts"
                rank="A"
                faceUp={false}
                width={60}
                height={90}
              />
            ))}
          </div>
        </div>

        {/* CENTER TRICK */}
        {phase === "PLAYING" && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-center">
            <div className="w-48 h-48 rounded-full border-2 border-white/20 flex items-center justify-center">
              <div className="text-lg opacity-50">Center</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

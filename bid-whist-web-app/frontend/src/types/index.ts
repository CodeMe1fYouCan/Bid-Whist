export type Card = {
    suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
    rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
};

export type Player = {
    id: string;
    name: string;
    isAI?: boolean;
    hand?: Card[];
};

export type PlayerHand = {
    playerId: string;
    playerName?: string;
    cards: Card[];
};

export type PlayedCard = {
    playerId: string;
    playerName: string;
    card: Card;
    position: number; // 0=top, 1=right, 2=bottom, 3=left (table positions)
};

export type Trick = {
    leadSuit: 'hearts' | 'diamonds' | 'clubs' | 'spades' | null;
    playedCards: PlayedCard[];
    winnerId?: string;
};

export type GameRoom = {
    roomCode: string;
    players: Player[];
    currentHand: number;
    totalHands: number;
};

export type Bid = {
    playerId: string;
    playerName: string;
    amount: number | 'pass';
};

export type GamePhase = 'DEALER_SELECTION' | 'BIDDING' | 'TRUMP_SELECTION' | 'PLAYING' | 'HAND_COMPLETE' | 'GAME_COMPLETE';

export type GameState = {
    type: 'GAME_STARTED' | 'GAME_IN_PROGRESS' | 'TRICK_COMPLETE' | 'HAND_COMPLETE' | 'GAME_COMPLETE';
    phase: GamePhase;
    roomCode: string;
    players: Player[];
    handAssignments?: Array<{playerId: string; playerName: string; handIndex: string}>;
    currentPlayerIndex: number;
    currentPlayerId: string;
    dealerIndex?: number;
    playerHands: Record<string, Card[]>; // handId -> cards in hand
    currentTrick: Trick;
    trickNumber: number;
    leadSuit: 'hearts' | 'diamonds' | 'clubs' | 'spades' | null;
    trumpSuit: 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'no-trump' | null;
    bids: Bid[];
    currentBidderIndex?: number;
    highestBid?: number;
    bidWinnerId?: string;
    bidWinnerHandId?: string;
    teamScores: { Us: number; Them: number };
    tricksWon: { Us: number; Them: number };
    tricks: Trick[]; // Completed tricks
    pointsToWin: 11 | 21;
    message?: string;
};

export type MatchmakingRequest = {
    playerName: string;
};

export type MatchmakingResponse = {
    roomCode: string;
    players: Player[];
};
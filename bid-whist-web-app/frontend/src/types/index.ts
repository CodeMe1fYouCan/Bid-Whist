export type Card = {
    suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
    rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
};

export type Player = {
    id: string;
    name: string;
    hands: Card[][];
};

export type PlayerHand = {
    playerId: string;
    playerName?: string;
    cards: Card[];
};

export type GameRoom = {
    roomCode: string;
    players: Player[];
    currentHand: number;
    totalHands: number;
};

export type GameState = {
    room: GameRoom;
    currentPlayerId: string;
    playedCards: Card[];
    scores: Record<string, number>;
};

export type MatchmakingRequest = {
    playerName: string;
};

export type MatchmakingResponse = {
    roomCode: string;
    players: Player[];
};
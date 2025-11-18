// Core game state shared across all phases
export interface CoreGameState {
  handAssignments: any[];
  playerHands: Record<string, any[]>;
  currentUserId: string | null;
  phase: string;
}

// Dealer selection phase state
export interface DealerPhaseState {
  dealerGuesses?: Record<string, number>;
  guessInput?: Record<string, string>;
  setGuessInput?: (input: Record<string, string>) => void;
  handleGuessSubmit?: (handId: string) => void;
}

// Bidding phase state
export interface BiddingPhaseState {
  currentBidderIndex?: number;
  bids?: any[];
  highestBid?: number;
  dealerIndex?: number;
  handleBid?: (handId: string, bidAmount: number | string) => void;
  bidWinnerHandId?: string;
  winningBid?: number;
}

// Trump selection phase state
export interface TrumpPhaseState {
  trumpSuit?: string;
  handleTrumpSelection?: (trumpSuit: string) => void;
}

// Playing phase state
export interface PlayingPhaseState {
  currentPlayerIndex?: number;
  currentTrick?: any[];
  tricksWon?: Record<string, number>;
  trickNumber?: number;
  handleCardPlay?: (handId: string, card: any) => void;
  trickWinnerHandId?: string | null;
  showTrickComplete?: boolean;
  lastTrick?: any[];
  lastTrickWinner?: string | null;
}

// Hand/Game complete phase state
export interface CompletePhaseState {
  handCompleteData?: any;
  readyPlayers?: string[];
  totalPoints?: Record<string, number>;
  teamScores?: Record<string, number>;
  pointsToWin?: number;
  onHandCompleteReady?: () => void;
}
